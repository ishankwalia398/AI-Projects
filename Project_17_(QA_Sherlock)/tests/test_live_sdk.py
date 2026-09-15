"""Real SDK orchestration with deterministic completions; no external LLM calls."""
import importlib.util
import json
import unittest
from qa_sherlock.core import corpus, demo_report


@unittest.skipUnless(importlib.util.find_spec('crewai'), 'Install live extras to test SDK orchestration')
class CrewSDKTests(unittest.TestCase):
    def test_six_agent_execution(self):
        from qa_sherlock.crew import investigate
        evidence = corpus('samples/datasets')
        expected = demo_report(evidence)

        class FixtureRouter:
            configs = [{'model':'fixture-only'}]
            calls = 0

            def complete(self, messages):
                self.calls += 1
                return 'Final Answer: ' + json.dumps(expected)

        router = FixtureRouter()
        result = investigate([{'error':'inclusive expiry failure'}], evidence, router)
        self.assertEqual(len(result['agent_outputs']), 6)
        self.assertGreaterEqual(router.calls, 6)
        self.assertEqual(result['summary'], expected['summary'])


@unittest.skipUnless(importlib.util.find_spec('pinecone'), 'Install live extras for Pinecone adapter test')
class PineconeSDKTests(unittest.TestCase):
    def test_search_mapping(self):
        from qa_sherlock.integrations import PineconeStore
        class Index:
            def search(self, **kwargs):
                assert kwargs['query']['inputs']['text'] == 'expiry'
                return {'result': {'hits': [{'_id':'REQ-001','_score':.9,'fields':{'chunk_text':'inclusive','title':'Expiry','kind':'requirement','source':'synthetic://req'}}]}}
        store = object.__new__(PineconeStore)
        store.index = Index(); store.config = {'namespace':'test','top_k':3}
        self.assertEqual(store.search('expiry')[0]['id'], 'REQ-001')
