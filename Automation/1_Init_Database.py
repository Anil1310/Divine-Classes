"""
Automation/01_Init_Database.py
==============================
Automated Python Tool for Divine Classes Database Management:
  1. Fresh Table Creation & Baseline Data Seeding
  2. Inserting Fresh Students, Batches, and Test Marks
  3. Deleting Students (by Roll Number or ID) directly from Supabase
  4. Inspecting & Verifying live database counts
  5. Safe cancel & 'Go back to main menu' navigation

Usage:
  # Interactive Menu:
  /opt/homebrew/bin/python3.14 Automation/01_Init_Database.py

  # Quick Fresh Reset:
  /opt/homebrew/bin/python3.14 Automation/01_Init_Database.py --fresh

  # Delete a student directly:
  /opt/homebrew/bin/python3.14 Automation/01_Init_Database.py --delete-student DC-115
"""

import os
import sys
import argparse
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("❌ Error: 'psycopg2' is not installed for this Python runtime.")
    print("👉 Please run: /opt/homebrew/bin/python3.14 -m pip install psycopg2-binary --break-system-packages")
    sys.exit(1)

# ============================================================================
# DATABASE CONNECTION PARAMETERS (Supabase project: srjqsofkjizwskqnzyfn)
# ============================================================================
DB_HOST = "aws-0-ap-south-1.pooler.supabase.com"
DB_PORT = 6543
DB_NAME = "postgres"
DB_USER = "postgres.srjqsofkjizwskqnzyfn"
DB_PASS = "Anil@13101986@"

ROOT = Path(__file__).resolve().parent.parent
SQL_PATH = ROOT / "Supabase" / "Create_Database.sql" if (ROOT / "Supabase" / "Create_Database.sql").exists() else ROOT / "supabase" / "Create_Database.sql"


def get_connection():
    """Establishes and returns an autocommit connection to Supabase PostgreSQL."""
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        connect_timeout=15
    )
    conn.autocommit = True
    return conn


def is_back(val):
    """Checks if the user requested to go back to the main menu."""
    return val.strip().lower() in ["0", "b", "back", "cancel", "q", "exit"]


def recreate_fresh_database():
    """Drops old tables/views, creates fresh tables, and inserts all clean seed data."""
    print("\n" + "=" * 70)
    print("🚀 RECREATING FRESH DATABASE (DROP + CREATE TABLES + INSERT BASELINE)")
    print("=" * 70)

    if not SQL_PATH.exists():
        print(f"❌ Error: Schema file not found at {SQL_PATH}")
        return False

    with open(SQL_PATH, "r", encoding="utf-8") as f:
        sql_content = f.read()

    print("🔌 Connecting to Supabase PostgreSQL...")
    conn = get_connection()
    cur = conn.cursor()

    print("⚡ Executing fresh schema and insert scripts...")
    cur.execute(sql_content)

    print("✅ Schema created and fresh seed data populated successfully!")
    cur.close()
    conn.close()
    verify_database()
    return True


def insert_fresh_student(name, roll, phone, parent_name="Parent", batch_id="b1", total_fee=0, paid_fee=0, monthly_fee=1000):
    """Inserts a fresh student record into public.students."""
    conn = get_connection()
    cur = conn.cursor()

    student_id = "s_" + roll.lower().replace("-", "_").replace(" ", "_")

    insert_sql = """
        INSERT INTO public.students (
            id, roll, name, phone, parent_name, total_fee, paid_fee, monthly_fee,
            status, batch_id, password, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, 'Active', %s, 'password123', NOW(), NOW()
        )
        ON CONFLICT (roll) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            parent_name = EXCLUDED.parent_name,
            total_fee = EXCLUDED.total_fee,
            paid_fee = EXCLUDED.paid_fee,
            monthly_fee = EXCLUDED.monthly_fee,
            batch_id = EXCLUDED.batch_id,
            updated_at = NOW()
        RETURNING id, roll, name, batch_id;
    """

    cur.execute(insert_sql, (student_id, roll, name, phone, parent_name, total_fee, paid_fee, monthly_fee, batch_id))
    result = cur.fetchone()
    print(f"✅ Fresh Student Inserted: ID={result[0]}, Roll={result[1]}, Name='{result[2]}', Batch='{result[3]}'")

    cur.close()
    conn.close()


