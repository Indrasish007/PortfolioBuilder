from rest_framework import serializers
from .models import CustomUser, Profile


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Flat serializer that merges CustomUser + Profile into one response.
    Read:  returns all account + profile fields.
    Write: only updates allowed profile fields (not auth fields like email/password).
    """
    # From Profile
    name       = serializers.CharField(source='profile.name',      required=False, allow_blank=True)
    phone      = serializers.CharField(source='profile.phone',     required=False, allow_blank=True)
    location   = serializers.CharField(source='profile.location',  required=False, allow_blank=True)
    website    = serializers.URLField( source='profile.website',   required=False, allow_blank=True)
    linkedin   = serializers.URLField( source='profile.linkedin',  required=False, allow_blank=True)
    github     = serializers.URLField( source='profile.github',    required=False, allow_blank=True)
    avatar     = serializers.CharField(source='profile.avatar',    required=False, allow_blank=True)
    # Tracks the last portfolio the user was editing (cross-device persistence)
    last_edited_portfolio_id = serializers.IntegerField(
        source='profile.last_edited_portfolio_id', required=False, allow_null=True
    )

    class Meta:
        model  = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            # Profile fields
            'name', 'phone', 'location', 'website', 'linkedin', 'github', 'avatar',
            'last_edited_portfolio_id',
        ]
        read_only_fields = ['id', 'email']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        # Update CustomUser fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update or create Profile
        profile, _ = Profile.objects.get_or_create(user=instance)
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        return instance
