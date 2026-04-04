from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import F, Q


class FighterProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fighter_profile')
    rating = models.PositiveIntegerField(default=0)
    achievements = models.TextField(blank=True)
    total_fights = models.PositiveIntegerField(default=0)
    total_reviews = models.PositiveIntegerField(default=0)
    average_review_score = models.DecimalField(max_digits=3, decimal_places=2, default=0)

    class Meta:
        ordering = ['-rating', '-average_review_score', 'user__username']

    def __str__(self):
        return f'{self.user.username} profile'


class Location(models.Model):
    name = models.CharField(max_length=120, unique=True)
    address = models.CharField(max_length=255)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class MartialArtRule(models.Model):
    name = models.CharField(max_length=80, unique=True)
    number_of_rounds = models.PositiveSmallIntegerField()
    round_duration_minutes = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class FighterExperience(models.Model):
    profile = models.ForeignKey(FighterProfile, on_delete=models.CASCADE, related_name='experiences')
    martial_art_rule = models.ForeignKey(MartialArtRule, on_delete=models.CASCADE, related_name='fighter_experiences')
    years = models.PositiveSmallIntegerField(default=0)
    months = models.PositiveSmallIntegerField(default=0, validators=[MaxValueValidator(11)])

    class Meta:
        ordering = ['-years', '-months', 'martial_art_rule__name']
        constraints = [
            models.UniqueConstraint(fields=['profile', 'martial_art_rule'], name='unique_fighter_experience'),
        ]

    def __str__(self):
        return f'{self.profile.user.username} - {self.martial_art_rule.name}'


class FighterReview(models.Model):
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='given_reviews',
    )
    target = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_reviews',
    )
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=~Q(reviewer=F('target')),
                name='reviewer_and_target_must_be_different',
            ),
            models.UniqueConstraint(fields=['reviewer', 'target'], name='unique_fighter_review_pair'),
        ]

    def __str__(self):
        return f'{self.reviewer} review for {self.target}'


class FightRecord(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_DECLINED = 'declined'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_DECLINED, 'Declined'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    initiator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='initiated_fights',
    )
    opponent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_fights',
    )
    location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name='fights')
    martial_art_rule = models.ForeignKey(MartialArtRule, on_delete=models.PROTECT, related_name='fights')
    date = models.DateField()
    result = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    message = models.CharField(max_length=255, blank=True)
    is_sparring = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-id']
        constraints = [
            models.CheckConstraint(
                condition=~Q(initiator=F('opponent')),
                name='fight_initiator_and_opponent_must_be_different',
            )
        ]

    def __str__(self):
        return f'{self.initiator} challenged {self.opponent} for {self.date}'
