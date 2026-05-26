from rest_framework import serializers
from .models import Resume, ResumeVersion, ResumeTemplate, ResumeMetadata

class ResumeTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeTemplate
        fields = ['slug', 'name', 'description', 'is_active']

class ResumeMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeMetadata
        fields = ['keywords', 'ats_score', 'last_parsed_from_url']

class ResumeVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeVersion
        fields = ['id', 'data', 'created_at']

class ResumeSerializer(serializers.ModelSerializer):
    metadata = ResumeMetadataSerializer(read_only=True)
    versions_count = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = ['id', 'title', 'template_slug', 'data', 'metadata', 'versions_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_versions_count(self, obj):
        return obj.versions.count()
