"""Seed initial data: admin, sample teachers/parents/classes/students."""
import os
import logging
from datetime import date, timedelta

import database
from auth import hash_password

logger = logging.getLogger(__name__)


async def seed_all():
    """Seed admin and sample data if database is empty."""
    # Always ensure admin exists / is up to date
    admin_email = os.environ["ADMIN_EMAIL"]
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing_admin = await database.fetch_one(
        "SELECT id, password_hash FROM users WHERE email = %s", (admin_email,)
    )
    if not existing_admin:
        await database.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, 'admin')",
            ("Administrator", admin_email, hash_password(admin_password)),
        )
        logger.info(f"Seeded admin: {admin_email}")

    # Check if we already have teachers/parents/classes
    user_count = await database.fetch_one("SELECT COUNT(*) AS c FROM users")
    if user_count["c"] > 1:
        logger.info("Data already seeded, skipping sample data.")
        return

    # Seed sample teachers
    teacher1_id = await database.execute(
        "INSERT INTO users (name, email, password_hash, role, phone) VALUES (%s, %s, %s, 'teacher', %s)",
        ("Ms. Sarah Johnson", "sarah@lumikids.com", hash_password("teacher123"), "+1-555-0101"),
    )
    teacher2_id = await database.execute(
        "INSERT INTO users (name, email, password_hash, role, phone) VALUES (%s, %s, %s, 'teacher', %s)",
        ("Mr. David Chen", "david@lumikids.com", hash_password("teacher123"), "+1-555-0102"),
    )

    # Seed sample parents
    parent1_id = await database.execute(
        "INSERT INTO users (name, email, password_hash, role, phone) VALUES (%s, %s, %s, 'parent', %s)",
        ("Emma Williams", "emma@example.com", hash_password("parent123"), "+1-555-0201"),
    )
    parent2_id = await database.execute(
        "INSERT INTO users (name, email, password_hash, role, phone) VALUES (%s, %s, %s, 'parent', %s)",
        ("Michael Brown", "michael@example.com", hash_password("parent123"), "+1-555-0202"),
    )

    # Seed sample classes
    class1_id = await database.execute(
        "INSERT INTO classes (name, age_group, description, teacher_id, capacity) VALUES (%s, %s, %s, %s, %s)",
        ("Sunshine Stars", "3-4 years", "Pre-K class focused on creative play and basic literacy.", teacher1_id, 15),
    )
    class2_id = await database.execute(
        "INSERT INTO classes (name, age_group, description, teacher_id, capacity) VALUES (%s, %s, %s, %s, %s)",
        ("Rainbow Explorers", "4-5 years", "Kindergarten class with structured learning activities.", teacher2_id, 18),
    )
    class3_id = await database.execute(
        "INSERT INTO classes (name, age_group, description, teacher_id, capacity) VALUES (%s, %s, %s, %s, %s)",
        ("Little Tots", "2-3 years", "Toddler class focused on social skills and motor development.", teacher1_id, 12),
    )

    # Seed sample students
    student1_id = await database.execute(
        "INSERT INTO students (name, age, gender, parent_id, class_id) VALUES (%s, %s, %s, %s, %s)",
        ("Lily Williams", 4, "Female", parent1_id, class2_id),
    )
    student2_id = await database.execute(
        "INSERT INTO students (name, age, gender, parent_id, class_id) VALUES (%s, %s, %s, %s, %s)",
        ("Noah Brown", 3, "Male", parent2_id, class1_id),
    )
    student3_id = await database.execute(
        "INSERT INTO students (name, age, gender, parent_id, class_id) VALUES (%s, %s, %s, %s, %s)",
        ("Olivia Smith", 4, "Female", parent1_id, class2_id),
    )

    # Seed attendance for last 14 days
    today = date.today()
    statuses = ["present", "present", "present", "present", "absent", "present", "late"]
    for student_id, class_id in [(student1_id, class2_id), (student2_id, class1_id), (student3_id, class2_id)]:
        for i in range(14):
            d = today - timedelta(days=i)
            if d.weekday() >= 5:
                continue  # skip weekends
            status = statuses[i % len(statuses)]
            await database.execute(
                "INSERT IGNORE INTO attendance (student_id, class_id, date, status, recorded_by) VALUES (%s, %s, %s, %s, %s)",
                (student_id, class_id, d, status, teacher1_id if class_id == class1_id else teacher2_id),
            )

    # Sample messages
    await database.execute(
        "INSERT INTO messages (sender_id, receiver_id, content) VALUES (%s, %s, %s)",
        (teacher2_id, parent1_id, "Hi Emma! Lily had a wonderful day today. She loved the painting activity!"),
    )
    await database.execute(
        "INSERT INTO messages (sender_id, receiver_id, content) VALUES (%s, %s, %s)",
        (parent1_id, teacher2_id, "Thank you so much! She's been talking about it all evening."),
    )

    # Sample enrollment requests
    await database.execute(
        """INSERT INTO enrollment_requests (parent_name, parent_email, phone, child_name, child_age, preferred_class, notes)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        ("Jessica Taylor", "jessica@example.com", "+1-555-0301", "Sophia Taylor", 3, "Sunshine Stars", "Sophia loves music and dance."),
    )

    logger.info("Sample data seeded successfully.")


async def write_test_credentials():
    """Write test credentials to /app/memory/test_credentials.md."""
    os.makedirs("/app/memory", exist_ok=True)
    content = f"""# LumiKids Academy - Test Credentials

## Admin
- Email: {os.environ['ADMIN_EMAIL']}
- Password: {os.environ['ADMIN_PASSWORD']}
- Role: admin
- Login → /admin

## Sample Teacher
- Email: sarah@lumikids.com
- Password: teacher123
- Role: teacher

- Email: david@lumikids.com
- Password: teacher123
- Role: teacher

## Sample Parent
- Email: emma@example.com
- Password: parent123
- Role: parent

- Email: michael@example.com
- Password: parent123
- Role: parent

## Auth Endpoints
- POST /api/auth/login        (body: {{email, password}})
- POST /api/auth/logout
- GET  /api/auth/me           (Authorization: Bearer <token>)

## Public Endpoints
- POST /api/public/enroll     (enrollment form submission)
"""
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(content)
