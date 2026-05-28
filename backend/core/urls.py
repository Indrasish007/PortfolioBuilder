from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def ping_view(request):
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('api/ping/', ping_view, name='ping'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/auth/dj-rest-auth/', include('dj_rest_auth.urls')),
    path('api/auth/dj-rest-auth/registration/', include('dj_rest_auth.registration.urls')),
    # path('api/users/', include('users.urls')),
    path('api/portfolios/', include('portfolios.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/ai/', include('ai.urls')),
    path('api/resume/', include('resumes.urls')),
]
