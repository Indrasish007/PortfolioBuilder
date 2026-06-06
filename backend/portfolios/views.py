from rest_framework import viewsets, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status as http_status
from django.db.models import Count, Sum
from django.utils.text import slugify
import re
from .models import Portfolio, PortfolioEvent, ProjectClick, PortfolioVisit
from .serializers import PortfolioSerializer
from .services.seo import generate_seo_payload

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

    def perform_update(self, serializer):
        instance = serializer.save()
        # Trigger search engine pinging if published
        if instance.status == 'Published':
            try:
                from .services.sitemap import ping_search_engines
                from .services.seo import generate_canonical_url
                ping_search_engines(generate_canonical_url(instance))
            except Exception:
                pass

        # Record which portfolio was last edited on the user's profile (cross-device)
        try:
            profile, _ = instance.user.profile.__class__.objects.get_or_create(user=instance.user)
            if profile.last_edited_portfolio_id != instance.pk:
                profile.last_edited_portfolio_id = instance.pk
                profile.save(update_fields=['last_edited_portfolio_id'])
        except Exception:
            pass  # Never let profile write failure break portfolio save


class PublicPortfolioView(generics.RetrieveAPIView):
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        pk = self.kwargs.get('pk')
        return generics.get_object_or_404(Portfolio, pk=pk)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        data['seo'] = generate_seo_payload(instance)
        return Response(data)

class PublicPortfolioBySlugView(generics.RetrieveAPIView):
    """Fetch a published portfolio by its human-readable slug."""
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        slug = self.kwargs.get('slug')
        return generics.get_object_or_404(Portfolio, slug=slug, status='Published')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        data['seo'] = generate_seo_payload(instance)
        return Response(data)

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

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        data['seo'] = generate_seo_payload(instance)
        return Response(data)

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
from rest_framework.parsers import BaseParser, JSONParser, FormParser, MultiPartParser

class PlainTextParser(BaseParser):
    media_type = 'text/plain'

    def parse(self, stream, media_type=None, parser_context=None):
        return stream.read()


