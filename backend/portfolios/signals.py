from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from portfolios.models import Portfolio, Project, Skill
from users.models import Profile

@receiver([post_save, post_delete], sender=Portfolio)
def invalidate_portfolio_og_cache(sender, instance, **kwargs):
    """Invalidate cache when portfolio properties (theme, template, custom fields) are saved/deleted."""
    cache_key = f"og_image_{instance.id}"
    cache.delete(cache_key)

@receiver([post_save, post_delete], sender=Project)
def invalidate_project_og_cache(sender, instance, **kwargs):
    """Invalidate parent portfolio OG image cache whenever projects change."""
    if instance.portfolio_id:
        cache_key = f"og_image_{instance.portfolio_id}"
        cache.delete(cache_key)

@receiver([post_save, post_delete], sender=Skill)
def invalidate_skill_og_cache(sender, instance, **kwargs):
    """Invalidate parent portfolio OG image cache whenever skills are added/removed."""
    if instance.portfolio_id:
        cache_key = f"og_image_{instance.portfolio_id}"
        cache.delete(cache_key)

@receiver([post_save, post_delete], sender=Profile)
def invalidate_profile_og_cache(sender, instance, **kwargs):
    """Invalidate all child portfolios OG image caches whenever shared user profile details change."""
    if instance.user:
        portfolios = Portfolio.objects.filter(user=instance.user)
        for p in portfolios:
            cache_key = f"og_image_{p.id}"
            cache.delete(cache_key)
