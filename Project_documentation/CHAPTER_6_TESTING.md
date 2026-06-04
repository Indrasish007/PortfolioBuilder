# Chapter 6: Testing

## 6.1 Testing Methodology

A multi-tiered testing strategy was adopted to verify the reliability, security, and performance of PortfolioBuilder:

1. **Unit Testing**: Testing individual functions, calculations, and database models in isolation (e.g., verifying traffic source categorization and scoring logic).
2. **Integration Testing**: Testing the communication between connected components, such as API request-response lifecycles, simplejwt authentication filters, and file upload pipelines.
3. **Security and Access Control Testing**: Verifying that endpoints are protected and only authenticated users can edit portfolios or view private metrics.
4. **User Acceptance Testing (UAT)**: Evaluating the system against functional checklists to ensure compatibility with user expectations.

---

## 6.2 Test Environment Configuration

The backend testing suite is run using Django's built-in testing framework:
*   **Test Database**: Django creates a separate database in memory (`sqlite:///:memory:`) for each test run to ensure tests do not affect production data.
*   **HTTP Client**: `APIClient` from the Django REST Framework simulates REST requests.
*   **Token Authentication**: Test setups use SimpleJWT's `RefreshToken` helper to generate access tokens and inject them into request headers.

---

## 6.3 Backend Unit Test Walkthroughs

