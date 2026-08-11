from rest_framework import serializers
from .models import MedicalRecord


class MedicalRecordSerializer(serializers.ModelSerializer):
    vet_name   = serializers.CharField(source='vet.full_name', read_only=True)
    animal_id  = serializers.CharField(source='animal.animal_id', read_only=True)

    class Meta:
        model  = MedicalRecord
        fields = [
            'record_id', 'animal_id', 'vet', 'vet_name',
            'entry_type', 'details', 'next_due_date', 'timestamp'
        ]
        read_only_fields = ['record_id', 'timestamp']


class MedicalRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MedicalRecord
        fields = ['entry_type', 'details', 'next_due_date']