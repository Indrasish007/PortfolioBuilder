from portfolios.models import Portfolio, PortfolioEvent, ProjectClick, PortfolioVisit
from django.db.models import Sum
from analytics.views import _score_portfolio

def generate_ai_insights(portfolio, analytics_data=None):
    insights = []
    
    # Pre-fetch projects if needed (or assume prefetched)
    projects = list(portfolio.projects.all())
    
    # 1. Top Project Heuristic
    if len(projects) > 0:
        clicks_counts = {proj.id: ProjectClick.objects.filter(project=proj).count() for proj in projects}
        total_clicks = sum(clicks_counts.values())
        top_project = max(projects, key=lambda proj: clicks_counts[proj.id])
        top_clicks = clicks_counts[top_project.id]
        
        if len(projects) == 1:
            if top_clicks >= 5:
                insights.append({
                    "type": "engagement",
                    "title": "Project Interest",
                    "message": f"Your project '{top_project.title}' is attracting interest with {top_clicks} clicks. Consider adding more projects to showcase your range.",
                    "priority": "medium"
                })
        else:
            other_clicks = [clicks_counts[proj.id] for proj in projects if proj.id != top_project.id]
            avg_other = sum(other_clicks) / len(other_clicks) if other_clicks else 0
            if top_clicks >= 3 and (avg_other == 0 or top_clicks >= 2 * avg_other):
                # Calculate multiplier
                mult = round(top_clicks / avg_other) if avg_other > 0 else top_clicks
                insights.append({
                    "type": "engagement",
                    "title": "Top Performing Project",
                    "message": f"Your '{top_project.title}' project receives {f'{mult}x ' if mult > 1 else ''}significantly more clicks than other projects. Consider featuring it more prominently.",
                    "priority": "high"
                })

    # 2. Mobile Audience Heuristic
    total_views = PortfolioEvent.objects.filter(portfolio=portfolio, event_type='view').count()
    if total_views >= 5:
        mobile_views = PortfolioEvent.objects.filter(portfolio=portfolio, event_type='view', device='Mobile').count()
        mobile_pct = round((mobile_views / total_views) * 100)
        if mobile_pct > 45:
            insights.append({
                "type": "audience",
                "title": "Mobile Audience Focus",
                "message": f"Most of your traffic ({mobile_pct}%) comes from mobile devices. Double-check that your layouts load quickly and look great on mobile.",
                "priority": "medium"
            })
        else:
            desktop_views = PortfolioEvent.objects.filter(portfolio=portfolio, event_type='view', device='Desktop').count()
            desktop_pct = round((desktop_views / total_views) * 100)
            if desktop_pct > 60:
                insights.append({
                    "type": "audience",
                    "title": "Desktop Dominance",
                    "message": f"Desktop users make up {desktop_pct}% of your visitors. Ensure your design leverages the screen space with sidebars or grid layouts.",
                    "priority": "low"
                })

    # 3. Visual Content Heuristic
    has_gallery = len(portfolio.gallery or []) > 0
    has_videos = len(portfolio.videos or []) > 0
    has_music = len(portfolio.music or []) > 0
    if has_gallery or has_videos or has_music:
        insights.append({
            "type": "content",
            "title": "Visual Engagement Boost",
            "message": "Visitors engage more with visual sections than text-only sections. Keep your portfolio gallery or media list fresh and up to date.",
            "priority": "medium"
        })
    else:
        insights.append({
            "type": "content",
            "title": "Add Visual Elements",
            "message": "Adding visual elements like a project gallery, videos, or music to your portfolio can boost visitor scroll depth and average view duration.",
            "priority": "low"
        })

    # 4. Geo Traffic Heuristic
    top_visit = PortfolioVisit.objects.filter(portfolio=portfolio).order_by('-visit_count').first()
    if top_visit and top_visit.visit_count >= 3 and top_visit.country_name.lower() != 'unknown':
        insights.append({
            "type": "geo",
            "title": "Global Reach",
            "message": f"Your portfolio is gaining traffic from {top_visit.country_name} ({top_visit.visit_count} visits). Tailor your project descriptions to international work trends.",
            "priority": "medium"
        })

    # 5. Portfolio Optimization Heuristic
    total_time = PortfolioEvent.objects.filter(portfolio=portfolio, event_type='session_time').aggregate(total=Sum('duration'))['total'] or 0
    session_count = PortfolioEvent.objects.filter(portfolio=portfolio, event_type='session_time').count()
    avg_time = round(total_time / session_count) if session_count > 0 else 0
    
    if portfolio.views >= 10 and avg_time > 0 and avg_time < 15:
        insights.append({
            "type": "optimization",
            "title": "Hook More Visitors",
            "message": f"Your average visitor duration is on the lower side ({avg_time}s). Try adding more interactive elements, thumbnails, or engaging taglines to grab attention.",
            "priority": "high"
        })
    elif portfolio.views >= 5 and len(projects) == 0:
        insights.append({
            "type": "optimization",
            "title": "Missing Case Studies",
            "message": "Your portfolio is receiving views but contains no projects. Add your projects immediately to capitalize on visitor interest.",
            "priority": "high"
        })

    # 6. Consistency Heuristic
    score_data = _score_portfolio(portfolio)
    score = score_data.get('score', 0)
    if score >= 80:
        insights.append({
            "type": "consistency",
            "title": "Portfolio Optimization Peak",
            "message": f"Your portfolio is highly competitive and well-optimized ({score}/100 completeness score). It is ready for professional applications!",
            "priority": "medium"
        })

    # 7. Fallback Heuristic for Low-Data Portfolios (ensures we always have enough premium insights)
    if len(insights) < 3:
        insights.append({
            "type": "optimization",
            "title": "Real-time AI Analysis",
            "message": "Your portfolio analytics tracker is active! Share your link to start gathering behavioral insight reports.",
            "priority": "medium"
        })
        insights.append({
            "type": "engagement",
            "title": "Job Readiness Tracking",
            "message": "We will evaluate your project clicks and resume downloads to determine visitor conversion once traffic arrives.",
            "priority": "low"
        })

    # Sort priorities: High first, then Medium, then Low
    priority_order = {"high": 3, "medium": 2, "low": 1}
    insights.sort(key=lambda x: priority_order.get(x["priority"], 1), reverse=True)
    
    # Return top 3-5 insights
    return insights[:5]
