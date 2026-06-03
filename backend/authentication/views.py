from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
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
            return Response({
                "success": True,
                "message": "Account created successfully"
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
                        return Response({
                            "success": True,
                            "message": "Account created successfully"
                        }, status=status.HTTP_201_CREATED)
                except Exception as check_err:
                    print(f"Error checking user existence: {check_err}", file=sys.stderr)
            
            return Response({
                "success": False,
                "error": "An error occurred during signup."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.views import APIView
import io
from django.core.management import call_command
from django.db import connection

class FixMigrationsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        output = []
        
        # 1. Check if column exists
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='portfolios_portfolio' AND column_name='custom_seo_title';
                """)
                row = cursor.fetchone()
                exists = row is not None
                output.append(f"Column custom_seo_title exists: {exists} (row: {row})")
        except Exception as e:
            exists = False
            output.append(f"Error checking column: {e}")
            
        # 2. Run fake back to 0013 and migrate
        output.append("Faking portfolios back to 0013...")
        try:
            out_buf = io.StringIO()
            call_command('migrate', 'portfolios', '0013', fake=True, stdout=out_buf, stderr=out_buf)
            output.append(f"Fake back output: {out_buf.getvalue()}")
        except Exception as e:
            output.append(f"Error faking back: {e}")
            
        output.append("Running migrate...")
        try:
            out_buf = io.StringIO()
            call_command('migrate', stdout=out_buf, stderr=out_buf)
            output.append(f"Migrate output: {out_buf.getvalue()}")
        except Exception as e:
            output.append(f"Error running migrate: {e}")
            
        return Response({
            "status": "done",
            "log": output
        })

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

