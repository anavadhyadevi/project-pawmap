from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Animal, TemperamentRating
from .serializers import AnimalSerializer, AnimalCreateSerializer, TemperamentRatingSerializer


class AnimalListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/animals/     — list all animals (public)
    POST /api/animals/     — create animal profile (volunteers + NGO only)
    """
    queryset = Animal.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AnimalCreateSerializer
        return AnimalSerializer

    def get_queryset(self):
        qs = Animal.objects.all()
        # filter by adoption status e.g. ?adoption_status=Available
        adoption_status = self.request.query_params.get('adoption_status')
        if adoption_status:
            qs = qs.filter(adoption_status=adoption_status)
        # filter by species e.g. ?species=Dog
        species = self.request.query_params.get('species')
        if species:
            qs = qs.filter(species__iexact=species)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        animal = serializer.save()
        return Response(
            AnimalSerializer(animal).data,
            status=status.HTTP_201_CREATED
        )


class AnimalDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/animals/{animal_id}/ — get animal detail
    PATCH /api/animals/{animal_id}/ — update animal (NGO/vet only)
    """
    queryset         = Animal.objects.all()
    serializer_class = AnimalSerializer
    lookup_field     = 'animal_id'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class TemperamentRatingView(APIView):
    """
    POST /api/animals/{animal_id}/rate/ — volunteer rates animal temperament
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, animal_id):
        try:
            animal = Animal.objects.get(animal_id=animal_id)
        except Animal.DoesNotExist:
            return Response(
                {'error': 'Animal not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = TemperamentRatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(animal=animal, volunteer=request.user)

        # return updated animal with new temperament score
        return Response(
            AnimalSerializer(animal).data,
            status=status.HTTP_201_CREATED
        )


class AdoptionReadyAnimalsView(generics.ListAPIView):
    """
    GET /api/animals/adopt/ — animals available for adoption (public)
    """
    serializer_class   = AnimalSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Animal.objects.filter(adoption_status='Available')