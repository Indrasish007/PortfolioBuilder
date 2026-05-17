from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import math

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # In a real app, this would query the Analytics models.
        # For now, we return mock data structured identically so the frontend works with the real API call.
        data = {
            "views": [{"day": f"D{i+1}", "views": 200 + round(math.sin(i/2)*120 + 90)} for i in range(14)],
            "visitors": [{"day": f"D{i+1}", "visitors": 80 + round(math.cos(i/3)*60 + 45)} for i in range(14)],
            "devices": [
                {"name": "Desktop", "value": 62},
                {"name": "Mobile", "value": 31},
                {"name": "Tablet", "value": 7},
            ],
            "countries": [
                {"country": "United States", "visits": 5421},
                {"country": "Germany", "visits": 1820},
                {"country": "India", "visits": 1612},
                {"country": "Brazil", "visits": 980},
                {"country": "Japan", "visits": 712},
            ],
            "downloads": 482,
            "suggestions": [
                "Your hero CTA gets 28% fewer clicks on mobile — try a sticky bottom CTA.",
                "Visitors from Germany convert 2.3× higher — consider a localized homepage.",
                "Add a testimonial near your pricing — projects with one convert 18% better.",
            ],
        }
        return Response(data)
