from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import datetime
from django.utils import timezone
from django.db.models import Count, Sum
from portfolios.models import Portfolio, PortfolioEvent, Project

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        portfolios = Portfolio.objects.filter(user=user)
        
        # Last 14 days range
        today = timezone.localdate()
        date_list = [today - datetime.timedelta(days=i) for i in range(13, -1, -1)]
        
        # 1. Views and Visitors over time (per day)
        views_chart = []
        visitors_chart = []
        
        for d in date_list:
            day_str = d.strftime('%b %d') # e.g. "May 19"
            
            # Views count on day d
            day_views = PortfolioEvent.objects.filter(
                portfolio__in=portfolios,
                event_type='view',
                created_at__date=d
            ).count()
            
            # Visitors count on day d (distinct visitor_ids)
            day_visitors = PortfolioEvent.objects.filter(
                portfolio__in=portfolios,
                created_at__date=d
            ).values('visitor_id').distinct().count()
            
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

        # 3. Countries — count only actual page views, not pings or downloads
        country_counts = PortfolioEvent.objects.filter(
            portfolio__in=portfolios,
            event_type='view',
            created_at__date__gte=today - datetime.timedelta(days=13)
        ).values('country').annotate(visits=Count('id')).order_by('-visits')[:10]
        
        countries_data = []
        for item in country_counts:
            if item['country']:  # skip blank/null country values
                countries_data.append({"country": item['country'], "visits": item['visits']})
        
        if not countries_data:
            countries_data = [
                {"country": "India", "visits": 0}
            ]

        # 4. Total views, visitors, and downloads in last 14 days
        total_views = PortfolioEvent.objects.filter(
            portfolio__in=portfolios,
            event_type='view',
            created_at__date__gte=today - datetime.timedelta(days=13)
        ).count()

        total_visitors = PortfolioEvent.objects.filter(
            portfolio__in=portfolios,
            created_at__date__gte=today - datetime.timedelta(days=13)
        ).values('visitor_id').distinct().count()

        downloads = PortfolioEvent.objects.filter(
            portfolio__in=portfolios,
            event_type='resume_download',
            created_at__date__gte=today - datetime.timedelta(days=13)
        ).count()

        # 5. Average session duration
        pings = PortfolioEvent.objects.filter(
            portfolio__in=portfolios,
            event_type='session_ping',
            created_at__date__gte=today - datetime.timedelta(days=13)
        )
        avg_session = 0
        if pings.exists():
            total_duration = pings.aggregate(Sum('duration'))['duration__sum'] or 0
            distinct_pingers = pings.values('visitor_id').distinct().count()
            avg_session = total_duration / max(1, distinct_pingers)

        # 6. Suggestions
        suggestions = []
        if total_views > 0:
            download_ratio = downloads / total_views
            if download_ratio < 0.05:
                suggestions.append("Your resume download rate is low (under 5%). Try adding a prominent resume download button to the header.")
            else:
                suggestions.append("Great resume download rate! Keep your resume file updated with your latest contact details.")
        else:
            suggestions.append("Once visitors view your portfolio, we will check your resume download conversion rate.")

        if avg_session > 0:
            if avg_session < 30:
                suggestions.append(f"Average session duration is low ({int(avg_session)}s). Consider placing your best featured projects higher up.")
            else:
                suggestions.append(f"Strong engagement! Average session is {int(avg_session)}s. Add a clean call-to-action at the end of the page.")
        else:
            suggestions.append("No active sessions detected yet. Share your portfolio links to start gathering session duration insights.")

        mobile_val = next((d['value'] for d in devices_data if d['name'] == 'Mobile'), 0)
        if mobile_val > 40:
            suggestions.append(f"Over {mobile_val}% of your traffic is mobile. Ensure all your uploaded gallery images load fast on mobile devices.")
        else:
            suggestions.append("Desktop users form the majority of your traffic. Ensure your portfolio layout looks wide and spacious.")

        data = {
            "views": views_chart,
            "visitors": visitors_chart,
            "devices": devices_data,
            "countries": countries_data,
            "downloads": downloads,
            "total_views": total_views,
            "total_visitors": total_visitors,
            "avg_session": int(avg_session),
            "suggestions": suggestions,
        }
        return Response(data)


class ProjectClicksSummaryView(APIView):
    """Returns all projects across the user's portfolios sorted by portfolio view count."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        portfolios = Portfolio.objects.filter(user=user).prefetch_related('projects')

        results = []
        for portfolio in portfolios:
            # Count actual tracked views from PortfolioEvent as click metric
            view_count = PortfolioEvent.objects.filter(
                portfolio=portfolio,
                event_type='view'
            ).count()

            for project in portfolio.projects.all():
                results.append({
                    'project_id': project.id,
                    'project_title': project.title,
                    'project_description': (project.description or '')[:120],
                    'portfolio_id': portfolio.id,
                    'portfolio_name': portfolio.name,
                    'portfolio_slug': portfolio.slug or str(portfolio.id),
                    'portfolio_url': f'/p/{portfolio.slug}' if portfolio.slug else f'/p/{portfolio.id}',
                    'click_count': view_count,
                    'github': project.github or '',
                    'live': project.live or '',
                    'tech': project.tech or [],
                    'featured': project.featured,
                    'image': project.image or '',
                })

        # Sort by click_count descending, then featured projects first on ties
        results.sort(key=lambda x: (x['click_count'], x['featured']), reverse=True)

        badge_count = sum(1 for r in results if r['click_count'] > 0)

        return Response({
            'projects': results,
            'badge_count': badge_count,
            'total_projects': len(results),
        })
