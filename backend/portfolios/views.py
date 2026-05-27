from rest_framework import viewsets, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status as http_status
from django.db.models import Count, Sum
from django.utils.text import slugify
import re
from .models import Portfolio, PortfolioEvent
from .serializers import PortfolioSerializer

class PortfolioViewSet(viewsets.ModelViewSet):
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Portfolio.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            with open('error.log', 'a') as f:
                f.write(str(serializer.errors) + '\n')
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            print("UPDATE ERRORS:", serializer.errors)
        return super().update(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save()

class PublicPortfolioView(generics.RetrieveAPIView):
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        pk = self.kwargs.get('pk')
        return generics.get_object_or_404(Portfolio, pk=pk)

class PublicPortfolioBySlugView(generics.RetrieveAPIView):
    """Fetch a published portfolio by its human-readable slug."""
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        slug = self.kwargs.get('slug')
        return generics.get_object_or_404(Portfolio, slug=slug, status='Published')

class PublicPortfolioByDomainView(generics.RetrieveAPIView):
    """Fetch a published portfolio by its mapped domain or hostname."""
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        domain = self.kwargs.get('domain', '').strip()
        
        # Clean the input domain
        cleaned = domain.lower()
        if '://' in cleaned:
            cleaned = cleaned.split('://', 1)[1]
        cleaned = cleaned.split('/')[0] # Get just the host part
        if cleaned.startswith('www.'):
            cleaned = cleaned[4:]
            
        # 1. Look up by exact domain field
        portfolio = Portfolio.objects.filter(domain__iexact=cleaned, status='Published').first()
        if not portfolio:
            # Look up by domain containing cleaned
            portfolio = Portfolio.objects.filter(domain__icontains=cleaned, status='Published').first()
            
        # 2. Fallback: maybe they entered the slug as the domain or vice-versa
        if not portfolio:
            portfolio = Portfolio.objects.filter(slug=cleaned, status='Published').first()
            
        if not portfolio:
            from django.http import Http404
            raise Http404("Portfolio not found for this domain.")
            
        return portfolio

class PublishPortfolioView(APIView):
    """POST /portfolios/{id}/publish/ — marks portfolio Published and generates a slug."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        portfolio = generics.get_object_or_404(Portfolio, pk=pk, user=request.user)

        # Generate a slug if none exists
        if not portfolio.slug:
            base = slugify(f"{request.user.profile.name or request.user.username}-{portfolio.name}")
            base = re.sub(r'-+', '-', base).strip('-') or 'portfolio'
            slug = base
            counter = 1
            while Portfolio.objects.filter(slug=slug).exclude(pk=portfolio.pk).exists():
                slug = f"{base}-{counter}"
                counter += 1
            portfolio.slug = slug

        portfolio.status = 'Published'
        portfolio.save(update_fields=['slug', 'status'])

        serializer = PortfolioSerializer(portfolio)
        return Response({
            'id': portfolio.pk,
            'slug': portfolio.slug,
            'status': portfolio.status,
            'portfolio': serializer.data,
        }, status=http_status.HTTP_200_OK)

class UnpublishPortfolioView(APIView):
    """POST /portfolios/{id}/unpublish/ — marks portfolio as Draft."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        portfolio = generics.get_object_or_404(Portfolio, pk=pk, user=request.user)
        portfolio.status = 'Draft'
        portfolio.save(update_fields=['status'])
        return Response({'id': portfolio.pk, 'status': portfolio.status})

class AnalyticsView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        import hashlib, json as _json
        portfolio = generics.get_object_or_404(Portfolio, pk=pk)

        # --- Robust body parsing ---
        # navigator.sendBeacon() sends the body as a Blob. Some browsers/CDNs
        # strip the Content-Type header so DRF cannot parse it and request.data
        # ends up as an empty dict. We fall back to parsing the raw body so that
        # session_time events are always recorded in production (Vercel/Railway).
        data = request.data
        if not data and request.body:
            try:
                data = _json.loads(request.body)
            except (_json.JSONDecodeError, ValueError):
                data = {}

        event_type = data.get('event_type')
        visitor_id = data.get('visitor_id', 'anonymous')
        duration = data.get('duration', 0)

        # Log every analytics POST for Vercel function log visibility
        import sys
        print(f"[Analytics] POST pk={pk} event_type={event_type!r} duration={duration!r} visitor={visitor_id!r} content_type={request.content_type!r}", flush=True, file=sys.stderr)

        # Detect IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '')

        # Detect Country — default to India for localhost/private IPs
        if not ip or ip in ('127.0.0.1', 'localhost', '::1') or ip.startswith('192.168.') or ip.startswith('10.'):
            country = 'India'
        else:
            country = 'India'

        # Detect Device
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        if not user_agent or 'python' in user_agent:
            devices_pool = ['Desktop', 'Desktop', 'Mobile', 'Mobile', 'Tablet']
            h = int(hashlib.md5(visitor_id.encode('utf-8')).hexdigest(), 16)
            device = devices_pool[h % len(devices_pool)]
        else:
            if 'mobile' in user_agent or 'android' in user_agent or 'iphone' in user_agent:
                device = 'Mobile'
            elif 'ipad' in user_agent or 'tablet' in user_agent:
                device = 'Tablet'
            else:
                device = 'Desktop'
        
        if event_type == 'view':
            import datetime as dt
            from django.utils import timezone as tz
            # Dedup: if this visitor already recorded a view on this portfolio
            # within the last 5 minutes, treat it as a duplicate and skip it.
            # This handles React StrictMode double-fire and browser refresh storms.
            cutoff = tz.now() - dt.timedelta(minutes=5)
            already_recorded = PortfolioEvent.objects.filter(
                portfolio=portfolio,
                event_type='view',
                visitor_id=visitor_id,
                created_at__gte=cutoff
            ).exists()
            if not already_recorded:
                PortfolioEvent.objects.create(portfolio=portfolio, event_type=event_type, visitor_id=visitor_id, device=device, country=country)
                portfolio.views += 1
                portfolio.save()

        elif event_type == 'resume_download':
            PortfolioEvent.objects.create(portfolio=portfolio, event_type=event_type, visitor_id=visitor_id, device=device, country=country)

        elif event_type == 'session_time':
            # Record how long this visitor spent on the portfolio (in seconds).
            # Duration is capped at 1 hour to avoid runaway values from idle tabs.
            # duration may arrive as a string when sendBeacon encodes the payload.
            try:
                capped_duration = min(int(float(duration or 0)), 3600)
            except (ValueError, TypeError):
                capped_duration = 0
            print(f"[Analytics] session_time capped_duration={capped_duration} for portfolio pk={pk}", flush=True, file=sys.stderr)
            if capped_duration > 0:
                PortfolioEvent.objects.create(
                    portfolio=portfolio,
                    event_type='session_time',
                    visitor_id=visitor_id,
                    duration=capped_duration,
                    device=device,
                    country=country,
                )
                print(f"[Analytics] session_time saved: {capped_duration}s for portfolio pk={pk}", flush=True, file=sys.stderr)

        return Response({'status': 'ok'})

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        portfolios = Portfolio.objects.filter(user=user)
        
        total_views = sum(p.views for p in portfolios)
        unique_visitors = PortfolioEvent.objects.filter(portfolio__in=portfolios).values('visitor_id').distinct().count()
        resume_downloads = PortfolioEvent.objects.filter(portfolio__in=portfolios, event_type='resume_download').count()
        
        return Response({
            'total_views': total_views,
            'unique_visitors': unique_visitors,
            'resume_downloads': resume_downloads,
        })

class PublicPortfolioListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        portfolios = Portfolio.objects.filter(status='Published')
        data = [
            {
                'slug': p.slug,
                'updated_at': p.updated_at.strftime('%Y-%m-%d') if p.updated_at else None
            }
            for p in portfolios if p.slug
        ]
        return Response(data)


class ProjectSetFeaturedView(APIView):
    """POST /portfolios/projects/<int:project_id>/set-featured/ — marks a project as featured."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_id):
        from .models import Project
        try:
            project = Project.objects.select_related('portfolio').get(
                id=project_id,
                portfolio__user=request.user
            )
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found or permission denied'},
                status=http_status.HTTP_404_NOT_FOUND
            )
        project.featured = True
        project.save(update_fields=['featured'])
        return Response({'success': True, 'project_id': project.id})
