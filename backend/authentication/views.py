from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, EmailTokenObtainPairSerializer
from users.models import CustomUser

from rest_framework import status
from rest_framework.response import Response

class SignupView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
            user = serializer.instance
            
            # Generate JWT tokens for auto-login
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "success": True,
                "message": "Account created successfully",
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Defensive handling: if user was created but connection closed/errored on commit/cleanup
            import sys, traceback
            print("Signup exception caught:", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            
            email = request.data.get('email')
            if email:
                try:
                    if CustomUser.objects.filter(email=email).exists():
                        print("User exists despite signup exception, returning success.", file=sys.stderr)
                        # Fetch the user to generate tokens
                        existing_user = CustomUser.objects.get(email=email)
                        refresh = RefreshToken.for_user(existing_user)
                        return Response({
                            "success": True,
                            "message": "Account created successfully",
                            "access": str(refresh.access_token),
                            "refresh": str(refresh)
                        }, status=status.HTTP_201_CREATED)
                except Exception as check_err:
                    print(f"Error checking user existence: {check_err}", file=sys.stderr)
            
            return Response({
                "success": False,
                "error": "An error occurred during signup."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

