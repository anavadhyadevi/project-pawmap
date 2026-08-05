from django.urls import path
from .views import (
    AnimalListCreateView, AnimalDetailView,
    TemperamentRatingView, AdoptionReadyAnimalsView
)

urlpatterns = [
    path('',                              AnimalListCreateView.as_view(),    name='animal-list-create'),
    path('adopt/',                        AdoptionReadyAnimalsView.as_view(), name='adoption-ready'),
    path('<str:animal_id>/',              AnimalDetailView.as_view(),        name='animal-detail'),
    path('<str:animal_id>/rate/',         TemperamentRatingView.as_view(),   name='animal-rate'),
]