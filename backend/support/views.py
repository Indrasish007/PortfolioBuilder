import os
import threading
from django.utils import timezone
from django.core.mail import EmailMessage
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import SupportTicket, ChatMessage
from .serializers import SupportTicketSerializer, SupportTicketCreateSerializer, ChatMessageSerializer

SUPPORT_EMAIL = 'indrasishadhya770@gmail.com'


def send_email_in_background(ticket_id, user_name, user_email, category, subject, message):
    """Fire-and-forget email sender — runs in a daemon thread, never blocks the response."""
    try:
        print(f"📧 Email thread started for ticket #{ticket_id}")
        print(f"📧 EMAIL_BACKEND:   {settings.EMAIL_BACKEND}")
        print(f"📧 EMAIL_HOST:      {settings.EMAIL_HOST}")
        print(f"📧 EMAIL_PORT:      {settings.EMAIL_PORT}")
        print(f"📧 EMAIL_USE_TLS:   {settings.EMAIL_USE_TLS}")
        print(f"📧 EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")

        if not settings.EMAIL_HOST_USER:
            print("❌ EMAIL_HOST_USER is empty — check Render environment variables!")
            return

        if not settings.EMAIL_HOST_PASSWORD:
            print("❌ EMAIL_HOST_PASSWORD is empty — check Render environment variables!")
            return

        email = EmailMessage(
            subject=f"[PortfolioBuilder Support] [{category}] — {subject}",
            body=(
                f"New Support Ticket #{ticket_id}\n"
                f"From: {user_name} ({user_email})\n"
                f"Category: {category}\n"
                f"Subject: {subject}\n\n"
                f"Message:\n{message}"
            ),
            from_email=settings.EMAIL_HOST_USER,
            to=[SUPPORT_EMAIL],
            reply_to=[user_email],
        )

        print(f"📧 Attempting to send email to {SUPPORT_EMAIL}...")
        email.send(fail_silently=False)
        print(f"✅ Email successfully sent for ticket #{ticket_id}")

    except Exception as e:
        print(f"❌ Email failed for ticket #{ticket_id}: {type(e).__name__}: {str(e)}")



def _send_reply_notification(ticket: SupportTicket):
    """Send reply notification email to the user."""
    try:
        subject = f"[PortfolioBuilder] Reply to your support ticket: {ticket.subject}"
        body = (
            f"Hi {ticket.user_name},\n\n"
            f"You have a new reply to your support ticket.\n\n"
            f"Subject: {ticket.subject}\n\n"
            f"--- Reply ---\n{ticket.admin_reply}\n\n"
            f"If you have further questions, please submit a new ticket from your PortfolioBuilder dashboard.\n\n"
            f"Best regards,\nThe PortfolioBuilder Team"
        )
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[ticket.user_email],
        )
        email.send(fail_silently=True)
    except Exception as e:
        print(f"[SupportEmail] Failed to send reply notification: {e}")


class SupportTicketListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tickets = SupportTicket.objects.filter(user=request.user)
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
            print(f"[SupportTicket] ✅ Ticket #{ticket.id} saved")

            # Step 2 — Send email in background (NEVER blocks response)
            thread = threading.Thread(
                target=send_email_in_background,
                args=(
                    ticket.id,
                    ticket.user_name,
                    ticket.user_email,
                    ticket.get_category_display(),
                    ticket.subject,
                    ticket.message,
                ),
                daemon=True,
            )
            thread.start()

            # Step 3 — Return success IMMEDIATELY without waiting for email
            return Response({
                'message': 'Support ticket created successfully',
                'ticket_id': ticket.id,
                'status': 'pending',
            }, status=201)

        except Exception as e:
            print(f"[SupportTicket] ❌ Error: {e}")
            return Response(
                {'error': f'Failed to create ticket: {str(e)}'},
                status=500,
            )


class SupportTicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        try:
            ticket = SupportTicket.objects.get(id=ticket_id, user=request.user)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SupportTicketSerializer(ticket).data)


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
            user_message = request.data.get('message', '').strip()

            if not user_message:
                return Response(
                    {'error': 'Message is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Save user message to database
            ChatMessage.objects.create(
                user=request.user,
                role='user',
                content=user_message
            )

            # Fetch full history as a LIST (not QuerySet) to avoid negative slicing AssertionError
            history_list = list(
                ChatMessage.objects.filter(
                    user=request.user
                ).order_by('created_at')
            )

            # Build a plain-text conversation prompt from DB history
            # Exclude the message we just saved in the history lines
            history_lines = ''
            for msg in history_list[:-1]:
                role_label = 'User' if msg.role == 'user' else 'Assistant'
                history_lines += f"{role_label}: {msg.content}\n"

            full_prompt = (
                f"{_CHATBOT_SYSTEM_PROMPT}\n\n"
                + (f"Conversation so far:\n{history_lines}" if history_lines else "")
                + f"User: {user_message}\nAssistant:"
            )

            # Resolve API key
            api_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
            if not api_key:
                from dotenv import load_dotenv
                load_dotenv()
                api_key = os.getenv("GEMINI_API_KEY", "")

            print(f"[HelpCenterChat] API key present: {bool(api_key)}, length: {len(api_key)}")

            bot_reply = None

            if api_key and not api_key.startswith("your_") and api_key != "mock_key":

                # ── Primary: google-genai SDK ──────────────────────────────────────
                try:
                    from google import genai
                    from google.genai import types

                    client = genai.Client(api_key=api_key)
                    last_error = None

                    for model_name in _CHAT_MODEL_CANDIDATES:
                        try:
                            response = client.models.generate_content(
                                model=model_name,
                                contents=full_prompt,
                                config=types.GenerateContentConfig(
                                    temperature=0.7,
                                    max_output_tokens=512,
                                ),
                            )
                            raw = (response.text or "").strip()
                            if raw:
                                print(f"[HelpCenterChat] Success with model: {model_name}")
                                bot_reply = raw
                                break
                        except Exception as exc:
                            err_str = str(exc)
                            if any(x in err_str for x in ("429", "RESOURCE_EXHAUSTED", "quota")):
                                print(f"[HelpCenterChat] Quota exhausted for {model_name}, trying next...")
                                last_error = exc
                                continue
                            print(f"[HelpCenterChat] Error with {model_name}: {exc}")
                            last_error = exc
                            continue

                    if not bot_reply:
                        print(f"[HelpCenterChat] All google-genai models failed. Last: {last_error}")

                except ImportError as ie:
                    print(f"[HelpCenterChat] google-genai SDK not available: {ie}")

                # ── Fallback: raw HTTP REST API ────────────────────────────────────
                if not bot_reply:
                    import requests as _req
                    for model_name in ["gemini-2.0-flash", "gemini-1.5-flash"]:
                        try:
                            url = (
                                f"https://generativelanguage.googleapis.com/v1beta/models/"
                                f"{model_name}:generateContent?key={api_key}"
                            )
                            payload = {
                                "systemInstruction": {"parts": [{"text": _CHATBOT_SYSTEM_PROMPT}]},
                                "contents": [{"parts": [{"text": full_prompt}]}],
                                "generationConfig": {"maxOutputTokens": 512, "temperature": 0.7},
                            }
                            resp = _req.post(url, json=payload, timeout=30)
                            print(f"[HelpCenterChat] REST fallback {model_name} → HTTP {resp.status_code}")
                            if resp.status_code == 200:
                                data = resp.json()
                                text = data['candidates'][0]['content']['parts'][0]['text'].strip()
                                if text:
                                    bot_reply = text
                                    break
                            else:
                                print(f"[HelpCenterChat] REST error: {resp.text[:400]}")
                        except Exception as exc:
                            print(f"[HelpCenterChat] REST fallback error ({model_name}): {exc}")

            else:
                print("[HelpCenterChat] No valid GEMINI_API_KEY — skipping AI call.")

            if not bot_reply:
                print("[HelpCenterChat] All AI paths failed — returning fallback reply.")
                bot_reply = (
                    "I'm sorry, I'm having trouble connecting to the AI right now. "
                    "Please try again in a moment, or use the Contact Support tab "
                    "to reach us directly."
                )

            # Save bot reply to database
            ChatMessage.objects.create(
                user=request.user,
                role='bot',
                content=bot_reply
            )

            return Response({'reply': bot_reply})

        except Exception as e:
            print(f"Chat error: {str(e)}")
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
