from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from portfolios.models import Portfolio

User = get_user_model()

class PortfolioAvatarTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="password")
        self.client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_portfolio_with_avatar(self):
        payload = {
            "name": "My Portfolio",
            "template": "Developer",
            "theme": "Midnight",
            "user": {
                "name": "Test User",
                "avatar": "http://example.com/initial_avatar.png"
            }
        }
        response = self.client.post("/api/portfolios/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        
        portfolio = Portfolio.objects.get(id=response.json()["id"])
        self.assertEqual(portfolio.avatar, "http://example.com/initial_avatar.png")

    def test_update_portfolio_change_avatar(self):
        portfolio = Portfolio.objects.create(
            user=self.user,
            name="My Portfolio",
            avatar="http://example.com/old_avatar.png"
        )
        
        payload = {
            "name": "Updated Portfolio",
            "user": {
                "name": "Test User",
                "avatar": "http://example.com/new_avatar.png"
            }
        }
        response = self.client.put(f"/api/portfolios/{portfolio.id}/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        
        portfolio.refresh_from_db()
        self.assertEqual(portfolio.avatar, "http://example.com/new_avatar.png")

    def test_update_portfolio_remove_avatar(self):
        portfolio = Portfolio.objects.create(
            user=self.user,
            name="My Portfolio",
            avatar="http://example.com/old_avatar.png"
        )
        
        payload = {
            "name": "Updated Portfolio",
            "user": {
                "name": "Test User",
                "avatar": None
            }
        }
        response = self.client.put(f"/api/portfolios/{portfolio.id}/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        
        portfolio.refresh_from_db()
        self.assertIsNone(portfolio.avatar)

    def test_update_portfolio_preserve_avatar_when_not_provided(self):
        portfolio = Portfolio.objects.create(
            user=self.user,
            name="My Portfolio",
            avatar="http://example.com/old_avatar.png"
        )
        
        payload = {
            "name": "Updated Portfolio",
            "user": {
                "name": "Test User"
                # 'avatar' key is explicitly omitted
            }
        }
        response = self.client.put(f"/api/portfolios/{portfolio.id}/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        
        portfolio.refresh_from_db()
        self.assertEqual(portfolio.avatar, "http://example.com/old_avatar.png")


class PortfolioURLValidationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="password")
        from users.models import Profile
        Profile.objects.create(user=self.user, name="Test User")
        self.client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_save_portfolio_with_malformed_and_username_urls(self):
        # Even if website or social links are plain usernames or malformed, the save should not fail.
        # to_internal_value will normalize them by prepending https://, and they will save successfully.
        portfolio = Portfolio.objects.create(
            user=self.user,
            name="My Portfolio"
        )
        
        payload = {
            "name": "Updated Portfolio",
            "user": {
                "name": "Test User",
                "github": "my-github-username",
                "website": "my-website.com",
                "linkedin": "https://linkedin.com/in/my-profile"
            }
        }
        
        response = self.client.put(f"/api/portfolios/{portfolio.id}/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        
        # Verify they saved successfully and normalized
        profile = self.user.profile
        profile.refresh_from_db()
        self.assertEqual(profile.github, "https://my-github-username")
        self.assertEqual(profile.website, "https://my-website.com")
        self.assertEqual(profile.linkedin, "https://linkedin.com/in/my-profile")

