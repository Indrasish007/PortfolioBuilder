from django.contrib import admin
from .models import SupportTicket, ChatMessage


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'subject', 'user_email', 'category', 'status', 'created_at']
    list_filter = ['status', 'category']
    search_fields = ['subject', 'user_email', 'user_name', 'message']
    readonly_fields = ['created_at', 'updated_at', 'replied_at']
    ordering = ['-created_at']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'content', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__username', 'content']

