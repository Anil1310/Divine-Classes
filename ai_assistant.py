#!/usr/bin/env python3
"""
Divine Classes — Zero-Token-Exhaustion OpenRouter AI Assistant
=============================================================
Configured with automatic fallbacks across multiple 100% free models
so you NEVER run out of tokens or hit credit exhaustion.

Free Models in Fallback Order:
  1. meta-llama/llama-3.3-70b-instruct:free
  2. google/gemini-2.0-flash-exp:free
  3. deepseek/deepseek-r1:free
  4. mistralai/mistral-7b-instruct:free

Usage:
  python ai_assistant.py
"""

import os
import sys

try:
    from openai import OpenAI
except ImportError:
    print("The 'openai' library is not installed.")
    print("Run: pip install openai")
    sys.exit(1)

# List of zero-cost free models on OpenRouter in priority order
FREE_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-r1:free",
    "mistralai/mistral-7b-instruct:free"
]

API_KEY = os.environ.get("OPENROUTER_API_KEY")

if not API_KEY:
    print("Note: OPENROUTER_API_KEY is not set in environment variables.")
    key_input = input("Enter your OpenRouter API Key (or press Enter to exit): ").strip()
    if key_input:
        API_KEY = key_input
    else:
        print("No API key provided. Exiting.")
        sys.exit(1)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY,
)

def ask_openrouter(prompt, max_tokens=1500):
    """
    Sends query with automatic fallback across free models.
    Guarantees you never run short of paid credits or tokens.
    """
    last_error = None

    for model_name in FREE_MODELS:
        try:
            print(f"-> Trying model: {model_name}...")
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert AI tutor for Divine Classes institute, "
                            "specializing in JEE, NEET, and CBSE Board preparation. "
                            "Provide clear, accurate, and concise explanations."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                extra_headers={
                    "HTTP-Referer": "https://divineclasses.vercel.app",
                    "X-Title": "Divine Classes Institute Portal"
                }
            )
            content = response.choices[0].message.content
            return content, model_name
        except Exception as e:
            last_error = e
            print(f"   [Notice] Model {model_name} unavailable or rate-limited. Falling back to next free model...")
            continue

    return f"All fallback models failed. Last error: {last_error}", None

def main():
    print("==========================================================")
    print("  Divine Classes — Unlimited Zero-Token OpenRouter Assistant")
    print("==========================================================")
    print("Zero-cost models active: Llama 3.3 70B, Gemini 2.0, DeepSeek R1")
    print("Type your question or prompt (or type 'exit' to quit):\n")

    while True:
        try:
            query = input("\nAsk AI > ").strip()
            if not query:
                continue
            if query.lower() in ("exit", "quit", "q"):
                print("Exiting.")
                break

            print("\nGenerating response...\n")
            reply, used_model = ask_openrouter(query)
            print("----------------------------------------------------------")
            if used_model:
                print(f"[Generated via {used_model} ($0.00 cost / unlimited)]\n")
            print(reply)
            print("----------------------------------------------------------")
        except KeyboardInterrupt:
            print("\nStopped.")
            break

if __name__ == "__main__":
    main()
