from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import MedicalRecord
from .serializers import MedicalRecordSerializer, MedicalRecordCreateSerializer


class MedicalRecordListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/medical/records/?animal=ANIMAL-0001  — list records (optionally filtered by animal)
    POST /api/medical/records/                      — log a new record (Volunteer, Vet, or NGO_Admin only)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MedicalRecordCreateSerializer
        return MedicalRecordSerializer

    def get_queryset(self):
        qs = MedicalRecord.objects.all()
        animal_id = self.request.query_params.get('animal')
        if animal_id:
            qs = qs.filter(animal__animal_id=animal_id)
        return qs

    def create(self, request, *args, **kwargs):
        if request.user.role not in ['Volunteer', 'NGO_Admin', 'Vet', 'Platform_Admin']:
            return Response(
                {'error': 'Only volunteers, vets, or NGO admins can log medical records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = serializer.save(vet=request.user)
        return Response(
            MedicalRecordSerializer(record).data,
            status=status.HTTP_201_CREATED
        )