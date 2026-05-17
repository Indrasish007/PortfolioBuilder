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
