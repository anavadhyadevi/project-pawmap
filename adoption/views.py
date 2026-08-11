from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AdoptionListing, AdopterInterest, AdoptionRecord
from .serializers import (
    AdoptionListingSerializer, AdoptionListingCreateSerializer,
    AdopterInterestSerializer, AdoptionRecordSerializer
)


class AdoptionListingListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/adoption/          — list all active listings (public)
    POST /api/adoption/          — create listing (NGO Admin only)
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdoptionListingCreateSerializer
        return AdoptionListingSerializer

    def get_queryset(self):
        qs = AdoptionListing.objects.filter(status='Active')
        species = self.request.query_params.get('species')
        if species:
            qs = qs.filter(animal__species__iexact=species)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        listing = serializer.save(published_by=request.user)
        # mark animal as available
        listing.animal.adoption_status = 'Available'
        listing.animal.save()
        return Response(
            AdoptionListingSerializer(listing).data,
            status=status.HTTP_201_CREATED
        )


class AdoptionListingDetailView(generics.RetrieveAPIView):
    """
    GET /api/adoption/{listing_id}/ — get listing detail
    """
    queryset           = AdoptionListing.objects.all()
    serializer_class   = AdoptionListingSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field       = 'listing_id'


class ExpressInterestView(APIView):
    """
    POST /api/adoption/{listing_id}/interest/ — adopter expresses interest
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, listing_id):
        try:
            listing = AdoptionListing.objects.get(listing_id=listing_id)
        except AdoptionListing.DoesNotExist:
            return Response(
                {'error': 'Listing not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if listing.status != 'Active':
            return Response(
                {'error': 'This listing is no longer active.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        interest, created = AdopterInterest.objects.get_or_create(
            listing=listing,
            adopter=request.user,
            defaults={'home_readiness_complete': False}
        )

        if not created:
            return Response(
                {'error': 'You have already expressed interest in this animal.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            AdopterInterestSerializer(interest).data,
            status=status.HTTP_201_CREATED
        )


class ApproveAdopterView(APIView):
    """
    POST /api/adoption/{listing_id}/approve/ — NGO approves an adopter
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, listing_id):
        try:
            listing = AdoptionListing.objects.get(listing_id=listing_id)
        except AdoptionListing.DoesNotExist:
            return Response(
                {'error': 'Listing not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        adopter_id = request.data.get('adopter_id')
        if not adopter_id:
            return Response(
                {'error': 'adopter_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            interest = AdopterInterest.objects.get(
                listing=listing, adopter_id=adopter_id
            )
        except AdopterInterest.DoesNotExist:
            return Response(
                {'error': 'This adopter has not expressed interest.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # create adoption record
        record = AdoptionRecord.objects.create(
            listing=listing,
            adopter=interest.adopter
        )

        # update statuses
        listing.status = 'Pending'
        listing.save()
        listing.animal.adoption_status = 'Adoption_Pending'
        listing.animal.save()

        return Response(
            AdoptionRecordSerializer(record).data,
            status=status.HTTP_201_CREATED
        )