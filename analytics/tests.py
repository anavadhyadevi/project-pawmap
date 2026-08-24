from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from cases.models import Case, Ward
from analytics.services import run_dbscan
from analytics.models import HotspotRun, HotspotCluster

User = get_user_model()


class AnalyticsDBSCANTests(TestCase):

    def setUp(self):
        # Create a test Ward
        self.ward = Ward.objects.create(
            ward_name="HSR Layout",
            city="Bengaluru",
            centroid_lat=12.9121,
            centroid_lon=77.6446
        )
        
        self.reporter = User.objects.create_user(
            email="reporter_an@pawmap.org",
            password="pwd",
            full_name="Reporter User",
            role="Reporter"
        )

        # Create 5 clustered cases close to each other (approx within 100m)
        # Centered around (12.9121, 77.6446)
        for i in range(5):
            Case.objects.create(
                latitude=12.9121 + (i * 0.0001),  # tiny offset
                longitude=77.6446 + (i * 0.0001),
                ward=self.ward,
                species="Dog",
                severity=3,
                reporter=self.reporter
            )
            
        # Create 2 noise cases far away
        Case.objects.create(
            latitude=12.9719,  # Indiranagar lat
            longitude=77.6412,
            ward=self.ward,
            species="Cat",
            severity=1,
            reporter=self.reporter
        )

    def test_run_dbscan_creates_clusters(self):
        """Test DBSCAN groups clustered points and ignores noise cases."""
        run, error = run_dbscan(eps_m=500, min_samples=5, days=30)
        
        self.assertNil = False
        self.assertIsNotNone(run)
        self.assertIsNone(error)
        
        # Verify HotspotRun metadata
        self.assertEqual(run.total_cases_processed, 6)
        
        # Verify exactly 1 cluster was created (noise of 1 case far away is skipped)
        clusters = HotspotCluster.objects.filter(run=run)
        self.assertEqual(clusters.count(), 1)
        
        cluster = clusters.first()
        self.assertEqual(cluster.case_count, 5)
        self.assertEqual(cluster.dominant_species, "Dog")
        # Centroid lat/lon should be close to HSR Layout centroid
        self.assertAlmostEqual(float(cluster.centroid_lat), 12.9123, places=3)
        self.assertAlmostEqual(float(cluster.centroid_lon), 77.6448, places=3)
