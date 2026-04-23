from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import serializers

from .models import (
    FightRecord,
    FighterProfile,
    Location,
    MartialArtRule,
    WEIGHT_CATEGORY_RULES,
    resolve_weight_category,
)


class FighterProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    experience_label = serializers.CharField(source="get_experience_level_display", read_only=True)
    total_fights = serializers.SerializerMethodField()
    weight_category = serializers.SerializerMethodField()
    weight_category_label = serializers.SerializerMethodField()

    class Meta:
        model = FighterProfile
        fields = [
            "id",
            "user_id",
            "username",
            "email",
            "rating",
            "experience_level",
            "experience_label",
            "achievements",
            "weight_kg",
            "height_cm",
            "weight_category",
            "weight_category_label",
            "city",
            "total_fights",
        ]

    def get_total_fights(self, obj):
        return FightRecord.objects.filter(
            challenge_status=FightRecord.STATUS_ACCEPTED,
            initiator=obj.user,
        ).count() + FightRecord.objects.filter(
            challenge_status=FightRecord.STATUS_ACCEPTED,
            opponent=obj.user,
        ).count()

    def get_weight_category(self, obj):
        return obj.weight_category_code

    def get_weight_category_label(self, obj):
        return obj.weight_category_label


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "name", "address"]


class MartialArtRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MartialArtRule
        fields = ["id", "name", "number_of_rounds", "round_duration_minutes"]


class FightRecordSerializer(serializers.ModelSerializer):
    initiator_username = serializers.CharField(source="initiator.username", read_only=True)
    opponent_username = serializers.CharField(source="opponent.username", read_only=True)
    winner_username = serializers.CharField(source="winner.username", read_only=True, default=None)
    location_detail = LocationSerializer(source="location", read_only=True)
    martial_art_detail = MartialArtRuleSerializer(source="martial_art_rule", read_only=True)
    challenge_status_label = serializers.CharField(source="get_challenge_status_display", read_only=True)
    opponent = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    location = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all(), required=False, allow_null=True)
    martial_art_rule = serializers.PrimaryKeyRelatedField(
        queryset=MartialArtRule.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = FightRecord
        fields = [
            "id",
            "initiator",
            "initiator_username",
            "opponent",
            "opponent_username",
            "winner",
            "winner_username",
            "location",
            "location_detail",
            "martial_art_rule",
            "martial_art_detail",
            "date",
            "duration_minutes",
            "is_sparring",
            "challenge_status",
            "challenge_status_label",
            "is_finished",
            "opponent_review",
            "opponent_skill_rating",
            "rating_delta",
            "created_at",
        ]
        read_only_fields = [
            "initiator",
            "rating_delta",
            "is_finished",
            "created_at",
            "challenge_status",
        ]

    def validate(self, data):
        request = self.context.get("request")
        opponent = data.get("opponent")
        date = data.get("date")
        duration_minutes = data.get("duration_minutes", getattr(self.instance, "duration_minutes", None))
        martial_art_rule = data.get("martial_art_rule", getattr(self.instance, "martial_art_rule", None))
        location = data.get("location", getattr(self.instance, "location", None))

        if request and opponent == request.user:
            raise serializers.ValidationError("Нельзя назначить себя оппонентом.")

        if date and date <= timezone.now():
            raise serializers.ValidationError({"date": "Нельзя бросить вызов на прошедшее время."})

        if duration_minutes is None:
            raise serializers.ValidationError({"duration_minutes": "Укажите длительность тренировки."})

        if self.instance is None:
            errors = {}
            if martial_art_rule is None:
                errors["martial_art_rule"] = "Выберите вид спорта для вызова."
            if location is None:
                errors["location"] = "Выберите зал для вызова."
            if errors:
                raise serializers.ValidationError(errors)

        return data


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, data):
        user = authenticate(username=data["username"], password=data["password"])
        if not user:
            raise serializers.ValidationError(
                "Неверный логин или пароль. Проверьте данные и попробуйте снова."
            )
        if not user.is_active:
            raise serializers.ValidationError("Аккаунт заблокирован.")
        data["user"] = user
        return data


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})
    experience_level = serializers.IntegerField(required=False, min_value=1, max_value=5, default=1)
    achievements = serializers.CharField(required=False, allow_blank=True)
    weight_kg = serializers.FloatField(required=False, allow_null=True, min_value=30)
    height_cm = serializers.IntegerField(required=False, allow_null=True, min_value=120, max_value=250)
    city = serializers.CharField(required=False, allow_blank=True, max_length=100)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Пользователь с таким логином уже существует.")
        return value

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Пароли не совпадают."})
        return data

    def create(self, validated_data):
        profile_data = {
            "experience_level": validated_data.pop("experience_level", 1),
            "achievements": validated_data.pop("achievements", ""),
            "weight_kg": validated_data.pop("weight_kg", None),
            "height_cm": validated_data.pop("height_cm", None),
            "city": validated_data.pop("city", ""),
        }
        validated_data.pop("password_confirm", None)
        password = validated_data.pop("password")

        user = User.objects.create_user(password=password, **validated_data)
        FighterProfile.objects.create(user=user, **profile_data)
        return user


class FighterProfileUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", required=False)
    email = serializers.EmailField(source="user.email", required=False, allow_blank=True)

    class Meta:
        model = FighterProfile
        fields = [
            "username",
            "email",
            "experience_level",
            "achievements",
            "weight_kg",
            "height_cm",
            "city"
        ]

    def validate_username(self, value):
        current_user = self.instance.user
        if User.objects.exclude(pk=current_user.pk).filter(username__iexact=value).exists():
            raise serializers.ValidationError("Этот логин уже занят.")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        user = instance.user
        if "username" in user_data:
            user.username = user_data["username"]
        if "email" in user_data:
            user.email = user_data["email"]
        user.save()
        return instance


class MatchmakingFilterSerializer(serializers.Serializer):
    martial_art_id = serializers.IntegerField(required=False, allow_null=True)
    location_id = serializers.IntegerField(required=False, allow_null=True)
    rating_range = serializers.IntegerField(required=False, default=200, min_value=50, max_value=1000)
    experience_level = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=5)
    weight_category = serializers.ChoiceField(
        required=False,
        allow_null=True,
        choices=[(code, label) for code, label, _, _ in WEIGHT_CATEGORY_RULES],
    )
    auto = serializers.BooleanField(required=False, default=False)

    def validate_martial_art_id(self, value):
        if value and not MartialArtRule.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Указанный вид спорта не найден.")
        return value

    def validate_location_id(self, value):
        if value and not Location.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Указанная локация не найдена.")
        return value


class LeaderboardFilterSerializer(serializers.Serializer):
    martial_art_id = serializers.IntegerField(required=False, allow_null=True)
    experience_level = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=5)
    weight_category = serializers.ChoiceField(
        required=False,
        allow_null=True,
        choices=[(code, label) for code, label, _, _ in WEIGHT_CATEGORY_RULES],
    )
    min_duration = serializers.IntegerField(required=False, allow_null=True, min_value=15, max_value=300)
    max_duration = serializers.IntegerField(required=False, allow_null=True, min_value=15, max_value=300)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=100, default=20)

    def validate(self, attrs):
        martial_art_id = attrs.get("martial_art_id")
        if martial_art_id and not MartialArtRule.objects.filter(pk=martial_art_id).exists():
            raise serializers.ValidationError({"martial_art_id": "Указанный вид спорта не найден."})

        min_duration = attrs.get("min_duration")
        max_duration = attrs.get("max_duration")
        if min_duration and max_duration and min_duration > max_duration:
            raise serializers.ValidationError({"max_duration": "Максимальная длительность должна быть не меньше минимальной."})

        return attrs