def delete_student(roll_or_id):
    """Deletes a student by Roll Number (e.g. DC-102) or ID (e.g. s1) from Supabase."""
    conn = get_connection()
    cur = conn.cursor()

    target = roll_or_id.strip()
    cur.execute("""
        SELECT id, roll, name FROM public.students 
        WHERE LOWER(roll) = LOWER(%s) OR LOWER(id) = LOWER(%s);
    """, (target, target))
    stu = cur.fetchone()

    if not stu:
        print(f"❌ Student with Roll Number or ID '{target}' not found in Supabase.")
        cur.close()
        conn.close()
        return False

    stu_id, stu_roll, stu_name = stu
    print(f"🗑️ Found Student: '{stu_name}' | Roll: {stu_roll} | ID: {stu_id}")

    # Remove related test scores
    cur.execute("DELETE FROM public.offline_tests WHERE student_id = %s;", (stu_id,))
    # Remove student
    cur.execute("DELETE FROM public.students WHERE id = %s;", (stu_id,))

    print(f"✅ Successfully deleted student '{stu_name}' ({stu_roll}) from database!")
    cur.close()
    conn.close()
    return True


def insert_fresh_batch(batch_id, name, subject="Physics, Chemistry, Mathematics", schedule="Mon-Fri 4:00 PM - 7:30 PM", teacher="Er. Rajesh Chahar"):
    """Inserts a fresh batch record into public.batches."""
    conn = get_connection()
    cur = conn.cursor()

    insert_sql = """
        INSERT INTO public.batches (
            id, name, subject, schedule, room, teacher, student_ids, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, 'Room 101', %s, '[]'::jsonb, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            subject = EXCLUDED.subject,
            schedule = EXCLUDED.schedule,
            teacher = EXCLUDED.teacher,
            updated_at = NOW()
        RETURNING id, name;
    """

    cur.execute(insert_sql, (batch_id, name, subject, schedule, teacher))
    result = cur.fetchone()
    print(f"✅ Fresh Batch Inserted: ID={result[0]}, Name='{result[1]}'")

    cur.close()
    conn.close()


def insert_fresh_test_score(test_name, test_date, student_id, batch_id, score, max_marks=100, topics="Core Topics", remarks="Good work"):
    """Inserts a fresh test mark into public.offline_tests."""
    conn = get_connection()
    cur = conn.cursor()

    test_id = f"test_{int(psycopg2.TimestampFromTicks(0).year)}_{student_id}"

    insert_sql = """
        INSERT INTO public.offline_tests (
            id, test_name, test_date, student_id, batch_id, score, max_score, topics, remarks, created_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            score = EXCLUDED.score,
            max_score = EXCLUDED.max_score,
            remarks = EXCLUDED.remarks
        RETURNING id, test_name, score, max_score;
    """

    cur.execute(insert_sql, (test_id, test_name, test_date, student_id, batch_id, score, max_marks, topics, remarks))
    result = cur.fetchone()
    print(f"✅ Fresh Test Mark Inserted: {result[1]} -> Score: {result[2]}/{result[3]}")

    cur.close()
    conn.close()


def verify_database():
    """Prints current row counts for all Divine Classes tables in Supabase."""
    print("\n" + "=" * 70)
    print("📊 SUPABASE LIVE TABLE AUDIT & ROW COUNTS")
    print("=" * 70)
    conn = get_connection()
    cur = conn.cursor()

    tables = [
        "batches", "students", "teachers", "materials", 
        "offline_tests", "feedbacks", "gallery", "settings_config"
    ]

    for table in tables:
        try:
            cur.execute(f"SELECT COUNT(*) FROM public.{table};")
            count = cur.fetchone()[0]
            print(f"  • public.{table:<18} : {count:>5} records")
        except Exception as e:
            print(f"  • public.{table:<18} : Error ({e})")

    cur.close()
    conn.close()
    print("=" * 70)


