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
        self.assertEqual(classify_traffic_source(None, None), "Direct")
        self.assertEqual(classify_traffic_source("", ""), "Direct")
        
        # UTM Sources
        self.assertEqual(classify_traffic_source("", "email"), "Email")
        self.assertEqual(classify_traffic_source("", "newsletter"), "Email")
        self.assertEqual(classify_traffic_source("", "linkedin"), "Social")
        self.assertEqual(classify_traffic_source("", "google"), "Search")
        
        # Referrer domains
        self.assertEqual(classify_traffic_source("https://t.co/xyz", ""), "Social")
        self.assertEqual(classify_traffic_source("https://www.linkedin.com/feed", ""), "Social")
        self.assertEqual(classify_traffic_source("https://www.google.com/search", ""), "Search")
        self.assertEqual(classify_traffic_source("https://mail.google.com/", ""), "Email")
        self.assertEqual(classify_traffic_source("https://someblog.com/post", ""), "Referral")

    def test_traffic_sources_view_authenticated(self):
        # Create mock data
        TrafficSource.objects.create(portfolio=self.portfolio, source="Direct", visit_count=5)
        TrafficSource.objects.create(portfolio=self.portfolio, source="Social", visit_count=5)
        
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
        
        social = next(s for s in sources if s["source"] == "Social")
        self.assertEqual(social["count"], 5)
        self.assertEqual(social["percentage"], 50)

    def test_traffic_sources_total_view(self):
        # Create second portfolio and mock data
        p2 = Portfolio.objects.create(user=self.user, name="Portfolio 2")
        TrafficSource.objects.create(portfolio=self.portfolio, source="Social", visit_count=3)
        TrafficSource.objects.create(portfolio=p2, source="Social", visit_count=7)
        
        refresh = RefreshToken.for_user(self.user)
        token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get("/api/analytics/traffic-sources/total/")
        self.assertEqual(response.status_code, 200)
        
        sources = response.json()["sources"]
        social = next(s for s in sources if s["source"] == "Social")
        self.assertEqual(social["count"], 10)
        self.assertEqual(social["percentage"], 100)
