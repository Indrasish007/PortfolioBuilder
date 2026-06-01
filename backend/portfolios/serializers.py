from rest_framework import serializers
from .models import Portfolio, Skill, Experience, Education, Project, Certification, Testimonial, Blog
from users.models import CustomUser, Profile
from .services.seo import generate_seo_payload

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
    github = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    live = serializers.CharField(required=False, allow_null=True, allow_blank=True)

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
            'custom_seo_title', 'custom_seo_description', 'custom_og_image',
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get('user') is None:
            ret['user'] = {}
        
        # Override the values inside the nested 'user' dict with the portfolio-specific fields
        # if they are set on the Portfolio instance, otherwise fall back to the shared Profile values.
        profile = instance.user.profile if (instance.user and hasattr(instance.user, 'profile')) else None
        
        ret['user']['name'] = instance.profile_name or (profile.name if profile else "")
        ret['user']['title'] = instance.profile_title or (profile.title if profile else "")
        ret['user']['location'] = instance.profile_location or (profile.location if profile else "")
        ret['user']['bio'] = instance.profile_bio or (profile.bio if profile else "")
        ret['user']['email'] = instance.profile_email or (profile.email if profile else "")
        ret['user']['phone'] = instance.profile_phone or (profile.phone if profile else "")
        ret['user']['avatar'] = instance.avatar or None
        ret['user']['resume_link'] = instance.profile_resume_link or (profile.resume_link if profile else "")
        
        ret['user']['github'] = instance.profile_github or (profile.github if profile else "")
        ret['user']['twitter'] = instance.profile_twitter or (profile.twitter if profile else "")
        ret['user']['linkedin'] = instance.profile_linkedin or (profile.linkedin if profile else "")
        ret['user']['facebook'] = instance.profile_facebook or (profile.facebook if profile else "")
        ret['user']['instagram'] = instance.profile_instagram or (profile.instagram if profile else "")
        ret['user']['website'] = instance.profile_website or (profile.website if profile else "")
        ret['user']['calendly'] = instance.profile_calendly or (profile.calendly if profile else "")

        # Inject dynamic SEO payload
        ret['seo'] = generate_seo_payload(instance)

        # Owner-only guard check: pop settings override fields if request context user is not the owner
        request = self.context.get('request', None)
        is_owner = False
        if request and request.user and request.user.is_authenticated:
            is_owner = (request.user == instance.user)

        if not is_owner:
            ret.pop('custom_seo_title', None)
            ret.pop('custom_seo_description', None)
            ret.pop('custom_og_image', None)

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

        # Update portfolio profile fields if a profile dict was sent by the client.
        if user_data and isinstance(user_data, dict):
            profile_data = user_data.get('profile', user_data)
            if 'avatar' in profile_data:
                portfolio.avatar = profile_data.pop('avatar', None)
            
            portfolio.profile_name = profile_data.get('name')
            portfolio.profile_title = profile_data.get('title')
            portfolio.profile_location = profile_data.get('location')
            portfolio.profile_bio = profile_data.get('bio')
            portfolio.profile_email = profile_data.get('email')
            portfolio.profile_phone = profile_data.get('phone')
            portfolio.profile_resume_link = profile_data.get('resume_link')
            
            portfolio.profile_github = profile_data.get('github')
            portfolio.profile_twitter = profile_data.get('twitter')
            portfolio.profile_linkedin = profile_data.get('linkedin')
            portfolio.profile_facebook = profile_data.get('facebook')
            portfolio.profile_instagram = profile_data.get('instagram')
            portfolio.profile_website = profile_data.get('website')
            portfolio.profile_calendly = profile_data.get('calendly')
            portfolio.save()
        else:
            # Pre-populate defaults from shared Profile so new portfolios are not blank
            try:
                profile = portfolio_user.profile if portfolio_user else None
                if profile:
                    portfolio.profile_name = profile.name
                    portfolio.profile_title = profile.title
                    portfolio.profile_location = profile.location
                    portfolio.profile_bio = profile.bio
                    portfolio.profile_email = profile.email
                    portfolio.profile_phone = profile.phone
                    portfolio.avatar = profile.avatar
                    portfolio.profile_resume_link = profile.resume_link
                    portfolio.profile_github = profile.github
                    portfolio.profile_twitter = profile.twitter
                    portfolio.profile_linkedin = profile.linkedin
                    portfolio.profile_facebook = profile.facebook
                    portfolio.profile_instagram = profile.instagram
                    portfolio.profile_website = profile.website
                    portfolio.profile_calendly = profile.calendly
                    portfolio.save()
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
        # Discard any top-level 'avatar' the client sent.
        validated_data.pop('avatar', None)

        avatar_provided = False
        avatar_value = None
        user_data = validated_data.pop('user', None)
        if user_data and isinstance(user_data, dict):
            profile_data = user_data.get('profile', user_data)
            if 'avatar' in profile_data:
                avatar_provided = True
                avatar_value = profile_data.pop('avatar', None)
            
            # Update the portfolio's specific profile override fields
            if 'name' in profile_data: instance.profile_name = profile_data['name']
            if 'title' in profile_data: instance.profile_title = profile_data['title']
            if 'location' in profile_data: instance.profile_location = profile_data['location']
            if 'bio' in profile_data: instance.profile_bio = profile_data['bio']
            if 'email' in profile_data: instance.profile_email = profile_data['email']
            if 'phone' in profile_data: instance.profile_phone = profile_data['phone']
            if 'resume_link' in profile_data: instance.profile_resume_link = profile_data['resume_link']
            
            if 'github' in profile_data: instance.profile_github = profile_data['github']
            if 'twitter' in profile_data: instance.profile_twitter = profile_data['twitter']
            if 'linkedin' in profile_data: instance.profile_linkedin = profile_data['linkedin']
            if 'facebook' in profile_data: instance.profile_facebook = profile_data['facebook']
            if 'instagram' in profile_data: instance.profile_instagram = profile_data['instagram']
            if 'website' in profile_data: instance.profile_website = profile_data['website']
            if 'calendly' in profile_data: instance.profile_calendly = profile_data['calendly']

        # Track which flat fields actually changed to minimise the UPDATE statement
        flat_field_map = {
            'name': 'name', 'template': 'template', 'theme': 'theme',
            'status': 'status', 'slug': 'slug', 'domain': 'domain',
            'sections': 'sections', 'custom': 'custom', 'gallery': 'gallery',
            'videos': 'videos', 'music': 'music', 'services': 'services',
            'languages': 'languages', 'volunteer': 'volunteer', 'awards': 'awards',
            'references': 'references', 'faqs': 'faqs',
            'avatar': 'avatar', 'profile_name': 'profile_name', 'profile_title': 'profile_title',
            'profile_location': 'profile_location', 'profile_bio': 'profile_bio',
            'profile_email': 'profile_email', 'profile_phone': 'profile_phone',
            'profile_resume_link': 'profile_resume_link', 'profile_github': 'profile_github',
            'profile_twitter': 'profile_twitter', 'profile_linkedin': 'profile_linkedin',
            'profile_facebook': 'profile_facebook', 'profile_instagram': 'profile_instagram',
            'profile_website': 'profile_website', 'profile_calendly': 'profile_calendly'
        }
        changed_flat = []
        for vd_key, field_name in flat_field_map.items():
            if vd_key in validated_data:
                setattr(instance, field_name, validated_data[vd_key])
                changed_flat.append(field_name)
            elif vd_key in ['avatar', 'profile_name', 'profile_title', 'profile_location', 'profile_bio',
                            'profile_email', 'profile_phone', 'profile_resume_link', 'profile_github',
                            'profile_twitter', 'profile_linkedin', 'profile_facebook', 'profile_instagram',
                            'profile_website', 'profile_calendly']:
                changed_flat.append(field_name)

        if avatar_provided:
            instance.avatar = avatar_value
            if 'avatar' not in changed_flat:
                changed_flat.append('avatar')

        if changed_flat:
            instance.save(update_fields=list(set(changed_flat)))

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
