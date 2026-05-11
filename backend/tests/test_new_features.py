"""Tests for new features: Student photo upload, Announcements, Telegram alerts."""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://academy-cms-6.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = ("admin@lumikids.com", "admin123")
TEACHER_SARAH = ("sarah@lumikids.com", "teacher123")
TEACHER_DAVID = ("david@lumikids.com", "teacher123")
PARENT_EMMA = ("emma@example.com", "parent123")
PARENT_MICHAEL = ("michael@example.com", "parent123")


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def admin_token():
    return _login(*ADMIN)["token"]


@pytest.fixture(scope="session")
def sarah_token():
    return _login(*TEACHER_SARAH)["token"]


@pytest.fixture(scope="session")
def david_token():
    return _login(*TEACHER_DAVID)["token"]


@pytest.fixture(scope="session")
def emma_token():
    return _login(*PARENT_EMMA)["token"]


@pytest.fixture(scope="session")
def michael_token():
    return _login(*PARENT_MICHAEL)["token"]


# 1x1 transparent PNG
PNG_BYTES = bytes.fromhex(
    "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
    "890000000D49444154789C636000010000000500017301940A000000004945"
    "4E44AE426082"
)


# ------ Photo upload ------
class TestPhotoUpload:
    def test_upload_photo_admin(self, admin_token):
        # find first student
        r = requests.get(f"{API}/admin/students", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        students = r.json()
        assert len(students) > 0, "no students in db"
        sid = students[0]["id"]

        files = {"file": ("test.png", io.BytesIO(PNG_BYTES), "image/png")}
        r = requests.post(
            f"{API}/admin/students/{sid}/photo",
            headers=_auth(admin_token),
            files=files,
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert "photo_url" in data
        assert data["photo_url"].startswith("/api/uploads/students/")

        # verify image is reachable
        full_url = f"{BASE_URL}{data['photo_url']}"
        rr = requests.get(full_url, timeout=15)
        assert rr.status_code == 200, f"upload not served: {rr.status_code}"
        assert rr.headers.get("content-type", "").startswith("image/"), rr.headers.get("content-type")

        # verify photo_url persisted on the student
        r = requests.get(f"{API}/admin/students", headers=_auth(admin_token), timeout=15)
        updated = next(s for s in r.json() if s["id"] == sid)
        assert updated["photo_url"] == data["photo_url"]

    def test_upload_photo_invalid_type(self, admin_token):
        r = requests.get(f"{API}/admin/students", headers=_auth(admin_token), timeout=15)
        sid = r.json()[0]["id"]
        files = {"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
        r = requests.post(
            f"{API}/admin/students/{sid}/photo",
            headers=_auth(admin_token),
            files=files,
            timeout=15,
        )
        assert r.status_code == 400

    def test_upload_photo_non_admin_forbidden(self, sarah_token):
        files = {"file": ("test.png", io.BytesIO(PNG_BYTES), "image/png")}
        r = requests.post(
            f"{API}/admin/students/1/photo",
            headers=_auth(sarah_token),
            files=files,
            timeout=15,
        )
        assert r.status_code == 403

    def test_upload_photo_student_not_found(self, admin_token):
        files = {"file": ("test.png", io.BytesIO(PNG_BYTES), "image/png")}
        r = requests.post(
            f"{API}/admin/students/999999/photo",
            headers=_auth(admin_token),
            files=files,
            timeout=15,
        )
        assert r.status_code == 404


# ------ Announcements ------
class TestAnnouncements:
    created_ids = []

    def test_admin_create_announcement_all(self, admin_token):
        payload = {
            "title": "TEST_AllAnnouncement",
            "description": "Visible to all teachers and parents",
            "scheduled_at": "2026-02-15T10:00:00",
            "location": "Main Hall",
            "target_role": "all",
        }
        r = requests.post(
            f"{API}/admin/announcements",
            headers=_auth(admin_token),
            json=payload,
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and data["ok"] is True
        TestAnnouncements.created_ids.append(data["id"])

    def test_admin_create_announcement_parent_only(self, admin_token):
        payload = {
            "title": "TEST_ParentOnly",
            "description": "Parents only",
            "target_role": "parent",
        }
        r = requests.post(
            f"{API}/admin/announcements",
            headers=_auth(admin_token),
            json=payload,
            timeout=15,
        )
        assert r.status_code == 200
        TestAnnouncements.created_ids.append(r.json()["id"])

    def test_admin_create_announcement_teacher_only(self, admin_token):
        payload = {
            "title": "TEST_TeacherOnly",
            "description": "Teachers only",
            "target_role": "teacher",
        }
        r = requests.post(
            f"{API}/admin/announcements",
            headers=_auth(admin_token),
            json=payload,
            timeout=15,
        )
        assert r.status_code == 200
        TestAnnouncements.created_ids.append(r.json()["id"])

    def test_admin_create_announcement_invalid_role(self, admin_token):
        r = requests.post(
            f"{API}/admin/announcements",
            headers=_auth(admin_token),
            json={"title": "TEST_Bad", "target_role": "everyone"},
            timeout=15,
        )
        assert r.status_code == 400

    def test_admin_list_announcements(self, admin_token):
        r = requests.get(f"{API}/admin/announcements", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        items = r.json()
        titles = [a["title"] for a in items]
        assert "TEST_AllAnnouncement" in titles
        assert "TEST_ParentOnly" in titles
        assert "TEST_TeacherOnly" in titles

    def test_teacher_sees_all_and_teacher(self, sarah_token):
        r = requests.get(f"{API}/announcements", headers=_auth(sarah_token), timeout=15)
        assert r.status_code == 200
        items = r.json()
        titles = [a["title"] for a in items]
        assert "TEST_AllAnnouncement" in titles
        assert "TEST_TeacherOnly" in titles
        assert "TEST_ParentOnly" not in titles

    def test_parent_sees_all_and_parent(self, emma_token):
        r = requests.get(f"{API}/announcements", headers=_auth(emma_token), timeout=15)
        assert r.status_code == 200
        items = r.json()
        titles = [a["title"] for a in items]
        assert "TEST_AllAnnouncement" in titles
        assert "TEST_ParentOnly" in titles
        assert "TEST_TeacherOnly" not in titles

    def test_notification_created_for_target_users(self, sarah_token, emma_token):
        # Sarah (teacher) should have notifications for ALL + Teacher announcements
        r = requests.get(f"{API}/notifications", headers=_auth(sarah_token), timeout=15)
        assert r.status_code == 200
        n_titles = [n["title"] for n in r.json()]
        assert any("TEST_AllAnnouncement" in t for t in n_titles)
        assert any("TEST_TeacherOnly" in t for t in n_titles)

        # Emma should have notifications for ALL + Parent
        r = requests.get(f"{API}/notifications", headers=_auth(emma_token), timeout=15)
        n_titles = [n["title"] for n in r.json()]
        assert any("TEST_AllAnnouncement" in t for t in n_titles)
        assert any("TEST_ParentOnly" in t for t in n_titles)

    def test_non_admin_cannot_create(self, sarah_token):
        r = requests.post(
            f"{API}/admin/announcements",
            headers=_auth(sarah_token),
            json={"title": "Hack", "target_role": "all"},
            timeout=15,
        )
        assert r.status_code == 403

    def test_admin_delete_announcement(self, admin_token):
        for aid in TestAnnouncements.created_ids:
            r = requests.delete(f"{API}/admin/announcements/{aid}", headers=_auth(admin_token), timeout=15)
            assert r.status_code == 200
        # verify gone
        r = requests.get(f"{API}/admin/announcements", headers=_auth(admin_token), timeout=15)
        remaining_ids = [a["id"] for a in r.json()]
        for aid in TestAnnouncements.created_ids:
            assert aid not in remaining_ids


# ------ Telegram linking ------
class TestTelegram:
    def test_initial_status_unlinked(self, michael_token):
        # First ensure unlinked
        requests.post(f"{API}/auth/unlink-telegram", headers=_auth(michael_token), timeout=15)
        r = requests.get(f"{API}/auth/telegram-status", headers=_auth(michael_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["linked"] is False
        assert data["chat_id"] in (None, "")
        assert "bot_username" in data

    def test_link_telegram(self, michael_token):
        r = requests.post(
            f"{API}/auth/link-telegram",
            headers=_auth(michael_token),
            json={"chat_id": "123456789"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        # Token is empty, so test_message_sent should be False but should NOT crash
        assert data["test_message_sent"] is False

    def test_status_after_link(self, michael_token):
        r = requests.get(f"{API}/auth/telegram-status", headers=_auth(michael_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["linked"] is True
        assert data["chat_id"] == "123456789"

    def test_unlink_telegram(self, michael_token):
        r = requests.post(f"{API}/auth/unlink-telegram", headers=_auth(michael_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True

        r = requests.get(f"{API}/auth/telegram-status", headers=_auth(michael_token), timeout=15)
        assert r.json()["linked"] is False


# ------ Bulk attendance triggers parent notification ------
class TestAttendanceNotifies:
    def test_absent_creates_parent_notification(self, david_token, emma_token):
        # David teaches Rainbow Explorers (Lily). Find Lily.
        r = requests.get(f"{API}/teacher/students", headers=_auth(david_token), timeout=15)
        assert r.status_code == 200, r.text
        students = r.json()
        # find Lily
        lily = next((s for s in students if "lily" in s["name"].lower()), None)
        if not lily:
            pytest.skip("Lily not seeded under David's class")
        class_id = lily["class_id"]

        # Mark Lily absent
        payload = {
            "class_id": class_id,
            "date": "2026-01-15",
            "records": [{"student_id": lily["id"], "date": "2026-01-15", "status": "absent"}],
        }
        r = requests.post(
            f"{API}/teacher/attendance/bulk",
            headers=_auth(david_token),
            json=payload,
            timeout=20,
        )
        assert r.status_code == 200, r.text

        # Emma (parent) should now have a notification of type attendance
        r = requests.get(f"{API}/notifications", headers=_auth(emma_token), timeout=15)
        assert r.status_code == 200
        attendance_notifs = [n for n in r.json() if n.get("type") == "attendance"]
        assert len(attendance_notifs) > 0, "expected an attendance notification for parent"
        assert any("Absent" in n["title"] or "absent" in n["message"].lower() for n in attendance_notifs)
