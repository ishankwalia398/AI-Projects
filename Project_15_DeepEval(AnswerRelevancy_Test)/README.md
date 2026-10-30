# Project 15 – DeepEval Answer Relevancy Test

A small **pytest + DeepEval** example that measures how relevant an LLM's answer is to the question asked, using DeepEval's `AnswerRelevancyMetric`.

## What it does

`test_01_Anwser_Relevancy.py` builds `LLMTestCase` objects (question, actual output, expected output, context) and asserts each one against an `AnswerRelevancyMetric` with a threshold of 0.9. A second "judge" LLM scores each answer. `Notes.md` documents the full setup.

## Features

- Answer-relevancy scoring with a pass/fail threshold.
- Test cases as plain Python, run through DeepEval's pytest integration.
- Judge model configurable: Groq (via a local OpenAI-compatible model), OpenAI, or other providers.

## Tech stack

- Python, pytest
- [DeepEval](https://github.com/confident-ai/deepeval)
- Groq / OpenAI as the judge LLM
- `python-dotenv`

## Setup and run

```bash
python3 -m venv venv && source venv/bin/activate
pip install -U deepeval requests python-dotenv
```

Configure the judge model as described in `Notes.md` (Groq, OpenAI and other providers are covered there), then run:

```bash
deepeval test run test_01_Anwser_Relevancy.py --display all
```

Note: each assertion makes a real LLM call, so keep the dataset small. Never commit credentials.
