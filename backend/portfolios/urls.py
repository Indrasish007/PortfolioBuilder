from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PortfolioViewSet, PublicPortfolioView, PublicPortfolioBySlugView,
    PublishPortfolioView, UnpublishPortfolioView,
    AnalyticsView, DashboardStatsView
)

router = DefaultRouter()
router.register(r'', PortfolioViewSet, basename='portfolio')

urlpatterns = [
    # Public access — by id or slug
    path('public/<int:pk>/', PublicPortfolioView.as_view(), name='public_portfolio'),
    path('public/slug/<slug:slug>/', PublicPortfolioBySlugView.as_view(), name='public_portfolio_slug'),
    # Publish / unpublish actions (authenticated)
    path('<int:pk>/publish/', PublishPortfolioView.as_view(), name='publish_portfolio'),
    path('<int:pk>/unpublish/', UnpublishPortfolioView.as_view(), name='unpublish_portfolio'),
    # Analytics & stats
    path('<int:pk>/analytics/', AnalyticsView.as_view(), name='analytics'),
    path('stats/dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('', include(router.urls)),
]
