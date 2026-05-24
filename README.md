# Teacher-First LMS

A teacher-first Learning Management System built with **Django REST Framework**, **React**, **PostgreSQL**, and **LiveKit Cloud**.

The project works like a simple version of **Google Classroom + Live Class LMS**. Teachers create courses and classrooms/batches, the system generates enrollment codes, and students join classrooms using those codes after creating their own accounts.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Main Application Flow](#main-application-flow)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Core Features](#core-features)
- [User Roles](#user-roles)
- [Database Design](#database-design)
- [API Architecture](#api-architecture)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [MVP Scope](#mvp-scope)
- [Future Improvements](#future-improvements)

---

## Project Overview

This LMS is designed around two main users:

- **Teacher**
- **Student**

For the MVP, there is no admin dashboard. A teacher creates an account, creates a course, creates a classroom or batch under that course, and shares the generated enrollment code with students. Students create accounts, log in, enter the enrollment code, and join the classroom.

Once enrolled, students can access live classes, study materials, assignments, submissions, attendance, and notifications.

---

## Main Application Flow

```text
Teacher creates account
        ↓
Teacher logs in
        ↓
Teacher creates Course
        ↓
Teacher creates Classroom / Batch under Course
        ↓
System generates enrollment code
        ↓
Student creates account
        ↓
Student logs in
        ↓
Student enters enrollment code
        ↓
Student is enrolled in Classroom / Batch
        ↓
Student can access classes, materials, assignments, and live sessions
```

---

## Tech Stack

### Frontend

- React
- React Router
- Axios or Fetch API
- JWT-based authentication
- LiveKit client SDK

### Backend

- Python
- Django
- Django REST Framework
- JWT Authentication
- Django Media Storage

### Database

- PostgreSQL

### Live Class

- LiveKit Cloud

### Optional Later

- Redis
- Celery
- WebSocket
- Admin dashboard
- Reports
- Email reminders
- Payment system

---

## Project Structure

Current root structure:

```text
project/
├── backend/
├── frontend/
├── er_digram.txt
├── frontned.txt
├── README.md
├── requirements.txt
├── rough.txt
└── venv/
```

Recommended structure:

```text
project/
├── backend/
│   ├── manage.py
│   ├── config/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── courses/
│   │   ├── classrooms/
│   │   ├── enrollments/
│   │   ├── live_classes/
│   │   ├── materials/
│   │   ├── assignments/
│   │   ├── attendance/
│   │   └── notifications/
│   └── media/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

## Core Features

### Teacher Side

- Teacher registration and login
- Teacher dashboard
- Create, update, and delete own courses
- Create classroom or batch under own course
- View and regenerate enrollment code
- View enrolled students
- Create live class sessions
- Upload study materials
- Create assignments
- View student submissions
- Grade submissions
- View attendance

### Student Side

- Student registration and login
- Student dashboard
- Join classroom using enrollment code
- View enrolled classrooms
- View course and classroom details
- Join live class
- Download study materials
- View assignments
- Submit assignments
- View attendance
- View notifications

---

## User Roles

For the MVP, the system has two roles:

```text
TEACHER
STUDENT
```

Admin can be added later.

### Teacher Can

- Create courses
- Edit own courses
- Delete own courses
- Create classrooms under own courses
- View students in own classrooms
- Create live sessions
- Upload materials
- Create assignments
- Grade submissions
- View attendance

### Student Can

- Create account
- Join classroom using enrollment code
- View enrolled classrooms
- Join live class
- View materials
- Submit assignments
- View own attendance
- View notifications

### Student Cannot

- Create courses
- Create classrooms
- Access classrooms without enrollment
- Join live class without enrollment
- View other students' private submissions

---

## Database Design

### 1. User

Stores login information for both teachers and students.

```text
User
├── id
├── full_name
├── email
├── password
├── role
├── is_active
├── created_at
└── updated_at
```

Roles:

```text
TEACHER
STUDENT
```

---

### 2. TeacherProfile

Stores extra teacher information.

```text
TeacherProfile
├── id
├── user_id
├── phone
├── qualification
├── experience
├── bio
├── created_at
└── updated_at
```

Relationship:

```text
One User → One TeacherProfile
```

Only users with role `TEACHER` should have this profile.

---

### 3. StudentProfile

Stores extra student information.

```text
StudentProfile
├── id
├── user_id
├── phone
├── address
├── date_of_birth
├── guardian_name
├── created_at
└── updated_at
```

Relationship:

```text
One User → One StudentProfile
```

Only users with role `STUDENT` should have this profile.

---

### 4. Course

Courses are created by teachers.

```text
Course
├── id
├── teacher_id
├── title
├── description
├── category
├── level
├── duration_weeks
├── thumbnail
├── is_active
├── created_at
└── updated_at
```

Relationships:

```text
One Teacher → Many Courses
One Course → Many Classrooms / Batches
```

Important rule:

Only the teacher who created the course can edit or delete it.

---

### 5. Classroom / Batch

A Google Classroom-style room under a course.

```text
Classroom
├── id
├── course_id
├── teacher_id
├── name
├── description
├── enrollment_code
├── max_students
├── allow_self_enrollment
├── is_active
├── start_date
├── end_date
├── created_at
└── updated_at
```

Relationships:

```text
One Course → Many Classrooms
One Teacher → Many Classrooms
One Classroom → Many Enrollments
```

Important rules:

- `enrollment_code` must be unique
- `teacher_id` must be the owner
- Student can join only if classroom is active
- Student can join only if self-enrollment is allowed

---

### 6. Enrollment

Connects students with classrooms.

```text
Enrollment
├── id
├── classroom_id
├── student_id
├── status
├── enrolled_at
├── created_at
└── updated_at
```

Status values:

```text
ACTIVE
COMPLETED
REMOVED
LEFT
```

Important rule:

One student cannot enroll twice in the same classroom.

Recommended unique constraint:

```text
unique(student_id, classroom_id)
```

---

### 7. ClassSession

Stores live class sessions.

```text
ClassSession
├── id
├── classroom_id
├── teacher_id
├── title
├── description
├── scheduled_date
├── start_time
├── end_time
├── livekit_room_name
├── status
├── created_at
└── updated_at
```

Status values:

```text
UPCOMING
LIVE
COMPLETED
CANCELLED
```

Live class flow:

```text
Teacher creates live session
        ↓
System creates LiveKit room name
        ↓
Teacher starts class
        ↓
Status becomes LIVE
        ↓
Student joins
        ↓
Attendance is recorded
```

---

### 8. StudyMaterial

Stores files uploaded by teachers.

```text
StudyMaterial
├── id
├── classroom_id
├── uploaded_by
├── title
├── description
├── file
├── file_type
├── is_active
├── uploaded_at
└── updated_at
```

Important rule:

Only enrolled students can view or download classroom materials.

---

### 9. Assignment

Stores assignments created by teachers.

```text
Assignment
├── id
├── classroom_id
├── teacher_id
├── title
├── description
├── file
├── due_date
├── max_marks
├── created_at
└── updated_at
```

---

### 10. Submission

Stores student assignment submissions.

```text
Submission
├── id
├── assignment_id
├── student_id
├── submitted_file
├── submitted_text
├── submitted_at
├── marks
├── feedback
├── status
└── updated_at
```

Status values:

```text
SUBMITTED
LATE
CHECKED
REJECTED
```

Important rule:

One student can submit once per assignment.

Recommended unique constraint:

```text
unique(assignment_id, student_id)
```

---

### 11. AttendanceRecord

Stores live class attendance.

```text
AttendanceRecord
├── id
├── class_session_id
├── student_id
├── status
├── join_time
├── leave_time
├── duration_minutes
├── created_at
└── updated_at
```

Status values:

```text
PRESENT
LATE
ABSENT
```

Attendance rule:

When a student joins a live class, create or update the attendance record.

---

### 12. Notification

Stores user notifications.

```text
Notification
├── id
├── user_id
├── title
├── message
├── type
├── is_read
├── created_at
└── updated_at
```

Notification types:

```text
CLASS_JOINED
NEW_ASSIGNMENT
NEW_MATERIAL
LIVE_CLASS
SYSTEM
```

---

## Database Relationships

```text
User
 ├── TeacherProfile
 └── StudentProfile

Teacher/User
 ├── Course
 ├── Classroom
 ├── ClassSession
 ├── StudyMaterial
 └── Assignment

Course
 └── Classroom

Classroom
 ├── Enrollment
 │    └── Student/User
 ├── ClassSession
 ├── StudyMaterial
 └── Assignment

Assignment
 └── Submission
      └── Student/User

ClassSession
 └── AttendanceRecord
      └── Student/User

User
 └── Notification
```

---

## API Architecture

### Auth APIs

```http
POST /api/auth/register/teacher/
POST /api/auth/register/student/
POST /api/auth/login/
POST /api/auth/logout/
POST /api/auth/token/refresh/
GET  /api/auth/me/
```

---

### Teacher Course APIs

```http
GET    /api/teacher/courses/
POST   /api/teacher/courses/
GET    /api/teacher/courses/{id}/
PUT    /api/teacher/courses/{id}/
DELETE /api/teacher/courses/{id}/
```

Only the course owner can update or delete a course.

---

### Teacher Classroom APIs

```http
GET    /api/teacher/classrooms/
POST   /api/teacher/classrooms/
GET    /api/teacher/classrooms/{id}/
PUT    /api/teacher/classrooms/{id}/
DELETE /api/teacher/classrooms/{id}/
POST   /api/teacher/classrooms/{id}/regenerate-code/
GET    /api/teacher/classrooms/{id}/students/
```

---

### Student Enrollment APIs

```http
POST /api/student/join-classroom/
GET  /api/student/classrooms/
GET  /api/student/classrooms/{id}/
```

Join request example:

```json
{
  "enrollment_code": "PYT8X2"
}
```

---

### Live Class APIs

```http
POST /api/teacher/classrooms/{id}/sessions/
GET  /api/teacher/classrooms/{id}/sessions/
POST /api/classes/{id}/start/
POST /api/classes/{id}/complete/
POST /api/classes/{id}/join/
```

When a student joins:

1. Check the student is enrolled
2. Check the class is live
3. Create or update attendance record
4. Generate LiveKit token
5. Return token to frontend

---

### Material APIs

```http
POST   /api/teacher/classrooms/{id}/materials/
GET    /api/student/classrooms/{id}/materials/
DELETE /api/teacher/materials/{id}/
```

---

### Assignment APIs

```http
POST /api/teacher/classrooms/{id}/assignments/
GET  /api/student/classrooms/{id}/assignments/
POST /api/student/assignments/{id}/submit/
GET  /api/teacher/assignments/{id}/submissions/
POST /api/teacher/submissions/{id}/grade/
```

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd project
```

---

### 2. Create and Activate Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

For Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

---

### 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Configure Environment Variables

Create a `.env` file inside the backend directory or project root depending on your Django settings.

Example:

```env
SECRET_KEY=your_django_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

LIVEKIT_URL=wss://your-livekit-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

MEDIA_URL=/media/
MEDIA_ROOT=media/
```

---

### 5. Setup PostgreSQL Database

Create a PostgreSQL database:

```sql
CREATE DATABASE lms_db;
```

Update your `.env` file with the correct database credentials.

---

### 6. Run Django Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

---

### 7. Create Superuser Optional

Even though the MVP does not require an admin dashboard, Django admin can still be useful during development.

```bash
python manage.py createsuperuser
```

---

### 8. Start Backend Server

```bash
python manage.py runserver
```

Backend will usually run at:

```text
http://127.0.0.1:8000/
```

---

### 9. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

---

### 10. Start Frontend Server

```bash
npm run dev
```

Frontend will usually run at:

```text
http://localhost:5173/
```

---

## Environment Variables

Recommended backend environment variables:

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Enable or disable debug mode |
| `ALLOWED_HOSTS` | Allowed hosts for Django |
| `DB_NAME` | PostgreSQL database name |
| `DB_USER` | PostgreSQL database user |
| `DB_PASSWORD` | PostgreSQL database password |
| `DB_HOST` | Database host |
| `DB_PORT` | Database port |
| `LIVEKIT_URL` | LiveKit Cloud WebSocket URL |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |
| `MEDIA_URL` | Django media URL |
| `MEDIA_ROOT` | Django media root |

---

## MVP Scope

Build these features first:

- Teacher registration
- Student registration
- Login
- Teacher creates course
- Teacher creates classroom or batch
- System generates class code
- Student joins classroom with code
- Teacher uploads material
- Teacher creates assignment
- Student submits assignment
- Teacher creates live class
- Student joins live class
- Basic attendance

---

## Future Improvements

Admin features can be added later as a separate module:

- Admin dashboard
- Manage teachers
- Manage students
- Approve teacher accounts
- View all courses
- Disable bad classrooms
- View reports
- Manage payments
- Platform settings
- Email reminders
- Background jobs with Celery
- Real-time notifications with WebSocket

Future roles:

```text
ADMIN
TEACHER
STUDENT
```

---

## Security and Permission Notes

- Use JWT authentication for protected APIs.
- Teachers should only manage their own courses and classrooms.
- Students should only access classrooms where they are enrolled.
- Enrollment codes must be unique.
- Do not expose LiveKit API secrets to the frontend.
- Generate LiveKit access tokens only from the backend.
- Validate file uploads before saving.
- Use PostgreSQL constraints to prevent duplicate enrollments and duplicate submissions.

---

## Suggested Development Order

```text
1. Setup Django project and PostgreSQL
2. Create User model with roles
3. Add TeacherProfile and StudentProfile
4. Add JWT authentication
5. Build teacher and student registration
6. Build login and current user API
7. Build Course model and teacher course APIs
8. Build Classroom model with enrollment code
9. Build student join-classroom API
10. Build materials module
11. Build assignments and submissions
12. Add LiveKit session creation and join token generation
13. Add basic attendance tracking
14. Connect React frontend pages
15. Polish UI and permission handling
```

---

## License

This project is for learning and development purposes. Add your preferred license before production release.

---

## Author

Developed by **James**.