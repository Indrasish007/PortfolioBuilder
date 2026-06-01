# backend/analytics/services/social.py

import datetime
import re
from django.utils import timezone
from django.db.models import Count
from analytics.models import SocialShareEvent

def is_bot(user_agent: str) -> bool:
    """Detects and filters known social preview crawler bots to protect analytics accuracy."""
    if not user_agent:
        return False
    ua = user_agent.lower()
    bot_keywords = [
        'linkedinbot', 'twitterbot', 'facebookexternalhit', 'whatsapp', 
        'discordbot', 'bot', 'crawler', 'spider', 'googlebot', 'bingbot'
    ]
    return any(kw in ua for kw in bot_keywords)


def detect_platform(referrer: str, user_agent: str) -> str:
    """Maps referrer URLs and user agent patterns to social platforms."""
    if not referrer:
        return 'direct'
        
    ref = referrer.lower()
    if 'linkedin.com' in ref or 'lnkd.in' in ref:
        return 'linkedin'
    if 't.co' in ref or 'twitter.com' in ref or 'x.com' in ref:
        return 'twitter'
    if 'wa.me' in ref or 'whatsapp.com' in ref or 'whatsapp' in ref:
        return 'whatsapp'
    if 'facebook.com' in ref or 'fb.me' in ref:
        return 'facebook'
    if 'discord.com' in ref or 'discordapp.com' in ref or 'discord' in ref:
        return 'discord'
        
    return 'other'


def record_share_event(portfolio, request):
    """
    Evaluates client user agent, filters bots, detects platforms, 
    and saves a share event.
    """
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    if is_bot(user_agent):
        return None
        
    referrer = request.META.get('HTTP_REFERER', '')
    platform = detect_platform(referrer, user_agent)
    
    event = SocialShareEvent.objects.create(
        portfolio=portfolio,
        platform=platform,
        referrer=referrer[:500] if referrer else None,
        user_agent=user_agent
    )
    return event


def get_share_summary(portfolio, days=30) -> dict:
    """
    Returns aggregated counts of click events by platform in the last N days.
    """
    cutoff = timezone.now() - datetime.timedelta(days=days)
    
    events = SocialShareEvent.objects.filter(
        portfolio=portfolio,
        clicked_at__gte=cutoff
    ).values('platform').annotate(count=Count('id'))
    
    summary = {
        'linkedin': 0,
        'twitter': 0,
        'whatsapp': 0,
        'facebook': 0,
        'discord': 0,
        'direct': 0,
        'other': 0,
    }
    
    total = 0
    for entry in events:
        plat = entry['platform']
        count = entry['count']
        if plat in summary:
            summary[plat] = count
            total += count
            
    summary['total'] = total
    return summary
