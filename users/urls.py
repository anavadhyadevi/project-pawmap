from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, MeView, LocationPingView,
    VolunteerListView, NgoListView, VerifyVolunteerView,
    PasswordResetRequestView, PasswordResetConfirmView,
)

urlpatterns = [
    path('register/',       RegisterView.as_view(),    name='user-register'),
    path('login/',          LoginView.as_view(),        name='user-login'),
    path('token/refresh/',  TokenRefreshView.as_view(), name='token-refresh'),
    path('me/',             MeView.as_view(),           name='user-me'),
    path('location/',       LocationPingView.as_view(), name='location-ping'),
    path('volunteers/',     VolunteerListView.as_view(), name='volunteer-list'),
    path('ngos/',           NgoListView.as_view(),      name='ngo-list'),
    path('<int:pk>/verify/', VerifyVolunteerView.as_view(), name='verify-volunteer'),
    # Password reset
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
