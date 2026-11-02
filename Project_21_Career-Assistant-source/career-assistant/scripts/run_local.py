import json
import os
import re
import signal
import socket
import shutil
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
VENV = BACKEND / ".venv"
WINDOWS = os.name == "nt"


def parse_dotenv(path):
    values = {}
    for number, raw_line in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        if "=" not in line:
            raise ValueError(f"Invalid .env entry on line {number}: expected KEY=VALUE.")
        key, value = line.split("=", 1)
        key = key.strip()
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key):
            raise ValueError(f"Invalid .env variable name on line {number}.")
        value = value.strip()
        if value[:1] in ("'", '"'):
            quote = value[0]
            if len(value) < 2 or value[-1] != quote:
                raise ValueError(f"Unclosed quoted value in .env on line {number}.")
            value = value[1:-1]
            if quote == '"':
                value = value.replace(r"\n", "\n").replace(r"\r", "\r").replace(r"\"", '"').replace(r"\\", "\\")
        else:
            value = re.split(r"\s+#", value, maxsplit=1)[0].rstrip()
        values[key] = value
    return values


def run_checked(command, cwd, label):
    print(f"[setup] {label}", flush=True)
    if WINDOWS and command[0] == "npm":
        command[0] = "npm.cmd"
        subprocess.run(command, cwd=cwd, check=True, shell=True)
    else:
        subprocess.run(command, cwd=cwd, check=True)


def prepare_dependencies():
    python = VENV / ("Scripts/python.exe" if WINDOWS else "bin/python")
    if not python.exists():
        run_checked([sys.executable, "-m", "venv", str(VENV)], BACKEND, "Creating Python virtual environment")
    run_checked(
        [str(python), "-m", "pip", "install", "--disable-pip-version-check", "-r", "requirements.txt"],
        BACKEND,
        "Checking/installing backend dependencies",
    )
    package_lock = FRONTEND / "package-lock.json"
    installed_lock = FRONTEND / "node_modules" / ".package-lock.json"
    if (
        not (FRONTEND / "node_modules").is_dir()
        or not installed_lock.is_file()
        or package_lock.stat().st_mtime > installed_lock.stat().st_mtime
    ):
        run_checked(["npm", "ci"], FRONTEND, "Installing frontend dependencies")
    else:
        print("[setup] Frontend dependencies already present; skipping npm ci", flush=True)
    return python


def child_environment():
    env = os.environ.copy()
    env_file = ROOT / ".env"
    if env_file.is_file():
        for key, value in parse_dotenv(env_file).items():
            env.setdefault(key, value)

    data_dir = Path(env.get("CAREER_ASSISTANT_DATA_DIR", BACKEND / "data")).expanduser().resolve()
    env.update(
        {
            "APP_ENV": "development",
            "DATABASE_URL": "sqlite:///" + (data_dir / "career.db").as_posix(),
            "FRONTEND_URL": "http://127.0.0.1:5173",
            "COOKIE_SECURE": "false",
            "STORAGE_DIR": str(data_dir / "files"),
            "QDRANT_URL": "",
            "INLINE_WORKER": "true",
        }
    )
    return env


def frontend_environment(env):
    sensitive = re.compile(r"(?:API_KEY|PASSWORD|SECRET|TOKEN|ACCESS_KEY|PRIVATE_KEY)$", re.IGNORECASE)
    return {key: value for key, value in env.items() if not sensitive.search(key)}


def start_process(command, cwd, env, label):
    options = {
        "cwd": cwd,
        "env": env,
        "stdout": subprocess.PIPE,
        "stderr": subprocess.STDOUT,
        "text": True,
        "encoding": "utf-8",
        "errors": "replace",
        "bufsize": 1,
    }
    if WINDOWS:
        options["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
        if command[0].lower().endswith((".cmd", ".bat")):
            options["shell"] = True
    else:
        options["start_new_session"] = True
    process = subprocess.Popen(command, **options)
    threading.Thread(target=forward_output, args=(process, label), daemon=True).start()
    print(f"[launcher] Started {label} (PID {process.pid})", flush=True)
    return process


def forward_output(process, label):
    if process.stdout is None:
        return
    for line in process.stdout:
        print(f"[{label}] {line}", end="", flush=True)


def wait_for_api(process, timeout=90):
    deadline = time.monotonic() + timeout
    url = "http://127.0.0.1:8000/api/health"
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError("The API process stopped before becoming healthy. See its log output above.")
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                payload = json.loads(response.read())
                if response.status == 200 and payload.get("status") == "ok":
                    return
        except (OSError, urllib.error.URLError):
            time.sleep(1)
    raise RuntimeError("The API did not become healthy within 90 seconds. Check the API log output above.")


def wait_for_frontend(process, timeout=60):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError("The frontend process stopped before becoming available. See its log output above.")
        try:
            with urllib.request.urlopen("http://127.0.0.1:5173", timeout=2) as response:
                if response.status == 200:
                    return
        except (OSError, urllib.error.URLError):
            time.sleep(1)
    raise RuntimeError("The frontend did not become available within 60 seconds. Check its log output above.")


def stop_process(process):
    if process.poll() is not None:
        return
    try:
        if WINDOWS:
            process.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            os.killpg(process.pid, signal.SIGTERM)
        process.wait(timeout=5)
    except (OSError, subprocess.TimeoutExpired):
        process.terminate()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()


def check_ports():
    for port in (8000, 5173):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            if WINDOWS:
                probe.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            try:
                probe.bind(('127.0.0.1', port))
            except OSError as exc:
                raise RuntimeError(
                    f'Port {port} is already in use. Stop the existing Career Assistant launcher '
                    'with Ctrl+C before starting again. If you only want to use the running app, '
                    'open http://127.0.0.1:5173. No new services were started.'
                ) from exc


def main():
    # Windows consoles may use cp1252; Vite emits Unicode status symbols.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(errors='backslashreplace')
    check_ports()
    python = prepare_dependencies()
    check_ports()
    env = child_environment()
    processes = []
    try:
        api = start_process(
            [str(python), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
            BACKEND,
            env,
            "api",
        )
        processes.append(api)
        wait_for_api(api)
        node = shutil.which("node")
        if not node:
            raise RuntimeError("Node.js was not found on PATH after dependency setup.")
        frontend = start_process(
            [node, str(FRONTEND / "node_modules" / "vite" / "bin" / "vite.js"), "--host", "127.0.0.1", "--strictPort", "--configLoader", "runner"],
            FRONTEND,
            frontend_environment(env),
            "frontend",
        )
        processes.append(frontend)
        wait_for_frontend(frontend)
        print("\nCareer Assistant is running at http://127.0.0.1:5173", flush=True)
        print("API health: http://127.0.0.1:8000/api/health", flush=True)
        print("Keep this window open. Press Ctrl+C here to stop all services.", flush=True)
        webbrowser.open("http://127.0.0.1:5173")
        while True:
            for name, process in zip(("API", "frontend"), processes):
                code = process.poll()
                if code is not None:
                    raise RuntimeError(f"The {name} process exited with code {code}. See its log output above.")
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[launcher] Stopping services...", flush=True)
    finally:
        for process in reversed(processes):
            stop_process(process)
        print("[launcher] All services stopped. Local data has been kept.", flush=True)


if __name__ == "__main__":
    try:
        main()
    except (OSError, subprocess.CalledProcessError, RuntimeError) as error:
        print(f"\n[launcher] Startup failed: {error}", file=sys.stderr, flush=True)
        sys.exit(1)
