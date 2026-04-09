from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import FightRecord, FighterReview, Location, MartialArtRule

User = get_user_model()


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'address']


class FightRecordSerializer(serializers.ModelSerializer):
    initiator_id = serializers.IntegerField(source='initiator.id', read_only=True)
    initiator_username = serializers.CharField(source='initiator.username', read_only=True)
    opponent_id = serializers.PrimaryKeyRelatedField(source='opponent', queryset=User.objects.all())
    opponent_username = serializers.CharField(source='opponent.username', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(source='location', queryset=Location.objects.all())
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_address = serializers.CharField(source='location.address', read_only=True)
    martial_art_rule_id = serializers.PrimaryKeyRelatedField(
        source='martial_art_rule',
        queryset=MartialArtRule.objects.all(),
    )
    rule_name = serializers.CharField(source='martial_art_rule.name', read_only=True)
    rule_rounds = serializers.IntegerField(source='martial_art_rule.number_of_rounds', read_only=True)
    rule_round_duration_minutes = serializers.IntegerField(
        source='martial_art_rule.round_duration_minutes',
        read_only=True,
    )
    status = serializers.ChoiceField(source='result', choices=FightRecord.STATUS_CHOICES, required=False)

    class Meta:
        model = FightRecord
        fields = [
            'id',
            'initiator_id',
            'initiator_username',
            'opponent_id',
            'opponent_username',
            'location_id',
            'location_name',
            'location_address',
            'martial_art_rule_id',
            'rule_name',
            'rule_rounds',
            'rule_round_duration_minutes',
            'date',
            'status',
            'message',
            'is_sparring',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'initiator_id',
            'initiator_username',
            'opponent_username',
            'location_name',
            'location_address',
            'rule_name',
            'rule_rounds',
            'rule_round_duration_minutes',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        initiator = getattr(self.instance, 'initiator', None)

        if request and request.user.is_authenticated and self.instance is None:
            initiator = request.user

        opponent = attrs.get('opponent', getattr(self.instance, 'opponent', None))

        if initiator and opponent and initiator == opponent:
            raise serializers.ValidationError('Initiator and opponent must be different users.')

        return attrs


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False, required=False)
    achievements = serializers.CharField(required=False, allow_blank=True)
    experiences = serializers.ListField(child=serializers.DictField(), required=False)


class LeaderboardSerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    username = serializers.CharField()
    rating = serializers.IntegerField()
    total_fights = serializers.IntegerField()
    total_reviews = serializers.IntegerField()
    average_review_score = serializers.FloatField()
    achievements = serializers.CharField()
    top_experiences = serializers.ListField(child=serializers.CharField())


def serialize_review(review: FighterReview) -> dict:
    return {
        'id': review.id,
        'reviewer_id': review.reviewer_id,
        'reviewer_username': review.reviewer.username,
        'target_id': review.target_id,
        'target_username': review.target.username,
        'rating': review.rating,
        'comment': review.comment,
        'created_at': review.created_at,
    }