The testing suite in [tests.py](file:///d:/PortfolioBuilder/backend/analytics/tests.py) validates the core analytics heuristics, traffic categorization, and endpoint permissions.

### 6.3.1 Analytics Insights Testing
The `AIInsightsTestCase` validates the generation of behavioral insights:

```python
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
        # Verify that portfolios with limited data receive default fallback insights
        insights = generate_ai_insights(self.portfolio)
        self.assertTrue(len(insights) >= 2)
        titles = [i["title"] for i in insights]
        self.assertIn("Real-time AI Analysis", titles)

    def test_top_project_heuristic(self):
        # Set up mock projects
        p1 = Project.objects.create(portfolio=self.portfolio, title="Project 1")
        p2 = Project.objects.create(portfolio=self.portfolio, title="Project 2")
        
        # Simulate click events on Project 1
        for i in range(10):
            ProjectClick.objects.create(project=p1, visitor_id=f"v{i}", link_type="live")
        
        insights = generate_ai_insights(self.portfolio)
        titles = [i["title"] for i in insights]
        self.assertIn("Top Performing Project", titles)
        self.assertEqual(insights[0]["priority"], "high")
```

### 6.3.2 Traffic Source Classification Testing
The traffic tracking service categorizes visitors based on referral URLs and query parameters. The test suite validates this classification logic:

```python
def test_classify_traffic_source(self):
    # Direct Visits
    self.assertEqual(classify_traffic_source(None, None), "Direct")
    self.assertEqual(classify_traffic_source("", ""), "Direct")
    
    # UTM Query Parameter Sources
    self.assertEqual(classify_traffic_source("", "email"), "Email")
    self.assertEqual(classify_traffic_source("", "newsletter"), "Email")
    self.assertEqual(classify_traffic_source("", "linkedin"), "LinkedIn")
    self.assertEqual(classify_traffic_source("", "github"), "GitHub")
    self.assertEqual(classify_traffic_source("", "whatsapp"), "WhatsApp")
    self.assertEqual(classify_traffic_source("", "qrcode"), "QR Code")
    
    # HTTP Referrer Header Domains
    self.assertEqual(classify_traffic_source("https://t.co/xyz", ""), "X/Twitter")
    self.assertEqual(classify_traffic_source("https://x.com/feed", ""), "X/Twitter")
    self.assertEqual(classify_traffic_source("https://www.linkedin.com/feed", ""), "LinkedIn")
    self.assertEqual(classify_traffic_source("https://github.com/profile", ""), "GitHub")
    self.assertEqual(classify_traffic_source("https://web.whatsapp.com/", ""), "WhatsApp")
    self.assertEqual(classify_traffic_source("https://www.google.com/search", ""), "Google")
```

### 6.3.3 API Security and Authorization Testing
Permission tests verify that API endpoints are protected against unauthenticated access:

```python
def test_ai_insights_view_unauthenticated(self):
    # Unauthenticated requests should be blocked with an HTTP 401 response
    response = self.client.get(f"/api/analytics/ai-insights/?portfolio_id={self.portfolio.id}")
    self.assertEqual(response.status_code, 401)

def test_ai_insights_view_authenticated_success(self):
    # Authenticated requests should succeed
    refresh = RefreshToken.for_user(self.user)
    token = str(refresh.access_token)
    self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    response = self.client.get(f"/api/analytics/ai-insights/?portfolio_id={self.portfolio.id}")
    self.assertEqual(response.status_code, 200)
    self.assertIn("insights", response.json())

def test_ai_insights_view_unauthorized_user(self):
    # Users should not be able to access other users' portfolios
    other_user = User.objects.create_user(username="otheruser", email="other@example.com", password="password")
    refresh = RefreshToken.for_user(other_user)
    token = str(refresh.access_token)
    self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    response = self.client.get(f"/api/analytics/ai-insights/?portfolio_id={self.portfolio.id}")
    self.assertEqual(response.status_code, 404)
```

---

## 6.4 AI Parser Fallback Testing Plan

The AI resume parser relies on external APIs (Groq and Gemini). To ensure system reliability if these APIs are unavailable, the test suite includes the following validation scenarios:

### Test Case: Rate Limiting Simulation
*   **Trigger**: The user uploads a resume file.
*   **Simulation**: The test suite mocks the Groq and Gemini clients to return HTTP 429 (Too Many Requests) or Resource Exhausted errors.
*   **Verification**: The system must catch the exceptions and run the `fallback_parse_cv()` method, extracting core fields via regex and keyword matching without throwing a server error.

### Test Case: Malformed File Simulation
*   **Trigger**: The user uploads a corrupted PDF file.
*   **Simulation**: The parser receives an empty string or a corrupted file object.
*   **Verification**: The system must catch the extraction error, return an HTTP 400 response, and display a user-friendly error message.

---

## 6.5 User Acceptance Testing (UAT) Matrices

### Table 6.1: Authentication and Account UAT Matrix
| Test ID | Test Scenario | Preconditions | Input Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UAT_AUTH_01` | Sign Up | Home page loaded | Email, Password, Name | Account created; tokens stored | As expected | Passed |
| `UAT_AUTH_02` | Sign In | Account exists | Valid Email/Password | JWT tokens received; redirected | As expected | Passed |
| `UAT_AUTH_03` | Token Refresh | Access token expired | Valid refresh token | New access token received | As expected | Passed |

### Table 6.2: AI Parsing and Onboarding UAT Matrix
| Test ID | Test Scenario | Preconditions | Input Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UAT_ONB_01` | Resume Parse | Authenticated | Valid PDF resume | JSON structure generated | As expected | Passed |
| `UAT_ONB_02` | Fallback Parse | APIs unavailable | Valid PDF resume | Heuristic parsing values | As expected | Passed |
| `UAT_ONB_03` | Form Validation | Onboarding open | Invalid email format | Validation error displayed | As expected | Passed |

### Table 6.3: Portfolio Editor UAT Matrix
| Test ID | Test Scenario | Preconditions | Input Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UAT_EDT_01` | Switch Layout | Editor open | Click 'BrutalistLayout' | Preview styles update | As expected | Passed |
| `UAT_EDT_02` | Undo Change | Modifications made | Click 'Undo' | Reverts to previous state | As expected | Passed |
| `UAT_EDT_03` | Asset Upload | Portfolio open | Select PNG file | Uploaded to Cloudinary | As expected | Passed |

### Table 6.4: Analytics Telemetry UAT Matrix
| Test ID | Test Scenario | Preconditions | Input Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UAT_ANL_01` | Log Page View | Public view open | Visitor loads URL | View count incremented | As expected | Passed |
| `UAT_ANL_02` | Track Click | Project links open | Click 'Live Demo' | click logged in database | As expected | Passed |
| `UAT_ANL_03` | Session Time | Page exit | Page viewed for 15s | 15s session duration logged | As expected | Passed |
