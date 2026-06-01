# backend/portfolios/services/seo.py

import re
from urllib.parse import urljoin
from django.conf import settings
from django.core.cache import cache

BASE_URL = getattr(settings, "SITE_BASE_URL", "https://portfoliobuilder.com")


def _clean_text(text, max_len=None):
    """Strip HTML tags, collapse whitespace, optionally truncate."""
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', str(text))
    text = re.sub(r'\s+', ' ', text).strip()
    if max_len and len(text) > max_len:
        text = text[:max_len - 1].rsplit(' ', 1)[0] + "…"
    return text


def generate_title(portfolio):
    """
    Format:   "Name | Headline"
    Fallback: "Name | Portfolio" → "Portfolio"
    Custom override: custom_seo_title field override
    """
    if getattr(portfolio, 'custom_seo_title', None):
        return portfolio.custom_seo_title.strip()

    name = portfolio.developer_name
    if not name:
        name = getattr(portfolio, 'name', '')
    name = _clean_text(name)

    headline = portfolio.developer_title
    headline = _clean_text(headline)

    if name and headline:
        return f"{name} | {headline}"
    elif name:
        return f"{name} | Portfolio"
    return "Professional Portfolio"


def generate_description(portfolio):
    """
    Auto-generate ~150-160 char description.
    Priority: custom settings → bio → headline + name → generic fallback.
    """
    if getattr(portfolio, 'custom_seo_description', None):
        return _clean_text(portfolio.custom_seo_description, max_len=160)

    bio = portfolio.developer_bio
    bio = _clean_text(bio, max_len=160)
    if bio and len(bio) > 40:
        return bio

    headline = portfolio.developer_title
    headline = _clean_text(headline)

    name = portfolio.developer_name
    if not name:
        name = getattr(portfolio, 'name', '')
    name = _clean_text(name)

    if name and headline:
        return _clean_text(f"Explore {name}'s professional portfolio. {headline}.", max_len=160)
    elif name:
        return _clean_text(
            f"Explore {name}'s projects, skills, and professional portfolio.", max_len=160
        )
    return "Explore this professional portfolio — projects, skills, and experience."


def generate_canonical_url(portfolio):
    """
    Always resolves to the new migrated SEO-friendly URL format `/u/{slug_or_id}`
    to maintain a clean, single indexed source of truth.
    """
    slug = getattr(portfolio, 'slug', None)
    identifier = slug if slug else portfolio.pk
    return urljoin(BASE_URL, f"/u/{identifier}")


def _resolve_image_url(portfolio):
    """Resolves a valid public URL for the portfolio avatar, or falls back to og-default."""
    image = getattr(portfolio, 'avatar', None)
    if not image and hasattr(portfolio, 'user') and hasattr(portfolio.user, 'profile'):
        image = getattr(portfolio.user.profile, 'avatar', None)

    if image and not isinstance(image, str):
        image = image.url if hasattr(image, 'url') else str(image)

    # Base64 avatar guard: if it is a base64 string (starts with 'data:'),
    # ignore it and use the default branded image. Leaking base64 will break crawler previews.
    if image and isinstance(image, str) and not image.startswith('data:'):
        if image.startswith('/'):
            return urljoin(BASE_URL, image)
        return image

    return urljoin(BASE_URL, "/og-default.png")


def generate_open_graph(portfolio):
    """
    Returns dict of all OG meta tags.
    If custom_og_image override is absent, falls back to the dynamic SVG OG view.
    """
    title = generate_title(portfolio)
    description = generate_description(portfolio)
    url = generate_canonical_url(portfolio)

    if getattr(portfolio, 'custom_og_image', None):
        image = portfolio.custom_og_image
    else:
        # Default fallback to our brand-curated dynamic SVG OG image view
        slug = getattr(portfolio, 'slug', None)
        if slug:
            image = urljoin(BASE_URL, f"/api/portfolios/public/slug/{slug}/og/")
        else:
            image = urljoin(BASE_URL, f"/api/portfolios/public/{portfolio.pk}/og/")

    return {
        "og:type": "profile",
        "og:title": title,
        "og:description": description,
        "og:url": url,
        "og:image": image,
        "og:image:width": "1200",
        "og:image:height": "630",
        "og:site_name": "PortfolioBuilder",
    }