def classify_traffic_source(referrer, utm_source):
    utm_source = (utm_source or '').strip().lower()
    referrer = (referrer or '').strip().lower()

    if utm_source == 'direct':
        return 'Direct'

    # 1. UTM Source Classification
    if utm_source:
        if utm_source == 'share':
            return 'Share'
        if utm_source == 'qrcode':
            return 'QR Code'
        if utm_source == 'native_share':
            return 'Native Share'

        # Social Platforms
        if 'linkedin' in utm_source:
            return 'LinkedIn'
        if 'github' in utm_source:
            return 'GitHub'
        if 'whatsapp' in utm_source:
            return 'WhatsApp'
        if 'facebook' in utm_source or utm_source == 'fb':
            return 'Facebook'
        if 'instagram' in utm_source or utm_source == 'ig':
            return 'Instagram'
        if utm_source in ('twitter', 'x', 'x.com', 't.co'):
            return 'X'
        if 'reddit' in utm_source:
            return 'Reddit'
        if 'youtube' in utm_source:
            return 'YouTube'
        if 'telegram' in utm_source:
            return 'Telegram'
        if 'discord' in utm_source:
            return 'Discord'
        if 'medium' in utm_source:
            return 'Medium'
        if 'quora' in utm_source:
            return 'Quora'
        if utm_source in ('hn', 'hackernews', 'hacker-news'):
            return 'HackerNews'
        if 'stackoverflow' in utm_source or 'stack-overflow' in utm_source:
            return 'Stack Overflow'
        if 'tiktok' in utm_source:
            return 'TikTok'
        if 'threads' in utm_source:
            return 'Threads'
        if 'snapchat' in utm_source:
            return 'Snapchat'

        # Search Engines
        if 'google' in utm_source:
            return 'Google'
        if 'bing' in utm_source:
            return 'Bing'
        if 'yahoo' in utm_source:
            return 'Yahoo'
        if 'duckduckgo' in utm_source:
            return 'DuckDuckGo'
        if 'baidu' in utm_source:
            return 'Baidu'
        if 'yandex' in utm_source:
            return 'Yandex'
        if 'ecosia' in utm_source:
            return 'Ecosia'
        if 'brave' in utm_source:
            return 'Brave Search'

        # Email
        if utm_source in ('email', 'newsletter', 'mail'):
            return 'Email'

        # Catch-all: format custom campaign sources exactly (replace underscores/dashes with spaces and capitalize)
        words = utm_source.replace('_', ' ').replace('-', ' ').split()
        return ' '.join(word.capitalize() for word in words)

    # 2. Referrer Classification
    if not referrer:
        # Both utm_source and referrer are empty — could be true direct (bookmark/address bar)
        # or mobile app traffic where the OS strips the referrer header.
        # Label as "Direct / Unknown" so dashboard users know origin is uncertain.
        return 'Direct / Unknown'

    # Social Platforms
    if 'linkedin.com' in referrer or 'lnkd.in' in referrer:
        return 'LinkedIn'
    if 'github.com' in referrer:
        return 'GitHub'
    if any(domain in referrer for domain in ('wa.me', 'web.whatsapp.com', 'api.whatsapp.com')):
        return 'WhatsApp'
    if 'facebook.com' in referrer or 'fb.me' in referrer:
        return 'Facebook'
    if 'instagram.com' in referrer:
        return 'Instagram'
    if any(domain in referrer for domain in ('twitter.com', 'x.com')) or '/t.co' in referrer or referrer == 't.co':
        return 'X'
    if 'reddit.com' in referrer:
        return 'Reddit'
    if 'youtube.com' in referrer or 'youtu.be' in referrer:
        return 'YouTube'
    if 'telegram.org' in referrer or 't.me' in referrer:
        return 'Telegram'
    if 'discord.com' in referrer or 'discord.gg' in referrer:
        return 'Discord'
    if 'medium.com' in referrer:
        return 'Medium'
    if 'quora.com' in referrer:
        return 'Quora'
    if 'news.ycombinator.com' in referrer:
        return 'HackerNews'
    if 'stackoverflow.com' in referrer:
        return 'Stack Overflow'
    if 'tiktok.com' in referrer:
        return 'TikTok'
    if 'threads.net' in referrer:
        return 'Threads'
    if 'snapchat.com' in referrer:
        return 'Snapchat'

    # Email
    email_domains = [
        'mail.google.com', 'outlook.live.com', 'mail.yahoo.com', 'protonmail.com'
    ]
    if any(domain in referrer for domain in email_domains):
        return 'Email'

    # Search Engines
    if 'google.com' in referrer or 'google.co.' in referrer:
        return 'Google'
    if 'bing.com' in referrer:
        return 'Bing'
    if 'yahoo.com' in referrer:
        return 'Yahoo'
    if 'duckduckgo.com' in referrer:
        return 'DuckDuckGo'
    if 'baidu.com' in referrer:
        return 'Baidu'
    if 'yandex.ru' in referrer or 'yandex.com' in referrer:
        return 'Yandex'
    if 'ecosia.org' in referrer:
        return 'Ecosia'
    if 'brave.com' in referrer or 'search.brave.com' in referrer:
        return 'Brave Search'

    return 'Referral'




