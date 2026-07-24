from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, MeView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/',    LoginView.as_view(),    name='user-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/',       MeView.as_view(),       name='user-me'),
]