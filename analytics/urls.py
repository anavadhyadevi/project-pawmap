from django.urls import path
from .views import RunDBSCANView, LatestHotspotsView, AllCasesGeoView, NgoAnalyticsSummaryView

urlpatterns = [
    path('run-dbscan/',   RunDBSCANView.as_view(),         name='run-dbscan'),
    path('hotspots/',     LatestHotspotsView.as_view(),     name='latest-hotspots'),
    path('cases-geo/',    AllCasesGeoView.as_view(),        name='cases-geo'),
    path('ngo-summary/',  NgoAnalyticsSummaryView.as_view(), name='ngo-analytics-summary'),
]