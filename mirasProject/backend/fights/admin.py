from django.contrib import admin

from .models import FighterExperience, FighterProfile, FighterReview, FightRecord, Location, MartialArtRule

admin.site.register(FighterProfile)
admin.site.register(FighterExperience)
admin.site.register(FighterReview)
admin.site.register(Location)
admin.site.register(MartialArtRule)
admin.site.register(FightRecord)
