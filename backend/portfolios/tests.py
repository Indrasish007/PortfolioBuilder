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
        
        # Verify they saved successfully and normalized on portfolio override fields
        portfolio.refresh_from_db()
        self.assertEqual(portfolio.profile_github, "https://my-github-username")
        self.assertEqual(portfolio.profile_website, "https://my-website.com")
        self.assertEqual(portfolio.profile_linkedin, "https://linkedin.com/in/my-profile")

        # Verify that the shared profile remains unchanged
        profile = self.user.profile
        profile.refresh_from_db()
        self.assertNotEqual(profile.github, "https://my-github-username")
        self.assertNotEqual(profile.website, "https://my-website.com")


class PortfolioSEOTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="seouser", email="seo@example.com", password="password")
        from users.models import Profile
        self.profile = Profile.objects.create(
            user=self.user,
            name="SEO Expert",
            title="SEO Architect",
            bio="Passionate about search engines and optimization."
        )
        self.portfolio = Portfolio.objects.create(
            user=self.user,
            name="My Portfolio",
            slug="seo-expert",
            avatar="data:image/png;base64,invalidbase64"  # Base64 avatar to test guard
        )
        self.client = APIClient()

    def test_seo_title_generation(self):
        from portfolios.services.seo import generate_title
        # 1. Title with name and headline
        title = generate_title(self.portfolio)
        self.assertEqual(title, "SEO Expert | SEO Architect")

        # 2. Title with name only
        self.profile.title = ""
        self.profile.save()
        title = generate_title(self.portfolio)
        self.assertEqual(title, "SEO Expert | Portfolio")

        # 3. Default fallback
        self.profile.name = ""
        self.portfolio.name = ""
        self.profile.save()
        self.portfolio.save()
        title = generate_title(self.portfolio)
        self.assertEqual(title, "Professional Portfolio")

    def test_seo_description_generation(self):
        from portfolios.services.seo import generate_description
        # 1. Bio priority
        description = generate_description(self.portfolio)
        self.assertEqual(description, "Passionate about search engines and optimization.")

        # 2. Short bio falls back to headline + name
        self.profile.bio = "Short"
        self.profile.save()
        description = generate_description(self.portfolio)
        self.assertEqual(description, "Explore SEO Expert's professional portfolio. SEO Architect.")

    def test_canonical_url_always_uses_platform_base(self):
        from portfolios.services.seo import generate_canonical_url
        # Under standard cases
        url = generate_canonical_url(self.portfolio)
        self.assertEqual(url, "https://portfoliobuilder.com/u/seo-expert")

        # No slug fallback to ID
        self.portfolio.slug = None
        self.portfolio.save()
        url = generate_canonical_url(self.portfolio)
        self.assertEqual(url, f"https://portfoliobuilder.com/u/{self.portfolio.pk}")

    def test_base64_avatar_guard_in_open_graph(self):
        from portfolios.services.seo import generate_open_graph
        og = generate_open_graph(self.portfolio)
        # Because avatar starts with 'data:', it must fallback to the default dynamic OG image view
        self.assertEqual(og["og:image"], "https://portfoliobuilder.com/api/portfolios/public/slug/seo-expert/og/")

        # Set valid public URL avatar
        self.portfolio.avatar = "/static/my_avatar.png"
        self.portfolio.save()
        # Even with an avatar, standard open graph defaults to our dynamic SVG as requested by Phase 4
        og = generate_open_graph(self.portfolio)
        self.assertEqual(og["og:image"], "https://portfoliobuilder.com/api/portfolios/public/slug/seo-expert/og/")

    def test_schema_knows_about_skills(self):
        from portfolios.services.seo import generate_schema
        from portfolios.models import Skill
        Skill.objects.create(portfolio=self.portfolio, name="SEO")
        Skill.objects.create(portfolio=self.portfolio, name="Django")

        schema = generate_schema(self.portfolio)
        person_node = next(item for item in schema["@graph"] if item["@type"] == "Person")
        self.assertEqual(person_node["knowsAbout"], ["SEO", "Django"])

    def test_public_views_inject_seo_payload(self):
        # 1. Publish the portfolio
        self.portfolio.status = "Published"
        self.portfolio.save()

        # 2. Verify GET by ID
        response = self.client.get(f"/api/portfolios/public/{self.portfolio.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("seo", response.json())
        seo = response.json()["seo"]
        self.assertEqual(seo["title"], "SEO Expert | SEO Architect")
        self.assertEqual(seo["canonical_url"], "https://portfoliobuilder.com/u/seo-expert")

        # 3. Verify GET by Slug
        response = self.client.get(f"/api/portfolios/public/slug/{self.portfolio.slug}/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("seo", response.json())

        # 4. Verify GET by Domain
        self.portfolio.domain = "expertseo.com"
        self.portfolio.save()
        response = self.client.get(f"/api/portfolios/public/domain/{self.portfolio.domain}/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("seo", response.json())
        self.assertEqual(response.json()["seo"]["canonical_url"], "https://portfoliobuilder.com/u/seo-expert")

    def test_sitemap_xml_generation_and_caching(self):
        # 1. Create a draft portfolio (should be excluded)
        Portfolio.objects.create(
            user=self.user,
            name="Draft Portfolio",
            status="Draft"
        )
        # 2. Make our initial portfolio published
        self.portfolio.status = "Published"
        self.portfolio.save()

        # 3. Request sitemap index
        response = self.client.get("/sitemap.xml")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/xml")
        
        # Verify content of index
        xml_content = response.content.decode()
        self.assertIn("<sitemapindex", xml_content)
        self.assertIn("/sitemap-portfolios.xml", xml_content)
        self.assertIn("/sitemap-images.xml", xml_content)

        # 4. Request portfolio sub-sitemap
        response = self.client.get("/sitemap-portfolios.xml")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/xml")
        
        xml_content = response.content.decode()
        self.assertIn("<urlset", xml_content)
        self.assertIn("https://portfoliobuilder.com/u/seo-expert", xml_content)
        self.assertNotIn("Draft Portfolio", xml_content)
        self.assertIn("<changefreq>weekly</changefreq>", xml_content)
        self.assertIn("<priority>0.8</priority>", xml_content)

        # 5. Request image sub-sitemap
        response = self.client.get("/sitemap-images.xml")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/xml")

    def test_robots_txt_view(self):
        response = self.client.get("/robots.txt")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/plain")
        
        content = response.content.decode()
        self.assertIn("User-agent: *", content)
        self.assertIn("Allow: /p/", content)
        self.assertIn("Disallow: /admin/", content)
        self.assertIn("Disallow: /api/", content)
        self.assertIn("Sitemap: https://portfoliobuilder.com/sitemap.xml", content)

    def test_custom_seo_overrides(self):
        # Set custom settings
        self.portfolio.custom_seo_title = "My Override Title"
        self.portfolio.custom_seo_description = "My override meta description."
        self.portfolio.custom_og_image = "https://example.com/custom-og.png"
        self.portfolio.save()

        from portfolios.services.seo import generate_seo_payload
        payload = generate_seo_payload(self.portfolio)

        self.assertEqual(payload["title"], "My Override Title")
        self.assertEqual(payload["description"], "My override meta description.")
        self.assertEqual(payload["open_graph"]["og:image"], "https://example.com/custom-og.png")

    def test_to_representation_owner_only_stripping_and_context_safety(self):
        self.portfolio.custom_seo_title = "Secret Title"
        self.portfolio.custom_seo_description = "Secret Desc"
        self.portfolio.custom_og_image = "https://example.com/secret-og.png"
        self.portfolio.save()

        # 1. Access by Owner (using authenticated client setup in setUp)
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/portfolios/{self.portfolio.id}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["custom_seo_title"], "Secret Title")
        self.assertEqual(data["custom_seo_description"], "Secret Desc")
        self.assertEqual(data["custom_og_image"], "https://example.com/secret-og.png")

        # 2. Access by Non-Owner
        other_user = User.objects.create_user(username="other", email="other@test.com", password="password")
        self.client.force_authenticate(user=other_user)
        response = self.client.get(f"/api/portfolios/{self.portfolio.id}/")
        # Note: Portfolios have get_queryset filter(user=self.request.user) so GET /api/portfolios/{id}
        # for non-owner returns 404. Let's verify that the public retrieval endpoints strip it!
        self.portfolio.status = "Published"
        self.portfolio.save()
        
        response = self.client.get(f"/api/portfolios/public/{self.portfolio.id}/")
        self.assertEqual(response.status_code, 200)
        public_data = response.json()
        self.assertNotIn("custom_seo_title", public_data)
        self.assertNotIn("custom_seo_description", public_data)
        self.assertNotIn("custom_og_image", public_data)
        
        # But wait, the computed title & desc are still exposed inside the injected seo block!
        self.assertEqual(public_data["seo"]["title"], "Secret Title")

        # 3. Context safety check (instantiating serializer without request context)
        from portfolios.serializers import PortfolioSerializer
        serializer = PortfolioSerializer(self.portfolio)
        rep = serializer.data  # Should succeed without throwing KeyError
        self.assertNotIn("custom_seo_title", rep)

    def test_seo_scoring_and_recommendations(self):
        from portfolios.services.seo import generate_seo_payload, generate_seo_score
        
        # Test low scoring portfolio
        self.portfolio.skills.all().delete()
        self.portfolio.slug = ""
        self.portfolio.avatar = ""
        self.profile.bio = ""
        self.profile.title = ""
        self.profile.name = ""
        self.portfolio.name = ""
        self.profile.save()
        self.portfolio.save()

        score = generate_seo_score(self.portfolio)
        self.assertEqual(score, 0)  # No fields populated
        
        payload = generate_seo_payload(self.portfolio)
        self.assertEqual(payload["score"], 0)
        self.assertTrue(len(payload["recommendations"]) >= 2)
        
        # Verify recommendation text
        self.assertIn("Write a bio", payload["recommendations"][0])

        # Test high scoring portfolio
        self.portfolio.skills.all().delete()
        from portfolios.models import Skill
        Skill.objects.create(portfolio=self.portfolio, name="Django")
        Skill.objects.create(portfolio=self.portfolio, name="Python")
        Skill.objects.create(portfolio=self.portfolio, name="SEO")
        
        self.portfolio.slug = "seo-expert"
        self.portfolio.avatar = "https://example.com/avatar.png"
        self.profile.name = "Mohit Halder"
        self.profile.title = "Data Architect"
        self.profile.bio = "A long bio that is definitely over one hundred characters to improve our search engine optimization scoring index."
        self.profile.save()
        self.portfolio.save()

        score = generate_seo_score(self.portfolio)
        # profile name (15) + headline (15) + bio >= 100 (20) + avatar (15) + skills >= 3 (10) + slug (10) = 85
        self.assertEqual(score, 85)

        payload = generate_seo_payload(self.portfolio)
        self.assertEqual(payload["score"], 85)
        # Should now suggest setting custom overrides (impact 5 pts each)
        self.assertIn("Set a custom SEO title", payload["recommendations"][0])


from unittest.mock import patch
from django.core.files.uploadedfile import SimpleUploadedFile

class ImageUploadTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser2", email="test2@example.com", password="password")
        self.client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    @patch('cloudinary.uploader.upload')
    def test_upload_image_success(self, mock_upload):
        mock_upload.return_value = {
            "secure_url": "https://res.cloudinary.com/mock-cloud/image/upload/v12345/test.png"
        }
        
        file_data = b"fake image content"
        uploaded_file = SimpleUploadedFile("avatar.png", file_data, content_type="image/png")
        
        response = self.client.post("/api/portfolios/upload-image/", {"image": uploaded_file}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["url"], "https://res.cloudinary.com/mock-cloud/image/upload/v12345/test.png")
        mock_upload.assert_called_once()

    def test_upload_image_no_file(self):
        response = self.client.post("/api/portfolios/upload-image/", {}, format="multipart")
        self.assertEqual(response.status_code, 400)



