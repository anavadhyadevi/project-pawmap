from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import MedicalRecord
from .serializers import MedicalRecordSerializer, MedicalRecordCreateSerializer
from animals.models import Animal


class MedicalRecordListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/medical/{animal_id}/ — list all records for an animal
    POST /api/medical/{animal_id}/ — add a medical record (vet/NGO only)
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MedicalRecordCreateSerializer
        return MedicalRecordSerializer

    def get_queryset(self):
        animal_id = self.kwargs['animal_id']
        return MedicalRecord.objects.filter(animal__animal_id=animal_id)

    def create(self, request, *args, **kwargs):
        animal_id = self.kwargs['animal_id']
        try:
            animal = Animal.objects.get(animal_id=animal_id)
        except Animal.DoesNotExist:
            return Response(
                {'error': 'Animal not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = serializer.save(animal=animal, vet=request.user)
        return Response(
            MedicalRecordSerializer(record).data,
            status=status.HTTP_201_CREATED
        )