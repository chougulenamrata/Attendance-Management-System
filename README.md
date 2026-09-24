# Northstar Attendance

Smart Attendance Management System for a college of approximately 5,000 students, 500 faculty members, 8 departments, 42 sections, and 180 subjects.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000.

The app runs immediately with an in-memory demo repository. Copy `.env.example` to `.env` to configure the included MySQL pool and transaction helper. The current assessment routes intentionally use the seeded demo repository so the submission runs without a database; the MySQL schema and connection layer are the documented persistence foundation for the next integration step.

## Demo credentials

- Admin: `admin@northstar.edu` / `Admin@123`
- Faculty: `faculty@northstar.edu` / `Faculty@123`
- Student: `student@northstar.edu` / `Student@123`

These credentials are local assessment-only demo accounts and must be replaced before production use.

## Features

- JWT login with bcrypt password verification and ADMIN/FACULTY/STUDENT role guards
- Admin summary, correction review, reports, and audit history
- Faculty subject/class/date attendance marking with duplicate prevention
- Searchable 500-member faculty directory and 5,000-student directory
- Explicit correction workflow: current status, requested status, reason, approve/reject, review comment
- 75% low-attendance warning and subject-wise student dashboard
- MySQL schema, connection pool, parameterized query helper, and transaction helper
- Responsive browser UI with faculty selection, filters, success/error feedback, and empty states

## Architecture

The Express server owns validation, authorization, attendance rules, correction state changes, and reporting calculations. The static HTML/CSS/JavaScript client consumes REST APIs. `db.js` provides the MySQL pool and transaction boundary; demo arrays remain as a local fallback so the submission works without a local database.

## API surface

- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/bootstrap`, `GET /api/attendance`
- `POST /api/attendance` (FACULTY/ADMIN)
- `POST /api/corrections` (ADMIN/FACULTY/STUDENT)
- `PATCH /api/corrections/:id` (ADMIN)
- `GET /api/admin/summary` (ADMIN)
- `GET /api/reports/low-attendance`, `GET /api/reports/subject` (ADMIN/FACULTY)
- `GET /api/students/me/attendance` (STUDENT)

## Validation and assumptions

- Attendance threshold is centralized at 75% in `server.js`.
- One student/subject/date register entry is allowed; duplicates return HTTP 409.
- The browser renders the first 50 directory matches for responsiveness while the API contains all 5,000 students and 500 faculty.
- A dedicated login page is implemented; the local demo stores the JWT in browser local storage. Production should use secure, httpOnly cookies and CSRF protection.
- The current API routes use in-memory arrays even when MySQL variables are present. Mutations reset on restart until repositories are connected to `db.js`.
- The MySQL schema is provided and validated for design, but this submission does not include a migration runner or seed script.

## Tests

```bash
npm test
```

The test suite verifies invalid/valid login, role protection, 5,000-student/500-faculty scale, reports, duplicate attendance rejection, correction creation, duplicate pending correction rejection, and correction rejection.
