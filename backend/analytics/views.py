from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import datetime
from django.utils import timezone
from django.db.models import Count, Sum, IntegerField
from django.db.models.functions import Coalesce
from portfolios.models import Portfolio, PortfolioEvent, Project, ProjectClick, PortfolioVisit


# ── Portfolio Score ───────────────────────────────────────────────────────────

_SCORE_CRITERIA = [
    {
        "key": "avatar",
        "max": 10,
        "emoji": "📸",
        "label": "Add a profile picture",
        "tip": "Add a profile picture to earn 10 points",
    },
    {
        "key": "bio",
        "max": 15,
        "emoji": "📝",
        "label": "Write an About section (min 50 chars)",
        "tip": "Write a longer About section (min 50 characters) to earn 15 points",
    },
    {
        "key": "skills_3",
        "max": 10,
        "emoji": "🛠️",
        "label": "Add at least 3 skills",
        "tip": "Add at least 3 skills to earn 10 points",
    },
    {
        "key": "project_1",
        "max": 15,
        "emoji": "🚀",
        "label": "Add your first project",
        "tip": "Add at least 1 project to earn 15 points",
    },
    {
        "key": "projects_3",
        "max": 10,
        "emoji": "🚀",
        "label": "Add at least 3 projects",
        "tip": "Add at least 3 projects to earn 10 more points",
    },
    {
        "key": "project_image",
        "max": 5,
        "emoji": "🖼️",
        "label": "Add an image to a project",
        "tip": "Add an image to at least one project to earn 5 points",
    },
    {
        "key": "project_live",
        "max": 5,
        "emoji": "🔗",
        "label": "Add a live link to a project",
        "tip": "Add a live demo link to at least one project to earn 5 points",
    },
    {
        "key": "email",
        "max": 10,
        "emoji": "📧",
        "label": "Add a contact email",
        "tip": "Add your contact email to earn 10 points",
    },
    {
        "key": "social",
        "max": 10,
        "emoji": "🔗",
        "label": "Add LinkedIn or GitHub link",
        "tip": "Add your LinkedIn or GitHub link to earn 10 points",
    },
    {
        "key": "theme",
        "max": 5,
        "emoji": "🎨",
        "label": "Select a custom theme",
        "tip": "Choose a custom theme (not the default Midnight) to earn 5 points",
    },
    {
        "key": "viewed",
        "max": 5,
        "emoji": "👁️",
        "label": "Get your first portfolio view",
        "tip": "Share your portfolio link to get your first view and earn 5 points",
    },
]

_SCORE_LABEL = [
    (91, "Excellent"),
    (71, "Good"),
    (41, "Average"),
    (0,  "Weak"),
]


