# Project 8 – LangFlow Agents

A collection of exported **Langflow** flows that act as QA assistants. Each JSON file can be imported into Langflow and run from the Playground or exposed through its API.

## Flows

| Flow | What it does |
|---|---|
| `AIChatBuddy.json` | Simple chat assistant (Chat Input → Groq model → Chat Output). |
| `Bug_Traige_Agent.json` | Fetches a Jira ticket, triages it with an LLM and returns the result as a table. |
| `RCA_Agent.json` | Pulls Jira defect data and builds an automated root-cause-analysis prompt; output rendered as a table. |
| `Flaky_Test_Analyzer.json` | Classifies flaky tests and analyses test reports to explain instability. |
| `Test_Case_Creator_Agent.json` | Fetches requirements from Confluence and generates test cases, exported to Excel. |
| `Test_Plan_Creator_Agent.json` | Routes the input and generates a test plan, compiled into an Excel file. |
| `API_Contract_Validator Agent.json` | Calls an API and validates the response against its contract using an LLM. |

## Features

- Jira and Confluence integration through custom Langflow components.
- Structured outputs: tables and downloadable Excel files.
- Reusable prompt templates per QA task.
- Model-agnostic: Groq and OpenRouter models.

## Tech stack

- **Langflow** (visual LLM flow builder, Python custom components)
- **LLM providers:** Groq, OpenRouter
- **Integrations:** Jira, Confluence, REST APIs, Excel export

## Usage

1. Install and start Langflow (`pip install langflow` then `langflow run`).
2. Import a flow JSON from the Langflow dashboard.
3. Set your API keys (Groq/OpenRouter) and Jira/Confluence credentials in the flow's components.
4. Open the Playground and run the flow.
