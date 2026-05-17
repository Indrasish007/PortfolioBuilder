from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PortfolioViewSet, PublicPortfolioView

router = DefaultRouter()
router.register(r'', PortfolioViewSet, basename='portfolio')

urlpatterns = [
    path('public/<str:username>/', PublicPortfolioView.as_view(), name='public_portfolio'),
    path('', include(router.urls)),
]
