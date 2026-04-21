# FightTrack

FightTrack is a combat-sports matchmaking and sparring tracker built for the Web Development course project. The application lets fighters register, manage their profile, find opponents, create sparring challenges, accept or decline challenges, finish sparring sessions with feedback, and view a rating leaderboard.

## Group Members

All members contributed to both frontend and backend development.

| Student | Contribution |
| --- | --- |
| Ibrayev Miras | Frontend and backend |
| Ibrashov Anuar | Frontend and backend |
| Yelgeldi Zhumagali | Frontend and backend |

## Tech Stack

| Layer | Technology | Current project version |
| --- | --- | --- |
| Frontend | Angular | 18.2.x |
| Frontend forms | Angular FormsModule with ngModel | Included |
| API client | Angular HttpClient | Included |
| Backend | Django | 4.2.9 |
| Backend API | Django REST Framework | 3.14.0 |
| Auth | SimpleJWT | 5.3.1 |
| CORS | django-cors-headers | 4.3.1 |
| Database | SQLite for local development | db.sqlite3 |

## Compatibility

Use these versions for the smoothest local setup:

| Tool | Recommended version |
| --- | --- |
| Node.js | 20.x LTS or 22.x |
| npm | 10.x or newer |
| Python | 3.11 or 3.12 |

Notes:

- The frontend has been upgraded to Angular 18. Angular 18 works with TypeScript 5.4.x, which matches the current `package.json`.
- Avoid Node 24 for this project unless Angular is upgraded further. Angular 18 does not officially target Node 24.
- The backend requirements pin Django 4.2.9. Create a fresh virtual environment and install `backend/requirements.txt` before running the server.
- The optional AI Coach feature requires `OPENAI_API_KEY` in `backend/.env`. The rest of the project works without it.

## Project Structure

```text
fighttrack/
  backend/
    manage.py
    requirements.txt
    .env.example
    fighttrack/
      settings.py
      urls.py
      wsgi.py
    fight_app/
      models.py
      serializers.py
      views.py
      urls.py
      admin.py
      management/commands/seed_demo.py
  frontend/
    angular.json
    package.json
    tsconfig.json
    src/
      app/
        app.component.*
        app.config.ts
        app.routes.ts
        interceptors/jwt.interceptor.ts
        services/api.service.ts
        services/auth.service.ts
        pages/
          home/
          login/
          register/
          profile/
          rating/
          matchmaking/
          fights/
        components/ai-coach/
```

## Local Setup

### Backend

From the repository root:

