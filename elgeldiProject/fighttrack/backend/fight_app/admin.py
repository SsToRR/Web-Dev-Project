from django.contrib import admin
from .models import FighterProfile, FightRecord, Location, MartialArtRule


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ["name", "address"]
    search_fields = ["name", "address"]


@admin.register(MartialArtRule)
class MartialArtRuleAdmin(admin.ModelAdmin):
    list_display = ["name", "number_of_rounds", "round_duration_minutes"]


@admin.register(FighterProfile)
class FighterProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "rating", "experience_level", "city"]
    list_filter = ["experience_level"]
    search_fields = ["user__username", "city"]


@admin.register(FightRecord)
class FightRecordAdmin(admin.ModelAdmin):
    list_display = ["__str__", "date", "is_sparring", "is_finished", "rating_delta"]
    list_filter = ["is_sparring", "is_finished"]
    search_fields = ["initiator__username", "opponent__username"]
    date_hierarchy = "date"
