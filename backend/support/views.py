import os
import threading
from django.utils import timezone
import resend
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import SupportTicket
from .serializers import SupportTicketSerializer, SupportTicketCreateSerializer

SUPPORT_EMAIL = 'indrasishadhya770@gmail.com'


def send_email_with_resend(ticket_id, user_name, user_email, category, subject, message, user_id):
    try:
        print(f"[Resend] Sending email for ticket #{ticket_id}")
        print(f"[Resend] RESEND_API_KEY exists: {bool(settings.RESEND_API_KEY)}")
        
        resend.api_key = settings.RESEND_API_KEY
        
        params = {
            "from": "PortfolioBuilder Support <onboarding@resend.dev>",
            "to": ["indrasishadhya770@gmail.com"],
            "reply_to": user_email,
            "subject": f"[PortfolioBuilder Support] [{category}] — {subject}",
            "text": f"""
New Support Ticket Received
===========================
Ticket ID: #{ticket_id}
From: {user_name} ({user_email})
Category: {category}
Subject: {subject}
Status: Pending

Message:
{message}

---
User ID: {user_id}
            """
        }
        
        email = resend.Emails.send(params)
        print(f"[Resend] Email sent for ticket #{ticket_id}: {email}")
        return True
        
    except Exception as e:
        print(f"[Resend] FAILED for ticket #{ticket_id}: {type(e).__name__}: {str(e)}")
        return False



def _send_reply_notification(ticket: SupportTicket):
    """Send reply notification email to the user."""
    try:
        print(f"[SupportEmail] Sending reply notification for ticket #{ticket.id}")
        resend.api_key = settings.RESEND_API_KEY
        params = {
            "from": "PortfolioBuilder Support <onboarding@resend.dev>",
            "to": [ticket.user_email],
            "subject": f"[PortfolioBuilder] Reply to your support ticket: {ticket.subject}",
            "text": f"""Hi {ticket.user_name},

You have a new reply to your support ticket.

Subject: {ticket.subject}

--- Reply ---
{ticket.admin_reply}

If you have further questions, please submit a new ticket from your PortfolioBuilder dashboard.

Best regards,
The PortfolioBuilder Team"""
        }
        email = resend.Emails.send(params)
        print(f"[SupportEmail] Reply notification sent for ticket #{ticket.id}: {email}")
    except Exception as e:
        print(f"[SupportEmail] Failed to send reply notification: {e}")


class SupportTicketListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tickets = SupportTicket.objects.filter(
            user=request.user
        ).order_by('-created_at')
        serializer = SupportTicketSerializer(tickets, many=True)
        return Response(serializer.data)

    def post(self, request):
        try:
            serializer = SupportTicketCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=400)

            # Step 1 — Save ticket to database immediately
            ticket = serializer.save(
                user=request.user,
                user_name=request.user.get_full_name() or request.user.username,
                user_email=request.user.email,
                status='pending',
            )
            print(f"[SupportTicket] Ticket #{ticket.id} saved to database")

            # Step 2 — Send email via Resend HTTP API
            import threading
            email_thread = threading.Thread(
                target=send_email_with_resend,
                args=(
                    ticket.id,
                    ticket.user_name,
                    ticket.user_email,
                    ticket.get_category_display(),
                    ticket.subject,
                    ticket.message,
                    request.user.id,
                ),
                daemon=True,
            )
            email_thread.start()
            print(f"[SupportTicket] Resend email thread started for ticket #{ticket.id}")

            # Step 3 — Return success immediately
            return Response({
                'message': 'Support ticket created successfully',
                'ticket_id': ticket.id,
                'status': 'pending',
            }, status=201)

        except Exception as e:
            print(f"[SupportTicket] ERROR: {str(e)}")
            return Response(
                {'error': f'Failed to create ticket: {str(e)}'},
                status=500,
            )


class SupportTicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        try:
            ticket = SupportTicket.objects.get(
                id=ticket_id,
                user=request.user
            )
            serializer = SupportTicketSerializer(ticket)
            return Response(serializer.data)
        except SupportTicket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found'},
                status=404
            )

    def delete(self, request, ticket_id):
        try:
            ticket = SupportTicket.objects.get(
                id=ticket_id,
                user=request.user  # Only owner can delete
            )
            ticket_id = ticket.id
            ticket.delete()
            print(f"✅ Ticket #{ticket_id} deleted by user {request.user.username}")
            return Response(
                {'message': f'Ticket #{ticket_id} deleted successfully'},
                status=200
            )
        except SupportTicket.DoesNotExist:
            return Response(
                {'error': 'Ticket not found or you do not have permission to delete it'},
                status=404
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete ticket: {str(e)}'},
                status=500
            )


class AdminReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Forbidden. Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        ticket_id = request.data.get('ticketId')
        reply_message = request.data.get('replyMessage', '').strip()

        if not ticket_id or not reply_message:
            return Response({'error': 'ticketId and replyMessage are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ticket = SupportTicket.objects.get(id=ticket_id)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

        ticket.admin_reply = reply_message
        ticket.status = 'answered'
        ticket.replied_at = timezone.now()
        ticket.save()

        _send_reply_notification(ticket)

        return Response(SupportTicketSerializer(ticket).data)



