from django.urls import path
from .views import (
    AnalyticsView, ProjectClicksSummaryView, AIInsightsView, 
    TrafficSourcesView, TrafficSourcesTotalView, SocialShareTrackView, ShareSummaryView,
    RecentRecordsView
)

urlpatterns = [
    path('', AnalyticsView.as_view(), name='analytics_dashboard'),
    path('project-clicks-summary/', ProjectClicksSummaryView.as_view(), name='project_clicks_summary'),
    path('ai-insights/', AIInsightsView.as_view(), name='ai_insights'),
    path('traffic-sources/total/', TrafficSourcesTotalView.as_view(), name='traffic_sources_total'),
    path('traffic-sources/', TrafficSourcesView.as_view(), name='traffic_sources'),
    path('track/<int:portfolio_id>/', SocialShareTrackView.as_view(), name='track_share'),
    path('shares/<int:portfolio_id>/', ShareSummaryView.as_view(), name='share_summary'),
    path('recent-records/', RecentRecordsView.as_view(), name='recent_records'),
]

