import os
from django.conf import settings
from google import genai
from google.genai import types

class GeminiService:
    """
    A service class to interact with the Gemini API securely.
    """
    def __init__(self):
        # Read API key from settings, falling back to environment variable
        self.api_key = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured in settings or environment variables.")
        self.client = genai.Client(api_key=self.api_key)

    def generate_content(self, prompt: str, model: str = "gemini-3.5-flash", **kwargs) -> str:
        """
        Generate content using the Gemini model.
        Defaults to gemini-3.5-flash.
        """
        try:
            config = types.GenerateContentConfig(**kwargs) if kwargs else None
            response = self.client.models.generate_content(
                model=model,
                contents=prompt,
                config=config
            )
            return response.text
        except Exception as e:
            # Secure handling to prevent leaking credentials/API keys in stacktraces
            raise RuntimeError(f"Gemini API request failed: {e}")

def parse_with_gemini(prompt: str, model: str = "gemini-3.5-flash", **kwargs) -> str:
    """
    A clean helper function to parse requests with the Gemini service.
    If GROQ_API_KEY is configured, routes to Groq (llama-3.3-70b-versatile) instead.
    """
    groq_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
    if groq_key:
        from core.groq_service import parse_with_groq
        # Map or default to llama-3.3-70b-versatile
        return parse_with_groq(prompt, model="llama-3.3-70b-versatile", **kwargs)

    service = GeminiService()
    return service.generate_content(prompt, model=model, **kwargs)
