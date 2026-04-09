from django.contrib.auth.models import User
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import FightRecord, FighterProfile, Location, MartialArtRule, WEIGHT_CATEGORY_RULES
from .serializers import (
    FightRecordSerializer,
    FighterProfileSerializer,
    FighterProfileUpdateSerializer,
    LeaderboardFilterSerializer,
    LocationSerializer,
    LoginSerializer,
    MartialArtRuleSerializer,
    MatchmakingFilterSerializer,
    RegisterSerializer,
)


def apply_weight_category_filter(queryset, weight_category):
    if not weight_category:
        return queryset

    category = next((item for item in WEIGHT_CATEGORY_RULES if item[0] == weight_category), None)
    if not category:
        return queryset

    _, _, min_weight, max_weight = category
    filters = {"weight_kg__gte": min_weight}
    if max_weight is not None:
        filters["weight_kg__lt"] = max_weight
    return queryset.filter(**filters)


def apply_fight_filters_to_profiles(queryset, martial_art_id=None, min_duration=None, max_duration=None):
    if not martial_art_id and min_duration is None and max_duration is None:
        return queryset

    initiated_filter = Q(user__initiated_fights__challenge_status=FightRecord.STATUS_ACCEPTED)
    opponent_filter = Q(user__opponent_fights__challenge_status=FightRecord.STATUS_ACCEPTED)

    if martial_art_id:
        initiated_filter &= Q(user__initiated_fights__martial_art_rule_id=martial_art_id)
        opponent_filter &= Q(user__opponent_fights__martial_art_rule_id=martial_art_id)

    if min_duration is not None:
        initiated_filter &= Q(user__initiated_fights__duration_minutes__gte=min_duration)
        opponent_filter &= Q(user__opponent_fights__duration_minutes__gte=min_duration)

    if max_duration is not None:
        initiated_filter &= Q(user__initiated_fights__duration_minutes__lte=max_duration)
        opponent_filter &= Q(user__opponent_fights__duration_minutes__lte=max_duration)

    return queryset.filter(initiated_filter | opponent_filter).distinct()


class FightRecordListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        fights = FightRecord.objects.filter(
            Q(initiator=request.user) | Q(opponent=request.user)
        ).select_related(
            "initiator",
            "opponent",
            "winner",
            "location",
            "martial_art_rule",
        )
        serializer = FightRecordSerializer(fights, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = FightRecordSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save(
                initiator=request.user,
                challenge_status=FightRecord.STATUS_PENDING,
                is_finished=False,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FightRecordDetail(APIView):
    permission_classes = [IsAuthenticated]

    def _get_fight(self, pk, user):
        fight = get_object_or_404(FightRecord, pk=pk)
        if fight.initiator != user and fight.opponent != user:
            return None, Response({"detail": "Нет доступа к этой записи."}, status=status.HTTP_403_FORBIDDEN)
        return fight, None

    def get(self, request, pk):
        fight, error = self._get_fight(pk, request.user)
        if error:
            return error
        serializer = FightRecordSerializer(fight, context={"request": request})
        return Response(serializer.data)

    def put(self, request, pk):
        fight, error = self._get_fight(pk, request.user)
        if error:
            return error
        if fight.initiator != request.user:
            return Response({"detail": "Только инициатор может редактировать вызов."}, status=status.HTTP_403_FORBIDDEN)
        serializer = FightRecordSerializer(fight, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        fight, error = self._get_fight(pk, request.user)
        if error:
            return error
        if fight.initiator != request.user:
            return Response({"detail": "Только инициатор может удалить вызов."}, status=status.HTTP_403_FORBIDDEN)
        fight.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def respond_to_challenge(request, pk):
    fight = get_object_or_404(FightRecord, pk=pk)

    if fight.opponent != request.user:
        return Response({"detail": "Только соперник может ответить на вызов."}, status=status.HTTP_403_FORBIDDEN)

    if fight.challenge_status != FightRecord.STATUS_PENDING:
        return Response({"detail": "На этот вызов уже ответили."}, status=status.HTTP_400_BAD_REQUEST)

    action = request.data.get("action")
    if action not in {"accept", "decline"}:
        return Response({"detail": "Допустимы только accept или decline."}, status=status.HTTP_400_BAD_REQUEST)

    if fight.date <= timezone.now() and action == "accept":
        return Response({"detail": "Нельзя принять вызов на прошедшее время."}, status=status.HTTP_400_BAD_REQUEST)

    fight.challenge_status = FightRecord.STATUS_ACCEPTED if action == "accept" else FightRecord.STATUS_DECLINED
    fight.save(update_fields=["challenge_status"])

    serializer = FightRecordSerializer(fight, context={"request": request})
    return Response(
        {
            "message": "Вызов принят." if action == "accept" else "Вызов отклонен.",
            "fight": serializer.data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def find_opponent(request):
    filter_serializer = MatchmakingFilterSerializer(data=request.data)
    if not filter_serializer.is_valid():
        return Response(filter_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = filter_serializer.validated_data

    try:
        my_profile = request.user.fighter_profile
    except FighterProfile.DoesNotExist:
        return Response({"detail": "Сначала создайте профиль бойца."}, status=status.HTTP_400_BAD_REQUEST)

    candidates = FighterProfile.objects.exclude(user=request.user).select_related("user")

    rating_range = data.get("rating_range", 200)
    base_candidates = candidates.filter(
        rating__gte=my_profile.rating - rating_range,
        rating__lte=my_profile.rating + rating_range,
    )

    if data.get("auto"):
        strict_candidates = base_candidates
        if my_profile.experience_level:
            strict_candidates = strict_candidates.filter(
                experience_level__gte=max(1, my_profile.experience_level - 1),
                experience_level__lte=min(5, my_profile.experience_level + 1),
            )
        if my_profile.weight_category_code:
            strict_candidates = apply_weight_category_filter(strict_candidates, my_profile.weight_category_code)

        if strict_candidates.exists():
            candidates = strict_candidates
        else:
            relaxed_candidates = base_candidates
            if my_profile.experience_level:
                relaxed_candidates = relaxed_candidates.filter(
                    experience_level__gte=max(1, my_profile.experience_level - 1),
                    experience_level__lte=min(5, my_profile.experience_level + 1),
                )
            if relaxed_candidates.exists():
                candidates = relaxed_candidates
            else:
                wide_candidates = FighterProfile.objects.exclude(user=request.user).select_related("user").filter(
                    rating__gte=my_profile.rating - max(rating_range, 350),
                    rating__lte=my_profile.rating + max(rating_range, 350),
                )
                candidates = wide_candidates if wide_candidates.exists() else base_candidates
    else:
        candidates = base_candidates
        if data.get("experience_level"):
            candidates = candidates.filter(experience_level=data["experience_level"])
        if data.get("location_id"):
            location = Location.objects.get(pk=data["location_id"])
            candidates = candidates.filter(city__icontains=location.address.split(",")[0])
        candidates = apply_weight_category_filter(candidates, data.get("weight_category"))
        candidates = apply_fight_filters_to_profiles(candidates, martial_art_id=data.get("martial_art_id"))

    candidates = candidates.order_by("-rating", "user__username")

    if not candidates.exists():
        return Response(
            {"detail": "Соперники не найдены. Попробуйте расширить критерии поиска."},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = FighterProfileSerializer(candidates[:12], many=True)
    return Response({"count": candidates.count(), "results": serializer.data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def finish_sparring(request, pk):
    fight = get_object_or_404(FightRecord, pk=pk)

    if fight.initiator != request.user and fight.opponent != request.user:
        return Response({"detail": "Нет доступа."}, status=status.HTTP_403_FORBIDDEN)

    if fight.challenge_status != FightRecord.STATUS_ACCEPTED:
        return Response({"detail": "Спарринг можно завершить только после принятия вызова."}, status=status.HTTP_400_BAD_REQUEST)

    if fight.date > timezone.now():
        return Response({"detail": "Нельзя завершить спарринг до запланированного времени."}, status=status.HTTP_400_BAD_REQUEST)

    if fight.is_finished:
        return Response({"detail": "Спарринг уже завершен."}, status=status.HTTP_400_BAD_REQUEST)

    opponent_review = request.data.get("opponent_review", "").strip()
    skill_rating = request.data.get("opponent_skill_rating")

    if not opponent_review:
        return Response({"detail": "Пожалуйста, оставьте отзыв об оппоненте."}, status=status.HTTP_400_BAD_REQUEST)

    fight.opponent_review = opponent_review
    if skill_rating is not None:
        try:
            parsed_rating = int(skill_rating)
            if 1 <= parsed_rating <= 10:
                fight.opponent_skill_rating = parsed_rating
        except (TypeError, ValueError):
            pass

    base_delta = 10
    duration_bonus = 5 if fight.duration_minutes >= 60 else 0
    skill_bonus = 5 if (fight.opponent_skill_rating or 0) >= 7 else 0
    fight.rating_delta = base_delta + duration_bonus + skill_bonus
    fight.is_finished = True
    fight.save()

    for participant in [fight.initiator, fight.opponent]:
        try:
            profile = participant.fighter_profile
            profile.rating += fight.rating_delta
            profile.save(update_fields=["rating"])
        except FighterProfile.DoesNotExist:
            continue

    serializer = FightRecordSerializer(fight, context={"request": request})
    return Response(
        {
            "message": f"Спарринг завершен. Оба бойца получили +{fight.rating_delta} к рейтингу.",
            "fight": serializer.data,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def leaderboard(request):
    serializer = LeaderboardFilterSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    fighters = FighterProfile.objects.select_related("user").all()

    if data.get("experience_level"):
        fighters = fighters.filter(experience_level=data["experience_level"])

    fighters = apply_weight_category_filter(fighters, data.get("weight_category"))
    fighters = apply_fight_filters_to_profiles(
        fighters,
        martial_art_id=data.get("martial_art_id"),
        min_duration=data.get("min_duration"),
        max_duration=data.get("max_duration"),
    )
    fighters = fighters.order_by("-rating", "user__username")

    limit = data.get("limit", 20)
    top_fighters = fighters[:limit]
    payload = FighterProfileSerializer(top_fighters, many=True).data
    return Response({"count": fighters.count(), "results": payload})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data["user"]
    refresh = RefreshToken.for_user(user)
    profile, _ = FighterProfile.objects.get_or_create(user=user)
    profile_data = FighterProfileSerializer(profile).data

    return Response({"access": str(refresh.access_token), "refresh": str(refresh), "user": profile_data})


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    profile_data = FighterProfileSerializer(user.fighter_profile).data
    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh), "user": profile_data},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get("refresh")
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"detail": "Выход выполнен успешно."})
    except Exception:
        return Response({"detail": "Неверный токен."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def locations_list(request):
    locations = Location.objects.all()
    return Response(LocationSerializer(locations, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def martial_arts_list(request):
    rules = MartialArtRule.objects.all()
    return Response(MartialArtRuleSerializer(rules, many=True).data)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def my_profile(request):
    profile, _ = FighterProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return Response(FighterProfileSerializer(profile).data)

    serializer = FighterProfileUpdateSerializer(
        profile,
        data=request.data,
        partial=request.method == "PATCH",
    )
    if serializer.is_valid():
        serializer.save()
        return Response(FighterProfileSerializer(profile).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
