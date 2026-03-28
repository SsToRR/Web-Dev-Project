from datetime import date

from django.contrib.auth.hashers import make_password
from django.db import migrations


def seed_demo_data(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    FighterProfile = apps.get_model('fights', 'FighterProfile')
    FightRecord = apps.get_model('fights', 'FightRecord')
    Location = apps.get_model('fights', 'Location')
    MartialArtRule = apps.get_model('fights', 'MartialArtRule')

    almaty_arena, _ = Location.objects.get_or_create(
        name='Almaty Arena',
        defaults={'address': '11 Momyshuly Street, Almaty'},
    )
    Location.objects.get_or_create(
        name='Astana Fight Club',
        defaults={'address': '22 Turan Avenue, Astana'},
    )
    Location.objects.get_or_create(
        name='Shymkent Combat Hall',
        defaults={'address': '7 Tauke Khan Avenue, Shymkent'},
    )

    boxing_rule, _ = MartialArtRule.objects.get_or_create(
        name='Boxing',
        defaults={'number_of_rounds': 3, 'round_duration_minutes': 3},
    )
    MartialArtRule.objects.get_or_create(
        name='Kickboxing',
        defaults={'number_of_rounds': 3, 'round_duration_minutes': 2},
    )
    MartialArtRule.objects.get_or_create(
        name='MMA',
        defaults={'number_of_rounds': 3, 'round_duration_minutes': 5},
    )

    fighter_one, _ = User.objects.get_or_create(
        username='fighter_one',
        defaults={
            'first_name': 'Arman',
            'last_name': 'Sadykov',
            'password': make_password('FightTrack123!'),
        },
    )
    fighter_two, _ = User.objects.get_or_create(
        username='fighter_two',
        defaults={
            'first_name': 'Dias',
            'last_name': 'Nurpeisov',
            'password': make_password('FightTrack123!'),
        },
    )

    FighterProfile.objects.update_or_create(
        user=fighter_one,
        defaults={
            'rating': 1025,
            'achievements': 'KMS in boxing, winner of the city cup',
            'total_fights': 1,
        },
    )
    FighterProfile.objects.update_or_create(
        user=fighter_two,
        defaults={
            'rating': 985,
            'achievements': 'Regional kickboxing finalist',
            'total_fights': 1,
        },
    )

    FightRecord.objects.get_or_create(
        initiator=fighter_one,
        opponent=fighter_two,
        location=almaty_arena,
        martial_art_rule=boxing_rule,
        date=date(2026, 3, 15),
        defaults={
            'result': 'win',
            'is_sparring': True,
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ('fights', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_demo_data, migrations.RunPython.noop),
    ]
