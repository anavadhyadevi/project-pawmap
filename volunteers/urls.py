from django.urls import path
from .views import VRSLeaderboardView, ComputeVRSView

urlpatterns = [
    path('vrs/', VRSLeaderboardView.as_view(), name='vrs-leaderboard'),
    path('compute/', ComputeVRSView.as_view(), name='vrs-compute'),
]