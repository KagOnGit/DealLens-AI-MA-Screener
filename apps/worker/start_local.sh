#!/usr/bin/env bash
set -euo pipefail

# -----------------------------
# DealLens Worker One-Click Run
# -----------------------------
# - Uses Python 3.11 (required for pandas==2.1.3 wheels)
# - Creates/uses .venv at repo root
# - Pre-installs numpy<2.0 + pandas==2.1.3 to avoid build issues
# - Installs apps/worker/requirements.txt
# - Loads env from repo .env and apps/worker/.env if present
# - Verifies Redis/Postgres reachability
# - Starts Celery worker + beat in one process (-B)
#
# Usage:
#   cd apps/worker
#   ./start_local.sh
#
# Optional env overrides:
#   LOG_LEVEL=info CELERY_CONCURRENCY=2 ./start_local.sh
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VENV_DIR="$REPO_ROOT/.venv"
LOG_LEVEL="${LOG_LEVEL:-info}"
CELERY_CONCURRENCY="${CELERY_CONCURRENCY:-2}"

echo "==> Repo root: $REPO_ROOT"
echo "==> Worker dir: $SCRIPT_DIR"
echo "==> Using venv: $VENV_DIR"

# Warn if conda base is active (causes pandas compile errors)
if [[ "${CONDA_DEFAULT_ENV:-}" == "base" ]]; then
  echo "⚠️  Detected Conda base environment (CONDA_DEFAULT_ENV=base)."
  echo "   Please run:  conda deactivate   (until (base) disappears) and re-run this script."
  exit 1
fi

# Ensure Python 3.11 is available
PYTHON_BIN="$(command -v python || true)"
if [[ -z "${PYTHON_BIN}" ]]; then
  echo "❌ 'python' not found on PATH. Install Python 3.11 and try again."
  exit 1
fi

PY_VER="$($PYTHON_BIN - <<'PY'
import sys
print(".".join(map(str, sys.version_info[:3])))
PY
)"

MAJOR="$(echo "$PY_VER" | cut -d. -f1)"
MINOR="$(echo "$PY_VER" | cut -d. -f2)"

if [[ "$MAJOR" -ne 3 || "$MINOR" -ne 11 ]]; then
  echo "❌ Python $PY_VER detected. Please use Python 3.11.x for smooth installs (pandas wheels)."
  echo "   If you have pyenv:  pyenv install 3.11.9 && pyenv local 3.11.9"
  exit 1
fi

# Create venv if needed
if [[ ! -d "$VENV_DIR" ]]; then
  echo "==> Creating virtualenv..."
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

# Activate venv
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

echo "==> Python in venv: $(python -V)"
python -m pip install --upgrade pip wheel setuptools >/dev/null

# Pre-install versions that avoid local compilation on macOS/arm
echo "==> Pre-installing numpy<2.0 and pandas==2.1.3 to avoid build issues..."
pip install "numpy<2.0" "pandas==2.1.3" >/dev/null

echo "==> Installing worker requirements..."
pip install -r "$SCRIPT_DIR/requirements.txt"

# Confirm celery is present
if ! command -v celery >/dev/null 2>&1; then
  echo "❌ Celery not found after install. Aborting."
  exit 1
fi

# Load .env files (repo root then worker dir), if present
load_env_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    echo "==> Loading env from $file"
    # Export non-comment, non-empty lines (simple KEY=VALUE)
    set -a
    # shellcheck disable=SC1090
    source <(grep -v '^[[:space:]]*#' "$file" | grep -E '^[[:alnum:]_]+=' || true)
    set +a
  fi
}
load_env_file "$REPO_ROOT/.env"
load_env_file "$SCRIPT_DIR/.env"

# Defaults if not provided
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/deallens}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"

echo "==> REDIS_URL: $REDIS_URL"
echo "==> DATABASE_URL: ${DATABASE_URL%%\?*}"  # hide query params if any

# Small parser to extract host/port from URLs via Python
parse_host_port() {
  python - "$1" <<'PY'
import sys, os
from urllib.parse import urlparse

u = urlparse(sys.argv[1])
host = u.hostname or "localhost"
port = u.port or (6379 if u.scheme.startswith("redis") else 5432)
print(f"{host} {port}")
PY
}

# Check TCP reachability (nc or python)
tcp_check() {
  local host="$1" port="$2" name="$3"
  if command -v nc >/dev/null 2>&1; then
    if nc -z "$host" "$port"; then
      echo "   ✅ $name reachable at $host:$port"
    else
      echo "   ❌ $name NOT reachable at $host:$port"
      return 1
    fi
  else
    python - "$host" "$port" "$name" <<'PY'
import socket, sys
host, port, name = sys.argv[1], int(sys.argv[2]), sys.argv[3]
s = socket.socket()
s.settimeout(2)
try:
    s.connect((host, port))
    print(f"   ✅ {name} reachable at {host}:{port}")
except Exception:
    print(f"   ❌ {name} NOT reachable at {host}:{port}")
    sys.exit(1)
finally:
    s.close()
PY
  fi
}

# Verify Redis
read -r REDIS_HOST REDIS_PORT <<<"$(parse_host_port "$REDIS_URL")"
tcp_check "$REDIS_HOST" "$REDIS_PORT" "Redis"

# Verify Postgres
read -r PG_HOST PG_PORT <<<"$(parse_host_port "$DATABASE_URL")"
tcp_check "$PG_HOST" "$PG_PORT" "Postgres"

echo "==> Starting Celery worker + beat (one process)..."
echo "   Log Level:  $LOG_LEVEL"
echo "   Concurrency: $CELERY_CONCURRENCY"
echo

# Run from worker dir so celery can find app.py
cd "$SCRIPT_DIR"

# Start worker with beat (-B)
exec celery -A app worker -B --loglevel="$LOG_LEVEL" --concurrency="$CELERY_CONCURRENCY"