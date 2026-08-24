from rest_framework import serializers
from .models import Animal, TemperamentRating


class TemperamentRatingSerializer(serializers.ModelSerializer):
    volunteer_name = serializers.CharField(source='volunteer.full_name', read_only=True)

    class Meta:
        model  = TemperamentRating
        fields = ['id', 'score', 'timestamp', 'volunteer_name']
        read_only_fields = ['timestamp']

    def validate_score(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Score must be between 1 and 5.')
        return value


class AnimalSerializer(serializers.ModelSerializer):
    temperament_ratings = TemperamentRatingSerializer(many=True, read_only=True)
    current_foster_name = serializers.CharField(
                            source='current_foster.full_name', read_only=True
                          )
    case_id = serializers.CharField(source='case.case_id', read_only=True)
    listing_id = serializers.CharField(source='adoption_listing.listing_id', read_only=True, required=False, allow_null=True)
    medical_summary = serializers.SerializerMethodField()
    case_photo = serializers.SerializerMethodField()

    def get_medical_summary(self, animal):
        records = animal.medical_records.order_by('-timestamp')[:3]
        return [
            {'record_id': record.record_id, 'entry_type': record.entry_type,
             'details': record.details, 'timestamp': record.timestamp}
            for record in records
        ]

    def get_case_photo(self, animal):
        """Return the URL of the photo from the linked case report, if any."""
        try:
            case = animal.case
            if case and case.photo:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(case.photo.url)
                return case.photo.url
        except Exception:
            pass
        return None

    class Meta:
        model  = Animal
        fields = [
            'animal_id', 'name', 'species', 'breed', 'estimated_age',
            'distinguishing_features', 'photo', 'case_photo',
            'temperament_score', 'adoption_status', 'ownership_status',
            'case_id', 'current_foster', 'current_foster_name',
            'created_at', 'updated_at',
            'temperament_ratings', 'medical_summary', 'listing_id',
        ]
        read_only_fields = ['animal_id', 'temperament_score', 'created_at', 'updated_at']


class AnimalCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Animal
        fields = [
            'name', 'species', 'breed', 'estimated_age',
            'distinguishing_features', 'photo',
            'ownership_status', 'case',
        ]