class AnalyticsView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser, PlainTextParser]

    def post(self, request, pk):
        import hashlib, json as _json
        portfolio = generics.get_object_or_404(Portfolio, pk=pk)

        # --- Robust body parsing ---
        # navigator.sendBeacon() sends the body as a Blob. Some browsers/CDNs
        # strip the Content-Type header so DRF cannot parse it and request.data
        # ends up as an empty dict. We fall back to parsing the raw body so that
        # session_time events are always recorded in production (Vercel/Railway).
        data = request.data
        if isinstance(data, (bytes, str)):
            try:
                if isinstance(data, bytes):
                    data = data.decode('utf-8')
                data = _json.loads(data)
            except (_json.JSONDecodeError, ValueError):
                data = {}
        elif not data and request.body:
            try:
                data = _json.loads(request.body)
            except (_json.JSONDecodeError, ValueError):
                data = {}

        event_type = data.get('event_type') if isinstance(data, dict) else None
        visitor_id = data.get('visitor_id', 'anonymous') if isinstance(data, dict) else 'anonymous'
        duration = data.get('duration', 0) if isinstance(data, dict) else 0

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
        
        # Determine normalized traffic source
        referrer_val = data.get('referrer', '') if isinstance(data, dict) else ''
        utm_source_val = (data.get('utm_source') or data.get('source') or '') if isinstance(data, dict) else ''
        source = classify_traffic_source(referrer_val, utm_source_val)

        # End-to-end debugging logs: log incoming payload
        import sys
        print(f"\n[Analytics EVENT] Received event_type={event_type!r}", file=sys.stderr)
        print(f"  URL: {request.build_absolute_uri()}", file=sys.stderr)
        print(f"  Referrer: {referrer_val}", file=sys.stderr)
        print(f"  Parsed UTM: source={data.get('utm_source')}, medium={data.get('utm_medium')}, campaign={data.get('utm_campaign')}", file=sys.stderr)
        print(f"  First-touch: source={data.get('first_touch_source')}, medium={data.get('first_touch_medium')}, campaign={data.get('first_touch_campaign')}", file=sys.stderr)
        print(f"  Last-touch: source={data.get('last_touch_source')}, medium={data.get('last_touch_medium')}, campaign={data.get('last_touch_campaign')}", file=sys.stderr)
        print(f"  Final Payload: {data}", file=sys.stderr)

        if event_type == 'view':
            from django.core.cache import cache
            # Deduplicate using a source-specific cache key to allow different sources in the 5-min window
            cache_key = f"view_recorded_{portfolio.id}_{visitor_id}_{source}"
            already_recorded = cache.get(cache_key) is not None

            if not already_recorded:
                # Set cache to prevent duplicate views for this source in the next 5 minutes
                cache.set(cache_key, True, 300)

                event = PortfolioEvent.objects.create(
                    portfolio=portfolio,
                    event_type=event_type,
                    visitor_id=visitor_id,
                    device=device,
                    country=country,
                    source=source,
                    medium=data.get('medium'),
                    campaign=data.get('campaign'),
                    referrer=referrer_val,
                    utm_source=data.get('utm_source'),
                    utm_medium=data.get('utm_medium'),
                    utm_campaign=data.get('utm_campaign'),
                    first_touch_source=data.get('first_touch_source'),
                    first_touch_medium=data.get('first_touch_medium'),
                    first_touch_campaign=data.get('first_touch_campaign'),
                    last_touch_source=data.get('last_touch_source'),
                    last_touch_medium=data.get('last_touch_medium'),
                    last_touch_campaign=data.get('last_touch_campaign')
                )
                print(f"  Database Saved: ID={event.id}, source={event.source}, utm_source={event.utm_source}, first_touch_source={event.first_touch_source}, last_touch_source={event.last_touch_source}", file=sys.stderr, flush=True)

                portfolio.views += 1
                portfolio.save()

                from .models import TrafficSource
                traffic_obj, created = TrafficSource.objects.get_or_create(
                    portfolio=portfolio,
                    source=event.source,
                    defaults={'visit_count': 1}
                )
                if not created:
                    traffic_obj.visit_count += 1
                    traffic_obj.save(update_fields=['visit_count'])

        elif event_type == 'resume_download':
            event = PortfolioEvent.objects.create(
                portfolio=portfolio,
                event_type=event_type,
                visitor_id=visitor_id,
                device=device,
                country=country,
                source=source,
                medium=data.get('medium'),
                campaign=data.get('campaign'),
                referrer=referrer_val,
                utm_source=data.get('utm_source'),
                utm_medium=data.get('utm_medium'),
                utm_campaign=data.get('utm_campaign'),
                first_touch_source=data.get('first_touch_source'),
                first_touch_medium=data.get('first_touch_medium'),
                first_touch_campaign=data.get('first_touch_campaign'),
                last_touch_source=data.get('last_touch_source'),
                last_touch_medium=data.get('last_touch_medium'),
                last_touch_campaign=data.get('last_touch_campaign')
            )
            print(f"  Database Saved: ID={event.id}, source={event.source}, event_type={event_type}, first_touch_source={event.first_touch_source}", file=sys.stderr, flush=True)

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
                event = PortfolioEvent.objects.create(
                    portfolio=portfolio,
                    event_type='session_time',
                    visitor_id=visitor_id,
                    duration=capped_duration,
                    device=device,
                    country=country,
                    source=source,
                    medium=data.get('medium'),
                    campaign=data.get('campaign'),
                    referrer=referrer_val,
                    utm_source=data.get('utm_source'),
                    utm_medium=data.get('utm_medium'),
                    utm_campaign=data.get('utm_campaign'),
                    first_touch_source=data.get('first_touch_source'),
                    first_touch_medium=data.get('first_touch_medium'),
                    first_touch_campaign=data.get('first_touch_campaign'),
                    last_touch_source=data.get('last_touch_source'),
                    last_touch_medium=data.get('last_touch_medium'),
                    last_touch_campaign=data.get('last_touch_campaign')
                )
                print(f"  Database Saved: ID={event.id}, source={event.source}, event_type=session_time, first_touch_source={event.first_touch_source}", file=sys.stderr, flush=True)

        return Response({'status': 'ok'})

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        portfolios = Portfolio.objects.filter(user=user)
        
        total_views = sum(p.views for p in portfolios)
        unique_visitors = sum(
            PortfolioEvent.objects.filter(portfolio=p).values('visitor_id').distinct().count()
            for p in portfolios
        )
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


