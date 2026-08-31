from crewai import Agent,Task, Crew
from crewai import LLM
from dotenv import load_dotenv
import os


load_dotenv()

groq_llm = LLM(
    model=f"openai/{os.getenv('GROQ_MODEL')}",
    api_key=os.getenv("GROQ_API_KEY"),
    base_url=os.getenv("GROQ_BASE_URL"),
)

qa_agent = Agent(
    role="Senior QA Engineer",
    goal="Analyse the feature or the requirements, and create 10-15 test cases out of it.",
    backstory="You are a senior QA engineer with 15 years of experience in test planning and testcases creation",
    llm = groq_llm,
    verbose=True
)

qa_task = Task(
    description="Create 10-15 test cases",
    expected_output="A numbered list of 10-15 test cases with brief descriptions for a https://www.saucedemo.com/ Login page with the username, password and login button functionality",
    agent=qa_agent
)

crew = Crew(
    agents=[qa_agent],
    tasks=[qa_task],
    verbose=True
)

# Step 4. kickOff
if __name__ == "__main__":
    result = crew.kickoff()
    print(result)