```powershell
cd elgeldiProject/fighttrack/backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Backend URL:

```text
http://localhost:8000
```

Optional AI Coach setup:

```powershell
copy .env.example .env
```

Then put a real `OPENAI_API_KEY` value into `.env`.

### Frontend

Open a second terminal:

```powershell
cd elgeldiProject/fighttrack/frontend
npm install
npm start
```

Frontend URL:

```text
http://localhost:4200
```

## Demo Accounts

After running `python manage.py seed_demo`, these accounts are available:

| Username | Password | Rating | Level |
| --- | --- | --- | --- |
| admin | admin123 | 1400 | Advanced |
| ali_kg | pass1234 | 1250 | Intermediate |
| arman_mma | pass1234 | 1100 | Intermediate |
| pro_ivan | pass1234 | 1600 | Professional |
| newbie_k | pass1234 | 850 | Beginner |

## API Endpoints

Base URL:

```text
http://localhost:8000/api/v1
```

| Method | Endpoint | Description | View type |
| --- | --- | --- | --- |
| POST | `/auth/register/` | Register user and return JWT tokens | FBV |
| POST | `/auth/login/` | Login and return JWT tokens | FBV |
| POST | `/auth/logout/` | Blacklist refresh token | FBV |
| POST | `/auth/refresh/` | Refresh access token | SimpleJWT |
| GET | `/profile/me/` | Get authenticated user's fighter profile | FBV |
| PATCH | `/profile/me/` | Update authenticated user's fighter profile | FBV |
| GET | `/fights/` | List current user's fights and challenges | CBV |
| POST | `/fights/` | Create a sparring challenge | CBV |
| GET | `/fights/{id}/` | Get challenge details | CBV |
| PUT | `/fights/{id}/` | Update challenge | CBV |
| DELETE | `/fights/{id}/` | Delete challenge | CBV |
| POST | `/fights/{id}/respond/` | Accept or decline a challenge | FBV |
| POST | `/fights/{id}/finish/` | Finish sparring and add feedback | FBV |
| POST | `/matchmaking/find/` | Find matching opponents | FBV |
| GET | `/leaderboard/` | Get fighter rating leaderboard | FBV |
| GET | `/locations/` | List available locations | FBV |
| GET | `/martial-arts/` | List martial art rules | FBV |
| POST | `/ai-coach/chat/` | Ask the optional AI Coach | FBV |

## Requirements Coverage

### Frontend

| Requirement | Status | Implementation |
| --- | --- | --- |
| Interfaces and services for backend APIs | Covered | `frontend/src/app/services/api.service.ts` |
| At least 4 click events that trigger API requests | Covered | Login, register, matchmaking search, challenge create, challenge response, delete, finish sparring |
| At least 4 form controls using `[(ngModel)]` | Covered | Login, register, profile, matchmaking, rating, review forms |
| Basic CSS styling | Covered | Component CSS files and global `styles.css` |
| Routing with at least 3 named routes | Covered | Home, rating, login, register, profile, matchmaking, fights |
| `@for` and `@if` rendering | Covered | Used throughout Angular templates |
| JWT authentication | Covered | Login page, logout, `JwtInterceptor`, protected routes |
| Angular service with `HttpClient` | Covered | `ApiService` |
| Graceful API error handling | Covered | Error messages in login, register, profile, rating, matchmaking, fights, AI Coach |

### Backend

| Requirement | Status | Implementation |
| --- | --- | --- |
| At least 4 models | Covered | `Location`, `MartialArtRule`, `FighterProfile`, `FightRecord` |
| At least 2 ForeignKey relationships | Covered | `FightRecord` has initiator, opponent, location, martial art rule, winner |
| At least 2 `serializers.Serializer` classes | Covered | `LoginSerializer`, `RegisterSerializer`, `MatchmakingFilterSerializer`, `LeaderboardFilterSerializer` |
| At least 2 `serializers.ModelSerializer` classes | Covered | `FighterProfileSerializer`, `LocationSerializer`, `MartialArtRuleSerializer`, `FightRecordSerializer` |
| At least 2 FBVs with DRF decorators | Covered | Login, register, logout, matchmaking, leaderboard, finish sparring, locations, martial arts |
| At least 2 CBVs using `APIView` | Covered | `FightRecordListCreate`, `FightRecordDetail` |
| Token-based login/logout | Covered | SimpleJWT login, refresh, logout blacklist |
| Full CRUD for one model | Covered | `FightRecord` list/create/retrieve/update/delete |
| Link created objects to authenticated user | Covered | Fight creation saves `initiator=request.user` |
| CORS for Angular dev server | Covered | `CORS_ALLOWED_ORIGINS` includes `localhost:4200` and `127.0.0.1:4200` |
| Postman collection | Covered | `postman/FightTrack.postman_collection.json` includes API requests and example responses |

## Verification Commands

```powershell
cd elgeldiProject/fighttrack/backend
.\venv\Scripts\activate
python manage.py check
```

```powershell
cd elgeldiProject/fighttrack/frontend
npm run build
```

## Defense Checklist

- GitHub repository contains the full Angular and Django project.
- README includes project description and group members.
- Backend and frontend run together locally.
- Postman collection is committed with all API requests and example responses.
- Presentation PDF, maximum 4 pages, is prepared for defense.
- All group members can explain both frontend and backend parts.