class TrackProjectClickView(APIView):
    """POST /portfolios/track-project-click/
    Records a single project link click by a visitor.
    AllowAny — called from the public portfolio page.
    Deduplicates within 60 s per (visitor_id, project_id) to avoid double-fires
    from React strict mode or accidental rapid clicks.
    """
    permission_classes = [permissions.AllowAny]
    parser_classes = [JSONParser, PlainTextParser]


    def post(self, request):
        import json as _json, datetime as dt
        from django.utils import timezone as tz
        from .models import Project

        # Support both JSON and text/plain payloads (text/plain avoids CORS preflight)
        data = request.data
        if isinstance(data, (bytes, str)):
            try:
                data = _json.loads(data if isinstance(data, str) else data.decode())
            except Exception:
                data = {}
        elif not data and request.body:
            try:
                data = _json.loads(request.body)
            except Exception:
                data = {}

        project_id = data.get('project_id') if isinstance(data, dict) else None
        link_type  = (data.get('link_type', 'live') if isinstance(data, dict) else 'live') or 'live'
        visitor_id = (data.get('visitor_id', 'anonymous') if isinstance(data, dict) else 'anonymous') or 'anonymous'

        if not project_id:
            return Response({'error': 'project_id required'}, status=http_status.HTTP_400_BAD_REQUEST)

        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({'error': 'project not found'}, status=http_status.HTTP_404_NOT_FOUND)

        # Dedup: skip if same visitor clicked same project within the last 60 seconds
        cutoff = tz.now() - dt.timedelta(seconds=60)
        already = ProjectClick.objects.filter(
            project=project,
            visitor_id=visitor_id,
            link_type=link_type,
            created_at__gte=cutoff,
        ).exists()

        # End-to-end debugging logs
        import sys
        print(f"\n[Analytics EVENT] Received project click", file=sys.stderr)
        print(f"  Project ID: {project_id}", file=sys.stderr)
        print(f"  Link Type: {link_type}", file=sys.stderr)
        print(f"  Referrer: {data.get('referrer')}", file=sys.stderr)
        print(f"  Parsed UTM: source={data.get('utm_source')}, medium={data.get('utm_medium')}, campaign={data.get('utm_campaign')}", file=sys.stderr)
        print(f"  First-touch: source={data.get('first_touch_source')}, medium={data.get('first_touch_medium')}, campaign={data.get('first_touch_campaign')}", file=sys.stderr)
        print(f"  Last-touch: source={data.get('last_touch_source')}, medium={data.get('last_touch_medium')}, campaign={data.get('last_touch_campaign')}", file=sys.stderr)
        print(f"  Final Payload: {data}", file=sys.stderr)

        if not already:
            # Use the same centralised classification pipeline as PortfolioEvent —
            # derive source from referrer + utm_source rather than trusting the raw
            # frontend 'source' string which may be stale or mis-formatted.
            click_referrer = data.get('referrer', '') or ''
            click_utm_source = (data.get('utm_source') or data.get('source') or '')
            click_source = classify_traffic_source(click_referrer, click_utm_source)

            click_event = ProjectClick.objects.create(
                project=project,
                visitor_id=visitor_id,
                link_type=link_type,
                source=click_source,
                medium=data.get('medium'),
                campaign=data.get('campaign'),
                referrer=click_referrer,
                utm_source=data.get('utm_source'),
                utm_medium=data.get('utm_medium'),
                utm_campaign=data.get('utm_campaign'),
                first_touch_source=data.get('first_touch_source'),
                first_touch_medium=data.get('first_touch_medium'),
                first_touch_campaign=data.get('first_touch_campaign'),
                last_touch_source=data.get('last_touch_source'),
                last_touch_medium=data.get('last_touch_medium'),
                last_touch_campaign=data.get('last_touch_campaign')
            )
            print(f"  Database Saved: ProjectClick ID={click_event.id}, source={click_event.source} (classified from utm={data.get('utm_source')!r}, referrer={click_referrer!r}), visitor={visitor_id}", file=sys.stderr, flush=True)

        return Response({'status': 'ok'})


