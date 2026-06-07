from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class SignupTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_signup_success(self):
        payload = {
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "first_name": "New User"
        }
        response = self.client.post("/api/auth/signup/", payload, format="json")
        print("SIGNUP RESPONSE STATUS:", response.status_code)
        print("SIGNUP RESPONSE DATA:", response.data)
        self.assertEqual(response.status_code, 201)

