from django.urls import path
from .views import AIAssistantView

urlpatterns = [
    path('assistant/', AIAssistantView.as_view(), name='ai_assistant'),
]
