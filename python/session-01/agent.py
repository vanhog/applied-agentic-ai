
import os
os.environ["PYDANTIC_AI_NO_BANNER"] = "1"

from pydantic_ai import Agent

agent = Agent(
    "openai:gpt-5.2",
    instructions="Answer briefly.",
)

result = agent.run_sync("Please book me a hairdresser appointment for Friday.")

print(result.output)
