from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import time


class AIAssistantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        prompt = request.data.get('prompt', '')
        time.sleep(1)
        return Response({
            "reply": f"Here's an idea for '{prompt}': Lead with a punchy 7-word hero line, then 3 outcome-focused project cards."
        })
