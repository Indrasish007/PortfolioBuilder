from django.db import models
from portfolios.models import Portfolio

class Analytics(models.Model):
    portfolio = models.OneToOneField(Portfolio, on_delete=models.CASCADE, related_name='analytics')
    downloads = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Analytics for {self.portfolio.name}"

class ViewStat(models.Model):
    analytics = models.ForeignKey(Analytics, on_delete=models.CASCADE, related_name='views')
    day = models.CharField(max_length=50)
    count = models.IntegerField(default=0)

class VisitorStat(models.Model):
    analytics = models.ForeignKey(Analytics, on_delete=models.CASCADE, related_name='visitors')
    day = models.CharField(max_length=50)
    count = models.IntegerField(default=0)

class DeviceStat(models.Model):
    analytics = models.ForeignKey(Analytics, on_delete=models.CASCADE, related_name='devices')
    name = models.CharField(max_length=100)
    value = models.IntegerField(default=0)

class CountryStat(models.Model):
    analytics = models.ForeignKey(Analytics, on_delete=models.CASCADE, related_name='countries')
    country = models.CharField(max_length=100)
    visits = models.IntegerField(default=0)

class Suggestion(models.Model):
    analytics = models.ForeignKey(Analytics, on_delete=models.CASCADE, related_name='suggestions')
    text = models.TextField()


class SocialShareEvent(models.Model):
    PLATFORM_CHOICES = [
        ('linkedin', 'LinkedIn'),
        ('twitter', 'Twitter/X'),
        ('whatsapp', 'WhatsApp'),
        ('facebook', 'Facebook'),
        ('discord', 'Discord'),
        ('direct', 'Direct Link'),
        ('other', 'Other'),
    ]

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name='share_events'
    )
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='other')
    clicked_at = models.DateTimeField(auto_now_add=True)
    referrer = models.URLField(max_length=500, blank=True, null=True)  # raw HTTP referrer header
    user_agent = models.TextField(blank=True, null=True)  # for bot filtering

    # Attribution tracking persistence fields
    source = models.CharField(max_length=100, default='Direct')
    medium = models.CharField(max_length=100, blank=True, null=True)
    campaign = models.CharField(max_length=255, blank=True, null=True)
    utm_source = models.CharField(max_length=100, blank=True, null=True)
    utm_medium = models.CharField(max_length=100, blank=True, null=True)
    utm_campaign = models.CharField(max_length=255, blank=True, null=True)
    first_touch_source = models.CharField(max_length=100, blank=True, null=True)
    first_touch_medium = models.CharField(max_length=100, blank=True, null=True)
    first_touch_campaign = models.CharField(max_length=255, blank=True, null=True)
    last_touch_source = models.CharField(max_length=100, blank=True, null=True)
    last_touch_medium = models.CharField(max_length=100, blank=True, null=True)
    last_touch_campaign = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['portfolio', 'clicked_at']),
            models.Index(fields=['platform']),
        ]

    def __str__(self):
        return f"{self.platform} click for portfolio {self.portfolio_id}"


