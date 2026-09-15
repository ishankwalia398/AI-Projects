import asyncio
import json
from .providers import Router


def evaluate(report, evidence, config):
    from deepeval.models import DeepEvalBaseLLM
    from deepeval.metrics import GEval
    from deepeval.test_case import LLMTestCase, LLMTestCaseParams

    class DeepSeekJudge(DeepEvalBaseLLM):
        def __init__(self):
            self.router = Router([config["judge"]])
            super().__init__(model_name=config["judge"]["model"])

        def load_model(self):
            return self.router

        def get_model_name(self):
            return config["judge"]["model"]

        def generate(self, prompt, schema=None):
            if schema:
                prompt += "\nReturn JSON matching: " + json.dumps(schema.model_json_schema())
            answer = self.router.complete([{"role": "user", "content": prompt}])
            if schema:
                cleaned = answer.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
                return schema.model_validate_json(cleaned)
            return answer

        async def a_generate(self, prompt, schema=None):
            return await asyncio.to_thread(self.generate, prompt, schema)

    judge = DeepSeekJudge()
    metrics = []
    for name, criteria in [
        ("Evidence groundedness", "Assess whether the root cause and claims are supported by supplied context; penalize fabricated citations and certainty beyond evidence."),
        ("Regression usefulness", "Assess whether the regression test tests the diagnosed bug, includes positive and negative boundaries, uses documented APIs and meaningful assertions.")
    ]:
        metric = GEval(name=name, criteria=criteria, model=judge,
                       evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.CONTEXT],
                       threshold=config["evaluation_threshold"], async_mode=False)
        metric.measure(LLMTestCase(input="Investigate failed test and generate regression coverage",
                                  actual_output=json.dumps(report), context=[d["text"] for d in evidence]))
        metrics.append({"name": name, "score": metric.score, "reason": metric.reason,
                        "passed": metric.is_successful()})
    return {"status": "completed", "engine": "DeepEval GEval", "model": judge.get_model_name(), "metrics": metrics}
