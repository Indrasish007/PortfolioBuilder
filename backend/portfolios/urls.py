from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PortfolioViewSet, PublicPortfolioView, AnalyticsView, DashboardStatsView

router = DefaultRouter()
router.register(r'', PortfolioViewSet, basename='portfolio')

urlpatterns = [
    path('public/<int:pk>/', PublicPortfolioView.as_view(), name='public_portfolio'),
    path('<int:pk>/analytics/', AnalyticsView.as_view(), name='analytics'),
    path('stats/dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('', include(router.urls)),
]
