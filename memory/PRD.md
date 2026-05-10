# LumiKids Academy Management System — PRD

## Original Problem Statement
Build a complete Kindergarten Management System ("LumiKids Academy") with:
- Public landing page + enrollment form
- Multi-role auth (Admin / Teacher / Parent) with email + password
- Admin: user/student/class CRUD, enrollment review, charts & reports
- Teacher: students, attendance recording, reports, parent messaging
- Parent: child profile, attendance history, teacher messaging
- Notifications, email confirmations on enrollment approval
- Soft pastel kindergarten-friendly UI

## Tech Stack (User-confirmed)
- React + Tailwind + shadcn UI + Recharts + sonner
- FastAPI (Python) + JWT (Bearer) + bcrypt
- MariaDB / MySQL on 127.0.0.1:3306 (database: `lumikids`) — supervisor-managed
- Gmail SMTP via aiosmtplib for transactional emails

## User Personas
1. **Administrator** — manages users, classes, students, reviews enrollment requests
2. **Teacher** — manages assigned classes, records attendance, messages parents
3. **Parent** — views child info, attendance, messages teachers
4. **Public visitor** — submits enrollment from landing page

## What's Implemented (Feb 2026)
- ✅ Public landing page (hero, about, programs, teachers, gallery, testimonials, contact, footer) with enrollment modal
- ✅ JWT login with role-based redirect; localStorage Bearer token
- ✅ Admin dashboard: stats overview, Users CRUD, Students CRUD, Classes CRUD, Enrollments review (approve creates parent + sends email with credentials), Reports (charts, print)
- ✅ Teacher dashboard: stats, students list, bulk attendance recording per class+date, reports (30-day pie + counts), parent messaging
- ✅ Parent dashboard: children overview, child profile, attendance with charts, teacher messaging
- ✅ Notifications (bell with unread badge, mark-all-read)
- ✅ Email integration (Gmail SMTP) — confirmation on submit, credentials on approval
- ✅ Sample seed data (2 teachers, 2 parents, 3 classes, 3 students, 14 days attendance, 1 pending enrollment)
- ✅ Soft pastel theme (#FF8C73 peach + #A7E8D0 mint), Fredoka headings, Nunito body
- ✅ Tested 100% backend (28 pytest cases pass) + 100% frontend flows

## Test Credentials
- Admin: `admin@lumikids.com` / `admin123`
- Teacher: `sarah@lumikids.com` / `teacher123`
- Teacher: `david@lumikids.com` / `teacher123`
- Parent: `emma@example.com` / `parent123`
- Parent: `michael@example.com` / `parent123`

## Backlog (P0 / P1 / P2)
**P1 — Quality of life**
- Allow admin role updates via PUT /api/admin/users
- Self-delete guard for admin
- Validate receiver_id against contacts list on POST /api/messages
- Profile page: change password from UI (endpoint exists)

**P2 — Enhancements**
- Avatar/photo upload (object storage integration)
- Calendar view for attendance
- Real-time messaging (WebSockets / polling refresh)
- Multi-language support
- Bulk import students via CSV
- Parent payment / billing module
- PDF export for reports (currently print-only)
- Split server.py into routers (users/admin/teacher/parent/messages) for maintainability

## Architecture
- `server.py` — FastAPI app + all routes prefixed `/api`
- `database.py` — aiomysql pool + schema init
- `auth.py` — JWT/bcrypt + role guards (`require_role`)
- `mailer.py` — aiosmtplib + HTML templates
- `seed.py` — admin + sample data on startup; writes test_credentials.md
- Frontend: React Router with `<ProtectedRoute allowedRoles>`, AuthContext (localStorage), axios interceptor for Bearer

## Setup Notes
- MariaDB managed via `/etc/supervisor/conf.d/mariadb.conf` (auto-restart)
- Backend `.env`: DB_HOST=127.0.0.1, DB_PORT=3306, DB_USER=root, DB_PASSWORD="", DB_NAME_MYSQL=lumikids, JWT_SECRET, ADMIN_EMAIL/PASSWORD, SMTP_*
- Frontend reads `REACT_APP_BACKEND_URL`
