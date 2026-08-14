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
        # SQLite doesn't support distinct(field), so latest-per-volunteer is done manually here.
        # If you migrate to PostgreSQL later, this can be simplified to .distinct('volunteer_id').
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
    Manual trigger for now; a Celery daily job can call this same method later.
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