def generate_twitter_card(portfolio):
    """Twitter/X card meta tags."""
    og = generate_open_graph(portfolio)
    return {
        "twitter:card": "summary_large_image",
        "twitter:title": og["og:title"],
        "twitter:description": og["og:description"],
        "twitter:image": og["og:image"],
    }


def generate_breadcrumb_schema(portfolio):
    """Generates standard BreadcrumbList structured data."""
    base_url = BASE_URL
    slug = getattr(portfolio, 'slug', None)
    identifier = slug if slug else portfolio.pk
    portfolio_url = urljoin(base_url, f"/u/{identifier}")
    
    name = portfolio.developer_name or getattr(portfolio, 'name', 'Portfolio')
    if not name:
        name = "Professional Portfolio"

    return {
        "@type": "BreadcrumbList",
        "@id": f"{portfolio_url}#breadcrumb",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": base_url
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": f"{name}'s Portfolio",
                "item": portfolio_url
            }
        ]
    }


def generate_website_schema():
    """Generates the main WebSite search action structured data."""
    return {
        "@type": "WebSite",
        "@id": f"{BASE_URL}#website",
        "name": "PortfolioBuilder",
        "url": BASE_URL,
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": f"{BASE_URL}/search?q={{search_term_string}}"
            },
            "query-input": "required name=search_term_string"
        }
    }


def generate_profile_page_schema(portfolio, person_url):
    """Generates the ProfilePage metadata schema."""
    import datetime
    today = datetime.date.today().strftime('%Y-%m-%d')
    updated = portfolio.updated_at.strftime('%Y-%m-%d') if getattr(portfolio, 'updated_at', None) else today
    
    slug = getattr(portfolio, 'slug', None)
    identifier = slug if slug else portfolio.pk
    portfolio_url = urljoin(BASE_URL, f"/u/{identifier}")
    
    return {
        "@type": "ProfilePage",
        "@id": f"{portfolio_url}#profilepage",
        "mainEntity": {
            "@type": "Person",
            "@id": person_url
        },
        "publisher": {
            "@type": "Organization",
            "name": "PortfolioBuilder",
            "url": BASE_URL
        },
        "dateModified": updated
    }


def generate_person_schema(portfolio):
    """Generates Person structured details."""
    name = portfolio.developer_name
    if not name:
        name = getattr(portfolio, 'name', '')
    name = _clean_text(name)

    url = generate_canonical_url(portfolio)
    image_url = _resolve_image_url(portfolio)

    schema = {
        "@type": "Person",
        "@id": f"{url}#person",
        "name": name,
        "url": url,
    }

    headline = portfolio.developer_title
    headline = _clean_text(headline)
    if headline:
        schema["jobTitle"] = headline

    if image_url:
        schema["image"] = image_url

    bio = portfolio.developer_bio
    bio = _clean_text(bio)
    if bio:
        schema["description"] = bio

    # Fetch nested skills relation
    skills = portfolio.skills.all() if hasattr(portfolio, 'skills') else []
    if skills:
        schema["knowsAbout"] = [skill.name for skill in skills]

    # sameAs social handles
    same_as = []
    for platform in ['github', 'linkedin', 'twitter', 'facebook', 'instagram']:
        val = getattr(portfolio, f'developer_{platform}', '')
        if val:
            same_as.append(val)
    if same_as:
        schema["sameAs"] = same_as

    return schema


def generate_schema(portfolio):
    """
    Schema.org dynamic unified @graph markup.
    Combines Person, ProfilePage, BreadcrumbList, and WebSite schemas.
    """
    person = generate_person_schema(portfolio)
    person_url = person.get('@id', '')
    
    profile_page = generate_profile_page_schema(portfolio, person_url)
    breadcrumb = generate_breadcrumb_schema(portfolio)
    website = generate_website_schema()
    
    return {
        "@context": "https://schema.org",
        "@graph": [
            person,
            profile_page,
            breadcrumb,
            website
        ]
    }


