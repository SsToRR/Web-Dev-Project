from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import FighterExperience, FighterProfile, FighterReview, FightRecord, Location, MartialArtRule

User = get_user_model()


class FightTrackApiTests(APITestCase):
    def setUp(self):
        self.initiator = User.objects.create_user(username='initiator', password='StrongPass123!')
        self.opponent = User.objects.create_user(username='opponent', password='StrongPass123!')
        self.location = Location.objects.create(name='Demo Hall', address='1 Arena Street')
        self.rule = MartialArtRule.objects.create(name='Savate', number_of_rounds=3, round_duration_minutes=2)

    def authenticate(self, username='initiator', password='StrongPass123!'):
        response = self.client.post(
            '/api/auth/login/',
            {'username': username, 'password': password},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.json()['access']}")
        return response

    def test_login_returns_jwt_pair(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'initiator', 'password': 'StrongPass123!'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        self.assertIn('refresh', response.json())

    def test_register_creates_user_profile_and_experiences(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'username': 'new_fighter',
                'password': 'NewStrongPass123!',
                'confirm_password': 'NewStrongPass123!',
                'achievements': 'Calm sparring partner',
                'experiences': [
                    {'martial_art_name': 'Boxing', 'years': 1, 'months': 3},
                    {'martial_art_name': 'MMA', 'years': 0, 'months': 7},
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username='new_fighter').exists())
        self.assertEqual(
            FighterProfile.objects.get(user__username='new_fighter').achievements,
            'Calm sparring partner',
        )
        self.assertEqual(FighterExperience.objects.filter(profile__user__username='new_fighter').count(), 2)

    def test_create_challenge_auto_assigns_request_user(self):
        self.authenticate()

        response = self.client.post(
            '/api/fights/',
            {
                'opponent_id': self.opponent.id,
                'location_id': self.location.id,
                'martial_art_rule_id': self.rule.id,
                'date': '2026-03-28',
                'message': 'Technical sparring, medium pace.',
                'is_sparring': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        created_challenge = FightRecord.objects.get(pk=response.json()['id'])
        self.assertEqual(created_challenge.initiator, self.initiator)
        self.assertEqual(created_challenge.opponent, self.opponent)
        self.assertEqual(created_challenge.result, FightRecord.STATUS_PENDING)

    def test_opponent_can_accept_and_leave_review(self):
        self.authenticate()
        create_response = self.client.post(
            '/api/fights/',
            {
                'opponent_id': self.opponent.id,
                'location_id': self.location.id,
                'martial_art_rule_id': self.rule.id,
                'date': '2026-03-28',
                'message': 'Evening sparring',
                'is_sparring': True,
            },
            format='json',
        )
        challenge_id = create_response.json()['id']

        self.client.credentials()
        self.authenticate(username='opponent')
        accept_response = self.client.patch(
            f'/api/fights/{challenge_id}/',
            {'status': FightRecord.STATUS_ACCEPTED},
            format='json',
        )

        self.assertEqual(accept_response.status_code, 200)

        review_response = self.client.post(
            '/api/reviews/',
            {
                'target_id': self.initiator.id,
                'rating': 5,
                'comment': 'Reliable partner with solid defense.',
            },
            format='json',
        )

        self.assertIn(review_response.status_code, {200, 201})
        self.assertTrue(FighterReview.objects.filter(reviewer=self.opponent, target=self.initiator).exists())

        initiator_profile = FighterProfile.objects.get(user=self.initiator)
        opponent_profile = FighterProfile.objects.get(user=self.opponent)
        self.assertEqual(initiator_profile.total_reviews, 1)
        self.assertEqual(initiator_profile.rating, 100)
        self.assertEqual(opponent_profile.total_fights, 1)
