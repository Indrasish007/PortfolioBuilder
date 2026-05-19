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

class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ['id', 'name', 'issuer', 'year']

class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ['id', 'name', 'role', 'quote']

class BlogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Blog
        fields = ['id', 'title', 'date', 'excerpt']

class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'name', 'username', 'title', 'location', 'email', 'avatar', 'bio',
            'github', 'twitter', 'linkedin', 'facebook', 'instagram', 'website', 'calendly', 'resume_link'
        ]

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
            'sections', 'custom', 'gallery', 'videos', 'music', 'services', 'languages', 'volunteer', 'awards', 'references', 'faqs'
        ]

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

        # Update profile fields if a profile dict was sent by the client
        if user_data and isinstance(user_data, dict):
            profile_data = user_data.get('profile', user_data)
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
        user_data = validated_data.pop('user', None)
        if user_data and 'profile' in user_data:
            profile = instance.user.profile
            for attr, value in user_data['profile'].items():
                setattr(profile, attr, value)
            profile.save()

        # Update flat fields
        instance.name = validated_data.get('name', instance.name)
        instance.template = validated_data.get('template', instance.template)
        instance.theme = validated_data.get('theme', instance.theme)
        instance.status = validated_data.get('status', instance.status)
        instance.slug = validated_data.get('slug', instance.slug)
        instance.domain = validated_data.get('domain', instance.domain)
        
        instance.sections = validated_data.get('sections', instance.sections)
        instance.custom = validated_data.get('custom', instance.custom)
        instance.gallery = validated_data.get('gallery', instance.gallery)
        instance.videos = validated_data.get('videos', instance.videos)
        instance.music = validated_data.get('music', instance.music)
        instance.services = validated_data.get('services', instance.services)
        instance.languages = validated_data.get('languages', instance.languages)
        instance.volunteer = validated_data.get('volunteer', instance.volunteer)
        instance.awards = validated_data.get('awards', instance.awards)
        instance.references = validated_data.get('references', instance.references)
        instance.faqs = validated_data.get('faqs', instance.faqs)
        
        instance.save()

        # Helper function for nested updates
        def update_nested(model, serializer_class, related_name, data):
            if data is not None:
                # Naive implementation: clear and recreate
                # A robust implementation would match IDs and update/create/delete accordingly
                getattr(instance, related_name).all().delete()
                for item in data:
                    model.objects.create(portfolio=instance, **item)

        update_nested(Skill, SkillSerializer, 'skills', validated_data.get('skills'))
        update_nested(Experience, ExperienceSerializer, 'experiences', validated_data.get('experiences'))
        update_nested(Education, EducationSerializer, 'educations', validated_data.get('educations'))
        update_nested(Project, ProjectSerializer, 'projects', validated_data.get('projects'))
        update_nested(Certification, CertificationSerializer, 'certifications', validated_data.get('certifications'))
        update_nested(Testimonial, TestimonialSerializer, 'testimonials', validated_data.get('testimonials'))
        update_nested(Blog, BlogSerializer, 'blogs', validated_data.get('blogs'))

        return instance
