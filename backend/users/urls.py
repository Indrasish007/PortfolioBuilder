from django.urls import path
from .views import (
    MeView,
    ChangePasswordView,
    ChangeEmailView,
    CheckUsernameView,
    DeleteAccountView,
)
from .last_edited_view import LastEditedPortfolioView

urlpatterns = [
    path('me/',               MeView.as_view(),                name='user-me'),
    path('change-password/',  ChangePasswordView.as_view(),     name='user-change-password'),
    path('change-email/',     ChangeEmailView.as_view(),        name='user-change-email'),
    path('check-username/',   CheckUsernameView.as_view(),      name='user-check-username'),
    path('delete-account/',   DeleteAccountView.as_view(),      name='user-delete-account'),
    path('last-edited/',      LastEditedPortfolioView.as_view(), name='user-last-edited'),
]
