# FightTrack — Полная документация проекта

## Архитектура

```
fighttrack/
├── backend/                          # Django 4.2 + DRF
│   ├── manage.py
│   ├── requirements.txt
│   ├── fighttrack/
│   │   ├── __init__.py
│   │   ├── settings.py               ← CORS, JWT, DRF настройки
│   │   ├── urls.py                   ← include fight_app.urls
│   │   └── wsgi.py
│   └── fight_app/
│       ├── __init__.py
│       ├── models.py                 ← 4 модели
│       ├── serializers.py            ← 2 ModelSerializer + 2 Serializer
│       ├── views.py                  ← 2 CBV + 2 FBV
│       ├── urls.py
│       ├── admin.py
│       └── management/
│           └── commands/
│               └── seed_demo.py      ← демо-данные
└── frontend/                         # Angular 17 standalone
    ├── angular.json
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.app.json
    └── src/
        ├── main.ts
        ├── index.html
        ├── styles.css                ← глобальные стили, CSS vars
        └── app/
            ├── app.component.ts      ← shell + sidebar
            ├── app.config.ts         ← providers, interceptor
            ├── app.routes.ts         ← /login /matchmaking /fights
            ├── services/
            │   ├── api.service.ts    ← HttpClient, интерфейсы
            │   └── auth.service.ts   ← JWT storage, login/logout
            ├── interceptors/
            │   └── jwt.interceptor.ts ← Bearer token в заголовки
            └── pages/
                ├── login/login.component.ts
                ├── matchmaking/matchmaking.component.ts
                └── fights/fights.component.ts
```

## Быстрый старт

### 1. Backend

```bash
cd fighttrack/backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo        # создаёт демо-данные
python manage.py runserver        # http://localhost:8000
```

**Демо-аккаунты после seed_demo:**
| Логин       | Пароль   | Рейтинг | Уровень       |
|-------------|----------|---------|---------------|
| admin       | admin123 | 1400    | Продвинутый   |
| ali_kg      | pass1234 | 1250    | Средний       |
| arman_mma   | pass1234 | 1100    | Средний       |
| pro_ivan    | pass1234 | 1600    | Профессионал  |
| newbie_k    | pass1234 | 850     | Новичок       |

### 2. Frontend

```bash
cd fighttrack/frontend
npm install
npm start                         # http://localhost:4200
```

## API Endpoints

| Метод | URL | Описание | Тип view |
|-------|-----|----------|----------|
| POST | `/api/v1/auth/login/` | Получить JWT токен | FBV |
| POST | `/api/v1/auth/logout/` | Инвалидация токена | FBV |
| POST | `/api/v1/auth/refresh/` | Обновить access токен | SimpleJWT |
| GET | `/api/v1/fights/` | История боёв | **CBV** |
| POST | `/api/v1/fights/` | Создать спарринг | **CBV** |
| GET | `/api/v1/fights/{id}/` | Детали боя | **CBV** |
| PUT | `/api/v1/fights/{id}/` | Обновить бой | **CBV** |
| DELETE | `/api/v1/fights/{id}/` | Удалить запись | **CBV** |
| POST | `/api/v1/matchmaking/find/` | Найти соперника | **FBV** |
| POST | `/api/v1/fights/{id}/finish/` | Завершить спарринг | **FBV** |
| GET | `/api/v1/locations/` | Список залов | FBV |
| GET | `/api/v1/martial-arts/` | Виды спорта | FBV |
| GET | `/api/v1/profile/me/` | Мой профиль | FBV |

## Ключевые технические решения

### Serializers
- **FightRecordSerializer** (ModelSerializer) — поддерживает вложенные объекты (location_detail, martial_art_detail) через SerializerMethodField и source
- **FighterProfileSerializer** (ModelSerializer) — `get_experience_level_display()` для текстового представления, `total_fights` через `SerializerMethodField`
- **LoginSerializer** (Serializer) — вызывает `django.contrib.auth.authenticate`, бросает `ValidationError` с русским сообщением
- **MatchmakingFilterSerializer** (Serializer) — валидирует FK на Location и MartialArtRule, поле `auto` для автоматического режима

### Views
- **FightRecordListCreate (CBV)** — GET возвращает бои текущего пользователя через `Q(initiator=user) | Q(opponent=user)`, POST автоматически привязывает `initiator=request.user`
- **FightRecordDetail (CBV)** — проверяет, что только участник видит запись, только инициатор редактирует/удаляет
- **find_opponent (FBV)** — при `auto=True` фильтрует по `rating ± rating_range` и `experience_level ± 1`, возвращает максимум 10 кандидатов
- **finish_sparring (FBV)** — атомарно сохраняет отзыв и обновляет рейтинг обоих участников: базово +15, бонус +5 если оценка ≥ 7

### Angular архитектура
- **Standalone компоненты** с `loadComponent` (lazy loading) для каждого маршрута
- **AuthGuard** через функциональный guard (`inject(AuthService)`) без отдельного класса
- **JwtInterceptor** перехватывает все запросы кроме `/auth/login/` и добавляет `Authorization: Bearer <token>`, при 401 — автоматический logout
- **@for / @if** — новый синтаксис Angular 17, без `*ngFor`/`*ngIf`

### Рейтинговая система
```
rating_delta = 15 (базово за участие)
            + 5  (если opponent_skill_rating >= 7)
```
Оба бойца (initiator и opponent) получают `+rating_delta` после завершения спарринга.
