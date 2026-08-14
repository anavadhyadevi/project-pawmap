from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from django.db.models import Count
from .models import HotspotRun, HotspotCluster
from .services import run_dbscan


class HotspotClusterSerializer(serializers.ModelSerializer):
    class Meta:
        model  = HotspotCluster
        fields = [
            'cluster_label', 'centroid_lat', 'centroid_lon',
            'case_count', 'dominant_species'
        ]


class HotspotRunSerializer(serializers.ModelSerializer):
    clusters = HotspotClusterSerializer(many=True, read_only=True)

    class Meta:
        model  = HotspotRun
        fields = [
            'run_id', 'run_date', 'eps_m', 'min_samples',
            'total_cases_processed', 'created_at', 'clusters'
        ]


class RunDBSCANView(APIView):
    """
    POST /api/analytics/run-dbscan/ — trigger DBSCAN hotspot detection
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        eps_m       = int(request.data.get('eps_m', 500))
        min_samples = int(request.data.get('min_samples', 5))
        days        = int(request.data.get('days', 30))

        run, error = run_dbscan(eps_m=eps_m, min_samples=min_samples, days=days)

        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            HotspotRunSerializer(run).data,
            status=status.HTTP_201_CREATED
        )


class LatestHotspotsView(APIView):
    """
    GET /api/analytics/hotspots/ — get latest hotspot clusters
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        latest_run = HotspotRun.objects.order_by('-created_at').first()
        if not latest_run:
            return Response(
                {'message': 'No hotspot analysis has been run yet.', 'clusters': []},
                status=status.HTTP_200_OK
            )
        return Response(
            HotspotRunSerializer(latest_run).data,
            status=status.HTTP_200_OK
        )


class AllCasesGeoView(APIView):
    """
    GET /api/analytics/cases-geo/ — all cases with coordinates for map display
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from cases.models import Case
        cases = Case.objects.filter(
            latitude__isnull=False,
            longitude__isnull=False
        ).values(
            'case_id', 'latitude', 'longitude',
            'species', 'severity', 'status', 'created_at', 'ward'
        )
        return Response(list(cases), status=status.HTTP_200_OK)


class NgoAnalyticsSummaryView(APIView):
    """
    GET /api/analytics/ngo-summary/ — NGO Admin's scoped analytics:
    case summary stats, cases-by-ward, and volunteer activity table.
    Scoped to volunteers whose User.ngo points to this NGO Admin.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'NGO_Admin':
            return Response(
                {'error': 'Only NGO Admins can view this.'},
                status=status.HTTP_403_FORBIDDEN
            )

        from cases.models import Case
        from users.models import User
        from volunteers.models import VolunteerReliabilityScore

        # volunteers belonging to this NGO
        ngo_volunteers = User.objects.filter(role='Volunteer', ngo=request.user)

        # cases handled by this NGO's volunteers
        cases = Case.objects.filter(volunteer__in=ngo_volunteers)

        summary = [
            {'label': 'Total cases', 'value': cases.count()},
            {'label': 'Open', 'value': cases.filter(status='Open').count()},
            {'label': 'Resolved', 'value': cases.filter(status='Resolved').count()},
            {'label': 'Escalated', 'value': cases.filter(status='Escalated').count()},
            {'label': 'Active volunteers', 'value': ngo_volunteers.count()},
        ]

        cases_by_ward = list(
            cases.exclude(ward__isnull=True)
            .values('ward__ward_name')
            .annotate(count=Count('case_id'))
            .order_by('-count')
        )
        cases_by_ward = [
            {'ward': row['ward__ward_name'], 'count': row['count']}
            for row in cases_by_ward
        ]

        volunteer_activity = []
        for v in ngo_volunteers:
            latest_vrs = VolunteerReliabilityScore.objects.filter(volunteer=v).order_by('-score_date').first()
            volunteer_activity.append({
                'name': v.full_name,
                'casesResolved': cases.filter(volunteer=v, status='Resolved').count(),
                'avgResponseMin': float(latest_vrs.avg_response_time_min) if latest_vrs else 0,
                'reliability': float(latest_vrs.vrs_score) * 5 if latest_vrs else 0,  # scaled to 0-5 for the ★ display
            })

        return Response({
            'summary': summary,
            'cases_by_ward': cases_by_ward,
            'volunteer_activity': volunteer_activity,
        }, status=status.HTTP_200_OK)