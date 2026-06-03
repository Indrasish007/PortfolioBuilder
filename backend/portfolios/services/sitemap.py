# backend/portfolios/services/sitemap.py

import datetime
import threading
import urllib.request
import re
from django.conf import settings
from urllib.parse import urljoin
from portfolios.models import Portfolio
from portfolios.services.seo import generate_canonical_url

def generate_sitemap_data():
    """
    Query all published portfolios and generate sitemap entries.
    Uses prefetch_related('skills') to prevent N+1 query patterns as requested.
    """
    portfolios = Portfolio.objects.filter(status='Published').prefetch_related('skills')
    
    entries = []
    for p in portfolios:
        lastmod = p.updated_at.strftime('%Y-%m-%d') if p.updated_at else None
        entries.append({
            "loc": generate_canonical_url(p),
            "lastmod": lastmod,
            "changefreq": "weekly",
            "priority": "0.8"
        })
    return entries


def generate_image_sitemap_entries():
    """
    For each published portfolio with a non-base64 profile image:
    {
      "loc": canonical_url,
      "image_loc": profile_image_url,
      "image_title": f"{name} — Professional Portfolio",
      "image_caption": headline or bio[:100]
    }
    """
    portfolios = Portfolio.objects.filter(status='Published').prefetch_related('skills')
    entries = []
    base_url = getattr(settings, 'SITE_BASE_URL', 'https://portfoliobuilder.com')

    for p in portfolios:
        image = getattr(p, 'avatar', None)
        profile = getattr(p.user, 'profile', None) if hasattr(p, 'user') else None
        if not image and profile:
            image = getattr(profile, 'avatar', None)
            
        if image:
            if hasattr(image, 'url'):
                img_url = image.url
            else:
                img_url = str(image)
                
            # Filter non-base64 images to prevent preview breakages
            if img_url and not img_url.startswith('data:'):
                if img_url.startswith('/'):
                    img_url = urljoin(base_url, img_url)
                    
                name = p.developer_name or getattr(p, 'name', '')
                headline = p.developer_title
                bio = p.developer_bio
                caption = headline if headline else (bio[:100] if bio else '')
                
                entries.append({
                    "loc": generate_canonical_url(p),
                    "image_loc": img_url,
                    "image_title": f"{name} — Professional Portfolio",
                    "image_caption": caption[:100] if caption else ""
                })
    return entries


def generate_sitemap_index_entries():
    """
    Returns entries for the sitemap index file referencing child sitemaps.
    """
    today = datetime.date.today().strftime('%Y-%m-%d')
    base_url = getattr(settings, 'SITE_BASE_URL', 'https://portfoliobuilder.com')
    return [
        { "loc": urljoin(base_url, "/sitemap-portfolios.xml"), "lastmod": today },
        { "loc": urljoin(base_url, "/sitemap-images.xml"),    "lastmod": today },
    ]


def ping_search_engines(canonical_url=None):
    """
    Sitemap pinging is deprecated by search engines (e.g. Google) and disabled
    here to optimize performance and prevent background thread freezing on Vercel.
    """
    pass
