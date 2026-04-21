from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

WEIGHT_CATEGORY_RULES = [
    ("light", "Легкая", 30, 60),
    ("middle", "Средняя", 60, 75),
    ("heavy", "Тяжелая", 75, 91),
    ("super_heavy", "Супертяжелая", 91, None),
]


def resolve_weight_category(weight_kg):
    if weight_kg is None:
        return None, None

    for code, label, min_weight, max_weight in WEIGHT_CATEGORY_RULES:
        if weight_kg >= min_weight and (max_weight is None or weight_kg < max_weight):
            return code, label

    return WEIGHT_CATEGORY_RULES[-1][0], WEIGHT_CATEGORY_RULES[-1][1]


class Location(models.Model):
    """Зал или арена для проведения боев и спаррингов."""

    name = models.CharField(max_length=200, verbose_name="Название зала")
    address = models.CharField(max_length=500, verbose_name="Адрес")

    class Meta:
        verbose_name = "Локация"
        verbose_name_plural = "Локации"

    def __str__(self):
        return f"{self.name} ({self.address})"


class MartialArtRule(models.Model):
    """Правила конкретного вида единоборства."""

    name = models.CharField(max_length=100, verbose_name="Название")
    number_of_rounds = models.PositiveIntegerField(default=3, verbose_name="Количество раундов")
    round_duration_minutes = models.PositiveIntegerField(default=3, verbose_name="Длительность раунда (мин)")

    class Meta:
        verbose_name = "Правила вида спорта"
        verbose_name_plural = "Правила видов спорта"

    def __str__(self):
        return f"{self.name} ({self.number_of_rounds}x{self.round_duration_minutes} мин)"


class FighterProfile(models.Model):
    """Профиль бойца как расширение стандартного пользователя."""

    EXPERIENCE_CHOICES = [
        (1, "Новичок"),
        (2, "Любитель"),
        (3, "Средний"),
        (4, "Продвинутый"),
        (5, "Профессионал"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="fighter_profile")
    rating = models.IntegerField(default=1000, verbose_name="Рейтинг")
    experience_level = models.IntegerField(
        choices=EXPERIENCE_CHOICES,
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Уровень опыта",
    )
    achievements = models.TextField(blank=True, verbose_name="Достижения")
    weight_kg = models.FloatField(null=True, blank=True, verbose_name="Вес (кг)")
    height_cm = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(120), MaxValueValidator(250)],
        verbose_name="Рост (см)",
    )
    city = models.CharField(max_length=100, blank=True, verbose_name="Город")

    class Meta:
        verbose_name = "Профиль бойца"
        verbose_name_plural = "Профили бойцов"

    avatar_url = models.URLField(blank=True, verbose_name="\u0410\u0432\u0430\u0442\u0430\u0440")

    @property
    def weight_category_code(self):
        code, _ = resolve_weight_category(self.weight_kg)
        return code

    @property
    def weight_category_label(self):
        _, label = resolve_weight_category(self.weight_kg)
        return label

    def __str__(self):
        return f"{self.user.username} (рейтинг: {self.rating})"


class FightRecord(models.Model):
    """Запись о бое или вызове на спарринг."""

    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_DECLINED = "declined"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Ожидает ответа"),
        (STATUS_ACCEPTED, "Принят"),
        (STATUS_DECLINED, "Отклонен"),
    ]

    initiator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="initiated_fights",
        verbose_name="Инициатор",
    )
    opponent = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="opponent_fights",
        verbose_name="Оппонент",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Локация",
    )
    martial_art_rule = models.ForeignKey(
        MartialArtRule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Правила",
    )
    date = models.DateTimeField(verbose_name="Дата боя")
    duration_minutes = models.PositiveIntegerField(
        default=60,
        validators=[MinValueValidator(15), MaxValueValidator(300)],
        verbose_name="Длительность тренировки (мин)",
    )
    is_sparring = models.BooleanField(default=True, verbose_name="Спарринг")
    challenge_status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        verbose_name="Статус вызова",
    )
    winner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="won_fights",
        verbose_name="Победитель",
    )
    opponent_review = models.TextField(blank=True, verbose_name="Отзыв об оппоненте")
    opponent_skill_rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name="Оценка навыков соперника (1-10)",
    )
    rating_delta = models.IntegerField(default=0, verbose_name="Изменение рейтинга")
    is_finished = models.BooleanField(default=False, verbose_name="Завершен")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Запись о бое"
        verbose_name_plural = "Записи о боях"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        fight_type = "Спарринг" if self.is_sparring else "Бой"
        return f"{fight_type}: {self.initiator.username} vs {self.opponent.username} ({self.date.date()})"
