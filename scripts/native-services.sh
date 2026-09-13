#!/usr/bin/env bash
set -euo pipefail

umask 077

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$ROOT_DIR"

STATE_DIR="$ROOT_DIR/.hoplite/native"
ENV_FILE="$ROOT_DIR/.env"
PG_ROOT="$STATE_DIR/postgres"
PG_DATA="$PG_ROOT/data"
PG_LOG="$PG_ROOT/postgres.log"
REDIS_ROOT="$STATE_DIR/redis"
REDIS_DATA="$REDIS_ROOT/data"
REDIS_CONFIG="$REDIS_ROOT/redis.conf"
REDIS_LOG="$REDIS_ROOT/redis.log"
REDIS_PID="$REDIS_ROOT/redis.pid"
MINIO_ROOT="$STATE_DIR/minio"
MINIO_DATA="$MINIO_ROOT/data"
MINIO_LOG="$MINIO_ROOT/minio.log"
MINIO_PID="$MINIO_ROOT/minio.pid"
MINIO_BIN_DIR="$STATE_DIR/bin"
MINIO_VERSION="RELEASE.2025-09-07T16-13-09Z"
MINIO_FILE="minio.linux-amd64.${MINIO_VERSION}"
MINIO_BIN="$MINIO_BIN_DIR/$MINIO_FILE"
MINIO_SHA256="7c5bd8512c6e966455b1d198209358b2d191c77a83ab377c4073281065fb855f"
# The checksum is published with this immutable upstream GitHub release asset.
MINIO_URL="https://github.com/minio/minio/releases/download/${MINIO_VERSION}/${MINIO_FILE}"
LOCK_DIR="$STATE_DIR/services.lock.d"

APT_UPDATED=0
PG_BIN_DIR=""
PG_INITDB=""
PG_CTL=""
PG_PSQL=""
PG_CREATEDB=""
REDIS_SERVER=""
REDIS_CLI=""
POSTGRES_USER=""
POSTGRES_DB=""
POSTGRES_PASSWORD=""
REDIS_PASSWORD=""
MINIO_ROOT_USER=""
MINIO_ROOT_PASSWORD=""
LOCK_HELD=0

info() {
  printf '%s\n' "$*"
}

die() {
  printf 'Native services: %s\n' "$*" >&2
  exit 1
}

require_environment() {
  [[ -f "$ENV_FILE" ]] || die 'environment missing; run node scripts/init-env.mjs first'
}

env_value() {
  local key="$1"
  local line value

  line="$(grep -m1 -E "^${key}=" "$ENV_FILE" || true)"
  [[ -n "$line" ]] || die "missing ${key} in .env"
  value="${line#*=}"
  value="${value%$'\r'}"
  [[ -n "$value" ]] || die "empty ${key} in .env"
  printf '%s' "$value"
}

