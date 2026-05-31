from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer
from users.models import CustomUser

class SignupView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = UserSerializer