class TrackVisitView(APIView):
    """POST /api/track-visit/ — tracks visitor country views dynamically with geolocation."""
    permission_classes = [permissions.AllowAny]
    parser_classes = [JSONParser, PlainTextParser]

    def post(self, request):
        import json as _json, hashlib as _hashlib
        from django.core.cache import cache as _cache

        data = request.data
        if isinstance(data, (bytes, str)):
            try:
                data = _json.loads(data if isinstance(data, str) else data.decode())
            except Exception:
                data = {}
        elif not data and request.body:
            try:
                data = _json.loads(request.body)
            except Exception:
                data = {}

        portfolio_id = data.get('portfolioId')
        country_name = data.get('country_name')
        country_code = data.get('country_code')

        if not portfolio_id or not country_name or not country_code:
            return Response({'error': 'portfolioId, country_name, and country_code are required'}, status=http_status.HTTP_400_BAD_REQUEST)

        # 1. IP Hash for debouncing
        x_forwarded_for = request.headers.get('x-forwarded-for')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '')
        
        ip_hash = _hashlib.sha256(ip.encode('utf-8')).hexdigest()

        # 2. Cooldown check (5 seconds debounce)
        cache_key = f"geo_track_{portfolio_id}_{country_code}_{ip_hash}"
        if _cache.get(cache_key):
            try:
                visit = PortfolioVisit.objects.get(
                    portfolio_id=portfolio_id,
                    country_name=country_name,
                    country_code=country_code
                )
                visit_count = visit.visit_count
            except PortfolioVisit.DoesNotExist:
                visit_count = 1
            return Response({'status': 'ok', 'visit_count': visit_count, 'debounced': True})

        # Set 5-second cooldown
        _cache.set(cache_key, True, timeout=5)

        try:
            portfolio = Portfolio.objects.get(pk=portfolio_id)
        except Portfolio.DoesNotExist:
            return Response({'error': 'Portfolio not found'}, status=http_status.HTTP_404_NOT_FOUND)

        # Get or create record
        visit, created = PortfolioVisit.objects.get_or_create(
            portfolio=portfolio,
            country_name=country_name,
            country_code=country_code,
            defaults={'visit_count': 1}
        )

        if not created:
            visit.visit_count += 1
            visit.save(update_fields=['visit_count'])

        return Response({'status': 'ok', 'visit_count': visit.visit_count})


from django.http import HttpResponse, Http404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.conf import settings
from .services.sitemap import (
    generate_sitemap_data,
    generate_image_sitemap_entries,
    generate_sitemap_index_entries
)

