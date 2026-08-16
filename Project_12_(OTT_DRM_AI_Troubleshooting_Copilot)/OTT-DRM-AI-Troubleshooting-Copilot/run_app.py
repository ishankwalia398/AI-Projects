from __future__ import annotations

import os

import uvicorn


def main() -> None:
    """Run the FastAPI app identically on macOS, Windows, and Unix/Linux."""

    host = os.getenv("APP_HOST", "127.0.0.1")
    port = int(os.getenv("APP_PORT", "8000"))
    reload_enabled = os.getenv("APP_RELOAD", "true").lower() in {"1", "true", "yes"}
    uvicorn.run("api.index:app", host=host, port=port, reload=reload_enabled)


if __name__ == "__main__":
    main()

