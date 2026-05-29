"""
GET  /api/users/last-edited/   → { "portfolio_id": <int|null> }
POST /api/users/last-edited/   body: { "portfolio_id": <int> }  → 200 OK

Dedicated endpoint for tracking the last-edited portfolio per user.
Stored on Profile.last_edited_portfolio_id (already migrated).
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Profile
from portfolios.models import Portfolio


class LastEditedPortfolioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        portfolio_id = profile.last_edited_portfolio_id

        # Verify the portfolio still exists and belongs to this user
        if portfolio_id:
            exists = Portfolio.objects.filter(
                pk=portfolio_id, user=request.user
            ).exists()
            if not exists:
                # Portfolio was deleted — clear stale reference
                profile.last_edited_portfolio_id = None
                profile.save(update_fields=["last_edited_portfolio_id"])
                portfolio_id = None

        return Response({"portfolio_id": portfolio_id})

    def post(self, request):
        portfolio_id = request.data.get("portfolio_id")
        if not portfolio_id:
            return Response(
                {"error": "portfolio_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify ownership before storing
        try:
            Portfolio.objects.get(pk=portfolio_id, user=request.user)
        except Portfolio.DoesNotExist:
            return Response(
                {"error": "Portfolio not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.last_edited_portfolio_id = portfolio_id
        profile.save(update_fields=["last_edited_portfolio_id"])
        return Response({"portfolio_id": portfolio_id})
