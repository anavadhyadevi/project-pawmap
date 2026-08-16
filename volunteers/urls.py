from django.urls import path
from .views import VolunteerVRSView, ComputeVRSView, VolunteerAnalyticsSummaryView

urlpatterns = [
    path('vrs/',           VolunteerVRSView.as_view(),             name='volunteer-vrs'),
    path('compute/',       ComputeVRSView.as_view(),               name='vrs-compute'),
    path('my-analytics/',  VolunteerAnalyticsSummaryView.as_view(), name='volunteer-my-analytics'),
]