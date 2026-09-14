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
PG_SERVER=""
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

source "$ROOT_DIR/scripts/native-service-utils.sh"

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

postgres_is_owned() {
  local pid
  [[ -f "$PG_DATA/PG_VERSION" ]] || return 1
  pid="$(pid_from_file "$PG_DATA/postmaster.pid" || true)"
  [[ -n "$pid" ]] || return 1
  pid_uses_binary "$pid" "$PG_SERVER" && process_has_argument "$pid" "$PG_DATA" &&
    run_as_postgres "$PG_CTL" --pgdata="$PG_DATA" status >/dev/null 2>&1
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
  if postgres_is_owned; then
    ensure_project_database || die 'Native PostgreSQL is running but local credentials were rejected'
    info 'PostgreSQL is ready.'
    return
  fi

  if tcp_port_is_in_use 5432; then
    die 'PostgreSQL is already listening on port 5432; refusing to alter an external server'
  fi

  initialize_postgres
  prepare_postgres_paths
  if ! run_as_postgres "$PG_CTL" --pgdata="$PG_DATA" --log="$PG_LOG" \
    --options='-h 127.0.0.1 -p 5432' --wait --timeout=60 start >/dev/null 9>&-; then
    die "PostgreSQL could not start. Inspect $PG_LOG"
  fi

  postgres_is_owned || die 'PostgreSQL started without proving ownership of the local data directory'
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

redis_is_owned() {
  local pid redisDirectory
  pid="$(pid_from_file "$REDIS_PID" || true)"
  [[ -n "$pid" ]] || return 1
  pid_uses_binary "$pid" "$REDIS_SERVER" || return 1
  redisDirectory="$(
    REDISCLI_AUTH="$REDIS_PASSWORD" "$REDIS_CLI" --no-auth-warning --raw -h 127.0.0.1 -p 6379 \
      config get dir 2>/dev/null || true
  )"
  [[ "$redisDirectory" == $'dir\n'"$REDIS_DATA" ]]
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
  if redis_is_owned; then
    if redis_is_healthy; then
      info 'Redis is ready.'
      return
    fi
    die 'Native Redis is running but local credentials were rejected'
  fi

  if tcp_port_is_in_use 6379; then
    die 'Redis is already listening on port 6379; refusing to alter an external server'
  fi

  prepare_redis_paths
  write_redis_config
  rm -f "$REDIS_PID"
  if ! run_as_redis "$REDIS_SERVER" "$REDIS_CONFIG" >/dev/null 9>&-; then
    die "Redis could not start. Inspect $REDIS_LOG"
  fi

  local attempt
  for attempt in $(seq 1 60); do
    if redis_is_owned && redis_is_healthy; then
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

minio_is_owned() {
  local pid
  pid="$(pid_from_file "$MINIO_PID" || true)"
  [[ -n "$pid" ]] || return 1
  pid_uses_binary "$pid" "$MINIO_BIN" && process_has_argument "$pid" "$MINIO_DATA"
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
  if minio_is_owned; then
    ensure_minio_dependencies
    if minio_is_healthy; then
      info 'MinIO is ready.'
      return
    fi
    die 'Native MinIO is running but did not pass its health check'
  fi

  if tcp_port_is_in_use 9000 || tcp_port_is_in_use 9001; then
    die 'MinIO is already listening on port 9000 or 9001; refusing to alter an external server'
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
    if minio_is_owned && minio_is_healthy; then
      info 'MinIO is ready.'
      return
    fi
    sleep 1
  done
  die "MinIO did not become ready. Inspect $MINIO_LOG"
}

stop_postgres() {
  detect_postgres_binaries
  if [[ -n "$PG_CTL" ]] && postgres_is_owned; then
    run_as_postgres "$PG_CTL" --pgdata="$PG_DATA" --wait --timeout=60 stop --mode=fast >/dev/null
    info 'PostgreSQL stopped.'
  fi
}

stop_redis() {
  local pid
  pid="$(pid_from_file "$REDIS_PID" || true)"
  [[ -n "$pid" ]] || return
  redis_is_owned || return
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
  pid="$(pid_from_file "$MINIO_PID" || true)"
  [[ -n "$pid" ]] || return
  if minio_is_owned; then
    kill -TERM "$pid" 2>/dev/null || true
    info 'MinIO stopped.'
  fi
  rm -f "$MINIO_PID"
}

show_status() {
  local failed=0

  detect_postgres_binaries
  if [[ -n "$PG_PSQL" ]] && postgres_is_owned && postgres_connects_to "$POSTGRES_DB"; then
    info 'PostgreSQL: ready'
  else
    info 'PostgreSQL: unavailable'
    failed=1
  fi

  REDIS_CLI="$(command -v redis-cli 2>/dev/null || true)"
  REDIS_SERVER="$(command -v redis-server 2>/dev/null || true)"
  if [[ -n "$REDIS_CLI" && -n "$REDIS_SERVER" ]] && redis_is_owned && redis_is_healthy; then
    info 'Redis: ready'
  else
    info 'Redis: unavailable'
    failed=1
  fi

  if minio_is_owned && minio_is_healthy; then
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
      REDIS_CLI="$(command -v redis-cli 2>/dev/null || true)"
      REDIS_SERVER="$(command -v redis-server 2>/dev/null || true)"
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
