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
    if 'linkedin.com' in ref or 'lnkd.in' in ref or 'utm_source=linkedin' in ref:
        return 'linkedin'
    if 't.co' in ref or 'twitter.com' in ref or 'x.com' in ref or 'utm_source=twitter' in ref or 'utm_source=x' in ref:
        return 'twitter'
    if 'wa.me' in ref or 'whatsapp.com' in ref or 'whatsapp' in ref or 'utm_source=whatsapp' in ref:
        return 'whatsapp'
    if 'facebook.com' in ref or 'fb.me' in ref or 'utm_source=facebook' in ref or 'utm_source=fb' in ref:
        return 'facebook'
    if 'discord.com' in ref or 'discordapp.com' in ref or 'discord' in ref or 'utm_source=discord' in ref:
        return 'discord'
        
    return 'other'


def record_share_event(portfolio, request):
    """
    Evaluates client user agent, filters bots, detects platforms, 
    and saves a share event with complete attribution data.
    """
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    if is_bot(user_agent):
        return None

    import json as _json, sys
    data = {}
    
    # Try parsing request.data or request.body (handles JSON and text/plain)
    try:
        from rest_framework.request import Request
        if isinstance(request, Request):
            data = request.data
        else:
            if hasattr(request, 'body') and request.body:
                data = request.body
    except Exception:
        pass

    if isinstance(data, (bytes, str)):
        try:
            if isinstance(data, bytes):
                data = data.decode('utf-8')
            data = _json.loads(data)
        except Exception:
            data = {}
    elif not data:
        try:
            if hasattr(request, 'body') and request.body:
                data = _json.loads(request.body)
        except Exception:
            data = {}

    if not isinstance(data, dict):
        data = {}

    referrer = data.get('referrer') or request.META.get('HTTP_REFERER', '')
    platform = detect_platform(referrer, user_agent)

    # Fallback platform mapping from parsed UTMs
    utm_source = data.get('utm_source') or data.get('source') or ''
    if platform in ('direct', 'other') and utm_source:
        utm_s_lower = utm_source.lower()
        if 'linkedin' in utm_s_lower:
            platform = 'linkedin'
        elif utm_s_lower in ('twitter', 'x', 'x.com', 't.co'):
            platform = 'twitter'
        elif 'whatsapp' in utm_s_lower:
            platform = 'whatsapp'
        elif 'facebook' in utm_s_lower or utm_s_lower == 'fb':
            platform = 'facebook'
        elif 'discord' in utm_s_lower:
            platform = 'discord'

    # End-to-end debugging logs
    print(f"\n[Analytics EVENT] Received social share landing/beacon", file=sys.stderr)
    print(f"  Referrer: {referrer}", file=sys.stderr)
    print(f"  Detected Platform: {platform}", file=sys.stderr)
    print(f"  Parsed UTM: source={data.get('utm_source')}, medium={data.get('utm_medium')}, campaign={data.get('utm_campaign')}", file=sys.stderr)
    print(f"  First-touch: source={data.get('first_touch_source')}, medium={data.get('first_touch_medium')}, campaign={data.get('first_touch_campaign')}", file=sys.stderr)
    print(f"  Last-touch: source={data.get('last_touch_source')}, medium={data.get('last_touch_medium')}, campaign={data.get('last_touch_campaign')}", file=sys.stderr)
    print(f"  Final Payload: {data}", file=sys.stderr)

    event = SocialShareEvent.objects.create(
        portfolio=portfolio,
        platform=platform,
        referrer=referrer[:500] if referrer else None,
        user_agent=user_agent,
        source=data.get('source') or 'Direct',
        medium=data.get('medium'),
        campaign=data.get('campaign'),
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
    
    print(f"  Database Saved: SocialShareEvent ID={event.id}, source={event.source}, platform={platform}", file=sys.stderr, flush=True)
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
