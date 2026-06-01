from rest_framework import serializers
from .models import Portfolio, Skill, Experience, Education, Project, Certification, Testimonial, Blog
from users.models import CustomUser, Profile

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ['id', 'role', 'company', 'period', 'description']

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ['id', 'school', 'degree', 'period']

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'tech', 'github', 'live', 'featured', 'image']

    def to_internal_value(self, data):
        if data:
            data = dict(data)
            for field in ['github', 'live']:
                if field in data and data[field]:
                    val = str(data[field]).strip()
                    if val and not val.startswith(('http://', 'https://')):
                        data[field] = f'https://{val}'
        return super().to_internal_value(data)

class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ['id', 'name', 'issuer', 'year']

class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ['id', 'name', 'role', 'quote']

class BlogSerializer(serializers.ModelSerializer):
    url = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Blog
        fields = ['id', 'title', 'date', 'dateRaw', 'excerpt', 'url']

class ProfileSerializer(serializers.ModelSerializer):
    # `email` is stored on the Profile model itself — NOT sourced from user.email (the auth/sign-in email).
    # This means CV-parsed or manually entered contact emails are preserved on save and never
    # silently overwritten by the auth email.
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    username = serializers.CharField(source='user.username', read_only=True)
    github = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    twitter = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    linkedin = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    facebook = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    instagram = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    website = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    calendly = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Profile
        fields = [
            'name', 'username', 'title', 'location', 'email', 'phone', 'avatar', 'bio',
            'github', 'twitter', 'linkedin', 'facebook', 'instagram', 'website', 'calendly', 'resume_link'
        ]

    def to_internal_value(self, data):
        if data:
            data = dict(data)
            url_fields = ['github', 'twitter', 'linkedin', 'facebook', 'instagram', 'website', 'calendly', 'resume_link']
            for field in url_fields:
                if field in data and data[field]:
                    val = str(data[field]).strip()
                    if val and not val.startswith(('http://', 'https://', 'data:')):
                        data[field] = f'https://{val}'
        return super().to_internal_value(data)

class PortfolioSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, required=False)
    experience = ExperienceSerializer(many=True, source='experiences', required=False)
    education = EducationSerializer(many=True, source='educations', required=False)
    projects = ProjectSerializer(many=True, required=False)
    certifications = CertificationSerializer(many=True, required=False)
    testimonials = TestimonialSerializer(many=True, required=False)
    blogs = BlogSerializer(many=True, required=False)
    user = ProfileSerializer(source='user.profile', required=False)

    class Meta:
        model = Portfolio
        fields = [
            'id', 'user', 'name', 'template', 'theme', 'status', 'slug', 'domain', 'views', 'updated_at',
            'skills', 'experience', 'education', 'projects', 'certifications', 'testimonials', 'blogs',
            'sections', 'custom', 'gallery', 'videos', 'music', 'services', 'languages', 'volunteer',
            'awards', 'references', 'faqs', 'avatar',
        ]

    def to_representation(self, instance):
        """Inject portfolio.avatar into user.avatar so the frontend always
        reads the portfolio-specific DP, not the shared profile avatar.
        If no avatar has been uploaded for this portfolio, user.avatar is
        explicitly set to None — no fallback to the shared profile avatar."""
        ret = super().to_representation(instance)
        # Only use the avatar that was explicitly uploaded for this portfolio.
        # Never fall back to the shared profile avatar; doing so would cause
        # a DP from one portfolio (or from onboarding) to bleed into every
        # other portfolio where the user never uploaded an image.
        portfolio_avatar = instance.avatar or None
        if ret.get('user') is None:
            ret['user'] = {}
        ret['user']['avatar'] = portfolio_avatar  # None when no DP uploaded
        return ret

    def create(self, validated_data):
        skills_data = validated_data.pop('skills', [])
        experiences_data = validated_data.pop('experiences', [])
        educations_data = validated_data.pop('educations', [])
        projects_data = validated_data.pop('projects', [])
        certifications_data = validated_data.pop('certifications', [])
        testimonials_data = validated_data.pop('testimonials', [])
        blogs_data = validated_data.pop('blogs', [])
        user_data = validated_data.pop('user', None)

        # Get request user from context
        request = self.context.get('request')
        context_user = request.user if request else None

        # Determine the portfolio owner
        portfolio_user = None
        if user_data and hasattr(user_data, 'pk'):
            portfolio_user = user_data
            user_data = None  # nothing to update in profile
        elif context_user:
            portfolio_user = context_user

        portfolio = Portfolio.objects.create(user=portfolio_user, **validated_data)

        # Update profile fields if a profile dict was sent by the client.
        # Strip out 'avatar' before writing to Profile — avatar is now
        # per-portfolio and stored on the Portfolio row, not the Profile.
        if user_data and isinstance(user_data, dict):
            profile_data = user_data.get('profile', user_data)
            if 'avatar' in profile_data:
                avatar_value = profile_data.pop('avatar', None)  # intercept avatar
                portfolio.avatar = avatar_value
                portfolio.save(update_fields=['avatar'])
            try:
                profile = portfolio_user.profile if portfolio_user else portfolio.user.profile
                for attr, value in profile_data.items():
                    setattr(profile, attr, value)
                profile.save()
            except Exception:
                pass
        
        for item in skills_data:
            Skill.objects.create(portfolio=portfolio, **item)
        for item in experiences_data:
            Experience.objects.create(portfolio=portfolio, **item)
        for item in educations_data:
            Education.objects.create(portfolio=portfolio, **item)
        for item in projects_data:
            Project.objects.create(portfolio=portfolio, **item)
        for item in certifications_data:
            Certification.objects.create(portfolio=portfolio, **item)
        for item in testimonials_data:
            Testimonial.objects.create(portfolio=portfolio, **item)
        for item in blogs_data:
            Blog.objects.create(portfolio=portfolio, **item)
            
        return portfolio

    def update(self, instance, validated_data):
        # Discard any top-level 'avatar' the client sent.  After the first save
        # the store keeps portfolio.avatar in its state and re-sends it on every
        # subsequent save — but it's stale.  The authoritative source is always
        # user.avatar (the field the editor writes to).  Without this pop the
        # stale value would win and the newly-uploaded image would be discarded.
        validated_data.pop('avatar', None)

        avatar_value = None  # will be set below from user.avatar if provided
        avatar_provided = False
        user_data = validated_data.pop('user', None)
        if user_data and isinstance(user_data, dict):
            profile_data = user_data.get('profile', user_data)
            # Intercept avatar — it lives on Portfolio, not Profile
            if 'avatar' in profile_data:
                avatar_provided = True
                avatar_value = profile_data.pop('avatar', None)
            try:
                profile = instance.user.profile
                changed_fields = []
                for attr, value in profile_data.items():
                    if hasattr(profile, attr):
                        setattr(profile, attr, value)
                        changed_fields.append(attr)
                if changed_fields:
                    profile.save(update_fields=changed_fields)
            except Exception:
                pass

        # Track which flat fields actually changed to minimise the UPDATE statement
        flat_field_map = {
            'name': 'name', 'template': 'template', 'theme': 'theme',
            'status': 'status', 'slug': 'slug', 'domain': 'domain',
            'sections': 'sections', 'custom': 'custom', 'gallery': 'gallery',
            'videos': 'videos', 'music': 'music', 'services': 'services',
            'languages': 'languages', 'volunteer': 'volunteer', 'awards': 'awards',
            'references': 'references', 'faqs': 'faqs',
        }
        changed_flat = []
        for vd_key, field_name in flat_field_map.items():
            if vd_key in validated_data:
                setattr(instance, field_name, validated_data[vd_key])
                changed_flat.append(field_name)

        # Always persist the avatar that came through user.avatar if it was provided.
        # It is saved as part of the same UPDATE if other fields changed too,
        # otherwise in its own minimal UPDATE so it's never silently skipped.
        if avatar_provided:
            instance.avatar = avatar_value
            if 'avatar' not in changed_flat:
                changed_flat.append('avatar')

        if changed_flat:
            instance.save(update_fields=changed_flat)

        # Optimised nested update: bulk delete + bulk_create in two queries per relation
        def update_nested(model, related_name, data):
            if data is None:
                return
            # Delete existing rows in one query
            getattr(instance, related_name).all().delete()
            if data:
                # Build model instances and bulk-insert in a single query
                objs = [model(portfolio=instance, **item) for item in data]
                model.objects.bulk_create(objs)

        update_nested(Skill, 'skills', validated_data.get('skills'))
        update_nested(Experience, 'experiences', validated_data.get('experiences'))
        update_nested(Education, 'educations', validated_data.get('educations'))
        update_nested(Project, 'projects', validated_data.get('projects'))
        update_nested(Certification, 'certifications', validated_data.get('certifications'))
        update_nested(Testimonial, 'testimonials', validated_data.get('testimonials'))
        update_nested(Blog, 'blogs', validated_data.get('blogs'))

        return instance
