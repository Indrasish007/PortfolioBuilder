from rest_framework import serializers
from users.models import CustomUser, Profile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            username=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        # Create an empty profile automatically
        Profile.objects.create(user=user, name=user.first_name)
        return user

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = CustomUser.USERNAME_FIELD

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add email field to allow validation to pass if client sends email
        self.fields['email'] = serializers.EmailField(required=False, write_only=True)
        # Allow username/email (the custom user model USERNAME_FIELD) to be optional at first
        self.fields[self.username_field].required = False

    def validate(self, attrs):
        email_val = attrs.get('email')
        # If 'email' is in attrs and the username field is not, copy email to username
        if email_val and not attrs.get(self.username_field):
            attrs[self.username_field] = email_val
        return super().validate(attrs)

