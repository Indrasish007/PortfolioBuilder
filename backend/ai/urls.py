from django.urls import path
from .views import AIAssistantView, AIRewriteView, AIRewriteAboutView, AIRewriteProjectView, AICVParsingView, ResumeParseView

urlpatterns = [
    path('assistant/', AIAssistantView.as_view(), name='ai_assistant'),
    path('rewrite/', AIRewriteView.as_view(), name='ai_rewrite'),
    path('rewrite-about/', AIRewriteAboutView.as_view(), name='ai_rewrite_about'),
    path('rewrite-project/', AIRewriteProjectView.as_view(), name='ai_rewrite_project'),
    path('parse-cv/', AICVParsingView.as_view(), name='ai_parse_cv'),
    path('resume/parse/', ResumeParseView.as_view(), name='resume_parse'),
]
