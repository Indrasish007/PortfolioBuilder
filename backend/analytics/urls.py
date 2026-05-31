from django.urls import path
from .views import AnalyticsView, ProjectClicksSummaryView, AIInsightsView

urlpatterns = [
    path('', AnalyticsView.as_view(), name='analytics_dashboard'),
    path('project-clicks-summary/', ProjectClicksSummaryView.as_view(), name='project_clicks_summary'),
    path('ai-insights/', AIInsightsView.as_view(), name='ai_insights'),
]
