from django.urls import path
from .views import VRSLeaderboardView, ComputeVRSView, VolunteerAnalyticsSummaryView

urlpatterns = [
    path('vrs/',           VRSLeaderboardView.as_view(),           name='vrs-leaderboard'),
    path('compute/',       ComputeVRSView.as_view(),               name='vrs-compute'),
    path('my-analytics/',  VolunteerAnalyticsSummaryView.as_view(), name='volunteer-my-analytics'),
]