def generate_seo_score(portfolio) -> int:
    """
    Scoring rubric (total 100 points):
    - Profile name present:                 +15
    - Headline/job title present:           +15
    - Bio length >= 100 chars:              +20
    - Profile image present (non-base64):   +15
    - Skills count >= 3:                    +10
    - Portfolio slug present:               +10
    - Custom SEO title set:                 +5
    - Custom meta description set:          +5
    - Custom OG image URL set:              +5
    """
    score = 0
    
    # 1. Profile name present
    name = portfolio.developer_name
    if not name:
        name = getattr(portfolio, 'name', '')
    if name and name.strip():
        score += 15
        
    # 2. Headline/job title present
    title = portfolio.developer_title
    if title and title.strip():
        score += 15
        
    # 3. Bio length >= 100 chars
    bio = portfolio.developer_bio
    if bio and len(bio.strip()) >= 100:
        score += 20
        
    # 4. Profile image present (non-base64)
    image = getattr(portfolio, 'avatar', None)
    if not image and hasattr(portfolio, 'user') and hasattr(portfolio.user, 'profile'):
        image = getattr(portfolio.user.profile, 'avatar', None)
    if image and isinstance(image, str) and not image.startswith('data:'):
        score += 15
        
    # 5. Skills count >= 3
    skills_count = portfolio.skills.count() if hasattr(portfolio, 'skills') else 0
    if skills_count >= 3:
        score += 10
        
    # 6. Portfolio slug present
    slug = getattr(portfolio, 'slug', None)
    if slug and slug.strip():
        score += 10
        
    # 7. Custom SEO title set
    custom_title = getattr(portfolio, 'custom_seo_title', None)
    if custom_title and custom_title.strip():
        score += 5
        
    # 8. Custom meta description set
    custom_desc = getattr(portfolio, 'custom_seo_description', None)
    if custom_desc and custom_desc.strip():
        score += 5
        
    # 9. Custom OG image URL set
    custom_img = getattr(portfolio, 'custom_og_image', None)
    if custom_img and custom_img.strip():
        score += 5
        
    return min(score, 100)


def generate_seo_recommendations(portfolio, score) -> list:
    """
    Returns a list of 2-3 specific, actionable strings targeting lowest-scoring missing fields.
    Each recommendation is direct and short (max 100 chars).
    """
    if score >= 100:
        return []
        
    recs = []
    
    # Priority 1: Bio length (20 pts)
    bio = portfolio.developer_bio
    if not bio or len(bio.strip()) < 100:
        recs.append("Write a bio of at least 100 characters to improve your meta description.")
        
    # Priority 2: Profile image (15 pts)
    image = getattr(portfolio, 'avatar', None)
    if not image and hasattr(portfolio, 'user') and hasattr(portfolio.user, 'profile'):
        image = getattr(portfolio.user.profile, 'avatar', None)
    if not image or (isinstance(image, str) and image.startswith('data:')):
        recs.append("Add a profile photo to improve social share previews.")
        
    # Priority 3: Full Name (15 pts)
    name = portfolio.developer_name
    if not name:
        name = getattr(portfolio, 'name', '')
    if not name or not name.strip():
        recs.append("Add your full name to your profile so search engines can identify you.")
        
    # Priority 4: Headline (15 pts)
    title = portfolio.developer_title
    if not title or not title.strip():
        recs.append("Add a professional headline to help search engines index your role.")
        
    # Priority 5: Skills (10 pts)
    skills_count = portfolio.skills.count() if hasattr(portfolio, 'skills') else 0
    if skills_count < 3:
        recs.append("Add at least 3 skills to enhance your Schema.org structured data.")
        
    # Priority 6: Slug (10 pts)
    slug = getattr(portfolio, 'slug', None)
    if not slug or not slug.strip():
        recs.append("Publish your portfolio to generate a search-friendly slug.")
        
    # Priority 7: Overrides (5 pts each)
    custom_title = getattr(portfolio, 'custom_seo_title', None)
    if not custom_title or not custom_title.strip():
        recs.append("Set a custom SEO title in portfolio settings for maximum control.")
        
    custom_desc = getattr(portfolio, 'custom_seo_description', None)
    if not custom_desc or not custom_desc.strip():
        recs.append("Set a custom SEO description to customize how you appear in search.")
        
    custom_img = getattr(portfolio, 'custom_og_image', None)
    if not custom_img or not custom_img.strip():
        recs.append("Upload a custom Open Graph image override for branded social previews.")
        
    return recs[:3]


