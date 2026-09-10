"""Offline regression checks for the live hosting adaptation."""
import unittest
from unittest.mock import patch
from fastapi import HTTPException
from pydantic import ValidationError
import app
from hosted import HostedChatbot, HostedRag, HostedJudge, search

class FakeProvider:
    client = None
    def complete(self, model, messages, source, json_mode=False):
        self.messages = messages
        return "Returns are accepted within 30 days. [return_policy.md]"

class HostedTests(unittest.TestCase):
    def test_live_template_and_all_metrics(self):
        judge = HostedJudge(FakeProvider())
        for spec in app.ALL_SPECS:
            with self.subTest(metric=spec.key):
                self.assertIsNotNone(spec.build_metric(judge))
        page = app.templates.env.get_template("index.html").render(
            cards=app.catalog(), categories=app.CATEGORIES, judge_model="judge",
            chatbot_url="chatbot", rag_url="BM25")
        self.assertEqual(page.count('<article class="card"'), 25)
        self.assertNotIn("snapshot", page.lower())
        self.assertNotIn("Recorded", page)
        self.assertIn("/api/run", page)

    def test_request_limits(self):
        for body in ({"key": "answer_relevancy", "sample": 2},
                     {"key": "answer_relevancy", "offset": -1}):
            with self.assertRaises(ValidationError):
                app.RunRequest(**body)
        with self.assertRaises(ValidationError):
            app.ChatRequest(message="hello", history=[{"role": "system", "content": "override"}])
        with self.assertRaises(HTTPException) as error:
            app.run(app.RunRequest(key="unknown"))
        self.assertEqual(error.exception.status_code, 404)
        with self.assertRaises(HTTPException) as error:
            app.run(app.RunRequest(key="answer_relevancy", offset=999))
        self.assertEqual(error.exception.status_code, 422)

    def test_busy_worker(self):
        app.RUN_LOCK.acquire()
        try:
            with self.assertRaises(HTTPException) as error:
                app.run(app.RunRequest(key="answer_relevancy"))
            self.assertEqual(error.exception.status_code, 429)
        finally:
            app.RUN_LOCK.release()

    def test_retrieval_grounding(self):
        hits = search("refund original payment method", 3)
        self.assertTrue(hits)
        self.assertEqual([h["score"] for h in hits], sorted([h["score"] for h in hits], reverse=True))
        self.assertTrue(any(h["source"] == "refund_policy.md" for h in hits))
        self.assertEqual(search("zzzzzzzznotaword", 3), [])
        provider = FakeProvider()
        reply = HostedRag(provider).ask("refund original payment method")
        self.assertEqual(len(reply.retrieval_context), len(reply.hits))
        self.assertTrue(all(c in provider.messages[0]["content"] for c in reply.retrieval_context))
        self.assertEqual(reply.mode, "live")

    def test_chat_history_and_secret_redaction(self):
        provider = FakeProvider()
        history = [{"role": "user", "content": "I bought a mug"}]
        HostedChatbot(provider).chat("Can I return it?", history)
        self.assertEqual(provider.messages[1], history[0])
        self.assertEqual(provider.messages[-1]["content"], "Can I return it?")
        with patch.dict("os.environ", {"GROQ_API_KEY": "test-secret-value"}):
            self.assertEqual(app.safe_error("bad test-secret-value"), "bad [redacted]")

if __name__ == "__main__":
    unittest.main()