def _score_portfolio(p) -> dict:
    """
    Compute a 0-100 completeness score for a Portfolio instance.
    Expects p to have prefetched: skills, projects, user__profile.
    """
    try:
        profile = p.user.profile
    except Exception:
        profile = None

    projects = list(p.projects.all())
    n_projects = len(projects)
    n_skills = p.skills.count()

    checks = {
        "avatar":        bool(p.avatar or (profile and profile.avatar)),
        "bio":           bool(p.developer_bio and len((p.developer_bio or "").strip()) >= 50),
        "skills_3":      n_skills >= 3,
        "project_1":     n_projects >= 1,
        "projects_3":    n_projects >= 3,
        "project_image": any(proj.image for proj in projects),
        "project_live":  any(proj.live for proj in projects),
        "email":         bool((p.developer_email or "").strip()),
        "social":        bool((p.developer_linkedin or "").strip() or (p.developer_github or "").strip()),
        "theme":         p.theme not in ("", "Midnight", None),
        "viewed":        p.views >= 1,
    }

    breakdown = []
    total = 0
    suggestions = []

    for c in _SCORE_CRITERIA:
        done = checks.get(c["key"], False)
        earned = c["max"] if done else 0
        total += earned
        breakdown.append({
            "key":    c["key"],
            "label":  c["label"],
            "emoji":  c["emoji"],
            "earned": earned,
            "max":    c["max"],
            "done":   done,
        })
        if not done:
            suggestions.append({
                "emoji": c["emoji"],
                "text":  c["tip"],
                "pts":   c["max"],
            })

    label = "Weak"
    for threshold, lbl in _SCORE_LABEL:
        if total >= threshold:
            label = lbl
            break

    return {
        "score":       total,
        "label":       label,
        "breakdown":   breakdown,
        "suggestions": suggestions,
    }

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        portfolios = Portfolio.objects.filter(user=user).prefetch_related(
            'skills', 'projects', 'user__profile'
        )
        
        # Last 14 days range
        today = timezone.localdate()
        date_list = [today - datetime.timedelta(days=i) for i in range(13, -1, -1)]
        
        # 1. Views and Visitors over time (per day)
        views_chart = []
        visitors_chart = []
        
        for d in date_list:
            day_str = d.strftime('%b %d') # e.g. "May 19"
            
            # Count raw view events per day — consistent with portfolio.views total
            day_views = PortfolioEvent.objects.filter(
                portfolio__in=portfolios,
                event_type='view',
                created_at__date=d
            ).count()
            
            # Visitors count on day d (distinct visitor_ids, summed per portfolio)
            day_visitors = sum(
                PortfolioEvent.objects.filter(
                    portfolio=p,
                    created_at__date=d
                ).values('visitor_id').distinct().count()
                for p in portfolios
            )
            
            views_chart.append({"day": day_str, "views": day_views})
            visitors_chart.append({"day": day_str, "visitors": day_visitors})

        # 2. Devices
        device_counts = PortfolioEvent.objects.filter(
            portfolio__in=portfolios,
            created_at__date__gte=today - datetime.timedelta(days=13)
        ).values('device').annotate(count=Count('id')).order_by('-count')
        
        total_device_events = sum(item['count'] for item in device_counts)
        devices_data = []
        if total_device_events > 0:
            for item in device_counts:
                percentage = round((item['count'] / total_device_events) * 100)
                devices_data.append({"name": item['device'], "value": percentage})
        else:
            devices_data = [
                {"name": "Desktop", "value": 60},
                {"name": "Mobile", "value": 30},
                {"name": "Tablet", "value": 10},
            ]

        # 3. Countries — total view count per country using real dynamic geolocation tracking
        combined_country_counts = (
            PortfolioVisit.objects
            .filter(portfolio__in=portfolios)
            .values('country_name', 'country_code')
            .annotate(visits=Sum('visit_count'))
            .order_by('-visits')
        )
        countries_data = [
            {
                "country": item['country_name'],
                "country_code": item['country_code'],
                "visits": item['visits']
            }
            for item in combined_country_counts
        ]

        # Use portfolio.views (same source as Dashboard) so both pages
        # always report an identical total — avoids counting stale duplicate
        # PortfolioEvent rows that existed before the dedup fix.
        total_views = sum(p.views for p in portfolios)


        total_visitors = sum(
            PortfolioEvent.objects.filter(
                portfolio=p,
                created_at__date__gte=today - datetime.timedelta(days=13)
            ).values('visitor_id').distinct().count()
            for p in portfolios
        )

        downloads = PortfolioEvent.objects.filter(
            portfolio__in=portfolios,
            event_type='resume_download',
            created_at__date__gte=today - datetime.timedelta(days=13)
        ).count()

        # 5. Suggestions
        suggestions = []
        if total_views > 0:
            download_ratio = downloads / total_views
            if download_ratio < 0.05:
                suggestions.append("Your resume download rate is low (under 5%). Try adding a prominent resume download button to the header.")
            else:
                suggestions.append("Great resume download rate! Keep your resume file updated with your latest contact details.")
        else:
            suggestions.append("Once visitors view your portfolio, we will check your resume download conversion rate.")



        mobile_val = next((d['value'] for d in devices_data if d['name'] == 'Mobile'), 0)
        if mobile_val > 40:
            suggestions.append(f"Over {mobile_val}% of your traffic is mobile. Ensure all your uploaded gallery images load fast on mobile devices.")
        else:
            suggestions.append("Desktop users form the majority of your traffic. Ensure your portfolio layout looks wide and spacious.")

        # 7. Per-portfolio breakdown
        per_portfolio = []
        for p in portfolios:
            p_views_chart = []
            for d in date_list:
                day_str = d.strftime('%b %d')
                day_views = PortfolioEvent.objects.filter(
                    portfolio=p,
                    event_type='view',
                    created_at__date=d
                ).count()
                p_views_chart.append({"day": day_str, "views": day_views})

            p_visitors = PortfolioEvent.objects.filter(
                portfolio=p,
                created_at__date__gte=today - datetime.timedelta(days=13)
            ).values('visitor_id').distinct().count()

            p_downloads = PortfolioEvent.objects.filter(
                portfolio=p,
                event_type='resume_download',
                created_at__date__gte=today - datetime.timedelta(days=13)
            ).count()

            p_country_visits = (
                PortfolioVisit.objects
                .filter(portfolio=p)
                .order_by('-visit_count')
            )

            p_countries = [
                {
                    "country": cv.country_name,
                    "country_code": cv.country_code,
                    "visits": cv.visit_count
                }
                for cv in p_country_visits
            ]

            # Total view time: sum all session_time event durations for this portfolio
            p_view_time = PortfolioEvent.objects.filter(
                portfolio=p,
                event_type='session_time',
            ).aggregate(total=Coalesce(Sum('duration'), 0, output_field=IntegerField()))['total']

            # Number of sessions (one session_time event per visit)
            p_visit_count = PortfolioEvent.objects.filter(
                portfolio=p,
                event_type='session_time',
            ).count()

            per_portfolio.append({
                "id": p.id,
                "name": p.name,
                "slug": p.slug or str(p.id),
                "status": p.status,
                "views": p.views,
                "visitors": p_visitors,
                "downloads": p_downloads,
                "countries": p_countries,
                "views_chart": p_views_chart,
                "total_view_time_seconds": p_view_time,
                "visit_count": p_visit_count,
                "portfolio_score": _score_portfolio(p),
            })

        # Overall total view time across all portfolios
        total_view_time_seconds = PortfolioEvent.objects.filter(
            portfolio__in=portfolios,
            event_type='session_time',
        ).aggregate(total=Coalesce(Sum('duration'), 0, output_field=IntegerField()))['total']

        data = {
            "views": views_chart,
            "visitors": visitors_chart,
            "devices": devices_data,
            "countries": countries_data,
            "downloads": downloads,
            "total_views": total_views,
            "total_visitors": total_visitors,
            "total_view_time_seconds": total_view_time_seconds,
            "suggestions": suggestions,
            "per_portfolio": per_portfolio,
        }
        return Response(data)


