import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
key = os.getenv("OPENAI_API_KEY")
print(f"Key starts with: {key[:10]}...")

client = OpenAI(api_key=key)

try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Say hello"}],
        max_tokens=10
    )
    print("Success!")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"Error: {e}")
