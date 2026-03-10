import os
import requests
from dotenv import load_dotenv

load_dotenv()

TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")


def embed(texts):

    url = "https://api.together.xyz/v1/embeddings"

    headers = {
        "Authorization": f"Bearer {TOGETHER_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "BAAI/bge-small-en-v1.5",
        "input": texts
    }

    response = requests.post(url, json=data, headers=headers)

    if response.status_code != 200:
        raise Exception(response.text)

    result = response.json()

    return [item["embedding"] for item in result["data"]]