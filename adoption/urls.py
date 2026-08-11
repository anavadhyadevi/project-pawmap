from django.urls import path
from .views import (
    AdoptionListingListCreateView, AdoptionListingDetailView,
    ExpressInterestView, ApproveAdopterView
)

urlpatterns = [
    path('',                               AdoptionListingListCreateView.as_view(), name='adoption-list'),
    path('<str:listing_id>/',              AdoptionListingDetailView.as_view(),     name='adoption-detail'),
    path('<str:listing_id>/interest/',     ExpressInterestView.as_view(),           name='express-interest'),
    path('<str:listing_id>/approve/',      ApproveAdopterView.as_view(),            name='approve-adopter'),
]