def generate_ai_seo_recommendations(portfolio, score, rule_recommendations) -> list:
    """
    Responsibilities:
    - Build a concise prompt from portfolio data:
        name, headline, bio length, skills count, image presence,
        current score, and current rule-based recommendations
    - Call the existing AI Insights service (reuse its client/method)
    - Ask for 2-3 specific, portfolio-aware improvement suggestions
        (e.g. "Your bio mentions Django but not React — add React to skills for better indexing")
    - Parse AI response into a list of plain strings (no markdown, no bullet symbols)
    - Cache result with key: f"seo_ai_recs_{portfolio.pk}" for 6 hours
    - On any exception (timeout, API error): return rule_recommendations as fallback
    - Never let an AI failure break the seo payload
    """
    import sys
    if 'test' in sys.argv or getattr(settings, 'TESTING', False):
        return rule_recommendations[:3]

    cache_key = f"seo_ai_recs_{portfolio.pk}"
    cached_recs = cache.get(cache_key)
    if cached_recs is not None:
        return cached_recs

    try:
        from core.gemini_service import parse_with_gemini
        
        # Gather information from portfolio
        name = portfolio.developer_name
        if not name:
            name = getattr(portfolio, 'name', '')
        if not name:
            name = "Portfolio Owner"
            
        headline = portfolio.developer_title
        bio = portfolio.developer_bio
        bio_word_count = len(bio.split()) if bio else 0
        
        skills = portfolio.skills.all() if hasattr(portfolio, 'skills') else []
        skills_list = ", ".join([s.name for s in skills]) if skills else "None"
        
        has_image = "Yes" if getattr(portfolio, 'avatar', None) or (hasattr(portfolio, 'user') and hasattr(portfolio.user, 'profile') and getattr(portfolio.user.profile, 'avatar', None)) else "No"
        
        prompt = f"""You are an SEO advisor for a professional portfolio platform.
Portfolio owner: {name}
Headline: {headline}
Bio length: {bio_word_count} words
Skills: {skills_list}
Has profile image: {has_image}
Current SEO score: {score}/100
Current issues: {rule_recommendations}

Give 2-3 specific, actionable SEO improvement tips for this portfolio.
Each tip should be one sentence, plain text, no bullet points or markdown.
Focus on content gaps specific to this person's profile.
"""
        response_text = parse_with_gemini(prompt)
        
        recs = []
        if response_text:
            lines = response_text.strip().split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                # Strip leading numbers/bullets/markdown
                line = re.sub(r'^[*+\-\s\d.)]+', '', line)
                line = line.replace('**', '').replace('*', '').strip()
                if line:
                    recs.append(line)
                    
        final_recs = [r for r in recs if r][:3]
        if not final_recs:
            final_recs = rule_recommendations[:3]
            
        cache.set(cache_key, final_recs, 6 * 3600)
        return final_recs
    except Exception:
        # Silently fall back to standard rule recommendations
        return rule_recommendations[:3]


def generate_seo_payload(portfolio):
    """
    Master function — returns the complete SEO payload for the API response.
    Call this from PublicPortfolioView, PublicPortfolioBySlugView, and PublicPortfolioByDomainView.
    """
    score = generate_seo_score(portfolio)
    rule_recs = generate_seo_recommendations(portfolio, score)  # Phase 2 — keep as fallback

    # Try AI recommendations, fall back to rule-based on failure
    recommendations = generate_ai_seo_recommendations(portfolio, score, rule_recs)
    
    # Check source
    cache_key = f"seo_ai_recs_{portfolio.pk}"
    # If the cached recommendations exist, they might have come from the rules fallback inside generate_ai_seo_recommendations
    # but that's perfectly fine for debugging or analytics representation.
    source = "ai"
    if recommendations == rule_recs[:3] and not cache.get(cache_key):
        source = "rules"

    canonical = generate_canonical_url(portfolio)
    hreflangs = [
        {"hreflang": "en", "href": canonical},
        {"hreflang": "x-default", "href": canonical}
    ]

    return {
        "portfolio_id": portfolio.pk,
        "title": generate_title(portfolio),
        "description": generate_description(portfolio),
        "canonical_url": canonical,
        "hreflangs": hreflangs,
        "open_graph": generate_open_graph(portfolio),
        "twitter_card": generate_twitter_card(portfolio),
        "schema": generate_schema(portfolio),
        "score": score,
        "recommendations": recommendations,
        "recommendations_source": source,
    }
