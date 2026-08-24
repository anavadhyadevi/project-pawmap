from rest_framework import serializers
from .models import AdoptionListing, AdopterInterest, AdoptionRecord
from animals.serializers import AnimalSerializer
from animals.models import Animal


class AdopterInterestSerializer(serializers.ModelSerializer):
    adopter_name = serializers.CharField(source='adopter.full_name', read_only=True)

    class Meta:
        model  = AdopterInterest
        fields = ['id', 'adopter', 'adopter_name', 'home_readiness_complete', 'expressed_at']
        read_only_fields = ['adopter', 'expressed_at']


class AdoptionRecordSerializer(serializers.ModelSerializer):
    adopter_name = serializers.CharField(source='adopter.full_name', read_only=True)

    class Meta:
        model  = AdoptionRecord
        fields = [
            'adoption_id', 'adopter', 'adopter_name',
            'approved_at', 'completed_at',
            'welfare_survey_30d_sent', 'welfare_survey_90d_sent'
        ]
        read_only_fields = ['adoption_id', 'approved_at']


class AdoptionListingSerializer(serializers.ModelSerializer):
    animal         = AnimalSerializer(read_only=True)
    published_by_name = serializers.CharField(source='published_by.full_name', read_only=True)
    interests      = AdopterInterestSerializer(many=True, read_only=True)
    adoption_record = AdoptionRecordSerializer(read_only=True)
    interest_count = serializers.IntegerField(source='interests.count', read_only=True)

    class Meta:
        model  = AdoptionListing
        fields = [
            'listing_id', 'animal', 'published_by', 'published_by_name',
            'published_at', 'status', 'interests', 'interest_count',
            'adoption_record'
        ]
        read_only_fields = ['listing_id', 'published_at']


class AdoptionListingCreateSerializer(serializers.ModelSerializer):
    # Accept the human-readable animal_id string (e.g. 'ANIMAL-0001')
    # instead of the internal integer PK
    animal = serializers.SlugRelatedField(
        slug_field='animal_id',
        queryset=Animal.objects.all()
    )

    class Meta:
        model  = AdoptionListing
        fields = ['animal']