from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q

from .models import FightRecord, FighterProfile, FighterReview


def rebuild_fighter_statistics():
    user_ids = list(get_user_model().objects.values_list('id', flat=True))

    for user_id in user_ids:
        FighterProfile.objects.get_or_create(user_id=user_id)

    profiles = {profile.user_id: profile for profile in FighterProfile.objects.all()}

    accepted_counts = FightRecord.objects.filter(result=FightRecord.STATUS_ACCEPTED).values('initiator_id', 'opponent_id')
    review_aggregates = FighterReview.objects.values('target_id').annotate(
        total_reviews=Count('id'),
        average_review_score=Avg('rating'),
    )

    accepted_map: dict[int, int] = {user_id: 0 for user_id in user_ids}

    for challenge in accepted_counts:
        accepted_map[challenge['initiator_id']] += 1
        accepted_map[challenge['opponent_id']] += 1

    review_map = {
        aggregate['target_id']: {
            'total_reviews': aggregate['total_reviews'],
            'average_review_score': aggregate['average_review_score'] or 0,
        }
        for aggregate in review_aggregates
    }

    for user_id, profile in profiles.items():
        review_info = review_map.get(user_id, {'total_reviews': 0, 'average_review_score': 0})
        average_score = Decimal(str(review_info['average_review_score'])).quantize(Decimal('0.01'))
        profile.total_fights = accepted_map.get(user_id, 0)
        profile.total_reviews = review_info['total_reviews']
        profile.average_review_score = average_score
        profile.rating = int(float(average_score) * 20)

    FighterProfile.objects.bulk_update(
        list(profiles.values()),
        ['rating', 'total_fights', 'total_reviews', 'average_review_score'],
    )


def fighters_have_accepted_challenge(first_user_id: int, second_user_id: int) -> bool:
    return FightRecord.objects.filter(
        Q(initiator_id=first_user_id, opponent_id=second_user_id)
        | Q(initiator_id=second_user_id, opponent_id=first_user_id),
        result=FightRecord.STATUS_ACCEPTED,
    ).exists()
