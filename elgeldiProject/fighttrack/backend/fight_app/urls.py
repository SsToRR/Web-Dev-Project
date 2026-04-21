from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views


urlpatterns = [
    path("auth/register/", views.register_view, name="register"),
    path("auth/login/", views.login_view, name="login"),
    path("auth/logout/", views.logout_view, name="logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("ai-coach/chat/", views.ai_coach_chat, name="ai-coach-chat"),
    path("fights/", views.FightRecordListCreate.as_view(), name="fight-list-create"),
    path("fights/<int:pk>/", views.FightRecordDetail.as_view(), name="fight-detail"),
    path("fights/<int:pk>/respond/", views.respond_to_challenge, name="fight-respond"),
    path("fights/<int:pk>/finish/", views.finish_sparring, name="finish-sparring"),
    path("matchmaking/find/", views.find_opponent, name="find-opponent"),
    path("leaderboard/", views.leaderboard, name="leaderboard"),
    path("locations/", views.locations_list, name="locations"),
    path("martial-arts/", views.martial_arts_list, name="martial-arts"),
    path("profile/me/", views.my_profile, name="my-profile"),
]