class RobotsTxtView(APIView):
    """
    GET /robots.txt
    Returns Content-Type: text/plain
    Public endpoint, no authentication required.
    Serves custom robots.txt dynamically based on the incoming request Host header.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        raw_host = request.get_host()
        hostname = raw_host.split(':')[0]
        
        main_domain = getattr(settings, 'MAIN_DOMAIN', 'portfoliobuilder.com')
        is_main_or_dev = (hostname == main_domain or hostname in ['localhost', '127.0.0.1', 'testserver'])

        if not is_main_or_dev:
            # Custom domain specific Robots.txt
            try:
                portfolio = Portfolio.objects.get(domain=hostname, status='Published')
                content = (
                    "User-agent: *\n"
                    "Allow: /\n\n"
                    f"Sitemap: https://{hostname}/sitemap.xml\n"
                )
                return HttpResponse(content, content_type="text/plain")
            except Portfolio.DoesNotExist:
                content = (
                    "User-agent: *\n"
                    "Disallow: /\n"
                )
                return HttpResponse(content, content_type="text/plain")

        # Main platform domain Robots.txt
        content = (
            "User-agent: *\n"
            "Allow: /p/\n"
            "Allow: /u/\n"
            "Disallow: /admin/\n"
            "Disallow: /api/\n"
            "Disallow: /dashboard/\n\n"
            f"Sitemap: {settings.SITE_BASE_URL}/sitemap.xml\n"
        )
        return HttpResponse(content, content_type="text/plain")


class SitemapXMLView(APIView):
    """
    GET /sitemap.xml
    Returns Content-Type: application/xml
    Public endpoint, no authentication.
    Cached for 24 hours. Serves index sitemap or custom domain-mapped flat sitemap.
    """
    permission_classes = [permissions.AllowAny]

    @method_decorator(cache_page(60 * 60 * 24))
    def get(self, request, *args, **kwargs):
        raw_host = request.get_host()
        hostname = raw_host.split(':')[0]
        
        main_domain = getattr(settings, 'MAIN_DOMAIN', 'portfoliobuilder.com')
        is_main_or_dev = (hostname == main_domain or hostname in ['localhost', '127.0.0.1', 'testserver'])

        if not is_main_or_dev:
            # Custom domain: serve single-entry sitemap for custom domain root
            try:
                portfolio = Portfolio.objects.get(domain=hostname, status='Published')
                lastmod = portfolio.updated_at.strftime('%Y-%m-%d') if portfolio.updated_at else ""
                xml_lines = [
                    '<?xml version="1.0" encoding="UTF-8"?>',
                    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                    '  <url>',
                    f'    <loc>https://{hostname}/</loc>',
                ]
                if lastmod:
                    xml_lines.append(f'    <lastmod>{lastmod}</lastmod>')
                xml_lines.extend([
                    '    <changefreq>weekly</changefreq>',
                    '    <priority>1.0</priority>',
                    '  </url>',
                    '</urlset>'
                ])
                xml_content = "\n".join(xml_lines)
                return HttpResponse(xml_content, content_type="application/xml")
            except Portfolio.DoesNotExist:
                raise Http404("Sitemap not found for this custom domain.")

        # Main domain: serve sitemap index
        entries = generate_sitemap_index_entries()
        xml_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        ]
        for entry in entries:
            xml_lines.append("  <sitemap>")
            xml_lines.append(f"    <loc>{entry['loc']}</loc>")
            if entry['lastmod']:
                xml_lines.append(f"    <lastmod>{entry['lastmod']}</lastmod>")
            xml_lines.append("  </sitemap>")
        xml_lines.append('</sitemapindex>')
        
        xml_content = "\n".join(xml_lines)
        return HttpResponse(xml_content, content_type="application/xml")


class PortfolioSitemapXMLView(APIView):
    """
    GET /sitemap-portfolios.xml
    Returns Content-Type: application/xml
    Public endpoint, cached for 24 hours.
    """
    permission_classes = [permissions.AllowAny]

    @method_decorator(cache_page(60 * 60 * 24))
    def get(self, request, *args, **kwargs):
        entries = generate_sitemap_data()
        
        xml_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        ]
        for entry in entries:
            xml_lines.append("  <url>")
            xml_lines.append(f"    <loc>{entry['loc']}</loc>")
            if entry['lastmod']:
                xml_lines.append(f"    <lastmod>{entry['lastmod']}</lastmod>")
            xml_lines.append(f"    <changefreq>{entry['changefreq']}</changefreq>")
            xml_lines.append(f"    <priority>{entry['priority']}</priority>")
            xml_lines.append("  </url>")
        xml_lines.append('</urlset>')
        
        xml_content = "\n".join(xml_lines)
        return HttpResponse(xml_content, content_type="application/xml")


class ImageSitemapXMLView(APIView):
    """
    GET /sitemap-images.xml
    Returns Content-Type: application/xml
    Public endpoint, cached for 24 hours.
    """
    permission_classes = [permissions.AllowAny]

    @method_decorator(cache_page(60 * 60 * 24))
    def get(self, request, *args, **kwargs):
        entries = generate_image_sitemap_entries()
        
        xml_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
            '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
        ]
        for entry in entries:
            xml_lines.append("  <url>")
            xml_lines.append(f"    <loc>{entry['loc']}</loc>")
            xml_lines.append("    <image:image>")
            xml_lines.append(f"      <image:loc>{entry['image_loc']}</image:loc>")
            if entry.get('image_title'):
                xml_lines.append(f"      <image:title>{entry['image_title']}</image:title>")
            if entry.get('image_caption'):
                xml_lines.append(f"      <image:caption>{entry['image_caption']}</image:caption>")
            xml_lines.append("    </image:image>")
            xml_lines.append("  </url>")
        xml_lines.append('</urlset>')
        
        xml_content = "\n".join(xml_lines)
        return HttpResponse(xml_content, content_type="application/xml")


from portfolios.services.og_image import generate_dynamic_og_image
from django.core.cache import cache

class DynamicOGImageView(APIView):
    """
    GET /api/portfolios/public/<id>/og/
    Generates a brand-curated high-fidelity SVG Open Graph preview image.
    Public view, AllowAny.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk, *args, **kwargs):
        cache_key = f"og_image_{pk}"
        cached_svg = cache.get(cache_key)
        if cached_svg:
            return HttpResponse(cached_svg, content_type="image/svg+xml")

        portfolio = generics.get_object_or_404(Portfolio, pk=pk, status='Published')
        svg_content = generate_dynamic_og_image(portfolio)
        
        # Cache for 10 minutes (600 seconds)
        cache.set(cache_key, svg_content, 600)
        return HttpResponse(svg_content, content_type="image/svg+xml")


