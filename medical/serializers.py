from rest_framework import serializers
from .models import MedicalRecord
from animals.models import Animal

class MedicalRecordSerializer(serializers.ModelSerializer):
    vet_name  = serializers.CharField(source='vet.full_name', read_only=True)
    animal_id = serializers.CharField(source='animal.animal_id', read_only=True)

    class Meta:
        model  = MedicalRecord
        fields = [
            'record_id', 'animal', 'animal_id', 'vet', 'vet_name',
            'entry_type', 'details', 'next_due_date', 'timestamp'
        ]
        read_only_fields = ['record_id', 'vet', 'timestamp']


class MedicalRecordCreateSerializer(serializers.ModelSerializer):
    animal = serializers.SlugRelatedField(slug_field='animal_id', queryset=Animal.objects.all())

    class Meta:
        model  = MedicalRecord
        fields = ['animal', 'entry_type', 'details', 'next_due_date']

    def validate_entry_type(self, value):
        normalized = value.strip().lower()
        valid_types = [choice[0] for choice in MedicalRecord.ENTRY_TYPES]
        if normalized not in valid_types:
            raise serializers.ValidationError(
                f"'{value}' is not a valid entry type. Choose from: {', '.join(valid_types)}."
            )
        return normalized