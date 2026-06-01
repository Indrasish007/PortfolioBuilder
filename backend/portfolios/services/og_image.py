# backend/portfolios/services/og_image.py

import html

def generate_dynamic_og_image(portfolio) -> str:
    """
    Generates a high-fidelity dynamic SVG Open Graph preview image (1200x630).
    Uses brand-curated dark background, glowing mesh accents, vector grids, 
    and crisp typography. Completely self-contained, no binary C-dependencies.
    """
    profile = getattr(portfolio.user, 'profile', None) if hasattr(portfolio, 'user') else None
    
    # Resolve Name
    name = profile.name if profile else None
    if not name:
        name = getattr(portfolio.user, 'first_name', '') + ' ' + getattr(portfolio.user, 'last_name', '')
    name = name.strip()
    if not name or name == ' ':
        name = getattr(portfolio, 'name', 'Professional')
        
    # Resolve Headline
    headline = profile.title if profile else None
    if not headline:
        headline = "Professional Portfolio"
        
    # Resolve Skills
    skills = portfolio.skills.all()[:5] if hasattr(portfolio, 'skills') else []
    skills_text = "  ·  ".join([s.name for s in skills]) if skills else ""
    
    # Escape SVG special characters to prevent XML parsing breakages
    name_esc = html.escape(name)
    headline_esc = html.escape(headline)
    skills_esc = html.escape(skills_text)

    svg_content = f"""<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Deep premium dark space background -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#070a13" />
    </linearGradient>
    
    <!-- Neon visual accents -->
    <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>

    <!-- Glassmorphic card overlay -->
    <linearGradient id="card-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02" />
    </linearGradient>

    <!-- Glowing mesh sphere filters -->
    <filter id="glow-blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="90" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Rect -->
  <rect width="1200" height="630" fill="url(#bg-grad)" />

  <!-- Ambient glowing spheres -->
  <circle cx="1080" cy="120" r="220" fill="#6366f1" fill-opacity="0.22" filter="url(#glow-blur)" />
  <circle cx="820" cy="480" r="180" fill="#06b6d4" fill-opacity="0.18" filter="url(#glow-blur)" />

  <!-- Abstract vector technical grid lines -->
  <path d="M 0,105 L 1200,105 M 0,210 L 1200,210 M 0,315 L 1200,315 M 0,420 L 1200,420 M 0,525 L 1200,525" stroke="#ffffff" stroke-opacity="0.02" stroke-width="1" />
  <path d="M 200,0 L 200,630 M 400,0 L 400,630 M 600,0 L 600,630 M 800,0 L 800,630 M 1000,0 L 1000,630" stroke="#ffffff" stroke-opacity="0.02" stroke-width="1" />

  <!-- Elegant outer glassmorphic card border -->
  <rect x="60" y="60" width="1080" height="510" rx="36" fill="url(#card-grad)" stroke="#ffffff" stroke-opacity="0.09" stroke-width="1.5" />

  <!-- Branded watermark group -->
  <g transform="translate(120, 130)">
    <rect width="44" height="44" rx="12" fill="url(#accent-grad)" />
    <text x="16" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" font-size="24" font-weight="900" fill="#ffffff">P</text>
    <text x="60" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" font-size="22" font-weight="800" fill="#ffffff" letter-spacing="1">PortfolioBuilder</text>
    <text x="270" y="29" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" font-size="11" font-weight="800" fill="#818cf8" letter-spacing="2.5" text-transform="uppercase" fill-opacity="0.8">AI Builder</text>
  </g>

  <!-- Accent visual horizontal divider bar -->
  <rect x="120" y="320" width="260" height="6" rx="3" fill="url(#accent-grad)" />

  <!-- Main Owner Name -->
  <text x="120" y="285" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" font-size="68" font-weight="900" fill="#ffffff" letter-spacing="-1.5">{name_esc}</text>
  
  <!-- Headline / Role -->
  <text x="120" y="375" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" font-size="28" font-weight="600" fill="#f1f5f9">{headline_esc}</text>
  
  <!-- Pre-fetched dynamic Skills -->
  {f'<text x="120" y="425" font-family="-apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Roboto\', \'Oxygen\', \'Ubuntu\', \'Cantarell\', \'Fira Sans\', \'Droid Sans\', \'Helvetica Neue\', sans-serif" font-size="16" font-weight="500" fill="#818cf8" letter-spacing="0.5">{skills_esc}</text>' if skills_esc else ''}

  <!-- Lower watermark footer -->
  <g transform="translate(120, 485)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" font-size="13" font-weight="700" fill="#a1a1aa" letter-spacing="2" text-transform="uppercase">Verified Online Portfolio</text>
    <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" font-size="12" font-weight="500" fill="#71717a">Scan or visit link to explore dynamic layouts, animations, and custom projects.</text>
  </g>

  <!-- Glowing background concentric circular ring -->
  <circle cx="1000" cy="180" r="50" fill="none" stroke="url(#accent-grad)" stroke-width="3" stroke-opacity="0.3" />
  <circle cx="1000" cy="180" r="22" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-opacity="0.2" />
</svg>"""
    return svg_content
