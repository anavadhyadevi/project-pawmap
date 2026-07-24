from rest_framework import serializers
from .models import Case, CaseStatusLog, Ward, AnimalType


class WardSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Ward
        fields = ['ward_name', 'city', 'centroid_lat', 'centroid_lon']


class AnimalTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AnimalType
        fields = ['species', 'breed']


class CaseStatusLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True)

    class Meta:
        model  = CaseStatusLog
        fields = [
            'log_id', 'old_status', 'new_status',
            'changed_at', 'note', 'is_auto_release', 'actor_name'
        ]


class CaseSerializer(serializers.ModelSerializer):
    reporter_name  = serializers.CharField(source='reporter.full_name',  read_only=True)
    volunteer_name = serializers.CharField(source='volunteer.full_name', read_only=True)
    status_logs    = CaseStatusLogSerializer(many=True, read_only=True)

    class Meta:
        model  = Case
        fields = [
            'case_id', 'latitude', 'longitude', 'ward',
            'species', 'breed', 'estimated_age',
            'severity', 'aggression_level', 'injury_type',
            'bystander_action', 'description', 'photo',
            'status', 'response_time_min',
            'reporter', 'reporter_name',
            'volunteer', 'volunteer_name',
            'created_at', 'updated_at',
            'status_logs',
        ]
        read_only_fields = [
            'case_id', 'status', 'reporter',
            'volunteer', 'response_time_min',
            'created_at', 'updated_at',
        ]


class CaseCreateSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model  = Case
        fields = [
            'latitude', 'longitude', 'ward',
            'species', 'breed', 'estimated_age',
            'severity', 'aggression_level', 'injury_type',
            'bystander_action', 'description', 'photo',
        ]

    def validate_severity(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Severity must be between 1 and 5.')
        return value

    def validate_aggression_level(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Aggression level must be between 1 and 5.')
        return value

    def validate_latitude(self, value):
        if not -90 <= float(value) <= 90:
            raise serializers.ValidationError('Invalid latitude.')
        return value

    def validate_longitude(self, value):
        if not -180 <= float(value) <= 180:
            raise serializers.ValidationError('Invalid longitude.')
        return value

class ClaimCaseSerializer(serializers.Serializer):
    note = serializers.CharField(max_length=500, required=False, default='')


class UpdateStatusSerializer(serializers.Serializer):
    STATUS_CHOICES = [
        ('En_Route',    'En Route'),
        ('On_Site',     'On Site'),
        ('Resolved',    'Resolved'),
        ('Escalated',   'Escalated'),
        ('Unresolved',  'Unresolved'),
    ]
    status = serializers.ChoiceField(choices=STATUS_CHOICES)
    note   = serializers.CharField(max_length=500, required=False, default='')