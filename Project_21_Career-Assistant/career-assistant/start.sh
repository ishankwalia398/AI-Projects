#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
OS_NAME="$(uname -s)"

python_ok() {
  command -v python3 >/dev/null 2>&1 &&
    python3 -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)' >/dev/null 2>&1
}

node_ok() {
  command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1 &&
    node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)' >/dev/null 2>&1
}

if [[ "$OS_NAME" == "Darwin" ]]; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew is required to install missing runtimes automatically."
    echo "Install Homebrew from https://brew.sh, then run: bash start.sh"
    exit 1
  fi
  eval "$(brew shellenv)"
  if ! python_ok; then
    echo "Installing Python 3.13 with Homebrew..."
    brew install python@3.13
    export PATH="$(brew --prefix python@3.13)/bin:$PATH"
  fi
  if ! node_ok; then
    echo "Installing Node.js with Homebrew..."
    brew install node
  fi
elif [[ "$OS_NAME" == "Linux" ]]; then
  need_install=false
  if ! python_ok || ! node_ok; then need_install=true; fi

  if [[ "$need_install" == true ]]; then
    if command -v apt-get >/dev/null 2>&1; then
      SUDO=()
      if [[ "$(id -u)" -ne 0 ]]; then
        command -v sudo >/dev/null 2>&1 || { echo "sudo is required to install dependencies."; exit 1; }
        SUDO=(sudo)
      fi
      "${SUDO[@]}" apt-get update
      "${SUDO[@]}" apt-get install -y python3 python3-venv python3-pip nodejs npm
    elif command -v dnf >/dev/null 2>&1; then
      SUDO=()
      if [[ "$(id -u)" -ne 0 ]]; then
        command -v sudo >/dev/null 2>&1 || { echo "sudo is required to install dependencies."; exit 1; }
        SUDO=(sudo)
      fi
      "${SUDO[@]}" dnf install -y python3 python3-pip nodejs npm
    elif command -v pacman >/dev/null 2>&1; then
      SUDO=()
      if [[ "$(id -u)" -ne 0 ]]; then
        command -v sudo >/dev/null 2>&1 || { echo "sudo is required to install dependencies."; exit 1; }
        SUDO=(sudo)
      fi
      "${SUDO[@]}" pacman -S --needed --noconfirm python python-pip nodejs npm
    elif command -v zypper >/dev/null 2>&1; then
      SUDO=()
      if [[ "$(id -u)" -ne 0 ]]; then
        command -v sudo >/dev/null 2>&1 || { echo "sudo is required to install dependencies."; exit 1; }
        SUDO=(sudo)
      fi
      "${SUDO[@]}" zypper --non-interactive install python3 python3-pip nodejs npm
    else
      echo "No supported package manager found (apt, dnf, pacman, or zypper). Install Python 3.12+ and Node.js 22.12+, then run bash start.sh."
      exit 1
    fi
  fi
else
  echo "Unsupported OS: $OS_NAME"
  exit 1
fi

if ! python_ok; then
  echo "Python 3.12+ is required but is still unavailable after installation. Install it for this Linux distribution, then rerun bash start.sh."
  exit 1
fi
if ! node_ok; then
  echo "Node.js 22.12+ is required but is still unavailable after installation. Install a supported Node.js release, then rerun bash start.sh."
  exit 1
fi

exec python3 "$ROOT/scripts/run_local.py"
