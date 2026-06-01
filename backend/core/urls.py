from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def ping_view(request):
    return JsonResponse({'status': 'ok'})

from portfolios.views import (
    TrackVisitView, SitemapXMLView, RobotsTxtView,
    PortfolioSitemapXMLView, ImageSitemapXMLView
)

urlpatterns = [
    path('sitemap.xml', SitemapXMLView.as_view(), name='sitemap'),
    path('sitemap-portfolios.xml', PortfolioSitemapXMLView.as_view(), name='portfolio_sitemap'),
    path('sitemap-images.xml', ImageSitemapXMLView.as_view(), name='image_sitemap'),
    path('robots.txt', RobotsTxtView.as_view(), name='robots_txt'),
    path('api/ping/', ping_view, name='ping'),
    path('api/track-visit/', TrackVisitView.as_view(), name='core_track_visit'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/auth/dj-rest-auth/', include('dj_rest_auth.urls')),
    path('api/auth/dj-rest-auth/registration/', include('dj_rest_auth.registration.urls')),
    # path('api/users/', include('users.urls')),
    path('api/users/', include('users.urls')),
    path('api/portfolios/', include('portfolios.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/ai/', include('ai.urls')),
    path('api/support/', include('support.urls')),
]
