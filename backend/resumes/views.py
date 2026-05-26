from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from .models import Resume, ResumeVersion, ResumeTemplate, ResumeMetadata
from .serializers import ResumeSerializer, ResumeTemplateSerializer, ResumeVersionSerializer
from .scraper import scrape_portfolio_url
from .pdf_generator import generate_resume_pdf

class ExtractPortfolioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        url = request.data.get("url", "").strip()
        if not url:
            return Response({"error": "URL is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            structured_data = scrape_portfolio_url(url)
            return Response(structured_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TemplateListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Default templates definition
        default_templates = [
            {"slug": "ats", "name": "ATS Template", "description": "Classic single-column design optimized for ATS systems and scanner readability.", "is_active": True},
            {"slug": "modern", "name": "Modern Template", "description": "Professional layout with a slate sidebar and prominent headings.", "is_active": True},
            {"slug": "minimal", "name": "Minimal Template", "description": "Sleek centered header with generous spacing and minimalist aesthetics.", "is_active": True},
            {"slug": "creative", "name": "Creative Template", "description": "Vibrant top header banner with bold color highlights.", "is_active": True},
            {"slug": "developer", "name": "Developer Template", "description": "Clean tech-focused grid with monospace formatting for code elements.", "is_active": True},
        ]
        
        # Populate DB metadata if templates table empty
        for t in default_templates:
            ResumeTemplate.objects.get_or_create(
                slug=t["slug"],
                defaults={"name": t["name"], "description": t["description"], "is_active": t["is_active"]}
            )
            
        templates = ResumeTemplate.objects.filter(is_active=True)
        serializer = ResumeTemplateSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ExportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume_data = request.data.get("data")
        template_slug = request.data.get("template_slug", "ats")
        resume_id = request.data.get("resume_id")
        
        if not resume_data and resume_id:
            resume = get_object_or_404(Resume, id=resume_id, user=request.user)
            resume_data = resume.data
            template_slug = resume.template_slug
            
        if not resume_data:
            return Response({"error": "Resume data is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            pdf_stream = generate_resume_pdf(resume_data, template_slug)
            filename = f"{resume_data.get('full_name', 'Resume').replace(' ', '_')}_Resume.pdf"
            
            response = HttpResponse(pdf_stream.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
        skills = data.get("skills", [])
        
        # Heuristic ATS score calculation
        score = 40 # Base score for having data
        
        # Check standard fields
        if data.get("full_name"): score += 5
        if data.get("email"): score += 5
        if data.get("phone"): score += 5
        if data.get("location"): score += 5
        if data.get("bio"): score += 5
        
        # Score based on count of sections
        if len(data.get("experience", [])) > 0: score += 10
        if len(data.get("education", [])) > 0: score += 10
        if len(data.get("projects", [])) > 0: score += 5
        if len(skills) > 0: score += 5
        
        # Tech skill keywords check
        ats_keywords = [
            "python", "django", "react", "node", "javascript", "typescript",
            "html", "css", "sql", "aws", "docker", "git", "api", "rest"
        ]
        matched_keywords = []
        skills_lower = [s.lower() for s in skills if isinstance(s, str)]
        
        for kw in ats_keywords:
            if kw in skills_lower:
                matched_keywords.append(kw.capitalize())
                score += 1 # Extra point per matched core keyword
                
        score = min(score, 100) # Cap at 100
        
        # Update or create metadata
        ResumeMetadata.objects.update_or_create(
            resume=resume,
            defaults={
                "keywords": matched_keywords,
                "ats_score": score
            }
        )

    # Custom action to duplicate a resume
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        resume = self.get_object()
        new_resume = Resume.objects.create(
            user=request.user,
            title=f"{resume.title} (Copy)",
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
        version_id = request.data.get("version_id")
        if not version_id:
            return Response({"error": "version_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        version = get_object_or_404(ResumeVersion, id=version_id, resume=resume)
        resume.data = version.data
        resume.save()
        
        serializer = self.get_serializer(resume)
        return Response(serializer.data, status=status.HTTP_200_OK)
