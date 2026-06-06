from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from portfolios.models import Portfolio, Project, ProjectClick, PortfolioEvent, PortfolioVisit, TrafficSource
from portfolios.views import classify_traffic_source
from analytics.services.ai_insights import generate_ai_insights

User = get_user_model()

class AIInsightsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="password")
        self.portfolio = Portfolio.objects.create(
            user=self.user,
            name="My Test Portfolio",
            theme="Dark",
            gallery=[{"id": 1, "image": "img1.png"}]
        )
        self.client = APIClient()
        
    def test_generate_ai_insights_low_data(self):
        insights = generate_ai_insights(self.portfolio)
        self.assertTrue(len(insights) >= 2)
        # Should include fallback insights
        titles = [i["title"] for i in insights]
        self.assertIn("Real-time AI Analysis", titles)
        
    def test_top_project_heuristic(self):
        p1 = Project.objects.create(portfolio=self.portfolio, title="Project 1")
        p2 = Project.objects.create(portfolio=self.portfolio, title="Project 2")
        
        # Add clicks
        for i in range(10):
            ProjectClick.objects.create(project=p1, visitor_id=f"v{i}", link_type="live")
        
        insights = generate_ai_insights(self.portfolio)
        titles = [i["title"] for i in insights]
        self.assertIn("Top Performing Project", titles)
        
        # Verify priority sorting
        self.assertEqual(insights[0]["priority"], "high")

    def test_ai_insights_view_unauthenticated(self):
        response = self.client.get(f"/api/analytics/ai-insights/?portfolio_id={self.portfolio.id}")
        self.assertEqual(response.status_code, 401)

    def test_ai_insights_view_authenticated_success(self):
        refresh = RefreshToken.for_user(self.user)
        token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(f"/api/analytics/ai-insights/?portfolio_id={self.portfolio.id}")
        self.assertEqual(response.status_code, 200)
        self.assertIn("insights", response.json())
        self.assertTrue(len(response.json()["insights"]) >= 2)

    def test_ai_insights_view_unauthorized_user(self):
        other_user = User.objects.create_user(username="otheruser", email="other@example.com", password="password")
        refresh = RefreshToken.for_user(other_user)
        token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(f"/api/analytics/ai-insights/?portfolio_id={self.portfolio.id}")
        self.assertEqual(response.status_code, 404)


class TrafficSourceTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="password")
        self.portfolio = Portfolio.objects.create(
            user=self.user,
            name="My Test Portfolio",
            theme="Dark"
        )
        self.client = APIClient()

    def test_classify_traffic_source(self):
        # Direct
        self.assertEqual(classify_traffic_source(None, None), "Direct")
        self.assertEqual(classify_traffic_source("", ""), "Direct")
        self.assertEqual(classify_traffic_source("", "direct"), "Direct")
        
        # UTM Sources
        self.assertEqual(classify_traffic_source("", "email"), "Email")
        self.assertEqual(classify_traffic_source("", "newsletter"), "Email")
        self.assertEqual(classify_traffic_source("", "linkedin"), "LinkedIn")
        self.assertEqual(classify_traffic_source("", "github"), "GitHub")
        self.assertEqual(classify_traffic_source("", "whatsapp"), "WhatsApp")
        self.assertEqual(classify_traffic_source("", "reddit"), "Reddit")
        self.assertEqual(classify_traffic_source("", "google"), "Google")
        self.assertEqual(classify_traffic_source("", "bing"), "Bing")
        self.assertEqual(classify_traffic_source("", "x"), "X")
        self.assertEqual(classify_traffic_source("", "twitter"), "X")
        self.assertEqual(classify_traffic_source("", "share"), "Share")
        self.assertEqual(classify_traffic_source("", "qrcode"), "QR Code")
        self.assertEqual(classify_traffic_source("", "native_share"), "Native Share")
        self.assertEqual(classify_traffic_source("", "tiktok"), "TikTok")
        self.assertEqual(classify_traffic_source("", "threads"), "Threads")
        self.assertEqual(classify_traffic_source("", "snapchat"), "Snapchat")
        self.assertEqual(classify_traffic_source("", "yahoo"), "Yahoo")
        self.assertEqual(classify_traffic_source("", "yandex"), "Yandex")
        self.assertEqual(classify_traffic_source("", "baidu"), "Baidu")
        self.assertEqual(classify_traffic_source("", "ecosia"), "Ecosia")
        self.assertEqual(classify_traffic_source("", "brave"), "Brave Search")
        
        # Referrer domains
        self.assertEqual(classify_traffic_source("https://t.co/xyz", ""), "X")
        self.assertEqual(classify_traffic_source("https://x.com/feed", ""), "X")
        self.assertEqual(classify_traffic_source("https://twitter.com/feed", ""), "X")
        self.assertEqual(classify_traffic_source("https://www.linkedin.com/feed", ""), "LinkedIn")
        self.assertEqual(classify_traffic_source("https://github.com/profile", ""), "GitHub")
        self.assertEqual(classify_traffic_source("https://web.whatsapp.com/", ""), "WhatsApp")
        self.assertEqual(classify_traffic_source("https://t.me/channel", ""), "Telegram")
        self.assertEqual(classify_traffic_source("https://reddit.com/r/python", ""), "Reddit")
        self.assertEqual(classify_traffic_source("https://discord.gg/invite", ""), "Discord")
        self.assertEqual(classify_traffic_source("https://www.google.com/search", ""), "Google")
        self.assertEqual(classify_traffic_source("https://bing.com/search", ""), "Bing")
        self.assertEqual(classify_traffic_source("https://duckduckgo.com/", ""), "DuckDuckGo")
        self.assertEqual(classify_traffic_source("https://mail.google.com/", ""), "Email")
        self.assertEqual(classify_traffic_source("https://someblog.com/post", ""), "Referral")
        
        # Custom Campaign source format
        self.assertEqual(classify_traffic_source("", "partner_newsletter"), "Partner Newsletter")

    def test_traffic_sources_view_authenticated(self):
        # Create mock data
        TrafficSource.objects.create(portfolio=self.portfolio, source="Direct", visit_count=5)
        TrafficSource.objects.create(portfolio=self.portfolio, source="LinkedIn", visit_count=5)
        
        # Authenticated
        refresh = RefreshToken.for_user(self.user)
        token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(f"/api/analytics/traffic-sources/?portfolio_id={self.portfolio.id}")
        self.assertEqual(response.status_code, 200)
        
        sources = response.json()["sources"]
        direct = next(s for s in sources if s["source"] == "Direct")
        self.assertEqual(direct["count"], 5)
        self.assertEqual(direct["percentage"], 50)
        
        linkedin = next(s for s in sources if s["source"] == "LinkedIn")
        self.assertEqual(linkedin["count"], 5)
        self.assertEqual(linkedin["percentage"], 50)

    def test_traffic_sources_total_view(self):
        # Create second portfolio and mock data
        p2 = Portfolio.objects.create(user=self.user, name="Portfolio 2")
        TrafficSource.objects.create(portfolio=self.portfolio, source="LinkedIn", visit_count=3)
        TrafficSource.objects.create(portfolio=p2, source="LinkedIn", visit_count=7)
        
        refresh = RefreshToken.for_user(self.user)
        token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get("/api/analytics/traffic-sources/total/")
        self.assertEqual(response.status_code, 200)
        
        sources = response.json()["sources"]
        linkedin = next(s for s in sources if s["source"] == "LinkedIn")
        self.assertEqual(linkedin["count"], 10)
        self.assertEqual(linkedin["percentage"], 100)


class AnalyticsPipelineTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="password")
        self.portfolio = Portfolio.objects.create(
            user=self.user,
            name="My Test Portfolio",
            theme="Dark",
            status="Published"
        )
        self.client = APIClient()

    def test_utm_source_linkedin_view_tracking(self):
        payload = {
            "event_type": "view",
            "visitor_id": "test_visitor_123",
            "referrer": "",
            "utm_source": "linkedin"
        }
        response = self.client.post(
            f"/api/portfolios/{self.portfolio.id}/analytics/",
            payload,
            format="json"
        )
        self.assertEqual(response.status_code, 200)

        # Verify database record
        ts = TrafficSource.objects.filter(portfolio=self.portfolio, source="LinkedIn").first()
        self.assertIsNotNone(ts)
        self.assertEqual(ts.visit_count, 1)

        # Authenticate to fetch dashboard traffic sources
        refresh = RefreshToken.for_user(self.user)
        token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get(f"/api/analytics/traffic-sources/?portfolio_id={self.portfolio.id}")
        self.assertEqual(response.status_code, 200)
        sources = response.json()["sources"]
        linkedin = next((s for s in sources if s["source"] == "LinkedIn"), None)
        self.assertIsNotNone(linkedin)
        self.assertEqual(linkedin["count"], 1)

    def test_source_linkedin_legacy_fallback(self):
        payload = {
            "event_type": "view",
            "visitor_id": "test_visitor_456",
            "referrer": "",
            "source": "linkedin"
        }
        response = self.client.post(
            f"/api/portfolios/{self.portfolio.id}/analytics/",
            payload,
            format="json"
        )
        self.assertEqual(response.status_code, 200)

        ts = TrafficSource.objects.filter(portfolio=self.portfolio, source="LinkedIn").first()
        self.assertIsNotNone(ts)

    def test_multitouch_persistence(self):
        # Test page view event saves first-touch and last-touch fields
        payload = {
            "event_type": "view",
            "visitor_id": "test_multitouch_visitor",
            "referrer": "https://linkedin.com/",
            "source": "LinkedIn",
            "medium": "social",
            "campaign": "brand",
            "utm_source": "linkedin",
            "utm_medium": "social",
            "utm_campaign": "brand",
            "first_touch_source": "LinkedIn",
            "first_touch_medium": "social",
            "first_touch_campaign": "brand",
            "last_touch_source": "Google",
            "last_touch_medium": "organic",
            "last_touch_campaign": "search"
        }
        response = self.client.post(
            f"/api/portfolios/{self.portfolio.id}/analytics/",
            payload,
            format="json"
        )
        self.assertEqual(response.status_code, 200)

        # Verify database event record
        event = PortfolioEvent.objects.filter(visitor_id="test_multitouch_visitor", event_type="view").first()
        self.assertIsNotNone(event)
        self.assertEqual(event.source, "LinkedIn")
        self.assertEqual(event.medium, "social")
        self.assertEqual(event.campaign, "brand")
        self.assertEqual(event.utm_source, "linkedin")
        self.assertEqual(event.first_touch_source, "LinkedIn")
        self.assertEqual(event.first_touch_medium, "social")
        self.assertEqual(event.first_touch_campaign, "brand")
        self.assertEqual(event.last_touch_source, "Google")
        self.assertEqual(event.last_touch_medium, "organic")
        self.assertEqual(event.last_touch_campaign, "search")

    def test_project_click_attribution(self):
        project = Project.objects.create(portfolio=self.portfolio, title="Test Project")
        payload = {
            "project_id": project.id,
            "link_type": "live",
            "visitor_id": "proj_visitor",
            "source": "LinkedIn",
            "medium": "social",
            "campaign": "profile",
            "utm_source": "linkedin",
            "first_touch_source": "LinkedIn",
            "first_touch_medium": "social",
            "first_touch_campaign": "profile",
            "last_touch_source": "LinkedIn",
            "last_touch_medium": "social",
            "last_touch_campaign": "profile"
        }
        response = self.client.post(
            "/api/portfolios/track-project-click/",
            payload,
            format="json"
        )
        self.assertEqual(response.status_code, 200)

        # Verify ProjectClick record
        click = ProjectClick.objects.filter(project=project, visitor_id="proj_visitor").first()
        self.assertIsNotNone(click)
        self.assertEqual(click.source, "LinkedIn")
        self.assertEqual(click.medium, "social")
        self.assertEqual(click.campaign, "profile")
        self.assertEqual(click.first_touch_source, "LinkedIn")
        self.assertEqual(click.last_touch_source, "LinkedIn")

    def test_social_share_beacon_payload(self):
        # Test that POST to track_share reads POST payload and populates SocialShareEvent attribution fields
        payload = {
            "source": "LinkedIn",
            "medium": "social",
            "campaign": "viral",
            "utm_source": "linkedin",
            "first_touch_source": "LinkedIn",
            "first_touch_medium": "social",
            "first_touch_campaign": "viral",
            "last_touch_source": "LinkedIn",
            "last_touch_medium": "social",
            "last_touch_campaign": "viral"
        }
        response = self.client.post(
            f"/api/analytics/track/{self.portfolio.id}/",
            payload,
            format="json"
        )
        self.assertEqual(response.status_code, 204)

        from analytics.models import SocialShareEvent
        event = SocialShareEvent.objects.filter(portfolio=self.portfolio).first()
        self.assertIsNotNone(event)
        self.assertEqual(event.platform, "linkedin")
        self.assertEqual(event.source, "LinkedIn")
        self.assertEqual(event.utm_source, "linkedin")
        self.assertEqual(event.first_touch_source, "LinkedIn")
        self.assertEqual(event.last_touch_source, "LinkedIn")

    def test_recent_records_endpoint(self):
        # Create a sample PortfolioEvent
        PortfolioEvent.objects.create(
            portfolio=self.portfolio,
            event_type="view",
            visitor_id="recent_visitor",
            source="Brave Search",
            medium="organic",
            campaign="test_campaign",
            utm_source="brave",
            utm_medium="organic",
            utm_campaign="test_campaign",
            first_touch_source="Brave Search",
            last_touch_source="Brave Search"
        )
        response = self.client.get("/api/analytics/recent-records/")
        self.assertEqual(response.status_code, 200)
        records = response.json()
        self.assertTrue(len(records) > 0)
        self.assertEqual(records[0]["visitor_id"], "recent_visitor")
        self.assertEqual(records[0]["source"], "Brave Search")
        self.assertEqual(records[0]["first_touch_source"], "Brave Search")
