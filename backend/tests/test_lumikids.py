"""LumiKids Academy backend test suite - covers auth, admin, teacher, parent, messaging, role guards."""
import os
import time
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


# ----- Health -----
class TestHealth:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ----- Auth -----
class TestAuth:
    def test_admin_login(self):
        data = _login(*ADMIN)
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN[0]
        assert isinstance(data["token"], str) and len(data["token"]) > 20

    def test_teacher_login(self):
        data = _login(*TEACHER_SARAH)
        assert data["user"]["role"] == "teacher"

    def test_parent_login(self):
        data = _login(*PARENT_EMMA)
        assert data["user"]["role"] == "parent"

    def test_invalid_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@lumikids.com", "password": "wrong"}, timeout=10)
        assert r.status_code == 401

    def test_me(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=_auth(admin_token), timeout=10)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN[0]

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code in (401, 403)


# ----- Public enroll -----
class TestPublicEnroll:
    def test_submit_enrollment(self):
        payload = {
            "parent_name": "TEST_Parent",
            "parent_email": f"test_parent_{int(time.time())}@example.com",
            "phone": "555-0100",
            "child_name": "TEST_Child",
            "child_age": 4,
            "preferred_class": "Sunshine Stars",
            "notes": "automated test",
        }
        r = requests.post(f"{API}/public/enroll", json=payload, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True
        assert "id" in body


# ----- Admin -----
class TestAdminStatsAndLists:
    def test_stats(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_students", "total_classes", "total_teachers", "total_parents",
                  "pending_enrollments", "attendance_percentage", "students_per_class", "monthly_enrollments"]:
            assert k in d
        assert isinstance(d["students_per_class"], list)

    def test_list_users(self, admin_token):
        r = requests.get(f"{API}/admin/users", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list) and len(users) > 0
        emails = [u["email"] for u in users]
        assert ADMIN[0] in emails

    def test_list_classes(self, admin_token):
        r = requests.get(f"{API}/admin/classes", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_students(self, admin_token):
        r = requests.get(f"{API}/admin/students", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_enrollments(self, admin_token):
        r = requests.get(f"{API}/admin/enrollments", headers=_auth(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestAdminUserCRUD:
    def test_create_update_delete_user(self, admin_token):
        h = _auth(admin_token)
        ts = int(time.time())
        email = f"test_user_{ts}@example.com"
        # Create
        r = requests.post(f"{API}/admin/users", headers=h, json={
            "name": "TEST_User", "email": email, "password": "testpass1", "role": "teacher", "phone": "555-1111"
        }, timeout=10)
        assert r.status_code == 200, r.text
        uid = r.json()["id"]
        assert isinstance(uid, int)

        # Verify via list
        rl = requests.get(f"{API}/admin/users", headers=h, timeout=10).json()
        assert any(u["id"] == uid and u["email"] == email for u in rl)

        # Update
        ru = requests.put(f"{API}/admin/users/{uid}", headers=h, json={"name": "TEST_User_Updated"}, timeout=10)
        assert ru.status_code == 200
        rl2 = requests.get(f"{API}/admin/users", headers=h, timeout=10).json()
        upd = next((u for u in rl2 if u["id"] == uid), None)
        assert upd and upd["name"] == "TEST_User_Updated"

        # Delete
        rd = requests.delete(f"{API}/admin/users/{uid}", headers=h, timeout=10)
        assert rd.status_code == 200
        rl3 = requests.get(f"{API}/admin/users", headers=h, timeout=10).json()
        assert not any(u["id"] == uid for u in rl3)


class TestAdminClassCRUD:
    def test_class_crud(self, admin_token):
        h = _auth(admin_token)
        # Need teacher id
        teachers = requests.get(f"{API}/lookup/teachers", headers=h, timeout=10).json()
        assert teachers
        tid = teachers[0]["id"]

        r = requests.post(f"{API}/admin/classes", headers=h, json={
            "name": f"TEST_Class_{int(time.time())}",
            "age_group": "3-4",
            "description": "test class",
            "teacher_id": tid,
            "capacity": 15,
        }, timeout=10)
        assert r.status_code == 200, r.text
        cid = r.json()["id"]

        r2 = requests.put(f"{API}/admin/classes/{cid}", headers=h, json={
            "name": "TEST_Class_Updated", "age_group": "4-5",
            "description": "updated", "teacher_id": tid, "capacity": 20,
        }, timeout=10)
        assert r2.status_code == 200

        cls_list = requests.get(f"{API}/admin/classes", headers=h, timeout=10).json()
        upd = next((c for c in cls_list if c["id"] == cid), None)
        assert upd and upd["name"] == "TEST_Class_Updated"

        rd = requests.delete(f"{API}/admin/classes/{cid}", headers=h, timeout=10)
        assert rd.status_code == 200


class TestAdminStudentCRUD:
    def test_student_crud(self, admin_token):
        h = _auth(admin_token)
        parents = requests.get(f"{API}/lookup/parents", headers=h, timeout=10).json()
        classes = requests.get(f"{API}/lookup/classes", headers=h, timeout=10).json()
        assert parents and classes
        r = requests.post(f"{API}/admin/students", headers=h, json={
            "name": "TEST_Student", "age": 4, "gender": "F",
            "parent_id": parents[0]["id"], "class_id": classes[0]["id"],
            "photo_url": None, "notes": "test"
        }, timeout=10)
        assert r.status_code == 200
        sid = r.json()["id"]

        ru = requests.put(f"{API}/admin/students/{sid}", headers=h, json={
            "name": "TEST_Student_Updated", "age": 5, "gender": "F",
            "parent_id": parents[0]["id"], "class_id": classes[0]["id"],
            "photo_url": None, "notes": "updated"
        }, timeout=10)
        assert ru.status_code == 200

        rd = requests.delete(f"{API}/admin/students/{sid}", headers=h, timeout=10)
        assert rd.status_code == 200


class TestEnrollmentDecision:
    def test_approve_enrollment(self, admin_token):
        h = _auth(admin_token)
        # First submit a public enrollment
        ts = int(time.time())
        email = f"test_enroll_{ts}@example.com"
        rs = requests.post(f"{API}/public/enroll", json={
            "parent_name": "TEST_EnrollParent",
            "parent_email": email,
            "phone": "555-0200",
            "child_name": "TEST_EnrollChild",
            "child_age": 3,
            "preferred_class": "Sunshine Stars",
        }, timeout=15)
        eid = rs.json()["id"]

        # Approve
        ra = requests.post(f"{API}/admin/enrollments/{eid}/decision", headers=h, json={"decision": "approved"}, timeout=15)
        assert ra.status_code == 200, ra.text
        body = ra.json()
        assert "temp_password" in body and body["ok"] is True

        # Verify parent + student exist
        users = requests.get(f"{API}/admin/users?role=parent", headers=h, timeout=10).json()
        assert any(u["email"] == email for u in users)


# ----- Teacher -----
class TestTeacher:
    def test_dashboard(self, sarah_token):
        r = requests.get(f"{API}/teacher/dashboard", headers=_auth(sarah_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "classes" in d and "student_count" in d and "trend" in d
        assert isinstance(d["classes"], list) and len(d["classes"]) >= 1

    def test_students(self, sarah_token):
        r = requests.get(f"{API}/teacher/students", headers=_auth(sarah_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_reports(self, sarah_token):
        r = requests.get(f"{API}/teacher/reports", headers=_auth(sarah_token), timeout=15)
        assert r.status_code == 200
        for k in ("present", "absent", "late", "total"):
            assert k in r.json()

    def test_attendance_bulk(self, sarah_token):
        r = requests.get(f"{API}/teacher/dashboard", headers=_auth(sarah_token), timeout=10).json()
        if not r["classes"]:
            pytest.skip("No classes assigned to Sarah")
        cid = r["classes"][0]["id"]
        students = requests.get(
            f"{API}/lookup/students-by-class/{cid}", headers=_auth(sarah_token), timeout=10
        ).json()
        if not students:
            pytest.skip("No students in class")
        from datetime import date
        today = date.today().isoformat()
        records = [{"student_id": s["id"], "date": today, "status": "present"} for s in students[:3]]
        rb = requests.post(f"{API}/teacher/attendance/bulk", headers=_auth(sarah_token), json={
            "class_id": cid, "date": today, "records": records
        }, timeout=15)
        assert rb.status_code == 200, rb.text
        assert rb.json()["count"] == len(records)


# ----- Parent -----
class TestParent:
    def test_dashboard(self, emma_token):
        r = requests.get(f"{API}/parent/dashboard", headers=_auth(emma_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "children" in d
        assert isinstance(d["children"], list)
        assert len(d["children"]) >= 1

    def test_child_attendance(self, emma_token):
        d = requests.get(f"{API}/parent/dashboard", headers=_auth(emma_token), timeout=10).json()
        if not d["children"]:
            pytest.skip("Emma has no children")
        cid = d["children"][0]["id"]
        r = requests.get(f"{API}/parent/children/{cid}/attendance", headers=_auth(emma_token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "records" in body and "summary" in body


# ----- Messaging -----
class TestMessaging:
    def test_contacts_and_send(self, sarah_token, emma_token):
        # Sarah contacts
        rc = requests.get(f"{API}/messages/contacts", headers=_auth(sarah_token), timeout=10)
        assert rc.status_code == 200
        sarah_contacts = rc.json()

        # Emma -> Sarah's class might not exist (Lily is in David's). Use David instead but for Sarah, use Michael (Noah).
        # Sarah teaches Sunshine Stars where Noah (Michael's child) is.
        michael_login = _login(*PARENT_MICHAEL)
        michael_token = michael_login["token"]
        # Michael's contacts should include Sarah
        rmc = requests.get(f"{API}/messages/contacts", headers=_auth(michael_token), timeout=10)
        assert rmc.status_code == 200
        michael_contacts = rmc.json()
        sarah_contact = next((c for c in michael_contacts if c["email"] == TEACHER_SARAH[0]), None)
        if sarah_contact is None:
            pytest.skip("Sarah not in Michael contact list")

        # Michael sends to Sarah
        rs = requests.post(f"{API}/messages", headers=_auth(michael_token), json={
            "receiver_id": sarah_contact["id"], "content": f"TEST_msg_{int(time.time())}"
        }, timeout=10)
        assert rs.status_code == 200

        # Sarah fetches thread - find michael id
        michael_id = michael_login["user"]["id"]
        rt = requests.get(f"{API}/messages/{michael_id}", headers=_auth(sarah_token), timeout=10)
        assert rt.status_code == 200
        msgs = rt.json()
        assert any("TEST_msg_" in m["content"] for m in msgs)


# ----- Notifications -----
class TestNotifications:
    def test_list_and_read_all(self, admin_token):
        r = requests.get(f"{API}/notifications", headers=_auth(admin_token), timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        ra = requests.post(f"{API}/notifications/read-all", headers=_auth(admin_token), timeout=10)
        assert ra.status_code == 200


# ----- Role guards -----
class TestRoleGuards:
    def test_parent_cannot_access_admin(self, emma_token):
        r = requests.get(f"{API}/admin/users", headers=_auth(emma_token), timeout=10)
        assert r.status_code in (401, 403)

    def test_teacher_cannot_access_admin(self, sarah_token):
        r = requests.get(f"{API}/admin/stats", headers=_auth(sarah_token), timeout=10)
        assert r.status_code in (401, 403)

    def test_parent_cannot_access_teacher(self, emma_token):
        r = requests.get(f"{API}/teacher/dashboard", headers=_auth(emma_token), timeout=10)
        assert r.status_code in (401, 403)
