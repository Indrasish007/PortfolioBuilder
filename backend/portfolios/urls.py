from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PortfolioViewSet, PublicPortfolioView, PublicPortfolioBySlugView,
    PublicPortfolioByDomainView, PublishPortfolioView, UnpublishPortfolioView,
    AnalyticsView, DashboardStatsView, PublicPortfolioListView, ProjectSetFeaturedView,
    TrackProjectClickView, TrackVisitView
)

router = DefaultRouter()
router.register(r'', PortfolioViewSet, basename='portfolio')

urlpatterns = [
    # Public access — by id, slug or domain
    path('public/list/', PublicPortfolioListView.as_view(), name='public_portfolios_list'),
    path('public/<int:pk>/', PublicPortfolioView.as_view(), name='public_portfolio'),
    path('public/slug/<slug:slug>/', PublicPortfolioBySlugView.as_view(), name='public_portfolio_slug'),
    path('public/domain/<path:domain>/', PublicPortfolioByDomainView.as_view(), name='public_portfolio_domain'),
    # Publish / unpublish actions (authenticated)
    path('<int:pk>/publish/', PublishPortfolioView.as_view(), name='publish_portfolio'),
    path('<int:pk>/unpublish/', UnpublishPortfolioView.as_view(), name='unpublish_portfolio'),
    # Analytics & stats
    path('<int:pk>/analytics/', AnalyticsView.as_view(), name='analytics'),
    path('stats/dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),
    # Project actions
    path('projects/<int:project_id>/set-featured/', ProjectSetFeaturedView.as_view(), name='set_project_featured'),
    # Project click tracking (visitor-side, AllowAny)
    path('track-project-click/', TrackProjectClickView.as_view(), name='track_project_click'),
    # Geolocation visitor tracking (visitor-side, AllowAny)
    path('track-visit/', TrackVisitView.as_view(), name='track_visit'),
    path('', include(router.urls)),
]
