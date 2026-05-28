from urllib.parse import urlparse

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.conf import settings

from .models import Resume, ResumeVersion, ResumeTemplate, ResumeMetadata
from .serializers import ResumeSerializer, ResumeTemplateSerializer, ResumeVersionSerializer
from .scraper import scrape_portfolio_url
from .pdf_generator import generate_resume_pdf


# ---------------------------------------------------------------------------
# Helpers — own-portfolio detection & DB data mapping
# ---------------------------------------------------------------------------

# Hostnames we recognise as "our own" deployed frontend.
# Add any custom domains here too.
_OWN_HOSTS = {
    'localhost',
    '127.0.0.1',
    'portfoliobuilder.vercel.app',
}

# Try to pull extra allowed hosts from settings/env so the check works on any
# custom domain the user may configure later.
try:
    _extra = getattr(settings, 'FRONTEND_ORIGINS', [])
    if isinstance(_extra, str):
        _extra = [h.strip() for h in _extra.split(',') if h.strip()]
    for h in _extra:
        parsed = urlparse(h if '://' in h else 'https://' + h)
        if parsed.hostname:
            _OWN_HOSTS.add(parsed.hostname.lower())
except Exception:
    pass


def _is_own_portfolio(url: str) -> bool:
    """Return True if the URL points to a portfolio hosted on our own frontend."""
    try:
        hostname = (urlparse(url).hostname or '').lower()
        if hostname in _OWN_HOSTS:
            return True
        # Also catch subdomains of localhost (e.g. app.localhost)
        if hostname.endswith('.localhost'):
            return True
        # Catch preview deployments on Vercel (*.vercel.app owned by us)
        # Only match if the path pattern looks like a portfolio page
        return False
    except Exception:
        return False


def _extract_slug(url: str) -> str | None:
    """
    Extract the portfolio slug or idOrSlug from a URL.
    Handles patterns:
      /p/<slug>                  (our main public route)
      /portfolio/<slug>          (alternative)
      /p/123                     (numeric id)
    Returns the last meaningful path segment, or None.
    """
    try:
        path = urlparse(url).path.strip('/')
        parts = [p for p in path.split('/') if p]
        # /p/<slug>  or /portfolio/<slug>
        for i, part in enumerate(parts):
            if part in ('p', 'portfolio') and i + 1 < len(parts):
                return parts[i + 1]
        # Fallback — return last segment if it looks like a slug/id
        if parts:
            return parts[-1]
        return None
    except Exception:
        return None


