"""Run all Python LangChain stages with synthetic evidence only."""
import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from .schemas import Ticket
from .workflow import run_workflow

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("google").setLevel(logging.ERROR)


async def main():
    # Deliberately no Jira input option: the user chose synthetic-only smoke tests.
    ticket = Ticket.model_validate(json.loads((ROOT / "fixtures/sample_report.json").read_text(encoding="utf-8"))["ticket"])
    if "--long" in sys.argv:
        ticket.description += "\nSynthetic load-test note; no private Jira content." * 320
    try:
        async with asyncio.timeout(240):
            report = await run_workflow(ticket, lambda stage, state: print(f"{stage}: {state}", flush=True))
        print(json.dumps({"source": ticket.source, "model": report.model, "stages": 3, "testCount": len(report.strategy.tests), "durationMs": report.durationMs}))
    except Exception as exc:
        detail = str(exc)
        for key, value in os.environ.items():
            if value and any(word in key for word in ("KEY", "TOKEN", "PASSWORD", "SECRET", "EMAIL")):
                detail = detail.replace(value, "[REDACTED]")
        print(json.dumps({"error": type(exc).__name__, "message": detail[:500]}))
        raise SystemExit(1) from None


if __name__ == "__main__":
    asyncio.run(main())
