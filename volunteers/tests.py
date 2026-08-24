from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from cases.models import Case, CaseNotification, Ward
from volunteers.models import VolunteerReliabilityScore

User = get_user_model()


class VolunteerVRSTests(TestCase):

    def setUp(self):
        self.ward = Ward.objects.create(
            ward_name="Indiranagar",
            city="Bengaluru",
            centroid_lat=12.9719,
            centroid_lon=77.6412
        )
        
        self.reporter = User.objects.create_user(
            email="rep@pawmap.org",
            password="pwd",
            full_name="Reporter User",
            role="Reporter"
        )
        
        self.volunteer = User.objects.create_user(
            email="vol@pawmap.org",
            password="pwd",
            full_name="Volunteer User",
            role="Volunteer",
            is_verified=True
        )

    def test_vrs_calculation_formula(self):
        """Test VRS calculations: RR=100%, CR=100%, RT=15 mins (norm=0.5, score=0.4*1 + 0.4*1 + 0.2*0.5 = 0.9)"""
        # Create a claimed and resolved case for volunteer
        case = Case.objects.create(
            latitude=12.9719,
            longitude=77.6412,
            ward=self.ward,
            species="Dog",
            severity=3,
            reporter=self.reporter,
            volunteer=self.volunteer,
            status="Resolved",
            response_time_min=15.0
        )
        
        # Create notification history
        notif = CaseNotification.objects.create(
            case=case,
            volunteer=self.volunteer,
            notified_at=timezone.now() - timedelta(minutes=20),
            responded_at=timezone.now() - timedelta(minutes=5)
        )
        
        # Compute score
        vrs_score = VolunteerReliabilityScore.compute_for_volunteer(self.volunteer)
        
        # Verify rates and score
        self.assertEqual(float(vrs_score.response_rate), 1.0)
        self.assertEqual(float(vrs_score.completion_rate), 1.0)
        self.assertEqual(float(vrs_score.avg_response_time_min), 15.0)
        # score = 0.4*(1.0) + 0.4*(1.0) + 0.2*(1.0 - 15/30) = 0.4 + 0.4 + 0.2*(0.5) = 0.9
        self.assertEqual(float(vrs_score.vrs_score), 0.9)
        self.assertFalse(vrs_score.flag_for_review)

    def test_vrs_consecutive_low_review_flag(self):
        """Test that three consecutive low scores (< 0.4) trigger the review flag."""
        # Seed 2 historical low scores
        VolunteerReliabilityScore.objects.create(
            volunteer=self.volunteer,
            score_date=timezone.now().date() - timedelta(days=2),
            vrs_score=0.35
        )
        VolunteerReliabilityScore.objects.create(
            volunteer=self.volunteer,
            score_date=timezone.now().date() - timedelta(days=1),
            vrs_score=0.30
        )
        
        # Compute today's score which will be 0.0 because they have no new activity
        vrs_score = VolunteerReliabilityScore.compute_for_volunteer(self.volunteer)
        self.assertEqual(float(vrs_score.vrs_score), 0.2)  # 0.2 from (1 - 0/30) if no claimed cases, response_rate=0, completion_rate=0
        self.assertTrue(vrs_score.flag_for_review)
