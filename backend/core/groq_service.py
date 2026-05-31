import os
from django.conf import settings
from groq import Groq

class GroqService:
    """
    A service class to interact with the Groq API securely.
    """
    def __init__(self):
        # Read API key from settings, falling back to environment variable
        self.api_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured in settings or environment variables.")
        self.client = Groq(api_key=self.api_key)

    def generate_content(self, prompt: str, model: str = "llama-3.3-70b-versatile", **kwargs) -> str:
        """
        Generate content using Groq's chat completion API.
        Defaults to llama-3.3-70b-versatile.
        """
        try:
            # Replicate generate_content format via chat completions
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                **kwargs
            )
            return response.choices[0].message.content
        except Exception as e:
            # Secure handling to prevent leaking credentials/API keys in stacktraces
            raise RuntimeError(f"Groq API request failed: {e}")

def parse_with_groq(prompt: str, model: str = "llama-3.3-70b-versatile", **kwargs) -> str:
    """
    A helper function to parse requests with the Groq service.
    """
    service = GroqService()
    return service.generate_content(prompt, model=model, **kwargs)
