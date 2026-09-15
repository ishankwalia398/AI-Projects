import asyncio
import json
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from qa_sherlock.core import corpus, demo_report, ingest_playwright, retrieve_local, validate_report
from qa_sherlock.integrations import Jira
from qa_sherlock.providers import Router, ProviderError
from qa_sherlock.reporting import write_report


class PipelineTests(unittest.TestCase):
    def test_demo_end_to_end(self):
        docs = corpus('samples/datasets')
        self.assertEqual(len(docs), 39)
        failures = ingest_playwright('samples/playwright-report.json')
        self.assertEqual(len(failures), 2)
        evidence = retrieve_local(json.dumps(failures), docs, 40)
        report = validate_report(demo_report(evidence), evidence)
        report.update(mode='demo', evidence=evidence, evaluation={'status':'not_run'})
        with tempfile.TemporaryDirectory() as folder:
            write_report(report, folder)
            self.assertIn('PROMO_EXPIRED', (Path(folder)/'regression.spec.ts').read_text())
            self.assertEqual(json.loads((Path(folder)/'report.json').read_text())['confidence'], .88)

    def test_unknown_citation_rejected(self):
        evidence = corpus('samples/datasets')
        report = demo_report(evidence)
        report['claims'][0]['evidence_ids'] = ['invented']
        with self.assertRaises(ValueError): validate_report(report, evidence)

    def test_recovered_flake_preserved(self):
        payload={'suites':[{'suites':[{'specs':[{'tests':[{'status':'flaky','results':[{'status':'failed','retry':0},{'status':'passed','retry':1}]}]}]}]}]}
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'report.json'; path.write_text(json.dumps(payload))
            failures=ingest_playwright(path)
        self.assertEqual(len(failures),1)
        self.assertEqual(failures[0]['outcome'],'flaky')

    def test_jira_connection_error_falls_back(self):
        async def broken(key): raise ConnectionError('secret must not leak')
        jira=Jira({},mcp_fetch=broken,rest_fetch=lambda key:{'fields':{'summary':key}})
        self.assertEqual(asyncio.run(jira.get_issue('SHOP-142'))['fields']['summary'],'SHOP-142')
        self.assertEqual(jira.events[-1]['transport'],'rest')
        self.assertNotIn('secret',json.dumps(jira.events))

    def test_jira_malformed_falls_back(self):
        async def malformed(key): return {'error':'bad'}
        jira=Jira({},mcp_fetch=malformed,rest_fetch=lambda key:{'fields':{'summary':'rest'}})
        self.assertEqual(asyncio.run(jira.get_issue('SHOP-142'))['fields']['summary'],'rest')

    def test_jira_success_skips_rest(self):
        async def good(key): return {'fields':{'summary':'mcp'}}
        def forbidden(key): self.fail('REST called despite MCP success')
        jira=Jira({},mcp_fetch=good,rest_fetch=forbidden)
        self.assertEqual(asyncio.run(jira.get_issue('SHOP-142'))['fields']['summary'],'mcp')

    def test_jira_timeout_falls_back(self):
        async def slow(key): await asyncio.sleep(1)
        jira=Jira({'timeout_seconds':.001},mcp_fetch=slow,rest_fetch=lambda key:{'fields':{'summary':'rest'}})
        self.assertEqual(asyncio.run(jira.get_issue('SHOP-142'))['fields']['summary'],'rest')

    def test_jira_invalid_key(self):
        with self.assertRaises(ValueError): asyncio.run(Jira({}).get_issue('../secrets'))

    def test_provider_fallback_and_no_secret_leak(self):
        configs=[{'model':x,'key_env':'TEST_KEY'} for x in ['primary','fallback']]
        def factory(config,key):
            def create(**kwargs):
                if config['model']=='primary': raise RuntimeError('secret')
                return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content='ok'))])
            return SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
        with patch.dict(os.environ,{'TEST_KEY':'secret'}):
            router=Router(configs,factory)
            self.assertEqual(router.complete([]),'ok')
        self.assertEqual(len(router.events),2)
        self.assertNotIn('secret',json.dumps(router.events))

    def test_missing_credentials_fail_closed(self):
        with patch.dict(os.environ,{},clear=True):
            with self.assertRaises(ProviderError): Router([{'model':'x','key_env':'ABSENT'}]).complete([])

    def test_html_escapes_evidence(self):
        evidence=corpus('samples/datasets'); evidence[0]['text']='<script>alert(1)</script>'
        report=demo_report(evidence); report.update(evidence=evidence,mode='demo',evaluation={})
        with tempfile.TemporaryDirectory() as folder:
            write_report(report,folder)
            page=(Path(folder)/'index.html').read_text(encoding='utf-8')
        self.assertNotIn('<script>alert(1)</script>',page)
        self.assertIn('&lt;script&gt;',page)


if __name__ == '__main__': unittest.main()
