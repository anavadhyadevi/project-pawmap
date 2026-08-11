from django.urls import path
from .views import RunDBSCANView, LatestHotspotsView, AllCasesGeoView

urlpatterns = [
    path('run-dbscan/',  RunDBSCANView.as_view(),      name='run-dbscan'),
    path('hotspots/',    LatestHotspotsView.as_view(),  name='latest-hotspots'),
    path('cases-geo/',   AllCasesGeoView.as_view(),     name='cases-geo'),
]