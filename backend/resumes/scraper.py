import re
import requests
from bs4 import BeautifulSoup
from django.conf import settings
from ai.services.ai_parser import parse_resume_with_ai

def scrape_portfolio_url(url: str) -> dict:
    """
    Scrapes a portfolio website (using requests/BS4 first, falling back to Playwright for dynamic SPAs).
    Extracts text, meta tags, and headings, and passes it to Gemini AI for resume structuring.
    """
    url = url.strip()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    # 1. Try static scraping first using requests
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }

    scraped_text = ""
    og_image = ""
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            html = response.text
            scraped_text, og_image = _parse_html_content(html)
    except Exception as e:
        print(f"[Scraper] Requests scrape failed: {e}")

    # 2. Check if we got enough content. If not (usually < 300 chars or empty), it's likely a SPA.
    # Fall back to Playwright.
    if len(scraped_text.strip()) < 300:
        print("[Scraper] SPA detected or static scrape empty. Falling back to Playwright...")
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(user_agent=headers['User-Agent'])
                page.goto(url, wait_until="networkidle", timeout=20000)
                
                # Wait additional 2 seconds for any client-side renders
                page.wait_for_timeout(2000)
                
                html = page.content()
                scraped_text, og_image_pw = _parse_html_content(html)
                if og_image_pw:
                    og_image = og_image_pw
                browser.close()
        except Exception as e:
            print(f"[Scraper] Playwright fallback failed: {e}")
            if not scraped_text:
                raise RuntimeError(f"Failed to fetch content from the URL: {str(e)}")

    if not scraped_text.strip():
        raise RuntimeError("No content could be extracted from this URL.")

    # 3. Call AI to structure the resume
    try:
        structured_data = parse_resume_with_ai(scraped_text)
        if not structured_data.get("profile_picture") and og_image:
            structured_data["profile_picture"] = og_image
        return structured_data
    except Exception as e:
        raise RuntimeError(f"AI parsing failed: {str(e)}")


def _parse_html_content(html_content: str) -> tuple[str, str]:
    """
    Parses HTML, extracts meta values, page title, images, and visible body text.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remove script and style elements
    for script in soup(["script", "style", "noscript", "svg", "header", "footer"]):
        script.decompose()

    extracted_parts = []

    # Get page title
    if soup.title and soup.title.string:
        extracted_parts.append(f"Page Title: {soup.title.string.strip()}")

    # Get meta description and og tags
    og_image = ""
    for meta in soup.find_all("meta"):
        name = meta.get("name", "").lower()
        prop = meta.get("property", "").lower()
        content = meta.get("content", "")
        
        if content:
            if name in ('description', 'author', 'keywords') or prop in ('og:title', 'og:description', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image'):
                extracted_parts.append(f"{name or prop}: {content.strip()}")
            if prop in ('og:image', 'twitter:image') and not og_image:
                og_image = content.strip()

    # Get visible text
    text = soup.get_text(separator=' ')
    # break into lines and remove leading and trailing space on each
    lines = (line.strip() for line in text.splitlines())
    # break multi-headlines into a line each
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    # drop blank lines
    body_text = '\n'.join(chunk for chunk in chunks if chunk)
    
    extracted_parts.append(body_text)
    
    return '\n'.join(extracted_parts), og_image
