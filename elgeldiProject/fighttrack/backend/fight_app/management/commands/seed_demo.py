"""
python manage.py seed_demo
Создает демонстрационные данные: локации, виды спорта, бойцов и спарринги.
"""

import random
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from fight_app.models import FightRecord, FighterProfile, Location, MartialArtRule


class Command(BaseCommand):
    help = "Заполняет БД демонстрационными данными"

    def handle(self, *args, **options):
        self.stdout.write("Создаем демо-данные...")

        locations_data = [
            ("Tiger Muay Thai", "Almaty, ул. Абая 1"),
            ("Fight Club Almaty", "Almaty, пр. Достык 42"),
            ("Reebok CrossFit", "Almaty, ул. Сейфуллина 100"),
        ]
        locations = []
        for name, address in locations_data:
            loc, created = Location.objects.get_or_create(name=name, defaults={"address": address})
            locations.append(loc)
            if created:
                self.stdout.write(f"  Создана локация: {name}")

        arts_data = [
            ("Бокс", 12, 3),
            ("ММА", 5, 5),
            ("Кикбоксинг", 9, 2),
            ("Муай-Тай", 5, 3),
            ("Грэпплинг", 3, 8),
        ]
        arts = []
        for name, rounds, duration in arts_data:
            art, created = MartialArtRule.objects.get_or_create(
                name=name,
                defaults={"number_of_rounds": rounds, "round_duration_minutes": duration},
            )
            arts.append(art)
            if created:
                self.stdout.write(f"  Создан вид спорта: {name}")

        fighters_data = [
            ("admin", "admin123", "Администратор", 1400, 4, "КМС по боксу", 85.0, 184, "Almaty"),
            ("ali_kg", "pass1234", "Али Бекенов", 1250, 3, "1 разряд кикбоксинг", 78.5, 179, "Almaty"),
            ("arman_mma", "pass1234", "Арман Сейтов", 1100, 3, "Любитель ММА", 82.0, 181, "Almaty"),
            ("bekzat_b", "pass1234", "Бекзат Боксер", 980, 2, "", 70.0, 175, "Almaty"),
            ("pro_ivan", "pass1234", "Иван Грозный", 1600, 5, "МС по боксу, чемпион РК", 90.0, 188, "Almaty"),
            ("newbie_k", "pass1234", "Кирилл Новый", 850, 1, "Только начинаю", 68.0, 172, "Almaty"),
        ]

        users = []
        for username, password, display, rating, exp, achievements, weight, height, city in fighters_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"first_name": display.split()[0]},
            )
            if created:
                user.set_password(password)
                if username == "admin":
                    user.is_staff = True
                    user.is_superuser = True
                user.save()
                self.stdout.write(f"  Создан пользователь: {username}")
            elif username == "admin":
                user.set_password(password)
                user.is_staff = True
                user.is_superuser = True
                user.save()

            FighterProfile.objects.update_or_create(
                user=user,
                defaults={
                    "rating": rating,
                    "experience_level": exp,
                    "achievements": achievements,
                    "weight_kg": weight,
                    "height_cm": height,
                    "city": city,
                },
            )
            users.append(user)

        if FightRecord.objects.count() == 0:
            self.stdout.write("  Создаем историю спаррингов...")
            sample_reviews = [
                "Отличный боец, хорошая техника удара. Честный соперник.",
                "Агрессивный стиль, но предсказуемый. Нужно работать над защитой.",
                "Очень быстрый, хорошо двигается. Было тяжело, но полезно.",
                "Спокойный и техничный. Много чему научился у него.",
            ]

            fight_pairs = [
                (users[0], users[1]),
                (users[1], users[2]),
                (users[2], users[3]),
                (users[0], users[4]),
            ]

            for index, (initiator, opponent) in enumerate(fight_pairs):
                fight_date = timezone.now() - timedelta(days=random.randint(5, 40))
                art = random.choice(arts)
                loc = random.choice(locations)
                FightRecord.objects.create(
                    initiator=initiator,
                    opponent=opponent,
                    location=loc,
                    martial_art_rule=art,
                    date=fight_date,
                    duration_minutes=random.choice([45, 60, 75, 90]),
                    is_sparring=True,
                    challenge_status=FightRecord.STATUS_ACCEPTED,
                    is_finished=True,
                    opponent_review=sample_reviews[index % len(sample_reviews)],
                    opponent_skill_rating=random.randint(6, 10),
                    rating_delta=20,
                )
                self.stdout.write(f"  Создан завершенный спарринг: {initiator.username} vs {opponent.username}")

            pending_challenge_date = timezone.now() + timedelta(days=2)
            FightRecord.objects.create(
                initiator=users[3],
                opponent=users[5],
                location=random.choice(locations),
                martial_art_rule=random.choice(arts),
                date=pending_challenge_date,
                duration_minutes=60,
                is_sparring=True,
                challenge_status=FightRecord.STATUS_PENDING,
            )

        self.stdout.write(self.style.SUCCESS("\nДемо-данные успешно созданы"))
        self.stdout.write("   Логин администратора: admin / admin123")
        self.stdout.write("   Логин бойца: ali_kg / pass1234")
