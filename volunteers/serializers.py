from rest_framework import serializers
from .models import VolunteerReliabilityScore


class VolunteerReliabilityScoreSerializer(serializers.ModelSerializer):
    volunteer_name = serializers.CharField(source='volunteer.full_name', read_only=True)

    class Meta:
        model = VolunteerReliabilityScore
        fields = [
            'vrs_id', 'volunteer', 'volunteer_name', 'score_date',
            'cases_notified', 'cases_responded', 'cases_completed',
            'avg_response_time_min', 'response_rate', 'completion_rate',
            'vrs_score', 'flag_for_review'
        ]
        read_only_fields = fields