#!/usr/bin/env bash
# Sourced after native-services.sh initializes workspace paths and service state.

info() {
  printf '%s\n' "$*"
}

die() {
  printf 'Native services: %s\n' "$*" >&2
  exit 1
}

valid_pid() {
  [[ "$1" =~ ^[0-9]+$ ]] && kill -0 "$1" 2>/dev/null
}

pid_from_file() {
  local file="$1"
  local pid
  [[ -r "$file" ]] || return 1
  IFS= read -r pid <"$file" || [[ -n "$pid" ]] || return 1
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  printf '%s\n' "$pid"
}

pid_uses_binary() {
  local pid="$1"
  local binary="$2"
  valid_pid "$pid" && [[ -x "$binary" ]] && [[ -r "/proc/$pid/exe" ]] &&
    [[ "$(readlink -f "/proc/$pid/exe")" == "$(readlink -f "$binary")" ]]
}

process_has_argument() {
  local pid="$1"
  local expected_argument="$2"
  valid_pid "$pid" && [[ -r "/proc/$pid/cmdline" ]] &&
    tr '\0' '\n' <"/proc/$pid/cmdline" | grep --fixed-strings --line-regexp -- "$expected_argument" >/dev/null
}

tcp_port_is_in_use() {
  local port="$1"
  [[ "$port" =~ ^[1-9][0-9]{0,4}$ ]] && [[ "$port" -le 65535 ]] || return 1
  (exec 3<>"/dev/tcp/127.0.0.1/$port") >/dev/null 2>&1
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
  PG_SERVER=""
  for candidate in /usr/lib/postgresql/16/bin "$(dirname "$(command -v initdb 2>/dev/null || true)")"; do
    [[ -x "$candidate/initdb" ]] || continue
    if "$candidate/initdb" --version 2>/dev/null | grep -Eq '\)[[:space:]]+16\.'; then
      PG_BIN_DIR="$candidate"
      break
    fi
  done
  if [[ -n "$PG_BIN_DIR" ]]; then
    PG_INITDB="$PG_BIN_DIR/initdb"
    PG_SERVER="$PG_BIN_DIR/postgres"
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
