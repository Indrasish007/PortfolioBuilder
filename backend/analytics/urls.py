from django.urls import path
from .views import AnalyticsView, ProjectClicksSummaryView

urlpatterns = [
    path('', AnalyticsView.as_view(), name='analytics_dashboard'),
    path('project-clicks-summary/', ProjectClicksSummaryView.as_view(), name='project_clicks_summary'),
]
