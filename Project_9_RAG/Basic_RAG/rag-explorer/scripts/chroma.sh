#!/usr/bin/env bash
set -euo pipefail

if command -v chroma >/dev/null 2>&1; then
  exec chroma "$@"
fi

COMMON_PATHS=(
  "/Library/Frameworks/Python.framework/Versions/3.13/bin/chroma"
  "/opt/homebrew/bin/chroma"
  "/usr/local/bin/chroma"
)

for candidate in "${COMMON_PATHS[@]}"; do
  if [ -x "$candidate" ]; then
    exec "$candidate" "$@"
  fi
done

echo "Chroma CLI was not found. Install it with: python3 -m pip install chromadb" >&2
exit 127
