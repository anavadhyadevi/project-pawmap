from django.test import TestCase

# Create your tests here.

from rest_framework.test import APITestCase
from rest_framework import status
from .models import User


class VolunteerApplicationFlowTests(APITestCase):
    def setUp(self):
        self.ngo = User.objects.create_user(
            email='ngo@example.com', password='StrongPass123!', full_name='PawCare NGO',
            role='NGO_Admin', is_verified=True
        )

    def test_volunteer_can_choose_ngo_and_be_approved_by_that_ngo(self):
        ngos = self.client.get('/api/users/ngos/')
        self.assertEqual(ngos.status_code, status.HTTP_200_OK)
        ngo_results = ngos.data.get('results', ngos.data)
        self.assertEqual(ngo_results[0]['id'], self.ngo.id)

        registration = self.client.post('/api/users/register/', {
            'full_name': 'Pending Volunteer', 'email': 'pending@example.com',
            'phone': '9876543210', 'role': 'Volunteer', 'ngo': self.ngo.id,
            'password': 'StrongPass123!', 'password2': 'StrongPass123!',
        })
        self.assertEqual(registration.status_code, status.HTTP_201_CREATED)
        volunteer = User.objects.get(email='pending@example.com')
        self.assertFalse(volunteer.is_verified)
        self.assertEqual(volunteer.ngo, self.ngo)

        self.client.force_authenticate(user=self.ngo)
        approval = self.client.patch(f'/api/users/{volunteer.id}/verify/', {})
        self.assertEqual(approval.status_code, status.HTTP_200_OK)
        volunteer.refresh_from_db()
        self.assertTrue(volunteer.is_verified)

    def test_unverified_ngo_cannot_approve_a_volunteer(self):
        volunteer = User.objects.create_user(
            email='pending2@example.com', password='StrongPass123!', full_name='Pending Volunteer',
            role='Volunteer', ngo=self.ngo
        )
        self.ngo.is_verified = False
        self.ngo.save(update_fields=['is_verified'])
        self.client.force_authenticate(user=self.ngo)

        response = self.client.patch(f'/api/users/{volunteer.id}/verify/', {})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Your NGO account must be verified before you can approve volunteers.')
        volunteer.refresh_from_db()
        self.assertFalse(volunteer.is_verified)
