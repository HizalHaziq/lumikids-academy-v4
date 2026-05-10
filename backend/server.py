"""LumiKids Academy Management System - FastAPI backend with MySQL."""
import os
import secrets
import string
import logging
from datetime import datetime, date
from pathlib import Path
from typing import Optional, List

from dotenv import load_dotenv
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

import database
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_role,
)
import mailer
import seed as seed_mod

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="LumiKids Academy API")
api = APIRouter(prefix="/api")


# ============================================================
# Pydantic Schemas
# ============================================================
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class LoginOut(BaseModel):
    token: str
    user: UserOut


class EnrollIn(BaseModel):
    parent_name: str = Field(min_length=2, max_length=150)
    parent_email: EmailStr
    phone: str = Field(min_length=5, max_length=30)
    child_name: str = Field(min_length=2, max_length=150)
    child_age: int = Field(ge=1, le=12)
    preferred_class: Optional[str] = None
    notes: Optional[str] = None


class UserCreateIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str  # admin/teacher/parent
    phone: Optional[str] = None


class UserUpdateIn(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class ClassIn(BaseModel):
    name: str
    age_group: Optional[str] = None
    description: Optional[str] = None
    teacher_id: Optional[int] = None
    capacity: int = 20


class StudentIn(BaseModel):
    name: str
    age: int
    gender: Optional[str] = None
    parent_id: Optional[int] = None
    class_id: Optional[int] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None


class AttendanceIn(BaseModel):
    student_id: int
    date: date
    status: str  # present/absent/late
    notes: Optional[str] = None


class AttendanceBulkIn(BaseModel):
    class_id: int
    date: date
    records: List[AttendanceIn]


class MessageIn(BaseModel):
    receiver_id: int
    content: str = Field(min_length=1, max_length=2000)


class EnrollmentDecisionIn(BaseModel):
    decision: str  # approved/rejected


class PasswordChangeIn(BaseModel):
    new_password: str = Field(min_length=6)


# ============================================================
# Health
# ============================================================
@api.get("/")
async def root():
    return {"message": "LumiKids Academy API", "status": "ok"}


# ============================================================
# Auth
# ============================================================
@api.post("/auth/login", response_model=LoginOut)
async def login(body: LoginIn):
    user = await database.fetch_one(
        "SELECT id, name, email, role, phone, avatar_url, password_hash FROM users WHERE email = %s",
        (body.email.lower(),),
    )
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"], user["role"])
    user.pop("password_hash", None)
    return {"token": token, "user": user}


@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return user


@api.post("/auth/change-password")
async def change_password(body: PasswordChangeIn, user: dict = Depends(get_current_user)):
    await database.execute(
        "UPDATE users SET password_hash = %s WHERE id = %s",
        (hash_password(body.new_password), user["id"]),
    )
    return {"ok": True}


# ============================================================
# Public: Enrollment
# ============================================================
@api.post("/public/enroll")
async def public_enroll(body: EnrollIn, bg: BackgroundTasks):
    eid = await database.execute(
        """INSERT INTO enrollment_requests
           (parent_name, parent_email, phone, child_name, child_age, preferred_class, notes)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (
            body.parent_name,
            body.parent_email.lower(),
            body.phone,
            body.child_name,
            body.child_age,
            body.preferred_class,
            body.notes,
        ),
    )

    # Notify all admins
    admins = await database.fetch_all("SELECT id FROM users WHERE role = 'admin'")
    for a in admins:
        await database.execute(
            "INSERT INTO notifications (user_id, type, title, message) VALUES (%s, 'enrollment', %s, %s)",
            (a["id"], "New Enrollment Request", f"{body.parent_name} requested enrollment for {body.child_name}"),
        )

    # Send confirmation email in background
    bg.add_task(
        mailer.send_email,
        body.parent_email,
        "Enrollment Request Received - LumiKids Academy",
        mailer.enrollment_received_html(body.parent_name, body.child_name),
    )

    return {"ok": True, "id": eid, "message": "Enrollment submitted successfully"}


# ============================================================
# Admin: Users CRUD
# ============================================================
@api.get("/admin/users")
async def admin_list_users(role: Optional[str] = None, _: dict = Depends(require_role("admin"))):
    if role:
        rows = await database.fetch_all(
            "SELECT id, name, email, role, phone, created_at FROM users WHERE role = %s ORDER BY created_at DESC",
            (role,),
        )
    else:
        rows = await database.fetch_all(
            "SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC"
        )
    return rows


@api.post("/admin/users")
async def admin_create_user(body: UserCreateIn, _: dict = Depends(require_role("admin"))):
    if body.role not in ("admin", "teacher", "parent"):
        raise HTTPException(400, "Invalid role")
    existing = await database.fetch_one("SELECT id FROM users WHERE email = %s", (body.email.lower(),))
    if existing:
        raise HTTPException(400, "Email already in use")
    uid = await database.execute(
        "INSERT INTO users (name, email, password_hash, role, phone) VALUES (%s, %s, %s, %s, %s)",
        (body.name, body.email.lower(), hash_password(body.password), body.role, body.phone),
    )
    return {"id": uid, "ok": True}


@api.put("/admin/users/{user_id}")
async def admin_update_user(user_id: int, body: UserUpdateIn, _: dict = Depends(require_role("admin"))):
    fields, params = [], []
    if body.name is not None:
        fields.append("name = %s"); params.append(body.name)
    if body.email is not None:
        fields.append("email = %s"); params.append(body.email.lower())
    if body.phone is not None:
        fields.append("phone = %s"); params.append(body.phone)
    if body.password:
        fields.append("password_hash = %s"); params.append(hash_password(body.password))
    if not fields:
        return {"ok": True}
    params.append(user_id)
    await database.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", tuple(params))
    return {"ok": True}


@api.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: int, _: dict = Depends(require_role("admin"))):
    await database.execute("DELETE FROM users WHERE id = %s", (user_id,))
    return {"ok": True}


# ============================================================
# Admin: Classes CRUD
# ============================================================
@api.get("/admin/classes")
async def admin_list_classes(_: dict = Depends(require_role("admin"))):
    rows = await database.fetch_all(
        """SELECT c.*, u.name AS teacher_name,
                  (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count
           FROM classes c LEFT JOIN users u ON u.id = c.teacher_id ORDER BY c.created_at DESC"""
    )
    return rows


@api.post("/admin/classes")
async def admin_create_class(body: ClassIn, _: dict = Depends(require_role("admin"))):
    cid = await database.execute(
        "INSERT INTO classes (name, age_group, description, teacher_id, capacity) VALUES (%s, %s, %s, %s, %s)",
        (body.name, body.age_group, body.description, body.teacher_id, body.capacity),
    )
    return {"id": cid, "ok": True}


@api.put("/admin/classes/{class_id}")
async def admin_update_class(class_id: int, body: ClassIn, _: dict = Depends(require_role("admin"))):
    await database.execute(
        "UPDATE classes SET name=%s, age_group=%s, description=%s, teacher_id=%s, capacity=%s WHERE id=%s",
        (body.name, body.age_group, body.description, body.teacher_id, body.capacity, class_id),
    )
    return {"ok": True}


@api.delete("/admin/classes/{class_id}")
async def admin_delete_class(class_id: int, _: dict = Depends(require_role("admin"))):
    await database.execute("DELETE FROM classes WHERE id = %s", (class_id,))
    return {"ok": True}


# ============================================================
# Admin: Students CRUD
# ============================================================
@api.get("/admin/students")
async def admin_list_students(_: dict = Depends(require_role("admin"))):
    rows = await database.fetch_all(
        """SELECT s.*, p.name AS parent_name, p.email AS parent_email, c.name AS class_name
           FROM students s LEFT JOIN users p ON p.id = s.parent_id
           LEFT JOIN classes c ON c.id = s.class_id ORDER BY s.enrolled_at DESC"""
    )
    return rows


@api.post("/admin/students")
async def admin_create_student(body: StudentIn, _: dict = Depends(require_role("admin"))):
    sid = await database.execute(
        "INSERT INTO students (name, age, gender, parent_id, class_id, photo_url, notes) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (body.name, body.age, body.gender, body.parent_id, body.class_id, body.photo_url, body.notes),
    )
    return {"id": sid, "ok": True}


@api.put("/admin/students/{student_id}")
async def admin_update_student(student_id: int, body: StudentIn, _: dict = Depends(require_role("admin"))):
    await database.execute(
        "UPDATE students SET name=%s, age=%s, gender=%s, parent_id=%s, class_id=%s, photo_url=%s, notes=%s WHERE id=%s",
        (body.name, body.age, body.gender, body.parent_id, body.class_id, body.photo_url, body.notes, student_id),
    )
    return {"ok": True}


@api.delete("/admin/students/{student_id}")
async def admin_delete_student(student_id: int, _: dict = Depends(require_role("admin"))):
    await database.execute("DELETE FROM students WHERE id = %s", (student_id,))
    return {"ok": True}


# ============================================================
# Admin: Enrollment Requests
# ============================================================
@api.get("/admin/enrollments")
async def admin_list_enrollments(status: Optional[str] = None, _: dict = Depends(require_role("admin"))):
    if status:
        return await database.fetch_all(
            "SELECT * FROM enrollment_requests WHERE status = %s ORDER BY created_at DESC", (status,)
        )
    return await database.fetch_all("SELECT * FROM enrollment_requests ORDER BY created_at DESC")


@api.post("/admin/enrollments/{enrollment_id}/decision")
async def admin_decide_enrollment(
    enrollment_id: int,
    body: EnrollmentDecisionIn,
    bg: BackgroundTasks,
    _: dict = Depends(require_role("admin")),
):
    if body.decision not in ("approved", "rejected"):
        raise HTTPException(400, "decision must be 'approved' or 'rejected'")

    enrollment = await database.fetch_one("SELECT * FROM enrollment_requests WHERE id = %s", (enrollment_id,))
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")
    if enrollment["status"] != "pending":
        raise HTTPException(400, "Enrollment already processed")

    await database.execute(
        "UPDATE enrollment_requests SET status = %s, processed_at = NOW() WHERE id = %s",
        (body.decision, enrollment_id),
    )

    if body.decision == "approved":
        # Create parent account if not exists
        parent_email = enrollment["parent_email"].lower()
        existing = await database.fetch_one("SELECT id FROM users WHERE email = %s", (parent_email,))
        temp_password = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(10))

        if existing:
            parent_id = existing["id"]
            # reset password to new temp
            await database.execute(
                "UPDATE users SET password_hash = %s WHERE id = %s",
                (hash_password(temp_password), parent_id),
            )
        else:
            parent_id = await database.execute(
                "INSERT INTO users (name, email, password_hash, role, phone) VALUES (%s, %s, %s, 'parent', %s)",
                (enrollment["parent_name"], parent_email, hash_password(temp_password), enrollment["phone"]),
            )

        # Try to find class
        class_id = None
        if enrollment["preferred_class"]:
            cls = await database.fetch_one(
                "SELECT id FROM classes WHERE name = %s LIMIT 1", (enrollment["preferred_class"],)
            )
            class_id = cls["id"] if cls else None

        # Create student
        await database.execute(
            "INSERT INTO students (name, age, parent_id, class_id) VALUES (%s, %s, %s, %s)",
            (enrollment["child_name"], enrollment["child_age"], parent_id, class_id),
        )

        # Send credentials email
        login_url = f"{os.environ.get('APP_URL', 'http://localhost:3000')}/login"
        bg.add_task(
            mailer.send_email,
            parent_email,
            "Welcome to LumiKids Academy - Your Account is Ready!",
            mailer.enrollment_approval_html(
                enrollment["parent_name"], enrollment["child_name"], parent_email, temp_password, login_url
            ),
        )
        return {"ok": True, "parent_id": parent_id, "temp_password": temp_password}

    return {"ok": True}


# ============================================================
# Admin: Reports & Stats
# ============================================================
@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_role("admin"))):
    total_students = (await database.fetch_one("SELECT COUNT(*) AS c FROM students"))["c"]
    total_classes = (await database.fetch_one("SELECT COUNT(*) AS c FROM classes"))["c"]
    total_teachers = (await database.fetch_one("SELECT COUNT(*) AS c FROM users WHERE role='teacher'"))["c"]
    total_parents = (await database.fetch_one("SELECT COUNT(*) AS c FROM users WHERE role='parent'"))["c"]
    pending_enrollments = (
        await database.fetch_one("SELECT COUNT(*) AS c FROM enrollment_requests WHERE status='pending'")
    )["c"]

    # Attendance % over last 30 days
    att = await database.fetch_one(
        """SELECT
              SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) AS present,
              COUNT(*) AS total
           FROM attendance
           WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"""
    )
    attendance_pct = round((att["present"] or 0) / att["total"] * 100, 1) if att and att["total"] else 0

    # Students per class
    per_class = await database.fetch_all(
        """SELECT c.name, COUNT(s.id) AS count
           FROM classes c LEFT JOIN students s ON s.class_id = c.id
           GROUP BY c.id, c.name ORDER BY count DESC"""
    )

    # Monthly enrollments (last 6 months)
    monthly = await database.fetch_all(
        """SELECT DATE_FORMAT(created_at, '%%Y-%%m') AS month, COUNT(*) AS count
           FROM enrollment_requests
           WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
           GROUP BY month ORDER BY month"""
    )

    return {
        "total_students": total_students,
        "total_classes": total_classes,
        "total_teachers": total_teachers,
        "total_parents": total_parents,
        "pending_enrollments": pending_enrollments,
        "attendance_percentage": attendance_pct,
        "students_per_class": per_class,
        "monthly_enrollments": monthly,
    }


# ============================================================
# Teacher
# ============================================================
@api.get("/teacher/dashboard")
async def teacher_dashboard(user: dict = Depends(require_role("teacher"))):
    classes = await database.fetch_all(
        "SELECT * FROM classes WHERE teacher_id = %s", (user["id"],)
    )
    class_ids = [c["id"] for c in classes]
    student_count = 0
    if class_ids:
        placeholders = ",".join(["%s"] * len(class_ids))
        row = await database.fetch_one(
            f"SELECT COUNT(*) AS c FROM students WHERE class_id IN ({placeholders})", tuple(class_ids)
        )
        student_count = row["c"]

    today_attendance = await database.fetch_one(
        "SELECT COUNT(*) AS c FROM attendance WHERE recorded_by = %s AND date = CURDATE()", (user["id"],)
    )

    # 7-day attendance trend for teacher's classes
    trend = []
    if class_ids:
        placeholders = ",".join(["%s"] * len(class_ids))
        trend = await database.fetch_all(
            f"""SELECT date,
                    SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) AS present,
                    SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) AS absent,
                    SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) AS late
                FROM attendance
                WHERE class_id IN ({placeholders}) AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY date ORDER BY date""",
            tuple(class_ids),
        )

    return {
        "classes": classes,
        "student_count": student_count,
        "today_attendance_count": today_attendance["c"],
        "trend": trend,
    }


@api.get("/teacher/students")
async def teacher_students(user: dict = Depends(require_role("teacher"))):
    return await database.fetch_all(
        """SELECT s.*, c.name AS class_name, p.name AS parent_name, p.email AS parent_email, p.id AS parent_user_id
           FROM students s
           LEFT JOIN classes c ON c.id = s.class_id
           LEFT JOIN users p ON p.id = s.parent_id
           WHERE c.teacher_id = %s
           ORDER BY s.name""",
        (user["id"],),
    )


@api.get("/teacher/attendance")
async def teacher_attendance(
    class_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(require_role("teacher")),
):
    query = """SELECT a.*, s.name AS student_name, c.name AS class_name
               FROM attendance a
               JOIN students s ON s.id = a.student_id
               JOIN classes c ON c.id = a.class_id
               WHERE c.teacher_id = %s"""
    params = [user["id"]]
    if class_id:
        query += " AND a.class_id = %s"; params.append(class_id)
    if date_from:
        query += " AND a.date >= %s"; params.append(date_from)
    if date_to:
        query += " AND a.date <= %s"; params.append(date_to)
    query += " ORDER BY a.date DESC, s.name"
    return await database.fetch_all(query, tuple(params))


@api.post("/teacher/attendance/bulk")
async def teacher_record_attendance(body: AttendanceBulkIn, user: dict = Depends(require_role("teacher"))):
    # Verify teacher owns the class
    cls = await database.fetch_one(
        "SELECT id FROM classes WHERE id = %s AND teacher_id = %s", (body.class_id, user["id"])
    )
    if not cls:
        raise HTTPException(403, "You don't manage this class")

    for r in body.records:
        if r.status not in ("present", "absent", "late"):
            raise HTTPException(400, f"Invalid status: {r.status}")
        await database.execute(
            """INSERT INTO attendance (student_id, class_id, date, status, notes, recorded_by)
               VALUES (%s, %s, %s, %s, %s, %s)
               ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), recorded_by = VALUES(recorded_by)""",
            (r.student_id, body.class_id, body.date, r.status, r.notes, user["id"]),
        )
    return {"ok": True, "count": len(body.records)}


@api.get("/teacher/reports")
async def teacher_reports(user: dict = Depends(require_role("teacher"))):
    summary = await database.fetch_one(
        """SELECT
              SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) AS present,
              SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END) AS absent,
              SUM(CASE WHEN a.status='late' THEN 1 ELSE 0 END) AS late,
              COUNT(*) AS total
           FROM attendance a
           JOIN classes c ON c.id = a.class_id
           WHERE c.teacher_id = %s AND a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)""",
        (user["id"],),
    )
    return {
        "present": summary["present"] or 0,
        "absent": summary["absent"] or 0,
        "late": summary["late"] or 0,
        "total": summary["total"] or 0,
    }


# ============================================================
# Parent
# ============================================================
@api.get("/parent/dashboard")
async def parent_dashboard(user: dict = Depends(require_role("parent"))):
    children = await database.fetch_all(
        """SELECT s.*, c.name AS class_name, c.teacher_id, u.name AS teacher_name
           FROM students s
           LEFT JOIN classes c ON c.id = s.class_id
           LEFT JOIN users u ON u.id = c.teacher_id
           WHERE s.parent_id = %s""",
        (user["id"],),
    )
    return {"children": children}


@api.get("/parent/children/{child_id}/attendance")
async def parent_child_attendance(child_id: int, user: dict = Depends(require_role("parent"))):
    child = await database.fetch_one(
        "SELECT * FROM students WHERE id = %s AND parent_id = %s", (child_id, user["id"])
    )
    if not child:
        raise HTTPException(404, "Child not found")
    records = await database.fetch_all(
        "SELECT * FROM attendance WHERE student_id = %s ORDER BY date DESC LIMIT 60", (child_id,)
    )
    summary = await database.fetch_one(
        """SELECT
              SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) AS present,
              SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) AS absent,
              SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) AS late,
              COUNT(*) AS total
           FROM attendance WHERE student_id = %s""",
        (child_id,),
    )
    return {
        "records": records,
        "summary": {
            "present": summary["present"] or 0,
            "absent": summary["absent"] or 0,
            "late": summary["late"] or 0,
            "total": summary["total"] or 0,
        },
    }


# ============================================================
# Messaging (Teacher <-> Parent)
# ============================================================
@api.get("/messages/contacts")
async def message_contacts(user: dict = Depends(get_current_user)):
    """Return list of users this user can message."""
    if user["role"] == "teacher":
        # Parents of students in teacher's classes
        rows = await database.fetch_all(
            """SELECT DISTINCT u.id, u.name, u.email, u.role
               FROM users u
               JOIN students s ON s.parent_id = u.id
               JOIN classes c ON c.id = s.class_id
               WHERE c.teacher_id = %s AND u.role = 'parent'""",
            (user["id"],),
        )
    elif user["role"] == "parent":
        # Teachers of children's classes
        rows = await database.fetch_all(
            """SELECT DISTINCT u.id, u.name, u.email, u.role
               FROM users u
               JOIN classes c ON c.teacher_id = u.id
               JOIN students s ON s.class_id = c.id
               WHERE s.parent_id = %s AND u.role = 'teacher'""",
            (user["id"],),
        )
    else:
        rows = await database.fetch_all("SELECT id, name, email, role FROM users WHERE id != %s", (user["id"],))

    # Add unread counts
    for r in rows:
        unread = await database.fetch_one(
            "SELECT COUNT(*) AS c FROM messages WHERE sender_id = %s AND receiver_id = %s AND is_read = 0",
            (r["id"], user["id"]),
        )
        r["unread_count"] = unread["c"]
    return rows


@api.get("/messages/{other_user_id}")
async def message_thread(other_user_id: int, user: dict = Depends(get_current_user)):
    msgs = await database.fetch_all(
        """SELECT * FROM messages
           WHERE (sender_id = %s AND receiver_id = %s)
              OR (sender_id = %s AND receiver_id = %s)
           ORDER BY created_at ASC""",
        (user["id"], other_user_id, other_user_id, user["id"]),
    )
    # Mark received messages as read
    await database.execute(
        "UPDATE messages SET is_read = 1 WHERE sender_id = %s AND receiver_id = %s",
        (other_user_id, user["id"]),
    )
    return msgs


@api.post("/messages")
async def send_message(body: MessageIn, user: dict = Depends(get_current_user)):
    receiver = await database.fetch_one("SELECT id, name FROM users WHERE id = %s", (body.receiver_id,))
    if not receiver:
        raise HTTPException(404, "Receiver not found")
    mid = await database.execute(
        "INSERT INTO messages (sender_id, receiver_id, content) VALUES (%s, %s, %s)",
        (user["id"], body.receiver_id, body.content),
    )
    # Notification
    await database.execute(
        "INSERT INTO notifications (user_id, type, title, message) VALUES (%s, 'message', %s, %s)",
        (body.receiver_id, "New Message", f"New message from {user['name']}"),
    )
    return {"id": mid, "ok": True}


# ============================================================
# Notifications
# ============================================================
@api.get("/notifications")
async def list_notifications(user: dict = Depends(get_current_user)):
    return await database.fetch_all(
        "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
        (user["id"],),
    )


@api.post("/notifications/{nid}/read")
async def mark_notification_read(nid: int, user: dict = Depends(get_current_user)):
    await database.execute(
        "UPDATE notifications SET is_read = 1 WHERE id = %s AND user_id = %s", (nid, user["id"])
    )
    return {"ok": True}


@api.post("/notifications/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await database.execute(
        "UPDATE notifications SET is_read = 1 WHERE user_id = %s", (user["id"],)
    )
    return {"ok": True}


# ============================================================
# Helpers (lookups for forms)
# ============================================================
@api.get("/lookup/teachers")
async def lookup_teachers(_: dict = Depends(require_role("admin"))):
    return await database.fetch_all("SELECT id, name, email FROM users WHERE role = 'teacher' ORDER BY name")


@api.get("/lookup/parents")
async def lookup_parents(_: dict = Depends(require_role("admin"))):
    return await database.fetch_all("SELECT id, name, email FROM users WHERE role = 'parent' ORDER BY name")


@api.get("/lookup/classes")
async def lookup_classes(_: dict = Depends(get_current_user)):
    return await database.fetch_all("SELECT id, name, age_group FROM classes ORDER BY name")


@api.get("/lookup/students-by-class/{class_id}")
async def lookup_students_by_class(class_id: int, _: dict = Depends(get_current_user)):
    return await database.fetch_all(
        "SELECT id, name, age FROM students WHERE class_id = %s ORDER BY name", (class_id,)
    )


# ============================================================
# Mount and middleware
# ============================================================
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await database.init_pool()
    await database.init_schema()
    await seed_mod.seed_all()
    await seed_mod.write_test_credentials()
    logger.info("LumiKids backend ready.")


@app.on_event("shutdown")
async def on_shutdown():
    await database.close_pool()
