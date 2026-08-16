from __future__ import annotations

import importlib.util
import os
import platform
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

REQUIRED_MODULES = ["fastapi", "uvicorn", "pydantic", "pinecone", "openai", "dotenv"]
REQUIRED_PATHS = [
    "api/index.py",
    "public/index.html",
    "src/drm_copilot/service.py",
    "data/knowledge_base.jsonl",
    "data/historical_incidents.jsonl",
]


def main() -> int:
    failures: list[str] = []
    warnings: list[str] = []
    version = sys.version_info
    system = platform.system() or "Unknown"

    print(f"Operating system: {system} {platform.release()}")
    print(f"Python: {platform.python_version()}")
    print(f"Project root: {ROOT}")

    if not ((3, 13) <= (version.major, version.minor) < (3, 14)):
        failures.append("Python 3.13 is required by this project")

    for module in REQUIRED_MODULES:
        if importlib.util.find_spec(module) is None:
            failures.append(f"Missing Python module: {module}")

    for relative_path in REQUIRED_PATHS:
        if not (ROOT / relative_path).exists():
            failures.append(f"Missing project file: {relative_path}")

    if not os.getenv("PINECONE_API_KEY"):
        warnings.append("PINECONE_API_KEY is not set; local RAG fallback will be used")
    if os.getenv("ENABLE_AI_EXPLANATION", "false").lower() == "true" and not os.getenv("OPENAI_API_KEY"):
        warnings.append("ENABLE_AI_EXPLANATION is true but OPENAI_API_KEY is not set")

    for warning in warnings:
        print(f"WARNING: {warning}")
    for failure in failures:
        print(f"ERROR: {failure}")

    if failures:
        print("Environment check failed.")
        return 1
    print("Environment check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

