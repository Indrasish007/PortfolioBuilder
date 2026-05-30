import os
import threading
from django.utils import timezone
import resend
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import SupportTicket, ChatMessage
from .serializers import SupportTicketSerializer, SupportTicketCreateSerializer, ChatMessageSerializer

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


# ── Chatbot system prompt ──────────────────────────────────────────────────────
_CHATBOT_SYSTEM_PROMPT = (
    "You are a helpful support assistant for PortfolioBuilder — an AI-powered "
    "portfolio building platform. You help users with questions about:\n"
    "- Creating and editing portfolios\n"
    "- Using templates and themes\n"
    "- Analytics and visit tracking\n"
    "- Portfolio score and improvement tips\n"
    "- Project insights and click tracking\n"
    "- Account settings and security\n"
    "- AI rewrite feature\n"
    "- Help Center navigation\n"
    "- General troubleshooting\n\n"
    "Always be friendly, concise, and helpful. If you don't know something "
    "specific about the user's account data, tell them to use the Contact "
    "Support form so the team can help directly. "
    "Keep responses short and easy to understand.\n"
    "Do NOT use markdown formatting — respond in plain text only."
)

_CHAT_MODEL_CANDIDATES = [
    "models/gemini-2.5-flash",
    "models/gemini-2.5-flash-lite",
    "models/gemini-flash-latest",
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-lite",
    "models/gemini-2.0-flash-001",
]


class HelpCenterChatView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user_message = request.data.get('message', '')
            
            print(f"[Chat] Received from {request.user.username}: {user_message[:50]}")
            
            if not user_message or not user_message.strip():
                return Response({'error': 'Message is required'}, status=400)
            
            # Check Gemini key from environment
            gemini_key = os.environ.get('GEMINI_API_KEY', '') or getattr(settings, 'GEMINI_API_KEY', '')
            print(f"[Chat] GEMINI_API_KEY exists: {bool(gemini_key)}")
            print(f"[Chat] GEMINI_API_KEY length: {len(gemini_key)}")
            
            if not gemini_key:
                print("[Chat] ERROR: GEMINI_API_KEY is missing from environment!")
                return Response({'error': 'AI service not configured — GEMINI_API_KEY missing'}, status=500)
            
            # Save user message
            ChatMessage.objects.create(
                user=request.user,
                role='user',
                content=user_message.strip()
            )
            
            # Fetch history as list
            history_list = list(
                ChatMessage.objects.filter(
                    user=request.user
                ).order_by('created_at')
            )
            print(f"[Chat] History length: {len(history_list)}")
            
            # Build Gemini history
            gemini_history = []
            if len(history_list) > 1:
                for msg in history_list[:-1]:
                    gemini_history.append({
                        'role': 'model' if msg.role == 'bot' else 'user',
                        'parts': [{'text': msg.content}]
                    })
            
            # Configure Gemini — try models in order until one works
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            
            system_prompt = """You are a helpful support assistant for PortfolioBuilder. Help users with creating portfolios, templates, themes, analytics, portfolio score, project insights, settings, AI rewrite feature and troubleshooting. Be friendly, concise and helpful."""
            
            _MODEL_FALLBACK = [
                'gemini-2.0-flash',
                'gemini-2.0-flash-lite',
                'gemini-1.5-flash',
                'gemini-1.5-pro',
            ]
            
            bot_reply = None
            last_error = None
            
            for model_name in _MODEL_FALLBACK:
                try:
                    print(f"[Chat] Trying model: {model_name}")
                    model = genai.GenerativeModel(model_name)
                    chat = model.start_chat(history=gemini_history)
                    full_message = (
                        f"{system_prompt}\n\nUser: {user_message.strip()}"
                        if not gemini_history
                        else user_message.strip()
                    )
                    response = chat.send_message(full_message)
                    bot_reply = response.text
                    print(f"[Chat] Success with {model_name}: {bot_reply[:50]}")
                    break
                except Exception as model_err:
                    err_str = str(model_err)
                    err_type = type(model_err).__name__
                    # Continue to next model on: quota, rate limit, not found, not supported
                    should_retry = (
                        '429' in err_str
                        or '404' in err_str
                        or 'quota' in err_str.lower()
                        or 'not found' in err_str.lower()
                        or 'not supported' in err_str.lower()
                        or 'ResourceExhausted' in err_type
                    )
                    if should_retry:
                        print(f"[Chat] Model {model_name} unavailable ({err_type}), trying next...")
                        last_error = model_err
                        continue
                    # Hard error (auth failure, network, etc.) — stop immediately
                    print(f"[Chat] Hard error with {model_name}: {err_type}: {err_str[:200]}")
                    last_error = model_err
                    break
            
            if not bot_reply:
                err_str = str(last_error) if last_error else ''
                if '429' in err_str or 'quota' in err_str.lower():
                    bot_reply = (
                        "I'm currently unavailable due to API rate limits. "
                        "Please try again in a minute, or use the Contact Support tab to reach us directly."
                    )
                else:
                    raise last_error if last_error else Exception("No reply from AI")
            
            # Save bot reply
            ChatMessage.objects.create(
                user=request.user,
                role='bot',
                content=bot_reply
            )
            
            return Response({'reply': bot_reply})
            
        except Exception as e:
            print(f"[Chat] ERROR type: {type(e).__name__}")
            print(f"[Chat] ERROR message: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=500
            )


class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            messages = ChatMessage.objects.filter(
                user=request.user
            ).order_by('created_at')

            serializer = ChatMessageSerializer(messages, many=True)
            return Response({
                'messages': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=500
            )


class ClearChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            deleted_count, _ = ChatMessage.objects.filter(
                user=request.user
            ).delete()

            return Response({
                'message': 'Chat history cleared successfully',
                'deleted': deleted_count
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=500
            )
