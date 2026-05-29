from rest_framework import serializers
from .models import SupportTicket


class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'user_name', 'user_email', 'category', 'subject',
            'message', 'status', 'admin_reply', 'replied_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'admin_reply', 'replied_at', 'created_at', 'updated_at']


class SupportTicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ['category', 'subject', 'message', 'user_name', 'user_email']
