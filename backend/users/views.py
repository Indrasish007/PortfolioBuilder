from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.contrib.auth import authenticate
from .models import CustomUser, Profile
from .serializers import UserProfileSerializer


class MeView(APIView):
    """GET /api/users/me/ — fetch current user profile.
       PATCH /api/users/me/ — update profile fields."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Ensure profile exists
        Profile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        Profile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """POST /api/users/change-password/
       Body: { current_password, new_password }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current = request.data.get('current_password', '')
        new_pw  = request.data.get('new_password', '')

        if not current or not new_pw:
            return Response({'error': 'Both current_password and new_password are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if len(new_pw) < 8:
            return Response({'error': 'New password must be at least 8 characters.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, email=request.user.email, password=current)
        if user is None:
            return Response({'error': 'Current password is incorrect.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_pw)
        user.save()
        return Response({'message': 'Password updated successfully.'})


class ChangeEmailView(APIView):
    """POST /api/users/change-email/
       Body: { new_email, current_password }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get('new_email', '').strip().lower()
        current   = request.data.get('current_password', '')

        if not new_email or not current:
            return Response({'error': 'new_email and current_password are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Verify current password
        user = authenticate(request, email=request.user.email, password=current)
        if user is None:
            return Response({'error': 'Current password is incorrect.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Check uniqueness
        if CustomUser.objects.filter(email=new_email).exclude(pk=request.user.pk).exists():
            return Response({'error': 'This email address is already in use.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user.email = new_email
        user.save()
        return Response({'message': 'Email updated successfully.'})


class CheckUsernameView(APIView):
    """GET /api/users/check-username/?username=xxx — public, no auth."""
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get('username', '').strip()
        if not username:
            return Response({'available': False, 'error': 'Username is required.'})

        # Exclude current user if authenticated
        qs = CustomUser.objects.filter(username__iexact=username)
        if request.user.is_authenticated:
            qs = qs.exclude(pk=request.user.pk)

        available = not qs.exists()
        return Response({'available': available, 'username': username})


class DeleteAccountView(APIView):
    """DELETE /api/users/delete-account/
       Body: { current_password }
       Deletes user + all related data (portfolios cascade via FK).
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        current = request.data.get('current_password', '')
        if not current:
            return Response({'error': 'current_password is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, email=request.user.email, password=current)
        if user is None:
            return Response({'error': 'Password is incorrect.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Django's CASCADE will remove: Profile, Portfolio, Analytics etc.
        user.delete()
        return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_200_OK)
