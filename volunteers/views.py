from django.db.models import Max
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import VolunteerReliabilityScore
from .serializers import VolunteerReliabilityScoreSerializer

User = get_user_model()


class VRSLeaderboardView(generics.ListAPIView):
    """
    GET /api/volunteers/vrs/ — latest VRS score per volunteer, ranked descending
    """
    serializer_class   = VolunteerReliabilityScoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        latest_dates = (
            VolunteerReliabilityScore.objects
            .values('volunteer_id')
            .annotate(latest_date=Max('score_date'))
        )
        ids = []
        for row in latest_dates:
            obj = VolunteerReliabilityScore.objects.filter(
                volunteer_id=row['volunteer_id'], score_date=row['latest_date']
            ).first()
            if obj:
                ids.append(obj.id)
        return VolunteerReliabilityScore.objects.filter(id__in=ids).order_by('-vrs_score')


class ComputeVRSView(APIView):
    """
    POST /api/volunteers/compute/ — recompute VRS for every volunteer.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['NGO_Admin', 'Platform_Admin']:
            return Response(
                {'error': 'Only NGO Admins can trigger VRS computation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        volunteers = User.objects.filter(role='Volunteer')
        results = [
            VolunteerReliabilityScoreSerializer(
                VolunteerReliabilityScore.compute_for_volunteer(v)
            ).data
            for v in volunteers
        ]
        return Response(results, status=status.HTTP_200_OK)


class VolunteerAnalyticsSummaryView(APIView):
    """
    GET /api/volunteers/my-analytics/ — the logged-in volunteer's own
    summary stats, reliability breakdown, and recent cases.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'Volunteer':
            return Response(
                {'error': 'This view is for volunteers only.'},
                status=status.HTTP_403_FORBIDDEN
            )

        from cases.models import Case

        latest_vrs = VolunteerReliabilityScore.objects.filter(
            volunteer=request.user
        ).order_by('-score_date').first()

        claimed = Case.objects.filter(volunteer=request.user)
        resolved_count = claimed.filter(status='Resolved').count()

        summary = [
            {'label': 'Cases resolved', 'value': resolved_count},
            {'label': 'Cases claimed', 'value': claimed.count()},
            {'label': 'Reliability score', 'value': f'{float(latest_vrs.vrs_score):.2f}' if latest_vrs else '0.00'},
        ]

        reliability_breakdown = [
            {'factor': 'Response rate', 'score': round(float(latest_vrs.response_rate) * 100) if latest_vrs else 0},
            {'factor': 'Completion rate', 'score': round(float(latest_vrs.completion_rate) * 100) if latest_vrs else 0},
            {
                'factor': 'Response speed',
                'score': round(max(0, 1 - (float(latest_vrs.avg_response_time_min) / 30)) * 100) if latest_vrs else 0
            },
        ]

        recent_cases = [
            {
                'id': c.case_id,
                'species': c.species,
                'location': c.ward.ward_name if c.ward else f'{c.latitude}, {c.longitude}',
                'status': c.status.replace('_', ' '),
            }
            for c in claimed.order_by('-created_at')[:8]
        ]

        return Response({
            'summary': summary,
            'reliabilityBreakdown': reliability_breakdown,
            'recentCases': recent_cases,
        }, status=status.HTTP_200_OK)