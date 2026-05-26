from django.db import models
from django.conf import settings

class Resume(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')
    title = models.CharField(max_length=255, default="My Resume")
    template_slug = models.CharField(max_length=100, default="ats")
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.title}"

class ResumeVersion(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='versions')
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Version of {self.resume.title} at {self.created_at}"

class ResumeTemplate(models.Model):
    slug = models.SlugField(max_length=100, unique=True, primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class ResumeMetadata(models.Model):
    resume = models.OneToOneField(Resume, on_delete=models.CASCADE, related_name='metadata')
    keywords = models.JSONField(default=list, blank=True)
    ats_score = models.IntegerField(default=0)
    last_parsed_from_url = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        return f"Metadata for {self.resume.title}"
