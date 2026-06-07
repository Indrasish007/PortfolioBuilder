from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views import SignupView, EmailTokenObtainPairView, HealthCheckView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('health-check/', HealthCheckView.as_view(), name='health_check'),
]



