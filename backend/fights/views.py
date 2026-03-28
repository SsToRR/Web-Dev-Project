from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Prefetch, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .models import FighterExperience, FighterProfile, FighterReview, FightRecord, Location, MartialArtRule
from .serializers import FightRecordSerializer, LeaderboardSerializer, LocationSerializer, LoginSerializer, serialize_review
from .utils import fighters_have_accepted_challenge, rebuild_fighter_statistics

User = get_user_model()


def serialize_experience(experience: FighterExperience) -> dict:
    return {
        'id': experience.id,
        'martial_art_rule_id': experience.martial_art_rule_id,
        'martial_art_name': experience.martial_art_rule.name,
        'years': experience.years,
        'months': experience.months,
        'label': f'{experience.martial_art_rule.name}: {experience.years} y {experience.months} m',
    }


def serialize_fighter_card(profile: FighterProfile, current_user_id: int | None) -> dict:
    return {
        'id': profile.user_id,
        'username': profile.user.username,
        'achievements': profile.achievements or 'No fighter bio yet',
        'rating': profile.rating,
        'total_fights': profile.total_fights,
        'total_reviews': profile.total_reviews,
        'average_review_score': float(profile.average_review_score),
        'experiences': [serialize_experience(experience) for experience in profile.experiences.all()],
        'can_receive_review': bool(current_user_id and fighters_have_accepted_challenge(current_user_id, profile.user_id)),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_view(request):
    if request.path.endswith('/login/'):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )

        if not user:
            return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {'id': user.id, 'username': user.username},
            }
        )

    if request.path.endswith('/register/'):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username'].strip()
        password = serializer.validated_data['password']
        confirm_password = serializer.validated_data.get('confirm_password', '')
        achievements = serializer.validated_data.get('achievements', '').strip()
        experiences = serializer.validated_data.get('experiences', [])

        if password != confirm_password:
            return Response({'detail': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'detail': 'This username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(password)
        except DjangoValidationError as exc:
            return Response({'detail': ' '.join(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password)
        profile = FighterProfile.objects.get(user=user)
        profile.achievements = achievements
        profile.save(update_fields=['achievements'])

        for experience in experiences:
            martial_art_name = str(experience.get('martial_art_name', '')).strip()

            if not martial_art_name:
                continue

            rule, _ = MartialArtRule.objects.get_or_create(
                name=martial_art_name,
                defaults={'number_of_rounds': 3, 'round_duration_minutes': 3},
            )
            FighterExperience.objects.update_or_create(
                profile=profile,
                martial_art_rule=rule,
                defaults={
                    'years': max(0, int(experience.get('years', 0) or 0)),
                    'months': min(11, max(0, int(experience.get('months', 0) or 0))),
                },
            )

        rebuild_fighter_statistics()
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {'id': user.id, 'username': user.username},
            },
            status=status.HTTP_201_CREATED,
        )

    refresh_token = request.data.get('refresh_token')

    if refresh_token:
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            return Response(
                {'detail': 'Refresh token is invalid or already blacklisted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    return Response({'detail': 'Logout completed successfully.'})


@api_view(['GET'])
@permission_classes([AllowAny])
def leaderboard_view(request):
    profiles = FighterProfile.objects.select_related('user').prefetch_related(
        Prefetch('experiences', queryset=FighterExperience.objects.select_related('martial_art_rule'))
    ).order_by('-rating', '-average_review_score', '-total_reviews', 'user__username')
    payload = [
        {
            'rank': index,
            'username': profile.user.username,
            'rating': profile.rating,
            'total_fights': profile.total_fights,
            'total_reviews': profile.total_reviews,
            'average_review_score': float(profile.average_review_score),
            'achievements': profile.achievements or 'No fighter bio yet',
            'top_experiences': [experience.martial_art_rule.name for experience in profile.experiences.all()[:3]],
        }
        for index, profile in enumerate(profiles, start=1)
    ]
    serializer = LeaderboardSerializer(payload, many=True)
    return Response(serializer.data)


class FightRecordListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.path.endswith('/reviews/'):
            reviews = FighterReview.objects.select_related('reviewer', 'target').filter(
                Q(reviewer=request.user) | Q(target=request.user)
            )
            return Response([serialize_review(review) for review in reviews])

        challenges = (
            FightRecord.objects.select_related('initiator', 'opponent', 'location', 'martial_art_rule')
            .filter(Q(initiator=request.user) | Q(opponent=request.user))
            .order_by('-created_at')
        )
        profile = FighterProfile.objects.select_related('user').prefetch_related(
            Prefetch('experiences', queryset=FighterExperience.objects.select_related('martial_art_rule'))
        ).get(user=request.user)
        other_profiles = FighterProfile.objects.select_related('user').prefetch_related(
            Prefetch('experiences', queryset=FighterExperience.objects.select_related('martial_art_rule'))
        ).exclude(user=request.user).order_by('-rating', '-average_review_score', 'user__username')
        received_reviews = FighterReview.objects.select_related('reviewer', 'target').filter(target=request.user)
        review_targets = (
            User.objects.filter(
                Q(initiated_fights__opponent=request.user, initiated_fights__result=FightRecord.STATUS_ACCEPTED)
                | Q(received_fights__initiator=request.user, received_fights__result=FightRecord.STATUS_ACCEPTED)
            )
            .exclude(id=request.user.id)
            .distinct()
            .order_by('username')
        )

        return Response(
            {
                'profile': {
                    'username': request.user.username,
                    'rating': profile.rating,
                    'total_fights': profile.total_fights,
                    'total_reviews': profile.total_reviews,
                    'average_review_score': float(profile.average_review_score),
                    'achievements': profile.achievements or 'No fighter bio yet',
                    'experiences': [serialize_experience(experience) for experience in profile.experiences.all()],
                },
                'challenges': FightRecordSerializer(challenges, many=True).data,
                'fighters': [serialize_fighter_card(other_profile, request.user.id) for other_profile in other_profiles],
                'locations': LocationSerializer(Location.objects.order_by('name'), many=True).data,
                'rules': list(
                    MartialArtRule.objects.order_by('name').values(
                        'id',
                        'name',
                        'number_of_rounds',
                        'round_duration_minutes',
                    )
                ),
                'review_targets': list(review_targets.values('id', 'username')),
                'received_reviews': [serialize_review(review) for review in received_reviews],
            }
        )

    def post(self, request):
        if request.path.endswith('/reviews/'):
            return self._create_review(request)

        serializer = FightRecordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        challenge = serializer.save(initiator=request.user, result=FightRecord.STATUS_PENDING)
        challenge.refresh_from_db()
        return Response(FightRecordSerializer(challenge).data, status=status.HTTP_201_CREATED)

    def _create_review(self, request):
        target_id = request.data.get('target_id')
        rating = request.data.get('rating')
        comment = str(request.data.get('comment', '')).strip()

        if not target_id or not rating:
            return Response({'detail': 'Target fighter and rating are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rating_value = int(rating)
        except (TypeError, ValueError):
            return Response({'detail': 'Rating must be an integer from 1 to 5.'}, status=status.HTTP_400_BAD_REQUEST)

        if rating_value < 1 or rating_value > 5:
            return Response({'detail': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        if int(target_id) == request.user.id:
            return Response({'detail': 'You cannot review yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        if not fighters_have_accepted_challenge(request.user.id, int(target_id)):
            return Response(
                {'detail': 'You can only review fighters after an accepted sparring challenge.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target = User.objects.filter(id=target_id).first()

        if not target:
            return Response({'detail': 'Target fighter not found.'}, status=status.HTTP_404_NOT_FOUND)

        review, created = FighterReview.objects.update_or_create(
            reviewer=request.user,
            target=target,
            defaults={'rating': rating_value, 'comment': comment},
        )
        rebuild_fighter_statistics()
        review.refresh_from_db()
        return Response(serialize_review(review), status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class FightRecordDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        return FightRecord.objects.select_related('initiator', 'opponent', 'location', 'martial_art_rule').filter(
            Q(initiator=request.user) | Q(opponent=request.user),
            pk=pk,
        ).first()

    def get(self, request, pk):
        challenge = self.get_object(request, pk)

        if not challenge:
            return Response({'detail': 'Challenge not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(FightRecordSerializer(challenge).data)

    def put(self, request, pk):
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        return self._update(request, pk, partial=True)

    def delete(self, request, pk):
        challenge = self.get_object(request, pk)

        if not challenge:
            return Response({'detail': 'Challenge not found.'}, status=status.HTTP_404_NOT_FOUND)

        if challenge.initiator != request.user:
            return Response({'detail': 'Only the challenger can delete a challenge.'}, status=status.HTTP_403_FORBIDDEN)

        challenge.delete()
        rebuild_fighter_statistics()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _update(self, request, pk, partial):
        challenge = self.get_object(request, pk)

        if not challenge:
            return Response({'detail': 'Challenge not found.'}, status=status.HTTP_404_NOT_FOUND)

        incoming_status = request.data.get('status')

        if challenge.opponent == request.user and incoming_status in {
            FightRecord.STATUS_ACCEPTED,
            FightRecord.STATUS_DECLINED,
        }:
            serializer = FightRecordSerializer(
                challenge,
                data={'status': incoming_status},
                partial=True,
                context={'request': request},
            )
            serializer.is_valid(raise_exception=True)
            updated_challenge = serializer.save()
            rebuild_fighter_statistics()
            updated_challenge.refresh_from_db()
            return Response(FightRecordSerializer(updated_challenge).data)

        if challenge.initiator != request.user:
            return Response({'detail': 'Only the challenger can edit this challenge.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = FightRecordSerializer(
            challenge,
            data=request.data,
            partial=partial,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        updated_challenge = serializer.save()

        if updated_challenge.result not in {
            FightRecord.STATUS_PENDING,
            FightRecord.STATUS_CANCELLED,
            FightRecord.STATUS_ACCEPTED,
            FightRecord.STATUS_DECLINED,
        }:
            updated_challenge.result = FightRecord.STATUS_PENDING
            updated_challenge.save(update_fields=['result'])

        rebuild_fighter_statistics()
        updated_challenge.refresh_from_db()
        return Response(FightRecordSerializer(updated_challenge).data)
