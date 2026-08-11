from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
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