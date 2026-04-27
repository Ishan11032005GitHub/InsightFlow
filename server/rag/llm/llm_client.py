import os
import requests
import time

class LLMClient:
    """Client for generating answers using Google Gemini."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        
    def generate_answer(self, query: str, context: str) -> str:
        """
        Generates a clear, structured answer using Google Gemini based on the provided context.
        Retries up to 3 times on rate limit errors.
        """
        if not context.strip():
            return "Please provide document context so I can answer your question."
        
        prompt = (
            "You are InsightFlow AI, an expert document analyst. "
            "Answer the user's question based ONLY on the context provided below. "
            "Provide a DETAILED and COMPREHENSIVE explanation. "
            "Cover every relevant point from the context thoroughly. "
            "Use headings, bullet points, numbered lists, and sub-points to organize the answer. "
            "Include specific details, numbers, names, and examples found in the context. "
            "If the question asks for a summary, cover ALL major topics and sections in the document. "
            "If the context does not contain information about the question, say so clearly.\n\n"
            f"--- DOCUMENT CONTEXT ---\n{context}\n--- END CONTEXT ---\n\n"
            f"Question: {query}\n\n"
            "Provide a detailed answer:"
        )
        
        if not self.api_key:
            return self._fallback_answer(query, context)
        
        last_error = None
        for attempt in range(3):
            try:
                response = requests.post(
                    f"{self.api_url}?key={self.api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.4,
                            "maxOutputTokens": 2048,
                        }
                    },
                    timeout=30
                )
                if response.status_code == 429:
                    wait_time = (attempt + 1) * 5
                    print(f"Gemini rate limited, retrying in {wait_time}s (attempt {attempt + 1}/3)")
                    time.sleep(wait_time)
                    continue
                response.raise_for_status()
                data = response.json()
                answer = data["candidates"][0]["content"]["parts"][0]["text"]
                return answer.strip()
            except Exception as e:
                last_error = e
                if "429" not in str(e):
                    break
        
        print(f"Gemini API error after retries: {last_error}")
        return self._fallback_answer(query, context)
    
    def _fallback_answer(self, query: str, context: str) -> str:
        """Extracts the most relevant sentences when the API is unavailable."""
        query_words = set(query.lower().split())
        sentences = [s.strip() for s in context.replace('\n', ' ').split('.') if len(s.strip()) > 20]
        
        scored = []
        for s in sentences:
            score = sum(1 for w in query_words if w in s.lower())
            scored.append((score, s))
        scored.sort(key=lambda x: -x[0])
        
        best = [s for _, s in scored[:5] if _]
        if not best:
            best = [s for _, s in scored[:3]]
        
        return "Based on the document:\n\n" + "\n\n".join(f"• {s.strip()}." for s in best)

    def chat(self, messages: list, user_info: dict = None) -> str:
        """
        General-purpose AI chat. Takes a list of messages with 'role' and 'text' keys.
        Works like ChatGPT/Gemini/Claude — answers any question.
        """
        if not self.api_key:
            return "AI chat is not available. Please configure the GEMINI_API_KEY."

        # Build user identity context
        user_context = ""
        if user_info:
            name = user_info.get('name', '')
            email = user_info.get('email', '')
            if name or email:
                user_context = f"The current user's name is {name} and their email is {email}. Remember this throughout the conversation. "

        system_prompt = (
            "You are InsightFlow AI, a highly capable AI assistant similar to ChatGPT, Gemini, and Claude. "
            f"{user_context}"
            "You can answer questions on any topic — coding, math, science, writing, analysis, and more. "
            "Be detailed, accurate, and helpful. Use markdown formatting for code blocks, lists, and headings. "
            "If you write code, always include comments explaining what it does."
        )

        # Build Gemini conversation format — prepend system prompt as first turn
        # (gemma models don't support system_instruction)
        contents = [
            {"role": "user", "parts": [{"text": system_prompt}]},
            {"role": "model", "parts": [{"text": "Understood! I'm InsightFlow AI, ready to help with anything. Ask me anything!"}]},
        ]
        for msg in messages:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg.get("text", "")}]
            })

        last_error = None
        for attempt in range(3):
            try:
                response = requests.post(
                    f"{self.api_url}?key={self.api_key}",
                    json={
                        "contents": contents,
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 4096,
                        }
                    },
                    timeout=30
                )
                if response.status_code == 429:
                    wait_time = (attempt + 1) * 5
                    print(f"Gemini rate limited, retrying in {wait_time}s (attempt {attempt + 1}/3)")
                    time.sleep(wait_time)
                    continue
                response.raise_for_status()
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                last_error = e
                if "429" not in str(e):
                    break

        print(f"Gemini chat error: {last_error}")
        return "Sorry, I'm having trouble connecting right now. Please try again in a moment."
