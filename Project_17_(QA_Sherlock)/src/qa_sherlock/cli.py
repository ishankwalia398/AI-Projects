import argparse
import asyncio
import json
from pathlib import Path
from .core import corpus, demo_report, ingest_playwright, load_json, retrieve_local, validate_report
from .reporting import write_report


def main():
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
    parser = argparse.ArgumentParser(description="QA Sherlock — autonomous defect investigation")
    parser.add_argument("command", choices=["demo", "investigate", "index", "models"])
    parser.add_argument("--config", default="configs/default.json")
    parser.add_argument("--data", default="samples/datasets")
    parser.add_argument("--failure", default="samples/playwright-report.json")
    parser.add_argument("--out", default="runs/latest")
    parser.add_argument("--jira", help="Read-only Jira issue key")
    parser.add_argument("--skip-eval", action="store_true")
    args = parser.parse_args()
    config = load_json(args.config)
    from .providers import Router
    router = Router([config['primary'], config['fallback']])
    if args.command == "models":
        print(json.dumps(router.models(), indent=2))
        return
    if args.command == "index":
        from .integrations import PineconeStore
        docs = corpus(args.data)
        PineconeStore(config['pinecone']).upsert(docs)
        print(f"Indexed {len(docs)} evidence records; allow Pinecone indexing to become consistent before querying.")
        return
    failures = ingest_playwright(args.failure)
    if not failures:
        parser.error("No failed Playwright attempts found; no investigation generated")
    query = json.dumps(failures)
    events = []
    if args.command == "demo":
        if Path(args.failure).resolve() != Path("samples/playwright-report.json").resolve():
            parser.error("Offline demo supports only bundled failure; use investigate for other reports")
        evidence = retrieve_local(query, corpus(args.data), top_k=40)
        report = demo_report(evidence)
        report['mode'] = "OFFLINE DEMO · fixture analysis · no LLM calls"
    else:
        from .integrations import PineconeStore, Jira
        from .crew import investigate
        evidence = PineconeStore(config['pinecone']).search(query)
        if args.jira:
            jira = Jira(config['jira'])
            issue = asyncio.run(jira.get_issue(args.jira))
            evidence.append({"id": args.jira, "kind": "jira", "title": issue['fields'].get('summary', args.jira), "text": json.dumps(issue['fields']), "source": "Jira " + args.jira})
            events.extend(jira.events)
        report = investigate(failures, evidence, router)
        report['mode'] = "LIVE · CrewAI six-agent investigation"
    validate_report(report, evidence)
    report.update(evidence=evidence, failures=failures, events=events + router.events)
    if args.command == 'demo' or args.skip_eval:
        report['evaluation'] = {"status": "not_run", "reason": "Offline demo" if args.command == 'demo' else "Explicit --skip-eval", "metrics": []}
    else:
        from .evaluation import evaluate
        try:
            report['evaluation'] = evaluate(report, evidence, config)
        except Exception as exc:
            report['evaluation'] = {"status": "failed", "error_type": type(exc).__name__, "metrics": []}
    write_report(report, args.out)
    print(f"Investigation: {Path(args.out).resolve() / 'index.html'}")
    if report['evaluation']['status'] == 'failed':
        raise SystemExit(2)


if __name__ == "__main__":
    main()