load_environment() {
  POSTGRES_USER="$(env_value POSTGRES_USER)"
  POSTGRES_DB="$(env_value POSTGRES_DB)"
  POSTGRES_PASSWORD="$(env_value POSTGRES_PASSWORD)"
  REDIS_PASSWORD="$(env_value REDIS_PASSWORD)"
  MINIO_ROOT_USER="$(env_value MINIO_ROOT_USER)"
  MINIO_ROOT_PASSWORD="$(env_value MINIO_ROOT_PASSWORD)"

  [[ "$POSTGRES_USER" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || die 'POSTGRES_USER must be a PostgreSQL identifier'
  [[ "$POSTGRES_DB" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || die 'POSTGRES_DB must be a PostgreSQL identifier'
}

prepare_state_directory() {
  mkdir -p "$STATE_DIR"
  chmod 711 "$ROOT_DIR/.hoplite" "$STATE_DIR"
}

release_lock() {
  [[ "$LOCK_HELD" -eq 1 ]] || return 0
  if [[ -f "$LOCK_DIR/pid" ]] && [[ "$(cat "$LOCK_DIR/pid" 2>/dev/null || true)" == "$$" ]]; then
    rm -rf "$LOCK_DIR"
  fi
}

acquire_lock() {
  local owner deadline
  deadline=$((SECONDS + 120))

  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    owner="$(cat "$LOCK_DIR/pid" 2>/dev/null || true)"
    if [[ "$owner" =~ ^[0-9]+$ ]] && ! kill -0 "$owner" 2>/dev/null; then
      rm -f "$LOCK_DIR/pid"
      rmdir "$LOCK_DIR" 2>/dev/null || true
      continue
    fi
    (( SECONDS < deadline )) || die 'timed out waiting for another native service operation'
    sleep 1
  done

  printf '%s\n' "$$" >"$LOCK_DIR/pid"
  LOCK_HELD=1
}

require_root_for_packages() {
  [[ "$(id -u)" -eq 0 ]] || die 'package installation requires root; use Docker Compose or install the missing service first'
}

install_packages() {
  require_root_for_packages
  if [[ "$APT_UPDATED" -eq 0 ]]; then
    info 'Refreshing apt metadata for native backing services.'
    DEBIAN_FRONTEND=noninteractive apt-get update -qq
    APT_UPDATED=1
  fi
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "$@"
}

detect_postgres_binaries() {
  local candidate
  PG_BIN_DIR=""

  for candidate in /usr/lib/postgresql/16/bin "$(dirname "$(command -v initdb 2>/dev/null || true)")"; do
    [[ -x "$candidate/initdb" ]] || continue
    if "$candidate/initdb" --version 2>/dev/null | grep -Eq '\)[[:space:]]+16\.'; then
      PG_BIN_DIR="$candidate"
      break
    fi
  done

  if [[ -n "$PG_BIN_DIR" ]]; then
    PG_INITDB="$PG_BIN_DIR/initdb"
    PG_CTL="$PG_BIN_DIR/pg_ctl"
    PG_PSQL="$PG_BIN_DIR/psql"
    PG_CREATEDB="$PG_BIN_DIR/createdb"
  fi
}

ensure_postgres_binaries() {
  detect_postgres_binaries
  if [[ -z "$PG_BIN_DIR" ]]; then
    install_packages postgresql-16 postgresql-client-16
    detect_postgres_binaries
  fi
  [[ -n "$PG_BIN_DIR" ]] || die 'PostgreSQL 16 binaries are unavailable; use Docker Compose or install postgresql-16'
}

ensure_redis_binaries() {
  if ! command -v redis-server >/dev/null 2>&1 || ! command -v redis-cli >/dev/null 2>&1; then
    install_packages redis-server
  fi
  REDIS_SERVER="$(command -v redis-server 2>/dev/null || true)"
  REDIS_CLI="$(command -v redis-cli 2>/dev/null || true)"
  [[ -n "$REDIS_SERVER" && -n "$REDIS_CLI" ]] || die 'Redis binaries are unavailable after installation'
}

ensure_minio_dependencies() {
  local packages=()

  command -v curl >/dev/null 2>&1 || packages+=(curl)
  [[ -r /etc/ssl/certs/ca-certificates.crt ]] || packages+=(ca-certificates)
  command -v sha256sum >/dev/null 2>&1 || packages+=(coreutils)

  if (( ${#packages[@]} > 0 )); then
    install_packages "${packages[@]}"
  fi
}

run_as_postgres() {
  if [[ "$(id -u)" -eq 0 ]]; then
    id postgres >/dev/null 2>&1 || die 'the postgres system account is unavailable'
    runuser -u postgres -- "$@"
  else
    "$@"
  fi
}

run_as_redis() {
  if [[ "$(id -u)" -eq 0 ]] && id redis >/dev/null 2>&1; then
    runuser -u redis -- "$@"
  else
    "$@"
  fi
}

prepare_postgres_paths() {
  if [[ "$(id -u)" -eq 0 ]]; then
    install -d -m 700 -o postgres -g postgres "$PG_ROOT" "$PG_DATA"
    touch "$PG_LOG"
    chown postgres:postgres "$PG_LOG"
    chmod 600 "$PG_LOG"
  else
    mkdir -p "$PG_ROOT" "$PG_DATA"
    touch "$PG_LOG"
    chmod 700 "$PG_ROOT" "$PG_DATA"
    chmod 600 "$PG_LOG"
  fi
}

postgres_connects_to() {
  local database="$1"
  PGPASSWORD="$POSTGRES_PASSWORD" "$PG_PSQL" --no-psqlrc --quiet --tuples-only --no-align \
    --host=127.0.0.1 --port=5432 --username="$POSTGRES_USER" --dbname="$database" \
    --command='SELECT 1' >/dev/null 2>&1
}

initialize_postgres() {
  [[ -f "$PG_DATA/PG_VERSION" ]] && return

  if [[ -d "$PG_DATA" ]] && [[ -n "$(find "$PG_DATA" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
    die "refusing to initialize non-empty PostgreSQL data directory at $PG_DATA"
  fi

  prepare_postgres_paths
  local password_file
  password_file="$(mktemp "$PG_ROOT/.init-password.XXXXXX")"
  printf '%s\n' "$POSTGRES_PASSWORD" >"$password_file"
  if [[ "$(id -u)" -eq 0 ]]; then
    chown postgres:postgres "$password_file"
  fi

  info 'Initializing local PostgreSQL 16 data directory.'
  if ! run_as_postgres "$PG_INITDB" --pgdata="$PG_DATA" --username="$POSTGRES_USER" \
    --pwfile="$password_file" --auth-host=scram-sha-256 --auth-local=scram-sha-256 --encoding=UTF8 --locale=C >/dev/null; then
    rm -f "$password_file"
    die "PostgreSQL initialization failed; inspect $PG_LOG"
  fi
  rm -f "$password_file"
}

ensure_project_database() {
  postgres_connects_to "$POSTGRES_DB" && return
  postgres_connects_to postgres || return 1

  if ! PGPASSWORD="$POSTGRES_PASSWORD" "$PG_CREATEDB" --host=127.0.0.1 --port=5432 \
    --username="$POSTGRES_USER" --maintenance-db=postgres "$POSTGRES_DB" >/dev/null 2>&1; then
    postgres_connects_to "$POSTGRES_DB" || die "could not create local PostgreSQL database $POSTGRES_DB"
  fi
}

start_postgres() {
  if postgres_connects_to "$POSTGRES_DB"; then
    info 'PostgreSQL is ready.'
    return
  fi

  if postgres_connects_to postgres; then
    [[ -f "$PG_DATA/PG_VERSION" ]] || die 'PostgreSQL is already listening on port 5432; refusing to alter an external server'
    ensure_project_database
    info 'PostgreSQL is ready.'
    return
  fi

  initialize_postgres
  prepare_postgres_paths
  if ! run_as_postgres "$PG_CTL" --pgdata="$PG_DATA" --log="$PG_LOG" \
    --options='-h 127.0.0.1 -p 5432' --wait --timeout=60 start >/dev/null 9>&-; then
    die "PostgreSQL could not start. Inspect $PG_LOG"
  fi

  ensure_project_database || die 'PostgreSQL started but local credentials were rejected'
  info 'PostgreSQL is ready.'
}

prepare_redis_paths() {
  mkdir -p "$REDIS_ROOT" "$REDIS_DATA"
  touch "$REDIS_LOG"
  if [[ "$(id -u)" -eq 0 ]] && id redis >/dev/null 2>&1; then
    chown -R redis:redis "$REDIS_ROOT"
  fi
  chmod 700 "$REDIS_ROOT" "$REDIS_DATA"
  chmod 600 "$REDIS_LOG"
}

redis_is_healthy() {
  REDISCLI_AUTH="$REDIS_PASSWORD" "$REDIS_CLI" --no-auth-warning --raw -h 127.0.0.1 -p 6379 ping 2>/dev/null | grep -qx 'PONG'
}

write_redis_config() {
  local config_tmp escaped_password
  config_tmp="$(mktemp "$REDIS_ROOT/.redis.conf.XXXXXX")"
  escaped_password="${REDIS_PASSWORD//\\/\\\\}"
  escaped_password="${escaped_password//\"/\\\"}"
  cat >"$config_tmp" <<EOF
bind 127.0.0.1
protected-mode yes
port 6379
daemonize yes
pidfile "$REDIS_PID"
logfile "$REDIS_LOG"
dir "$REDIS_DATA"
appendonly yes
appendfsync everysec
requirepass "$escaped_password"
EOF
  mv "$config_tmp" "$REDIS_CONFIG"
  if [[ "$(id -u)" -eq 0 ]] && id redis >/dev/null 2>&1; then
    chown redis:redis "$REDIS_CONFIG"
  fi
  chmod 600 "$REDIS_CONFIG"
}

start_redis() {
  if redis_is_healthy; then
    info 'Redis is ready.'
    return
  fi

  prepare_redis_paths
  write_redis_config
  if ! run_as_redis "$REDIS_SERVER" "$REDIS_CONFIG" >/dev/null 9>&-; then
    die "Redis could not start. Inspect $REDIS_LOG"
  fi

  local attempt
  for attempt in $(seq 1 60); do
    if redis_is_healthy; then
      info 'Redis is ready.'
      return
    fi
    sleep 1
  done
  die "Redis did not become ready. Inspect $REDIS_LOG"
}

minio_is_healthy() {
  curl --fail --silent --show-error --max-time 2 http://127.0.0.1:9000/minio/health/live >/dev/null 2>&1
}

verify_minio_binary() {
  [[ -x "$MINIO_BIN" ]] && printf '%s  %s\n' "$MINIO_SHA256" "$MINIO_BIN" | sha256sum --check --status -
}

ensure_minio_binary() {
  [[ "$(uname -m)" =~ ^(x86_64|amd64)$ ]] || die 'native MinIO bootstrap currently supports linux amd64; use Docker Compose on another architecture'
  ensure_minio_dependencies
  mkdir -p "$MINIO_BIN_DIR"
  chmod 700 "$MINIO_BIN_DIR"

  if [[ -e "$MINIO_BIN" ]] && ! verify_minio_binary; then
    rm -f "$MINIO_BIN"
  fi
  if verify_minio_binary; then
    return
  fi

  local download_tmp
  download_tmp="$(mktemp "$MINIO_BIN_DIR/.${MINIO_FILE}.XXXXXX")"
  info "Downloading pinned MinIO ${MINIO_VERSION}."
  if ! curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 --retry 3 --connect-timeout 15 \
    --max-time 600 --output "$download_tmp" "$MINIO_URL"; then
    rm -f "$download_tmp"
    die 'could not download the pinned MinIO binary'
  fi
  if ! printf '%s  %s\n' "$MINIO_SHA256" "$download_tmp" | sha256sum --check --status -; then
    rm -f "$download_tmp"
    die 'the downloaded MinIO binary failed checksum verification'
  fi
  chmod 700 "$download_tmp"
  mv "$download_tmp" "$MINIO_BIN"
}

prepare_minio_paths() {
  mkdir -p "$MINIO_ROOT" "$MINIO_DATA"
  touch "$MINIO_LOG"
  chmod 700 "$MINIO_ROOT" "$MINIO_DATA"
  chmod 600 "$MINIO_LOG"
}

start_minio() {
  if minio_is_healthy; then
    info 'MinIO is ready.'
    return
  fi

  ensure_minio_binary
  prepare_minio_paths
  rm -f "$MINIO_PID"
  nohup setsid env MINIO_ROOT_USER="$MINIO_ROOT_USER" MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
    "$MINIO_BIN" server "$MINIO_DATA" --address 127.0.0.1:9000 --console-address 127.0.0.1:9001 \
    </dev/null >>"$MINIO_LOG" 2>&1 9>&- &
  printf '%s\n' "$!" >"$MINIO_PID"

  local attempt
  for attempt in $(seq 1 60); do
    if minio_is_healthy; then
      info 'MinIO is ready.'
      return
    fi
    sleep 1
  done
  die "MinIO did not become ready. Inspect $MINIO_LOG"
}

valid_pid() {
  [[ "$1" =~ ^[0-9]+$ ]] && kill -0 "$1" 2>/dev/null
}

pid_uses_binary() {
  local pid="$1"
  local binary="$2"
  valid_pid "$pid" && [[ -r "/proc/$pid/exe" ]] && [[ "$(readlink -f "/proc/$pid/exe")" == "$(readlink -f "$binary")" ]]
}

stop_postgres() {
  detect_postgres_binaries
  if [[ -n "$PG_CTL" && -f "$PG_DATA/PG_VERSION" ]] && run_as_postgres "$PG_CTL" --pgdata="$PG_DATA" status >/dev/null 2>&1; then
    run_as_postgres "$PG_CTL" --pgdata="$PG_DATA" --wait --timeout=60 stop --mode=fast >/dev/null
    info 'PostgreSQL stopped.'
  fi
}

stop_redis() {
  local pid
  [[ -f "$REDIS_PID" ]] || return
  pid="$(cat "$REDIS_PID")"
  pid_uses_binary "$pid" "$REDIS_SERVER" || return
  if [[ -n "$REDIS_CLI" ]] && redis_is_healthy; then
    REDISCLI_AUTH="$REDIS_PASSWORD" "$REDIS_CLI" --no-auth-warning -h 127.0.0.1 -p 6379 shutdown >/dev/null 2>&1 || true
  fi
  if valid_pid "$pid"; then
    kill -TERM "$pid" 2>/dev/null || true
  fi
  rm -f "$REDIS_PID"
  info 'Redis stopped.'
}

stop_minio() {
  local pid
  [[ -f "$MINIO_PID" ]] || return
  pid="$(cat "$MINIO_PID")"
  if pid_uses_binary "$pid" "$MINIO_BIN"; then
    kill -TERM "$pid" 2>/dev/null || true
    info 'MinIO stopped.'
  fi
  rm -f "$MINIO_PID"
}

show_status() {
  local failed=0

  detect_postgres_binaries
  if [[ -n "$PG_PSQL" ]] && postgres_connects_to "$POSTGRES_DB"; then
    info 'PostgreSQL: ready'
  else
    info 'PostgreSQL: unavailable'
    failed=1
  fi

  if command -v redis-cli >/dev/null 2>&1; then
    REDIS_CLI="$(command -v redis-cli)"
  fi
  if [[ -n "$REDIS_CLI" ]] && redis_is_healthy; then
    info 'Redis: ready'
  else
    info 'Redis: unavailable'
    failed=1
  fi

  if minio_is_healthy; then
    info 'MinIO: ready'
  else
    info 'MinIO: unavailable'
    failed=1
  fi

  return "$failed"
}

main() {
  local action="${1:-up}"
  prepare_state_directory
  require_environment
  load_environment
  acquire_lock
  trap release_lock EXIT

  case "$action" in
    up)
      ensure_postgres_binaries
      ensure_redis_binaries
      start_postgres
      start_redis
      start_minio
      info 'Native PostgreSQL, Redis, and MinIO are ready.'
      ;;
    stop)
      detect_postgres_binaries
      if command -v redis-cli >/dev/null 2>&1; then
        REDIS_CLI="$(command -v redis-cli)"
        REDIS_SERVER="$(command -v redis-server 2>/dev/null || true)"
      fi
      stop_minio
      stop_redis
      stop_postgres
      ;;
    status)
      show_status
      ;;
    *)
      printf 'Usage: %s {up|stop|status}\n' "$0" >&2
      exit 2
      ;;
  esac
}

main "$@"
