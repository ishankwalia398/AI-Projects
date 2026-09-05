from dotenv import load_dotenv

load_dotenv()

from deepeval.test_case import LLMTestCase
from deepeval import assert_test
from deepeval.metrics import AnswerRelevancyMetric

def test_hello_world():
    test_cases = [
        LLMTestCase(
            input="What is 2+2?",
            actual_output="4",
            expected_output="4",
            context=["arithmetic addition operation"],
        ),
        LLMTestCase(
            input="What is 4+3?",
            actual_output="7",
            expected_output="7",
            context=["arithmetic addition operation"],
        ),
    ]

    metric = [AnswerRelevancyMetric(threshold=0.9)]

    for test_case in test_cases:
        assert_test(test_case, metric)