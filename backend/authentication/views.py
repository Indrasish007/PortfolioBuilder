import logging
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, EmailTokenObtainPairSerializer
from users.models import CustomUser

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import connections
from django.db.migrations.executor import MigrationExecutor

logger = logging.getLogger(__name__)

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
            logger.exception("Signup failed")
            
            # Defensive handling: if user was created but connection closed/errored on commit/cleanup
            email = request.data.get('email')
            if email:
                try:
                    if CustomUser.objects.filter(email=email).exists():
                        logger.info("User exists despite signup exception, returning success.")
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
                    logger.exception("Error checking user existence during signup failure handling")
            
            return Response({
                "success": False,
                "error": "An error occurred during signup."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        health = {
            "database": "unknown",
            "user_model_access": "unknown",
            "migrations_status": "unknown",
            "unapplied_migrations": []
        }
        
        # 1. Verify Database Connection
        try:
            connection = connections['default']
            connection.ensure_connection()
            health["database"] = "healthy"
        except Exception as db_err:
            logger.exception("Health check database connection failed")
            health["database"] = f"unhealthy: {str(db_err)}"
            return Response(health, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        # 2. Verify User Model Access
        try:
            user_count = CustomUser.objects.count()
            health["user_model_access"] = f"healthy (user count: {user_count})"
        except Exception as user_err:
            logger.exception("Health check user model access failed")
            health["user_model_access"] = f"unhealthy: {str(user_err)}"
            return Response(health, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        # 3. Verify Migration Status
        try:
            executor = MigrationExecutor(connection)
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
            unapplied = [f"{migration.app_label}.{migration.name}" for migration, _ in plan]
            health["unapplied_migrations"] = unapplied
            if len(unapplied) == 0:
                health["migrations_status"] = "healthy (all migrations applied)"
            else:
                health["migrations_status"] = f"unhealthy ({len(unapplied)} migrations unapplied)"
        except Exception as mig_err:
            logger.exception("Health check migration status check failed")
            health["migrations_status"] = f"unhealthy: {str(mig_err)}"
            return Response(health, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(health, status=status.HTTP_200_OK)

