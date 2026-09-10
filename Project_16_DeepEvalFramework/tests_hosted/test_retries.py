import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from openai import APIStatusError
from hosted import Provider, retry_delay


def api_error(status=429, header="3", message="Please try again in 250ms."):
    response = SimpleNamespace(status_code=status, headers={"retry-after": header}, request=None)
    return APIStatusError(message, response=response, body=None)


class RetryTests(unittest.TestCase):
    def provider(self):
        provider = Provider.__new__(Provider)
        provider.client = MagicMock()
        provider.deadline = 1240
        return provider

    def test_respects_longest_provider_delay(self):
        self.assertEqual(retry_delay(api_error(), 0), 4)
        self.assertEqual(retry_delay(api_error(header="", message="Try again in 682.5ms."), 0), 1.6825)
        self.assertEqual(retry_delay(api_error(header="", message="Try again in 2m."), 0), 121)

    @patch("hosted.time.sleep")
    @patch("hosted.time.monotonic", return_value=1000)
    def test_rate_limit_retries_same_call(self, clock, sleep):
        provider = self.provider()
        response = SimpleNamespace(usage=None, choices=[SimpleNamespace(
            message=SimpleNamespace(content="valid response"), finish_reason="stop")])
        create = provider.client.chat.completions.create
        create.side_effect = [api_error(), response]
        self.assertEqual(provider.complete("model", [], "judge"), "valid response")
        self.assertEqual(create.call_count, 2)
        self.assertEqual(create.call_args_list[0], create.call_args_list[1])
        sleep.assert_called_once_with(4)

    @patch("hosted.time.sleep")
    @patch("hosted.time.monotonic", return_value=1000)
    def test_does_not_retry_authentication_errors(self, clock, sleep):
        provider = self.provider()
        provider.client.chat.completions.create.side_effect = api_error(status=401)
        with self.assertRaises(APIStatusError):
            provider.complete("model", [], "judge")
        sleep.assert_not_called()

    @patch("hosted.time.sleep")
    @patch("hosted.time.monotonic", return_value=1000)
    def test_long_limit_cannot_overrun_request_deadline(self, clock, sleep):
        provider = self.provider()
        provider.client.chat.completions.create.side_effect = api_error(header="3600")
        with self.assertRaisesRegex(RuntimeError, "usage limit is still active"):
            provider.complete("model", [], "judge")
        sleep.assert_not_called()


if __name__ == "__main__":
    unittest.main()
