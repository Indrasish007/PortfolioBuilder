from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import Profile

User = get_user_model()

class UserMePatchTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="password")
        self.profile, _ = Profile.objects.get_or_create(user=self.user)
        self.client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_patch_profile_success(self):
        payload = {
            "first_name": "John",
            "last_name": "Doe",
            "username": "johndoe",
            "name": "John Doe",
            "avatar": None
        }
        response = self.client.patch("/api/users/me/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(self.user.username, "johndoe")
        self.assertEqual(self.user.first_name, "John")
        self.assertEqual(self.user.last_name, "Doe")
        self.assertEqual(self.profile.name, "John Doe")
        self.assertIsNone(self.profile.avatar)

    def test_patch_contact_success(self):
        payload = {
            "phone": "123456789",
            "location": "New York",
            "website": "example.com",
            "linkedin": "https://linkedin.com/in/john",
            "github": "github.com/john"
        }
        response = self.client.patch("/api/users/me/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.phone, "123456789")
        self.assertEqual(self.profile.location, "New York")
        self.assertEqual(self.profile.website, "https://example.com")
        self.assertEqual(self.profile.linkedin, "https://linkedin.com/in/john")
        self.assertEqual(self.profile.github, "https://github.com/john")
