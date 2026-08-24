from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from cases.models import Case, CaseStatusLog, Ward
from django.db import transaction
import time

User = get_user_model()


class PawMapTests(APITestCase):

    def setUp(self):
        # Create a test Ward
        self.ward = Ward.objects.create(
            ward_name="Koramangala",
            city="Bengaluru",
            centroid_lat=12.9348,
            centroid_lon=77.6189
        )
        
        # Create User accounts
        self.reporter = User.objects.create_user(
            email="reporter@test.com",
            password="testpassword",
            full_name="Reporter User",
            role="Reporter"
        )
        
        self.volunteer = User.objects.create_user(
            email="volunteer@test.com",
            password="testpassword",
            full_name="Volunteer Companion",
            role="Volunteer",
            is_verified=True
        )

        self.another_volunteer = User.objects.create_user(
            email="volunteer2@test.com",
            password="testpassword",
            full_name="Another Volunteer",
            role="Volunteer",
            is_verified=True
        )

        # Force authenticate the volunteer client
        self.client.force_authenticate(user=self.volunteer)

    def test_case_id_generation_and_saving(self):
        """Test Case model generates CASE-xxxx sequence IDs and saves fields correctly."""
        case = Case.objects.create(
            latitude=12.9348,
            longitude=77.6189,
            ward=self.ward,
            species="Dog",
            breed="Indie",
            severity=4,
            aggression_level=2,
            injury_type="Laceration",
            reporter=self.reporter
        )
        self.assertEqual(case.case_id, "CASE-0001")
        self.assertEqual(case.status, "Open")
        
        case2 = Case.objects.create(
            latitude=12.9340,
            longitude=77.6180,
            ward=self.ward,
            species="Cat",
            breed="Unknown",
            severity=3,
            aggression_level=1,
            injury_type="Lethargy",
            reporter=self.reporter
        )
        self.assertEqual(case2.case_id, "CASE-0002")

    def test_atomic_case_claiming_success(self):
        """Test a volunteer can successfully claim an open case."""
        case = Case.objects.create(
            latitude=12.9348,
            longitude=77.6189,
            ward=self.ward,
            species="Dog",
            severity=3,
            reporter=self.reporter
        )
        
        url = f'/api/cases/{case.case_id}/claim/'
        response = self.client.patch(url, {'note': 'En route now'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        case.refresh_from_db()
        self.assertEqual(case.status, "In_Progress")
        self.assertEqual(case.volunteer, self.volunteer)
        
        # Verify CaseStatusLog was written
        log = CaseStatusLog.objects.filter(case=case).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.old_status, "Open")
        self.assertEqual(log.new_status, "In_Progress")
        self.assertEqual(log.actor, self.volunteer)

    def test_concurrent_case_claiming_conflict(self):
        """Test that claiming a case twice returns a HTTP 409 Conflict."""
        case = Case.objects.create(
            latitude=12.9348,
            longitude=77.6189,
            ward=self.ward,
            species="Dog",
            severity=3,
            reporter=self.reporter
        )
        
        # Volunteer 1 claims
        url = f'/api/cases/{case.case_id}/claim/'
        response1 = self.client.patch(url, {'note': 'Claiming'})
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Volunteer 2 tries to claim same case
        self.client.force_authenticate(user=self.another_volunteer)
        response2 = self.client.patch(url, {'note': 'Claiming too'})
        self.assertEqual(response2.status_code, status.HTTP_409_CONFLICT)
