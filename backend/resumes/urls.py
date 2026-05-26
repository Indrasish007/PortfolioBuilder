from django.urls import path
from .views import ResumeViewSet, ExtractPortfolioView, ExportPDFView, TemplateListView

urlpatterns = [
    path('extract/', ExtractPortfolioView.as_view(), name='resume-extract'),
    path('pdf/', ExportPDFView.as_view(), name='resume-pdf'),
    path('templates/', TemplateListView.as_view(), name='resume-templates'),
    
    # Specific bindings for the requested paths
    path('history/', ResumeViewSet.as_view({'get': 'list'}), name='resume-history'),
    path('generate/', ResumeViewSet.as_view({'post': 'create'}), name='resume-generate'),
    
    # CRUD mappings
    path('<int:pk>/', ResumeViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='resume-detail'),
    
    # Custom action routes
    path('<int:pk>/duplicate/', ResumeViewSet.as_view({'post': 'duplicate'}), name='resume-duplicate'),
    path('<int:pk>/versions/', ResumeViewSet.as_view({'get': 'versions'}), name='resume-versions'),
    path('<int:pk>/rollback/', ResumeViewSet.as_view({'post': 'rollback'}), name='resume-rollback'),
]
