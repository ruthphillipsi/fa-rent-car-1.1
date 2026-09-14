#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
source "$ROOT_DIR/scripts/native-service-utils.sh"

bash -n "$ROOT_DIR/scripts/setup.sh" "$ROOT_DIR/scripts/services.sh" \
  "$ROOT_DIR/scripts/native-services.sh" "$ROOT_DIR/scripts/native-service-utils.sh"
git -C "$ROOT_DIR" check-ignore --no-index -q .context/generated-context

TEMP_DIR="$(mktemp -d)"
LISTENER_PID=""
cleanup() {
  if [[ -n "$LISTENER_PID" ]] && kill -0 "$LISTENER_PID" 2>/dev/null; then
    kill "$LISTENER_PID" 2>/dev/null || true
    wait "$LISTENER_PID" 2>/dev/null || true
  fi
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

PID_FILE="$TEMP_DIR/pid"
printf '%s\nmetadata\n' "$$" >"$PID_FILE"
[[ "$(pid_from_file "$PID_FILE")" == "$$" ]]

printf 'not-a-pid\n' >"$PID_FILE"
if pid_from_file "$PID_FILE" >/dev/null; then
  printf 'pid_from_file accepted invalid content\n' >&2
  exit 1
fi

pid_uses_binary "$$" "$(command -v bash)"

TOKEN="native-ownership-token-$$"
bash -c '
  set -euo pipefail
  source "$1"
  process_has_argument "$$" "$2"
  ! process_has_argument "$$" "${2}-unrelated"
' _ "$ROOT_DIR/scripts/native-service-utils.sh" "$TOKEN"

PORT_FILE="$TEMP_DIR/port"
node --input-type=module -e '
  import { createServer } from "node:net";
  const server = createServer();
  server.listen(0, "127.0.0.1", () => process.stdout.write(`${server.address().port}\n`));
  setInterval(() => {}, 1_000);
' >"$PORT_FILE" 2>/dev/null &
LISTENER_PID="$!"
for _ in $(seq 1 50); do
  [[ -s "$PORT_FILE" ]] && break
  sleep 0.05
done
[[ -s "$PORT_FILE" ]]
tcp_port_is_in_use "$(cat "$PORT_FILE")"
