from django.urls import path

from .views import FightRecordDetailView, FightRecordListCreateView, auth_view, leaderboard_view

urlpatterns = [
    path('auth/login/', auth_view, name='login'),
    path('auth/register/', auth_view, name='register'),
    path('auth/logout/', auth_view, name='logout'),
    path('leaderboard/', leaderboard_view, name='leaderboard'),
    path('fights/', FightRecordListCreateView.as_view(), name='fight-list-create'),
    path('reviews/', FightRecordListCreateView.as_view(), name='review-list-create'),
    path('fights/<int:pk>/', FightRecordDetailView.as_view(), name='fight-detail'),
]