def interactive_menu():
    """Interactive command-line interface with safe 'Back to Main Menu' navigation."""
    while True:
        print("\n" + "=" * 55)
        print("   DIVINE CLASSES — DATABASE CONTROL CONSOLE")
        print("=" * 55)
        print("1) 🚀 Recreate Fresh Database (Drop + Tables + Seed)")
        print("2) 👤 Insert a Fresh Student")
        print("3) 🗑️  Delete a Student (By Roll No Or ID)")
        print("4) 📚 Insert a Fresh Batch")
        print("5) 📝 Insert a Fresh Test Score")
        print("6) 🔍 Verify Live Table Counts")
        print("0) 🚪 Exit Console")
        print("-" * 55)

        choice = input("Enter choice (0-6): ").strip()

        if choice in ["0", "exit", "q"]:
            print("👋 Exiting Divine Classes Database Console. Goodbye!")
            break

        elif choice == "1":
            confirm = input("⚠️  Recreate all tables and reseed? Type 'yes' to proceed (or '0' to go back): ").strip()
            if is_back(confirm) or confirm.lower() != "yes":
                print("↩️  Cancelled. Returning to main menu.")
                continue
            recreate_fresh_database()
            input("\nPress Enter to return to main menu...")

        elif choice == "2":
            print("\n--- Insert Fresh Student (Type '0' anytime to go back) ---")
            name = input("Student Name [e.g. Rahul Verma]: ").strip()
            if is_back(name):
                print("↩️  Returning to main menu.")
                continue
            name = name or "Rahul Verma"

            roll = input("Roll Number [e.g. DC-115]: ").strip()
            if is_back(roll):
                print("↩️  Returning to main menu.")
                continue
            roll = roll or "DC-115"

            phone = input("Phone Number [default: +91 98765 00000]: ").strip()
            if is_back(phone):
                print("↩️  Returning to main menu.")
                continue
            phone = phone or "+91 98765 00000"

            parent = input("Parent Name [default: Mr. Verma]: ").strip()
            if is_back(parent):
                print("↩️  Returning to main menu.")
                continue
            parent = parent or "Mr. Verma"

            batch = input("Batch ID [default: b1]: ").strip()
            if is_back(batch):
                print("↩️  Returning to main menu.")
                continue
            batch = batch or "b1"

            insert_fresh_student(name, roll, phone, parent, batch)
            input("\nPress Enter to return to main menu...")

        elif choice == "3":
            print("\n--- Delete a Student (Type '0' anytime to go back) ---")
            target = input("Enter Student Roll Number or ID to delete [e.g. DC-115 or s1]: ").strip()
            if is_back(target) or not target:
                print("↩️  Cancelled. Returning to main menu.")
                continue
            delete_student(target)
            input("\nPress Enter to return to main menu...")

        elif choice == "4":
            print("\n--- Insert Fresh Batch (Type '0' anytime to go back) ---")
            batch_id = input("Batch ID [e.g. b4]: ").strip()
            if is_back(batch_id):
                print("↩️  Returning to main menu.")
                continue
            batch_id = batch_id or "b4"

            name = input("Batch Name [e.g. Delta JEE 2027]: ").strip()
            if is_back(name):
                print("↩️  Returning to main menu.")
                continue
            name = name or "Delta JEE 2027"

            subject = input("Subjects [default: Physics, Chemistry, Mathematics]: ").strip()
            if is_back(subject):
                print("↩️  Returning to main menu.")
                continue
            subject = subject or "Physics, Chemistry, Mathematics"

            insert_fresh_batch(batch_id, name, subject)
            input("\nPress Enter to return to main menu...")

        elif choice == "5":
            print("\n--- Insert Test Score (Type '0' anytime to go back) ---")
            test_name = input("Test Name [e.g. Grand Test #3 - Optics]: ").strip()
            if is_back(test_name):
                print("↩️  Returning to main menu.")
                continue
            test_name = test_name or "Grand Test #3 - Optics"

            test_date = input("Test Date [default: 2026-11-01]: ").strip()
            if is_back(test_date):
                print("↩️  Returning to main menu.")
                continue
            test_date = test_date or "2026-11-01"

            student_id = input("Student ID or Roll [e.g. s1]: ").strip()
            if is_back(student_id):
                print("↩️  Returning to main menu.")
                continue
            student_id = student_id or "s1"

            batch_id = input("Batch ID [default: b1]: ").strip()
            if is_back(batch_id):
                print("↩️  Returning to main menu.")
                continue
            batch_id = batch_id or "b1"

            score_str = input("Score Obtained [default: 92]: ").strip()
            if is_back(score_str):
                print("↩️  Returning to main menu.")
                continue
            try:
                score = float(score_str or 92)
            except ValueError:
                score = 92.0

            insert_fresh_test_score(test_name, test_date, student_id, batch_id, score)
            input("\nPress Enter to return to main menu...")

        elif choice == "6":
            verify_database()
            input("\nPress Enter to return to main menu...")

        else:
            print("Invalid choice, please select 0-6.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Divine Classes Supabase DB Tool")
    parser.add_argument("--fresh", action="store_true", help="Recreate fresh tables and insert seed data non-interactively")
    parser.add_argument("--verify", action="store_true", help="Verify live record counts")
    parser.add_argument("--delete-student", type=str, help="Delete a student by roll number or ID")
    args = parser.parse_args()

    if args.fresh:
        recreate_fresh_database()
    elif args.verify:
        verify_database()
    elif args.delete_student:
        delete_student(args.delete_student)
    else:
        interactive_menu()
