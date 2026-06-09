# Teacher-First LMS

A full-stack online classroom platform built with **Django REST Framework**, **React + Vite**, **PostgreSQL**, **Redis/Celery**, and **LiveKit Cloud** for live video sessions.

Teachers create courses and batches, students join with enrollment codes, and everyone meets in live video classrooms powered by LiveKit.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Application Flow](#application-flow)
- [Database Design](#database-design)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Running with Docker (Recommended)](#running-with-docker-recommended)
- [Running Locally Without Docker](#running-locally-without-docker)
- [Frontend Development](#frontend-development)
- [Docker Compose Architecture](#docker-compose-architecture)
- [Deployment Notes](#deployment-notes)
- [Common Errors](#common-errors)

---

## Project Overview

This LMS is designed around two main user roles — **Teacher** and **Student**. Teachers register, create courses and batches, share enrollment codes with students, and host live video classes. Students register, join batches using codes, attend live classes, download study materials, and submit assignments.

The system uses JWT authentication with httpOnly cookies for refresh tokens, role-based access control throughout, and Celery + Redis for background file compression tasks.

---

## Tech Stack

### Backend
- Python 3.12, Django 5.0.8, Django REST Framework 3.15.2
- Simple JWT 5.3.1 (authentication)
- drf-spectacular (Swagger/ReDoc API docs)
- Celery 5.4.0 + Redis 7 (async task queue for file compression)
- PostgreSQL 16 (primary database)
- Gunicorn (WSGI production server)
- LiveKit Python SDK — livekit-api 0.7.0 (live video rooms)
- Pillow, python-magic (file handling)

### Frontend
- React 19 + Vite
- React Router DOM
- Axios (HTTP client with JWT interceptor)
- @livekit/components-react (LiveKit video UI)
- Plain CSS (no Tailwind)

### Infrastructure
- Docker + Docker Compose (5-service stack)
- Nginx 1.27 (reverse proxy + static file serving)
- Multi-stage Docker builds

---

## Project Structure

```
project/
├── .env                        # Root env (DB credentials for docker-compose)
├── docker-compose.yml
│
├── backend/
│   ├── .env                    # Backend-specific env (LiveKit, DB)
│   ├── Dockerfile              # Multi-stage Python 3.12 build
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── celery.py
│   │   └── wsgi.py
│   └── apps/
│       ├── users/              # Auth, TeacherProfile, StudentProfile
│       ├── courses/            # Course CRUD
│       ├── batch/              # Batch/Classroom management
│       ├── enrollment/         # Student enrollment via code
│       ├── class_sessions/     # Live sessions + LiveKit tokens
│       └── StudyMaterial/      # Materials, assignments, submissions
│
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/                # Axios client + service modules
│       ├── context/            # AuthContext, ToastContext
│       ├── routes/             # ProtectedRoute, TeacherRoute, StudentRoute
│       ├── layouts/            # AuthLayout, DashboardLayout
│       ├── components/         # Reusable UI (cards, modals, sidebar)
│       ├── pages/
│       │   ├── teacher/        # Dashboard, courses, batches, sessions
│       │   ├── student/        # Dashboard, join classroom, assignments
│       │   └── live/           # LiveClassRoom (LiveKit video)
│       ├── styles/             # Global CSS files
│       └── utils/              # Helpers (date, validators, role)
│
└── nginx/
    ├── Dockerfile              # Builds frontend + serves via nginx
    └── default.conf            # Reverse proxy config
```

---

## User Roles and Permissions

| Action | Teacher | Student |
|---|---|---|
| Register / Login | Yes | Yes |
| Create Course | Yes (own only) | No |
| Edit / Delete Course | Yes (own only) | No |
| Create Batch | Yes (for own course) | No |
| Edit / Delete Batch | Yes (own only) | No |
| Join Batch with enrollment code | No | Yes |
| Create Class Session | Yes (own batch) | No |
| Start / Complete / Cancel Session | Yes (own only) | No |
| Join Live Class | Yes (as host) | Yes (if enrolled) |
| View Attendance | Yes (own session) | No |
| Upload Study Material | Yes | No |
| Submit Assignment | No | Yes (once per assignment) |

---

## Application Flow

```
Teacher registers → TeacherProfile created
        ↓
Teacher logs in → Gets JWT access token
        ↓
Teacher creates Course
        ↓
Teacher creates Batch under Course
        ↓
System auto-generates enrollment code (e.g. PYT8X2)
        ↓
Teacher shares code with students
        ↓
Student registers → StudentProfile created
        ↓
Student logs in → Gets JWT access token
        ↓
Student enters enrollment code → Enrolled in Batch
        ↓
Teacher creates ClassSession (scheduled)
        ↓
Teacher starts session → Status: LIVE, gets LiveKit token
        ↓
Student joins → Attendance recorded, gets LiveKit token
        ↓
Both enter LiveKit video room
        ↓
Teacher marks session COMPLETED
```

---

## Database Design

**User** (UUID PK, email-based login)
- `full_name`, `email`, `phone`, `role` (ADMIN/TEACHER/STUDENT)

**TeacherProfile** (OneToOne → User)
- `qualification`, `experience` (years), `bio`

**StudentProfile** (OneToOne → User)
- `address`, `date_of_birth`, `guardian_name`

**Course** (FK → Teacher)
- `title`, `description`, `category`, `level` (BEGINNER/INTERMEDIATE/ADVANCED), `duration_weeks`, `is_active`

**Batch** (FK → Course, FK → Teacher)
- `name`, `enrollment_code` (auto-generated unique 6-char), `max_students`
- `start_date`, `end_date` (auto-calculated from course `duration_weeks`)

**Enrollment** (FK → Batch, FK → Student)
- `status` (PENDING/APPROVED/REJECTED/DROPPED)
- Unique constraint: `(batch, student)`

**ClassSession** (FK → Batch, FK → Teacher)
- `scheduled_date`, `start_time`, `end_time`
- `livekit_room_name` (auto-generated), `status` (UPCOMING/LIVE/COMPLETED/CANCELLED)

**ClassSessionAttendance** (FK → ClassSession, FK → Student)
- `joined_at`, `left_at`

**StudyMaterial** (FK → Batch, FK → Teacher)
- `title`, `description`

**StudyMaterialAttachment** (FK → StudyMaterial)
- `file`, `compression_status`, `original_size`, `compressed_size`, `mime_type`

**Submission** (FK → StudyMaterial, FK → Student)
- `submitted_file`, `compression_status`, `submitted_at`
- Unique constraint: `(assignment, student)`

---

## API Reference

### Auth

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/teacher/register/` | Public |
| POST | `/api/auth/student/register/` | Public |
| POST | `/api/auth/login/` | Public |
| POST | `/api/auth/refresh/` | Public (reads httpOnly cookie) |
| GET | `/api/auth/me/` | Required |
| GET | `/api/auth/me/teacher/` | Teacher only |
| GET | `/api/auth/me/student/` | Student only |

**Login response:**
```json
{
  "access": "jwt-access-token",
  "user": { "id": "...", "full_name": "...", "email": "...", "role": "TEACHER" }
}
```
Refresh token is set as an httpOnly cookie automatically.

### Courses

| Method | Endpoint | Notes |
|---|---|---|
| GET/POST | `/api/Course/` | Teacher sees own courses only |
| GET/PUT/PATCH/DELETE | `/api/Course/{id}/` | Course owner only for writes |

### Batches

| Method | Endpoint | Notes |
|---|---|---|
| GET/POST | `/api/Batch/` | Teacher sees own batches |
| GET/PUT/PATCH/DELETE | `/api/Batch/{id}/` | Batch owner only for writes |

**Create batch payload:**
```json
{
  "course": "uuid",
  "name": "Python Morning Batch",
  "description": "Morning classroom",
  "max_students": 50,
  "allow_self_enrollment": true,
  "is_active": true,
  "start_date": "2026-06-01"
}
```

### Enrollment

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/enrollment/` | Student joins with code |
| GET | `/api/enrollment/` | Student's enrolled batches |

**Join payload:**
```json
{ "enrollment_code": "PYT8X2" }
```

### Class Sessions

| Method | Endpoint | Notes |
|---|---|---|
| GET/POST | `/api/ClassSession/` | Teacher sees own sessions |
| GET/PUT/PATCH/DELETE | `/api/ClassSession/{id}/` | Session owner for writes |
| POST | `/api/ClassSession/{id}/start/` | Returns LiveKit token for teacher |
| POST | `/api/ClassSession/{id}/join/` | Records attendance, returns LiveKit token |
| POST | `/api/ClassSession/{id}/complete/` | Marks session completed |
| POST | `/api/ClassSession/{id}/cancel/` | Cancels session |
| GET | `/api/ClassSession/{id}/attendance/` | Teacher views who attended |

**Start/Join response:**
```json
{
  "server_url": "wss://your-project.livekit.cloud",
  "participant_token": "livekit-jwt-token",
  "room_name": "class-session-uuid"
}
```

### Study Materials and Submissions

| Method | Endpoint | Notes |
|---|---|---|
| GET/POST | `/api/StudyMaterial/` | Teacher uploads, all view |
| DELETE | `/api/StudyMaterial/{id}/` | Teacher only |
| GET/POST | `/api/Submission/` | Student submits, teacher views |

### API Docs

| URL | Description |
|---|---|
| `/api/docs/` | Swagger UI (interactive) |
| `/api/redoc/` | ReDoc documentation |
| `/api/schema/` | Raw OpenAPI schema |

---

## Environment Variables

### Root `.env` (docker-compose reads this)

```env
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your_strong_password
```

### `backend/.env`

```env
SECRET_KEY=your-django-secret-key-here

DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your_strong_password
DB_HOST=localhost          # use "db" when running inside Docker
DB_PORT=5432

LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

> When running with Docker, set `DB_HOST=db` (the service name in docker-compose.yml). The docker-compose already sets this via the `environment` block, so your `backend/.env` `DB_HOST` is only used for local development.

### `frontend/.env` (local dev only)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

> In Docker production builds, `VITE_API_BASE_URL=/api` is baked in by the nginx Dockerfile. No frontend `.env` needed for Docker.

---

## Running with Docker (Recommended)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 24+
- Docker Compose v2 (bundled with Docker Desktop)

### Step 1 — Clone the repository

```bash
git clone <your-repository-url>
cd project
```

### Step 2 — Create root `.env`

```bash
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your_strong_password
```

### Step 3 — Create `backend/.env`

```bash
SECRET_KEY=replace-this-with-a-real-secret-key

DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your_strong_password
DB_HOST=db
DB_PORT=5432

LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### Step 4 — Build and start all services

```bash
docker compose up --build
```

This brings up 5 containers:

| Container | Role | Exposed |
|---|---|---|
| `online_class_db` | PostgreSQL 16 | Internal |
| `online_class_redis` | Redis 7 | Internal |
| `online_class_backend` | Django + Gunicorn (3 workers) | Internal |
| `online_class_celery_worker` | Celery (media queue) | None |
| `online_class_nginx` | Nginx reverse proxy + frontend | Port 80 |

On first boot the backend automatically runs:
- `python manage.py migrate`
- `python manage.py collectstatic --noinput`

Then Gunicorn starts.

### Step 5 — Access the application

| URL | Description |
|---|---|
| `http://localhost` | React frontend |
| `http://localhost/api/docs/` | Swagger API docs |
| `http://localhost/admin/` | Django admin |

### Create a superuser (optional)

```bash
docker compose exec backend python manage.py createsuperuser
```

### Useful commands

```bash
# Run in background
docker compose up -d --build

# Stop all containers
docker compose down

# Stop and delete all data (volumes)
docker compose down -v

# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f celery_worker

# Run Django management commands
docker compose exec backend python manage.py <command>
```

---

## Running Locally Without Docker

Use this for faster backend iteration during development.

### Prerequisites

- Python 3.12+
- PostgreSQL 16
- Redis 7
- Node.js 20+

### Step 1 — Set up virtual environment

```bash
git clone <your-repository-url>
cd project

python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
```

### Step 2 — Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

### Step 3 — Create PostgreSQL database

```sql
CREATE DATABASE lms_db;
```

### Step 4 — Create `backend/.env`

```env
SECRET_KEY=your-secret-key

DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### Step 5 — Run migrations

```bash
cd backend
python manage.py migrate
```

### Step 6 — Create a superuser (optional)

```bash
python manage.py createsuperuser
```

### Step 7 — Start the backend

```bash
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`

### Step 8 — Start Redis

```bash
# Quickest option — use Docker just for Redis
docker run -d -p 6379:6379 redis:7-alpine

# Or start your local redis
redis-server
```

### Step 9 — Start Celery worker (for file compression)

Open a new terminal with venv activated:

```bash
cd backend
celery -A config worker -l info -Q celery,media
```

---

## Frontend Development

### Install dependencies

```bash
cd frontend
npm install
```

### Create `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Start dev server

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

Vite also proxies `/api` to `http://localhost:8000` automatically (configured in `vite.config.js`), so requests work in both cases.

### Build for production

```bash
npm run build
```

Output goes to `frontend/dist/`. The Docker setup handles this automatically inside the nginx multi-stage build.

---

## Docker Compose Architecture

### Service startup order

```
db (healthcheck: pg_isready) ─┐
                               ├─▶ backend ─▶ nginx
redis (healthcheck: ping) ────┘
                               └─▶ celery_worker
```

### Volumes

| Volume | Used by | Purpose |
|---|---|---|
| `postgres_data` | db | Persistent database files |
| `redis_data` | redis | AOF persistence |
| `static_volume` | backend (rw), nginx (ro) | Django collectstatic output |
| `media_volume` | backend (rw), celery (rw), nginx (ro) | User-uploaded files |

### Nginx routing

```
/              →  React SPA (index.html fallback for client-side routing)
/api/*         →  Django backend:8000
/admin/*       →  Django backend:8000
/static/*      →  static_volume
/media/*       →  media_volume
```

Client upload limit: **25MB** (matches Django `MAX_UPLOAD_SIZE`)

### How the frontend gets built

The `nginx/Dockerfile` is a two-stage build:

1. Stage 1 (`node:20-alpine`) — installs npm deps, builds Vite with `VITE_API_BASE_URL=/api`
2. Stage 2 (`nginx:1.27-alpine`) — copies built dist + nginx config

The nginx service in docker-compose uses `context: .` (project root) so both `frontend/` and `nginx/` are available during build.

---

## Deployment Notes

### On a VPS

1. SSH into the server, install Docker and Docker Compose
2. Clone the repository
3. Create `.env` and `backend/.env` with production values
4. Set `DEBUG=False` in `backend/config/settings.py`
5. Run `docker compose up -d --build`
6. Set your domain DNS A record to the VPS public IP

### Adding HTTPS

The current Nginx config only handles HTTP on port 80. To add SSL:

1. Stop nginx: `docker compose stop nginx`
2. Get a certificate (Certbot standalone): `certbot certonly --standalone -d yourdomain.com`
3. Add HTTPS server block to `nginx/default.conf` and mount `/etc/letsencrypt` into the nginx container
4. Rebuild: `docker compose up -d --build nginx`

### Important settings for production

- Use a strong random `SECRET_KEY`
- Set `DEBUG=False`
- Keep `LIVEKIT_API_SECRET` out of version control (use `.gitignore`)
- Use a strong database password
- Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in `settings.py` to match your domain

---

## Common Errors

| Error | Likely Cause | Fix |
|---|---|---|
| `401 Unauthorized` on API calls | JWT not sent | Check axiosClient sends `Authorization: Bearer <token>` |
| `403 Forbidden` on batch/session create | Resource belongs to a different user | Create the course/batch with the same teacher account you are logged in as |
| `course: This field may not be null` | Missing course UUID in batch payload | Send `"course": "uuid-here"` in the POST body |
| `classroom: This field may not be null` | Missing batch UUID in session payload | Send `"classroom": "uuid-here"` in the POST body |
| `Network Error` | CORS blocked | Add frontend origin to `CORS_ALLOWED_ORIGINS` in settings |
| `pg_isready` healthcheck looping | DB not ready | Wait — Docker retries 5 times automatically |
| LiveKit token error | Missing env vars | Set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` in `backend/.env` |
| Port 80 already in use | Another process using port 80 | Stop the conflicting process or change Nginx ports in docker-compose.yml |
| `Error: ENOENT frontend/package*.json` | Wrong Docker build context | Nginx service must use `context: .` (project root), not `./frontend` |

---

## License

This project is for learning and development purposes. Add your preferred license before production release.

---

## Author

Developed by **James**.
