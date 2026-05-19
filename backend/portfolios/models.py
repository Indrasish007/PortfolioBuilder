from django.db import models
from users.models import CustomUser

class Portfolio(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Published', 'Published'),
    ]
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='portfolios')
    name = models.CharField(max_length=255, default="Personal Portfolio")
    template = models.CharField(max_length=100, default="Developer")
    theme = models.CharField(max_length=100, default="Midnight")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Draft')
    slug = models.SlugField(unique=True, blank=True, null=True)
    domain = models.CharField(max_length=255, blank=True, null=True)
    views = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
    sections = models.JSONField(default=list, blank=True)
    custom = models.JSONField(default=dict, blank=True)
    gallery = models.JSONField(default=list, blank=True)
    videos = models.JSONField(default=list, blank=True)
    music = models.JSONField(default=list, blank=True)
    services = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)
    volunteer = models.JSONField(default=list, blank=True)
    awards = models.JSONField(default=list, blank=True)
    references = models.JSONField(default=list, blank=True)
    faqs = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.user.email} - {self.name}"

class Skill(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Experience(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='experiences')
    role = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    period = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.role} at {self.company}"

class Education(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='educations')
    school = models.CharField(max_length=255)
    degree = models.CharField(max_length=255)
    period = models.CharField(max_length=100)

    def __str__(self):
        return self.school

class Project(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    tech = models.JSONField(default=list, blank=True)
    github = models.CharField(max_length=500, blank=True, null=True)
    live = models.CharField(max_length=500, blank=True, null=True)
    featured = models.BooleanField(default=False)
    image = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.title

class Certification(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='certifications')
    name = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255)
    year = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Testimonial(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='testimonials')
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=255)
    quote = models.TextField()

    def __str__(self):
        return self.name

class Blog(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='blogs')
    title = models.CharField(max_length=255)
    date = models.CharField(max_length=100)
    excerpt = models.TextField(blank=True)

    def __str__(self):
        return self.title

class PortfolioEvent(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=50) # 'view', 'resume_download', 'session_ping'
    visitor_id = models.CharField(max_length=255) # hash for unique visitors
    duration = models.IntegerField(default=0) # duration in seconds for session pings
    device = models.CharField(max_length=50, default='Desktop') # 'Desktop', 'Mobile', 'Tablet'
    country = models.CharField(max_length=100, default='United States')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} - {self.portfolio.id}"
