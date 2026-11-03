#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ -x "$root/backend/.venv/bin/python" ]]; then
  exec "$root/backend/.venv/bin/python" "$root/scripts/reset_data.py" "$@"
fi
exec python3 "$root/scripts/reset_data.py" "$@"
