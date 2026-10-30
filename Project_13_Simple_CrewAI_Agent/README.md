# Project 13 – Simple CrewAI Agent

A minimal **CrewAI** example: a single "Senior QA Engineer" agent that analyses a feature and writes 10–15 test cases. The sample task targets the SauceDemo login page (username, password and login button).

## Features

- One agent, one task, one crew – the smallest working CrewAI setup.
- Role, goal and backstory prompting for a QA persona.
- LLM configured through environment variables (Groq via an OpenAI-compatible endpoint).
- Prints a numbered list of test cases with short descriptions.

## Tech stack

- Python
- [CrewAI](https://www.crewai.com/)
- Groq (OpenAI-compatible API)
- `python-dotenv`

## Setup and run

```bash
pip install crewai python-dotenv
```

Create a `.env` file:

```
GROQ_MODEL=<model-name>
GROQ_API_KEY=<your-key>
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

```bash
python 01_test_analyst_Agent.py
```

Never commit the `.env` file.