class ProjectClicksSummaryView(APIView):
    """Returns all projects across the user's portfolios sorted by real ProjectClick count."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        portfolios = Portfolio.objects.filter(user=user).prefetch_related('projects')

        # Aggregate real click counts from the ProjectClick model
        click_counts = (
            ProjectClick.objects
            .filter(project__portfolio__user=user)
            .values('project_id')
            .annotate(total=Count('id'))
        )
        # Build a fast lookup: project_id -> click count
        click_map = {row['project_id']: row['total'] for row in click_counts}

        results = []
        for portfolio in portfolios:
            for project in portfolio.projects.all():
                click_count = click_map.get(project.id, 0)
                results.append({
                    'project_id': project.id,
                    'project_title': project.title,
                    'project_description': (project.description or '')[:120],
                    'portfolio_id': portfolio.id,
                    'portfolio_name': portfolio.name,
                    'portfolio_slug': portfolio.slug or str(portfolio.id),
                    'portfolio_url': f'/p/{portfolio.slug}' if portfolio.slug else f'/p/{portfolio.id}',
                    'click_count': click_count,
                    'github': project.github or '',
                    'live': project.live or '',
                    'tech': project.tech or [],
                    'featured': project.featured,
                    'image': project.image or '',
                })

        # Sort by click_count descending, then featured projects first on ties
        results.sort(key=lambda x: (x['click_count'], x['featured']), reverse=True)

        # Badge = number of projects with at least 1 click
        badge_count = sum(1 for r in results if r['click_count'] > 0)

        return Response({
            'projects': results,
            'badge_count': badge_count,
            'total_projects': len(results),
        })


class AIInsightsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio_id = request.query_params.get('portfolio_id')
        if not portfolio_id:
            return Response({'error': 'portfolio_id is required'}, status=400)
            
        try:
            portfolio = Portfolio.objects.prefetch_related('projects', 'skills', 'user__profile').get(
                id=portfolio_id,
                user=request.user
            )
        except Portfolio.DoesNotExist:
            return Response({'error': 'Portfolio not found or permission denied'}, status=404)
            
        from analytics.services.ai_insights import generate_ai_insights
        insights = generate_ai_insights(portfolio)
        
        return Response({'insights': insights})


class TrafficSourcesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio_id = request.query_params.get('portfolio_id')
        if not portfolio_id:
            return Response({'error': 'portfolio_id is required'}, status=400)

        try:
            portfolio = Portfolio.objects.get(id=portfolio_id, user=request.user)
        except Portfolio.DoesNotExist:
            return Response({'error': 'Portfolio not found or permission denied'}, status=404)

        from portfolios.models import TrafficSource
        sources = TrafficSource.objects.filter(portfolio=portfolio)
        
        total_count = sum(s.visit_count for s in sources)
        
        results = []
        for s in sources:
            percentage = round((s.visit_count / total_count) * 100, 1) if total_count > 0 else 0.0
            results.append({
                'source': s.source,
                'count': s.visit_count,
                'visits': s.visit_count,
                'percentage': percentage
            })
            
        results.sort(key=lambda x: x['visits'], reverse=True)
            
        return Response({'sources': results})


class TrafficSourcesTotalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        portfolios = Portfolio.objects.filter(user=user)
        
        from portfolios.models import TrafficSource
        from django.db.models import Sum
        
        sources = (
            TrafficSource.objects
            .filter(portfolio__in=portfolios)
            .values('source')
            .annotate(total=Sum('visit_count'))
        )
        
        source_map = {item['source']: item['total'] for item in sources}
        total_count = sum(source_map.values())
        
        results = []
        for source_name, count in source_map.items():
            percentage = round((count / total_count) * 100, 1) if total_count > 0 else 0.0
            results.append({
                'source': source_name,
                'count': count,
                'visits': count,
                'percentage': percentage
            })
            
        results.sort(key=lambda x: x['visits'], reverse=True)
            
        return Response({'sources': results})


from rest_framework.permissions import AllowAny
from django.core.cache import cache
from analytics.services.social import record_share_event, get_share_summary

class SocialShareTrackView(APIView):
    """
    GET /api/analytics/track/{portfolio_id}/
    Public endpoint to track dynamic platform sharing clicks.
    Silently discards bot requests and applies cache-based IP rate limits.
    """
    permission_classes = [AllowAny]

    def get(self, request, portfolio_id, *args, **kwargs):
        # 1. Fetch portfolio
        try:
            portfolio = Portfolio.objects.get(pk=portfolio_id)
        except Portfolio.DoesNotExist:
            return Response({'error': 'Portfolio not found'}, status=404)

        # 2. Rate limiting check (max 10 requests per IP per portfolio per hour)
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0].strip() if x_forwarded_for else request.META.get('REMOTE_ADDR', '')
        rate_key = f"rate_limit_share_{portfolio_id}_{ip}"
        
        req_count = cache.get(rate_key, 0)
        if req_count >= 10:
            return Response({'error': 'Too many share tracking requests. Please try again later.'}, status=429)
        cache.set(rate_key, req_count + 1, 3600)  # 1 hour expiration

        # 3. Record share event (filters bot inside service)
        record_share_event(portfolio, request)
        
        return Response(status=204)

    def post(self, request, portfolio_id, *args, **kwargs):
        return self.get(request, portfolio_id, *args, **kwargs)


class ShareSummaryView(APIView):
    """
    GET /api/analytics/shares/{portfolio_id}/
    Returns platform-specific sharing click metrics aggregated for the last N days.
    Owner-authenticated only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, portfolio_id, *args, **kwargs):
        # 1. Verify ownership
        try:
            portfolio = Portfolio.objects.get(pk=portfolio_id, user=request.user)
        except Portfolio.DoesNotExist:
            return Response({'error': 'Portfolio not found or permission denied'}, status=404)

        # 2. Get period days from query params (default 30 days)
        try:
            days = int(request.query_params.get('days', 30))
        except (ValueError, TypeError):
            days = 30

        # 3. Fetch summary
        summary = get_share_summary(portfolio, days=days)
        total = summary.pop('total', 0)

        return Response({
            'summary': summary,
            'total': total,
            'period_days': days
        })


class RecentRecordsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        events = PortfolioEvent.objects.all().order_by('-id')[:20]
        data = []
        for e in events:
            data.append({
                'id': e.id,
                'portfolio_id': e.portfolio_id,
                'event_type': e.event_type,
                'visitor_id': e.visitor_id,
                'duration': e.duration,
                'device': e.device,
                'country': e.country,
                'created_at': e.created_at.isoformat() if e.created_at else None,
                'source': e.source,
                'medium': e.medium,
                'campaign': e.campaign,
                'referrer': e.referrer,
                'utm_source': e.utm_source,
                'utm_medium': e.utm_medium,
                'utm_campaign': e.utm_campaign,
                'first_touch_source': e.first_touch_source,
                'first_touch_medium': e.first_touch_medium,
                'first_touch_campaign': e.first_touch_campaign,
                'last_touch_source': e.last_touch_source,
                'last_touch_medium': e.last_touch_medium,
                'last_touch_campaign': e.last_touch_campaign,
            })
        return Response(data)

