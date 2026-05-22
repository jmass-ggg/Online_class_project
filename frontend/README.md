# Classroom Live React Frontend

A production-ready React + Vite frontend for a Django REST Framework online classroom backend with LiveKit video classes. The UI follows a modern SaaS dashboard pattern inspired by Google Classroom and Zoom.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

## Environment

Create a `.env` file from `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

## Required packages

```bash
npm install react-router-dom axios livekit-client @livekit/components-react @livekit/components-styles
```

## Backend requirements

The Django backend must be running on `http://localhost:8000` and the frontend runs on `http://localhost:5173`.

Django CORS settings:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

CORS_ALLOW_CREDENTIALS = True
```

LiveKit server URL and participant token must be returned by the backend `start` and `join` endpoints. This frontend supports these response keys:

- `participant_token` or `token`
- `server_url` or `livekit_url` or `url`
- `room_name` or `livekit_room_name`

## API route casing

This project intentionally keeps the DRF router paths capitalized:

- `/Course/`
- `/Batch/`
- `/ClassSession/`

Do not lowercase these paths unless the backend changes.

## Main features

- JWT login with refresh token stored in an httpOnly cookie
- Axios refresh interceptor with automatic failed-request retry
- Teacher and student registration
- Role-based protected routing
- Teacher course, classroom/batch, session, and attendance management
- Student enrollment by classroom code
- Student enrolled classrooms and live session joining
- LiveKit video classroom page using `LiveKitRoom` and `VideoConference`
- Responsive dark-sidebar dashboard UI using plain CSS only