class DynamicOGImageBySlugView(APIView):
    """
    GET /api/portfolios/public/slug/<slug>/og/
    Generates a brand-curated high-fidelity SVG Open Graph preview image by slug.
    Public view, AllowAny.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug, *args, **kwargs):
        portfolio = generics.get_object_or_404(Portfolio, slug=slug, status='Published')
        
        cache_key = f"og_image_{portfolio.id}"
        cached_svg = cache.get(cache_key)
        if cached_svg:
            return HttpResponse(cached_svg, content_type="image/svg+xml")

        svg_content = generate_dynamic_og_image(portfolio)
        
        # Cache for 10 minutes (600 seconds)
        cache.set(cache_key, svg_content, 600)
        return HttpResponse(svg_content, content_type="image/svg+xml")


import cloudinary.uploader
import logging

logger = logging.getLogger(__name__)

class ImageUploadView(APIView):
    """
    POST /api/portfolios/upload-image/
    Expects a multipart file upload with key 'image' or 'file'.
    Uploads the file directly to Cloudinary and returns the URL.
    Falls back to returning a local Base64 Data URL if Cloudinary is unconfigured (mock)
    or fails, ensuring robust local development and offline/fallback operations.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        import os
        file_obj = request.FILES.get('image') or request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded under key "image" or "file".'}, status=http_status.HTTP_400_BAD_REQUEST)
        
        try:
            cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', 'mock_cloud_name')
            if cloud_name == 'mock_cloud_name' or not cloud_name:
                raise ValueError("Cloudinary credentials are not configured (mock_cloud_name detected).")

            # Upload to Cloudinary with auto resource_type to handle images and PDFs
            result = cloudinary.uploader.upload(
                file_obj,
                resource_type="auto"
            )
            secure_url = result.get('secure_url')
            if not secure_url:
                return Response({'error': 'Cloudinary upload did not return a secure URL.'}, status=http_status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({'url': secure_url}, status=http_status.HTTP_200_OK)
        except Exception as e:
            logger.warning(f"Cloudinary upload failed/skipped: {e}. Falling back to Base64 data URL for local development/compatibility.")
            try:
                import base64
                file_obj.seek(0)
                file_content = file_obj.read()
                mime_type = getattr(file_obj, 'content_type', 'application/octet-stream')
                base64_str = base64.b64encode(file_content).decode('utf-8')
                data_url = f"data:{mime_type};base64,{base64_str}"
                return Response({'url': data_url}, status=http_status.HTTP_200_OK)
            except Exception as fallback_err:
                logger.exception("Fallback Base64 encoding failed")
                return Response({'error': f'Failed to process file: {str(e)}'}, status=http_status.HTTP_500_INTERNAL_SERVER_ERROR)


