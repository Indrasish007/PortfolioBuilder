from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class Profile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    name = models.CharField(max_length=150, blank=True)
    title = models.CharField(max_length=150, blank=True)
    location = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)
    # Portfolio contact email — independent of the sign-in (auth) email on CustomUser.
    # Populated from CV parsing or manual entry; never overwritten by auth logic.
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    avatar = models.TextField(blank=True, null=True) # Changed to TextField to support base64 strings
    
    # Social links
    github = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    calendly = models.URLField(blank=True, null=True)
    resume_link = models.TextField(blank=True, null=True)

    # Tracks which portfolio the user was last editing — persists across devices.
    # Stored as a plain int (not FK) so deleting a portfolio doesn't cascade-delete the profile.
    last_edited_portfolio_id = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} Profile"
