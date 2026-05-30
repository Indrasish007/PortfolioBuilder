from django.urls import path
from .views import (
    SupportTicketListCreateView,
    SupportTicketDetailView,
    AdminReplyView,
    HelpCenterChatView,
    ChatHistoryView,
    ClearChatHistoryView,
)

urlpatterns = [
    path('tickets/', SupportTicketListCreateView.as_view(), name='support-tickets'),
    path('tickets/<int:ticket_id>/', SupportTicketDetailView.as_view(), name='support-ticket-detail'),
    path('reply/', AdminReplyView.as_view(), name='support-admin-reply'),
    path('chat/', HelpCenterChatView.as_view(), name='support-chat'),
    path('chat/history/', ChatHistoryView.as_view(), name='support-chat-history'),
    path('chat/clear/', ClearChatHistoryView.as_view(), name='support-chat-clear'),
]

