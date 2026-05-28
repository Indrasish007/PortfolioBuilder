import re
import requests
from bs4 import BeautifulSoup
from django.conf import settings
from ai.services.ai_parser import parse_resume_with_ai


def scrape_portfolio_url(url: str) -> dict:
    """
    Scrapes an EXTERNAL portfolio website and feeds the content to Gemini AI
    for resume structuring.

    Strategy:
    1. Try a static HTTP GET (fast, works for SSR pages).
    2. If we got < 300 chars, try Playwright for JS-rendered SPAs.
    3. Pass whatever text we managed to collect to Gemini.
    4. If we still have very little content, return what Gemini could infer
       plus a `_partial: True` flag so the frontend can warn the user.

    NOTE: This function is ONLY called for external URLs.
    Own-portfolio URLs are handled via direct DB lookup in views.py.
    """
    url = url.strip()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/120.0.0.0 Safari/537.36'
        ),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }

    scraped_text = ''
    og_image = ''
    fetch_error = None

    # ── 1. Static scrape ──────────────────────────────────────────────────
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            html = response.text
            scraped_text, og_image = _parse_html_content(html)
        else:
            fetch_error = f'HTTP {response.status_code}'
    except Exception as e:
        fetch_error = str(e)
        print(f'[Scraper] Requests scrape failed: {e}')

    # ── 2. Playwright fallback for SPAs ───────────────────────────────────
    if len(scraped_text.strip()) < 300:
        print('[Scraper] Static content too short — trying Playwright…')
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(user_agent=headers['User-Agent'])
                page.goto(url, wait_until='networkidle', timeout=25000)
                page.wait_for_timeout(2500)   # extra render time
                html = page.content()
                pw_text, pw_img = _parse_html_content(html)
                if len(pw_text.strip()) > len(scraped_text.strip()):
                    scraped_text = pw_text
                if pw_img and not og_image:
                    og_image = pw_img
                browser.close()
        except Exception as e:
            print(f'[Scraper] Playwright fallback failed: {e}')

    # ── 3. Decide whether to proceed or fail ─────────────────────────────
    is_partial = len(scraped_text.strip()) < 300

    if not scraped_text.strip():
        # Nothing at all — hard fail with a helpful message
        raise RuntimeError(
            'Could not fetch content from this URL. '
            'The page may be behind authentication or block automated access. '
            'Please fill in your details manually.'
        )

    # ── 4. Gemini AI extraction ───────────────────────────────────────────
    try:
        structured_data = parse_resume_with_ai(scraped_text)
        if not structured_data.get('profile_picture') and og_image:
            structured_data['profile_picture'] = og_image
        # Tag partial results so the frontend can warn the user
        if is_partial:
            structured_data['_partial'] = True
            structured_data['_partial_message'] = (
                'Only partial data could be fetched from this external link '
                '(the page may be JavaScript-rendered). '
                'Please review and fill in any missing fields manually.'
            )
        else:
            structured_data['_source'] = 'external'
        return structured_data
    except Exception as e:
        raise RuntimeError(f'AI parsing failed: {str(e)}')


def _parse_html_content(html_content: str) -> tuple[str, str]:
    """
    Parses HTML and returns (visible_text, og_image_url).
    Strips scripts, styles, navbars and footers to reduce noise.
    """
    soup = BeautifulSoup(html_content, 'html.parser')

    # Remove noisy / non-content elements
    for tag in soup(['script', 'style', 'noscript', 'svg', 'nav', 'header', 'footer', 'iframe']):
        tag.decompose()

    extracted_parts = []

    # Page title
    if soup.title and soup.title.string:
        extracted_parts.append(f'Page Title: {soup.title.string.strip()}')

    # Meta tags (description, author, OG/Twitter)
    og_image = ''
    for meta in soup.find_all('meta'):
        name = meta.get('name', '').lower()
        prop = meta.get('property', '').lower()
        content = (meta.get('content') or '').strip()

        if not content:
            continue

        if name in ('description', 'author', 'keywords') or \
                prop in ('og:title', 'og:description', 'og:image',
                         'twitter:title', 'twitter:description', 'twitter:image'):
            extracted_parts.append(f'{name or prop}: {content}')

        if prop in ('og:image', 'twitter:image') and not og_image:
            og_image = content

    # Visible body text
    raw_text = soup.get_text(separator=' ')
    lines = (line.strip() for line in raw_text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split('  '))
    body_text = '\n'.join(chunk for chunk in chunks if chunk)
    extracted_parts.append(body_text)

    return '\n'.join(extracted_parts), og_image
