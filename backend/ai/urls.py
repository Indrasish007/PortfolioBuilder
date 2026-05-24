from django.urls import path
from .views import AIAssistantView, AIRewriteView, AICVParsingView, ResumeParseView, FetchGlobalPortfolioView

urlpatterns = [
    path('assistant/', AIAssistantView.as_view(), name='ai_assistant'),
    path('rewrite/', AIRewriteView.as_view(), name='ai_rewrite'),
    path('parse-cv/', AICVParsingView.as_view(), name='ai_parse_cv'),
    path('resume/parse/', ResumeParseView.as_view(), name='resume_parse'),
    path('portfolio/fetch-url/', FetchGlobalPortfolioView.as_view(), name='fetch_global_portfolio'),
]