def _map_portfolio_to_resume_data(portfolio) -> dict:
    """
    Convert a Portfolio DB object (with related data) into the resume JSON
    structure expected by PortfolioToResume.jsx.
    """
    # Profile data lives on portfolio.user.profile
    try:
        profile = portfolio.user.profile
    except Exception:
        profile = None

    def _s(v):
        return (v or '').strip()

    # --- Identity ---
    full_name = _s(profile.name if profile else '')
    headline = _s(profile.title if profile else '')
    bio = _s(profile.bio if profile else '')
    email = _s(profile.email if profile else '')
    phone = _s(profile.phone if profile else '')
    location = _s(profile.location if profile else '')

    # --- Skills ---
    skills = [_s(sk.name) for sk in portfolio.skills.all() if sk.name]

    # --- Languages (portfolio-level JSON field) ---
    languages = portfolio.languages or []

    # --- Experience ---
    experience = []
    for exp in portfolio.experiences.all():
        experience.append({
            'company': _s(exp.company),
            'role': _s(exp.role),
            'start_date': '',
            'end_date': '',
            'period': _s(exp.period),      # keep period for display
            'description': _s(exp.description),
        })

    # --- Education ---
    education = []
    for edu in portfolio.educations.all():
        education.append({
            'school': _s(edu.school),
            'degree': _s(edu.degree),
            'start_date': '',
            'end_date': '',
            'period': _s(edu.period),
            'grade': '',
        })

    # --- Projects ---
    projects = []
    for proj in portfolio.projects.all():
        tech_raw = proj.tech
        if isinstance(tech_raw, list):
            tech_str = ', '.join(str(t) for t in tech_raw if t)
        else:
            tech_str = _s(str(tech_raw)) if tech_raw else ''
        projects.append({
            'title': _s(proj.title),
            'description': _s(proj.description),
            'tech_stack': tech_str,
            'github_url': _s(proj.github or ''),
            'live_url': _s(proj.live or ''),
        })

    # --- Certifications ---
    certifications = []
    for cert in portfolio.certifications.all():
        certifications.append({
            'name': _s(cert.name),
            'issuer': _s(cert.issuer),
            'year': _s(cert.year),
        })

    # --- Social links (from profile fields) ---
    social_links = []
    if profile:
        _social_fields = [
            ('github', profile.github),
            ('linkedin', profile.linkedin),
            ('twitter', profile.twitter),
            ('instagram', profile.instagram),
            ('website', profile.website),
        ]
        for platform, url_val in _social_fields:
            if url_val and url_val.strip():
                social_links.append({'platform': platform, 'url': url_val.strip()})

    return {
        'full_name': full_name,
        'headline': headline,
        'bio': bio,
        'email': email,
        'phone': phone,
        'location': location,
        'profile_picture': portfolio.avatar or '',
        'skills': skills,
        'languages': languages,
        'experience': experience,
        'education': education,
        'projects': projects,
        'certifications': certifications,
        'social_links': social_links,
        # Extra metadata flag so the frontend knows this came from DB
        '_source': 'database',
    }


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

class ExtractPortfolioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        url = request.data.get('url', '').strip()
        if not url:
            return Response({'error': 'URL is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Normalise URL — add scheme if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        # ------------------------------------------------------------------
        # PATH A — Own portfolio: fetch directly from the database
        # ------------------------------------------------------------------
        if _is_own_portfolio(url):
            slug_or_id = _extract_slug(url)
            if not slug_or_id:
                return Response(
                    {'error': 'Could not extract a portfolio slug from this link. '
                               'Make sure the URL looks like: yoursite.com/p/your-slug'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Try slug first, then numeric PK
            from portfolios.models import Portfolio
            portfolio = None

            # Try slug match (published)
            portfolio = Portfolio.objects.filter(slug=slug_or_id, status='Published').first()

            # Fallback: try numeric id (any status owned by any user — read-only public)
            if not portfolio and slug_or_id.isdigit():
                portfolio = Portfolio.objects.filter(pk=int(slug_or_id), status='Published').first()

            if not portfolio:
                return Response(
                    {'error': 'Portfolio not found. Please check the link and make sure '
                               'the portfolio is published.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            resume_data = _map_portfolio_to_resume_data(portfolio)
            return Response(resume_data, status=status.HTTP_200_OK)

        # ------------------------------------------------------------------
        # PATH B — External URL: scrape + Gemini AI extraction
        # ------------------------------------------------------------------
        try:
            structured_data = scrape_portfolio_url(url)
            return Response(structured_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TemplateListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Default templates definition
        default_templates = [
            {'slug': 'ats', 'name': 'ATS Template', 'description': 'Classic single-column design optimized for ATS systems and scanner readability.', 'is_active': True},
            {'slug': 'modern', 'name': 'Modern Template', 'description': 'Professional layout with a slate sidebar and prominent headings.', 'is_active': True},
            {'slug': 'minimal', 'name': 'Minimal Template', 'description': 'Sleek centered header with generous spacing and minimalist aesthetics.', 'is_active': True},
            {'slug': 'creative', 'name': 'Creative Template', 'description': 'Vibrant top header banner with bold color highlights.', 'is_active': True},
            {'slug': 'developer', 'name': 'Developer Template', 'description': 'Clean tech-focused grid with monospace formatting for code elements.', 'is_active': True},
        ]

        # Populate DB metadata if templates table empty
        for t in default_templates:
            ResumeTemplate.objects.get_or_create(
                slug=t['slug'],
                defaults={'name': t['name'], 'description': t['description'], 'is_active': t['is_active']}
            )

        templates = ResumeTemplate.objects.filter(is_active=True)
        serializer = ResumeTemplateSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ExportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume_data = request.data.get('data')
        template_slug = request.data.get('template_slug', 'ats')
        resume_id = request.data.get('resume_id')

        if not resume_data and resume_id:
            resume = get_object_or_404(Resume, id=resume_id, user=request.user)
            resume_data = resume.data
            template_slug = resume.template_slug

        if not resume_data:
            return Response({'error': 'Resume data is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pdf_stream = generate_resume_pdf(resume_data, template_slug)
            filename = f"{resume_data.get('full_name', 'Resume').replace(' ', '_')}_resume.pdf"

            response = HttpResponse(pdf_stream.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        resume = serializer.save(user=self.request.user)
        # Create initial version
        ResumeVersion.objects.create(resume=resume, data=resume.data)
        # Calculate ATS score and metadata
        self._save_metadata(resume)

    def perform_update(self, serializer):
        resume = serializer.save()
        # Save historical version
        ResumeVersion.objects.create(resume=resume, data=resume.data)
        # Calculate ATS score and metadata
        self._save_metadata(resume)

    def _save_metadata(self, resume):
        data = resume.data or {}
        skills = data.get('skills', [])

        # Heuristic ATS score calculation
        score = 40  # Base score for having data

        # Check standard fields
        if data.get('full_name'): score += 5
        if data.get('email'): score += 5
        if data.get('phone'): score += 5
        if data.get('location'): score += 5
        if data.get('bio'): score += 5

        # Score based on count of sections
        if len(data.get('experience', [])) > 0: score += 10
        if len(data.get('education', [])) > 0: score += 10
        if len(data.get('projects', [])) > 0: score += 5
        if len(skills) > 0: score += 5

        # Tech skill keywords check
        ats_keywords = [
            'python', 'django', 'react', 'node', 'javascript', 'typescript',
            'html', 'css', 'sql', 'aws', 'docker', 'git', 'api', 'rest'
        ]
        matched_keywords = []
        skills_lower = [s.lower() for s in skills if isinstance(s, str)]

        for kw in ats_keywords:
            if kw in skills_lower:
                matched_keywords.append(kw.capitalize())
                score += 1  # Extra point per matched core keyword

        score = min(score, 100)  # Cap at 100

        # Update or create metadata
        ResumeMetadata.objects.update_or_create(
            resume=resume,
            defaults={
                'keywords': matched_keywords,
                'ats_score': score
            }
        )

    # Custom action to duplicate a resume
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        resume = self.get_object()
        new_resume = Resume.objects.create(
            user=request.user,
            title=f'{resume.title} (Copy)',
            template_slug=resume.template_slug,
            data=resume.data
        )
        # Copy version
        ResumeVersion.objects.create(resume=new_resume, data=new_resume.data)
        # Copy metadata
        try:
            metadata = resume.metadata
            ResumeMetadata.objects.create(
                resume=new_resume,
                keywords=metadata.keywords,
                ats_score=metadata.ats_score,
                last_parsed_from_url=metadata.last_parsed_from_url
            )
        except Exception:
            self._save_metadata(new_resume)

        serializer = self.get_serializer(new_resume)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # Custom action to list versions
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        resume = self.get_object()
        versions = resume.versions.all().order_by('-created_at')
        serializer = ResumeVersionSerializer(versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # Custom action to rollback
    @action(detail=True, methods=['post'])
    def rollback(self, request, pk=None):
        resume = self.get_object()
        version_id = request.data.get('version_id')
        if not version_id:
            return Response({'error': 'version_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        version = get_object_or_404(ResumeVersion, id=version_id, resume=resume)
        resume.data = version.data
        resume.save()

        serializer = self.get_serializer(resume)
        return Response(serializer.data, status=status.HTTP_200_OK)
