#!/usr/bin/env python3
"""
===============================================================================
Divine Classes — Unified Portal & Database Control Manager
===============================================================================
Update anything in your Supabase Database, GitHub, Vercel, and Google Apps Script
directly from this interactive tool.

Usage:
    Set SUPABASE_SERVICE_ROLE_KEY in the environment before running.
    python update_portal.py
===============================================================================
"""

import sys
import os
import json
import urllib.request
import urllib.error
import subprocess

# Supabase Credentials
SUPABASE_URL = "https://mbplsboknjvmhfqasuik.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_SERVICE_ROLE_KEY:
    raise SystemExit("Set SUPABASE_SERVICE_ROLE_KEY in the environment before running this script.")

HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "User-Agent": "divine-classes-admin-agent",
    "Prefer": "return=representation"
}

# Terminal Colors
CYAN = "\033[1;36m"
GREEN = "\033[1;32m"
YELLOW = "\033[1;33m"
RED = "\033[1;31m"
BOLD = "\033[1m"
RESET = "\033[0m"


def api_request(endpoint, method="GET", data=None):
    """Execute authenticated HTTP request to Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, method=method, headers=HEADERS)
    if data is not None:
        req.data = json.dumps(data).encode("utf-8")
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"{RED}Supabase Error ({e.code}): {err_body}{RESET}")
        return None
    except Exception as e:
        print(f"{RED}Request failed: {e}{RESET}")
        return None


# =============================================================================
# 1. SETTINGS MANAGEMENT
# =============================================================================
def get_settings():
    res = api_request("settings?id=eq.1")
    if res and len(res) > 0 and "data" in res[0]:
        return res[0]["data"]
    return {}


def update_settings_menu():
    print(f"\n{BOLD}{CYAN}=== 1. UPDATE INSTITUTE SETTINGS ==={RESET}")
    current = get_settings()

    print(f"{YELLOW}Current Settings:{RESET}")
    print(f"  1. Institute Name : {current.get('instituteName', 'Divine Classes')}")
    print(f"  2. Admin Name     : {current.get('adminName', 'Ravi Shankar')}")
    print(f"  3. Admin Email    : {current.get('adminEmail', 'divineclasses1010@gmail.com')}")
    print(f"  4. Contact Phone  : {current.get('phone', '+91 95556 78753')}")
    print(f"  5. Contact Email  : {current.get('email', 'contact@divineclasses.in')}")
    print(f"  6. Address        : {current.get('address', '235 Paschimpuri Pocket 2, Club Rd New Delhi 110063')}")
    print(f"  7. Tagline        : {current.get('tagline', '')}")
    print()

    print(f"{BOLD}Press Enter to keep current value:{RESET}")
    new_inst_name = input(f"Institute Name [{current.get('instituteName', '')}]: ").strip()
    new_admin_name = input(f"Admin Name [{current.get('adminName', '')}]: ").strip()
    new_admin_email = input(f"Admin Email [{current.get('adminEmail', '')}]: ").strip()
    new_phone = input(f"Phone [{current.get('phone', '')}]: ").strip()
    new_email = input(f"Email [{current.get('email', '')}]: ").strip()
    new_address = input(f"Address [{current.get('address', '')}]: ").strip()
    new_tagline = input(f"Tagline [{current.get('tagline', '')}]: ").strip()

    updated = dict(current)
    if new_inst_name: updated["instituteName"] = new_inst_name
    if new_admin_name: updated["adminName"] = new_admin_name
    if new_admin_email: updated["adminEmail"] = new_admin_email
    if new_phone: updated["phone"] = new_phone
    if new_email: updated["email"] = new_email
    if new_address: updated["address"] = new_address
    if new_tagline: updated["tagline"] = new_tagline

    # Save to Supabase
    req_headers = dict(HEADERS)
    req_headers["Prefer"] = "resolution=merge-duplicates"
    url = f"{SUPABASE_URL}/rest/v1/settings"
    body = json.dumps({"id": 1, "data": updated}).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=req_headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"\n{GREEN}✓ Settings updated successfully in Supabase!{RESET}")
    except Exception as e:
        print(f"{RED}Failed to update settings: {e}{RESET}")


# =============================================================================
# 2. STUDENTS MANAGEMENT
# =============================================================================
def list_students():
    students = api_request("students?select=*&order=roll.asc")
    if students is None:
        return []
    print(f"\n{BOLD}{CYAN}=== STUDENTS LIST ({len(students)} total) ==={RESET}")
    if not students:
        print(f"{YELLOW}No students found in Supabase.{RESET}")
        return []
    print(f"{BOLD}{'Roll':<10} {'Name':<22} {'Phone':<14} {'Monthly Fee':<12} {'Paid':<10} {'Status':<8}{RESET}")
    print("-" * 80)
    for s in students:
        roll = s.get("roll") or s.get("id") or "-"
        name = (s.get("name") or "-")[:20]
        phone = (s.get("phone") or "-")[:12]
        fee = f"Rs.{s.get('monthly_fee', 0)}"
        paid = f"Rs.{s.get('paid_fee', 0)}"
        status = s.get("status") or "Active"
        print(f"{roll:<10} {name:<22} {phone:<14} {fee:<12} {paid:<10} {status:<8}")
    return students


def add_student():
    print(f"\n{BOLD}{CYAN}=== ADD NEW STUDENT ==={RESET}")
    roll = input("Student Roll No / ID (e.g. DC-101): ").strip()
    if not roll:
        print(f"{RED}Roll number is required!{RESET}")
        return
    name = input("Student Full Name: ").strip()
    phone = input("Phone Number: ").strip()
    parent_name = input("Parent Name: ").strip()
    monthly_fee = input("Monthly Fee [2500]: ").strip() or "2500"
    paid_fee = input("Paid Fee [0]: ").strip() or "0"
    due_date = input("Due Date [2026-11-10]: ").strip() or "2026-11-10"
    password = input("Portal Password [student123]: ").strip() or "student123"

    payload = {
        "id": roll,
        "roll": roll,
        "name": name,
        "phone": phone,
        "parent_name": parent_name,
        "monthly_fee": float(monthly_fee),
        "total_fee": float(monthly_fee),
        "paid_fee": float(paid_fee),
        "due_date": due_date,
        "password": password,
        "status": "Active"
    }
    res = api_request("students", method="POST", data=payload)
    if res is not None:
        print(f"\n{GREEN}✓ Student '{name}' ({roll}) added to Supabase!{RESET}")


def update_student_fee():
    students = list_students()
    if not students:
        return
    roll = input("\nEnter Roll No of student to update: ").strip()
    match = [s for s in students if s.get("roll") == roll or s.get("id") == roll]
    if not match:
        print(f"{RED}Student not found.{RESET}")
        return
    st = match[0]
    print(f"\nSelected: {st.get('name')} (Current Paid: Rs.{st.get('paid_fee')})")
    new_paid = input(f"Enter new Total Paid Amount: ").strip()
    if new_paid:
        res = api_request(f"students?id=eq.{st.get('id')}", method="PATCH", data={"paid_fee": float(new_paid)})
        if res is not None:
            print(f"{GREEN}✓ Fee updated successfully!{RESET}")


def delete_student():
    list_students()
    roll = input("\nEnter Roll No / ID to delete: ").strip()
    if not roll:
        return
    confirm = input(f"{RED}Are you sure you want to delete '{roll}'? (y/N): {RESET}").strip().lower()
    if confirm == "y":
        res = api_request(f"students?id=eq.{roll}", method="DELETE")
        print(f"{GREEN}✓ Student deleted from Supabase!{RESET}")


# =============================================================================
# 3. TEACHERS MANAGEMENT
# =============================================================================
def list_teachers():
    teachers = api_request("teachers?select=*&order=id.asc")
    if teachers is None:
        return []
    print(f"\n{BOLD}{CYAN}=== TEACHERS LIST ({len(teachers)} total) ==={RESET}")
    if not teachers:
        print(f"{YELLOW}No teachers found in Supabase.{RESET}")
        return []
    print(f"{BOLD}{'ID':<8} {'Name':<24} {'Subject':<22} {'Phone':<14} {'Email':<25}{RESET}")
    print("-" * 95)
    for t in teachers:
        tid = t.get("id") or "-"
        name = (t.get("name") or "-")[:22]
        subj = (t.get("subject") or "-")[:20]
        phone = (t.get("phone") or "-")[:12]
        email = (t.get("email") or "-")[:24]
        print(f"{tid:<8} {name:<24} {subj:<22} {phone:<14} {email:<25}")
    return teachers


def add_teacher():
    print(f"\n{BOLD}{CYAN}=== ADD NEW TEACHER ==={RESET}")
    tid = input("Teacher ID (e.g. tr6): ").strip()
    name = input("Teacher Name: ").strip()
    subject = input("Subject: ").strip()
    email = input("Email: ").strip()
    phone = input("Phone: ").strip()
    experience = input("Experience (e.g. 8+ Years): ").strip()
    qualification = input("Qualification (e.g. M.Sc. Physics): ").strip()
    password = input("Password [teacher123]: ").strip() or "teacher123"

    payload = {
        "id": tid,
        "name": name,
        "subject": subject,
        "email": email,
        "phone": phone,
        "experience": experience,
        "qualification": qualification,
        "password": password,
        "status": "Active"
    }
    res = api_request("teachers", method="POST", data=payload)
    if res is not None:
        print(f"\n{GREEN}✓ Teacher '{name}' added to Supabase!{RESET}")


# =============================================================================
# 4. BATCHES MANAGEMENT
# =============================================================================
def list_batches():
    batches = api_request("batches?select=*&order=id.asc")
    if batches is None:
        return []
    print(f"\n{BOLD}{CYAN}=== BATCHES LIST ({len(batches)} total) ==={RESET}")
    if not batches:
        print(f"{YELLOW}No batches found in Supabase.{RESET}")
        return []
    print(f"{BOLD}{'ID':<8} {'Name':<35} {'Subject':<25} {'Room':<18}{RESET}")
    print("-" * 90)
    for b in batches:
        bid = b.get("id") or "-"
        bname = (b.get("name") or "-")[:33]
        bsubj = (b.get("subject") or "-")[:23]
        room = (b.get("room") or "-")[:16]
        print(f"{bid:<8} {bname:<35} {bsubj:<25} {room:<18}")
    return batches


def add_batch():
    print(f"\n{BOLD}{CYAN}=== ADD NEW BATCH ==={RESET}")
    bid = input("Batch ID (e.g. b6): ").strip()
    name = input("Batch Name: ").strip()
    subject = input("Subject(s): ").strip()
    schedule = input("Schedule (e.g. Mon-Fri 09:00 AM - 12:00 PM): ").strip()
    room = input("Room (e.g. Lecture Hall 102): ").strip()
    teacher = input("Faculty In-Charge: ").strip()

    payload = {
        "id": bid,
        "name": name,
        "subject": subject,
        "schedule": schedule,
        "room": room,
        "teacher": teacher,
        "student_ids": []
    }
    res = api_request("batches", method="POST", data=payload)
    if res is not None:
        print(f"\n{GREEN}✓ Batch '{name}' added to Supabase!{RESET}")


# =============================================================================
# 5. SEED INITIAL DATA FROM DummyData.js
# =============================================================================
def seed_from_dummy_data():
    print(f"\n{BOLD}{CYAN}=== POPULATE SUPABASE WITH INITIAL INSTITUTE DATA ==={RESET}")
    js_path = os.path.join(os.path.dirname(__file__), "DummyData.js")
    if not os.path.exists(js_path):
        print(f"{RED}DummyData.js not found.{RESET}")
        return

    # Use node to extract getDummySeedData() as JSON
    node_cmd = """
    const fs = require('fs');
    const vm = require('vm');
    const code = fs.readFileSync('DummyData.js', 'utf8');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    const data = sandbox.getDummySeedData();
    console.log(JSON.stringify(data));
    """
    try:
        proc = subprocess.run(["node", "-e", node_cmd], capture_output=True, text=True, check=True)
        seed_data = json.loads(proc.stdout)
    except Exception as e:
        print(f"{RED}Could not extract DummyData.js: {e}{RESET}")
        return

    # 1. Batches
    batches = seed_data.get("batches", [])
    if batches:
        mapped_b = [{
            "id": b["id"],
            "name": b.get("name", ""),
            "subject": b.get("subject", ""),
            "schedule": b.get("schedule", ""),
            "room": b.get("room", ""),
            "teacher": b.get("teacher", ""),
            "student_ids": b.get("studentIds", [])
        } for b in batches]
        req_headers = dict(HEADERS)
        req_headers["Prefer"] = "resolution=merge-duplicates"
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/batches", data=json.dumps(mapped_b).encode("utf-8"), headers=req_headers, method="POST")
        urllib.request.urlopen(req)
        print(f"{GREEN}✓ Seeded {len(mapped_b)} Batches!{RESET}")

    # 2. Students
    students = seed_data.get("students", [])
    if students:
        mapped_s = [{
            "id": s["id"],
            "roll": s.get("roll", s["id"]),
            "name": s.get("name", ""),
            "phone": s.get("phone", ""),
            "parent_name": s.get("parentName", ""),
            "admission_date": s.get("admissionDate", ""),
            "monthly_fee": float(s.get("monthlyFee", 2500)),
            "total_fee": float(s.get("totalFee", 2500)),
            "paid_fee": float(s.get("paidFee", 0)),
            "due_date": s.get("dueDate", ""),
            "password": s.get("password", "student123"),
            "status": s.get("status", "Active"),
            "photo_url": s.get("photoUrl", ""),
            "address": s.get("address", "")
        } for s in students]
        req_headers = dict(HEADERS)
        req_headers["Prefer"] = "resolution=merge-duplicates"
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/students", data=json.dumps(mapped_s).encode("utf-8"), headers=req_headers, method="POST")
        urllib.request.urlopen(req)
        print(f"{GREEN}✓ Seeded {len(mapped_s)} Students!{RESET}")

    # 3. Teachers
    teachers = seed_data.get("teachers", [])
    if teachers:
        mapped_t = [{
            "id": t["id"],
            "name": t.get("name", ""),
            "subject": t.get("subject", ""),
            "qualification": t.get("qualification", ""),
            "experience": t.get("experience", ""),
            "email": t.get("email", ""),
            "phone": t.get("phone", ""),
            "specialization": t.get("specialization", ""),
            "bio": t.get("bio", ""),
            "avatar_color": t.get("avatarColor", ""),
            "initials": t.get("initials", ""),
            "password": t.get("password", "teacher123"),
            "status": t.get("status", "Active")
        } for t in teachers]
        req_headers = dict(HEADERS)
        req_headers["Prefer"] = "resolution=merge-duplicates"
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/teachers", data=json.dumps(mapped_t).encode("utf-8"), headers=req_headers, method="POST")
        urllib.request.urlopen(req)
        print(f"{GREEN}✓ Seeded {len(mapped_t)} Teachers!{RESET}")

    # 4. Materials
    materials = seed_data.get("materials", [])
    if materials:
        mapped_m = [{
            "id": m["id"],
            "batch_id": m.get("batchId"),
            "title": m.get("title", ""),
            "category": m.get("category", ""),
            "upload_date": m.get("uploadDate", ""),
            "uploaded_by": m.get("uploadedBy", ""),
            "file_size": m.get("fileSize", ""),
            "downloads": m.get("downloads", 0),
            "file_name": m.get("fileName", ""),
            "file_type": m.get("fileType", ""),
            "download_url": m.get("downloadUrl", ""),
            "drive_url": m.get("driveUrl", "")
        } for m in materials]
        req_headers = dict(HEADERS)
        req_headers["Prefer"] = "resolution=merge-duplicates"
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/materials", data=json.dumps(mapped_m).encode("utf-8"), headers=req_headers, method="POST")
        urllib.request.urlopen(req)
        print(f"{GREEN}✓ Seeded {len(mapped_m)} Materials!{RESET}")

    print(f"\n{BOLD}{GREEN}🎉 All institute data successfully populated into Supabase!{RESET}")


# =============================================================================
# 6. FULL CLOUD SYNC & PUSH (GITHUB + VERCEL + APPS SCRIPT)
# =============================================================================
def cloud_sync_and_push():
    print(f"\n{BOLD}{CYAN}=== 1-CLICK DEPLOY (GITHUB + VERCEL + APPS SCRIPT) ==={RESET}")
    commit_msg = input("Enter commit message [Update portal and database]: ").strip()
    if not commit_msg:
        commit_msg = "Update portal and database"

    # 1. Git add & commit
    print(f"\n{YELLOW}1/3 Staging and pushing to GitHub...{RESET}")
    subprocess.run(["git", "add", "-A"])
    subprocess.run(["git", "commit", "-m", commit_msg])
    subprocess.run(["git", "push", "origin", "main"])

    # 2. Clasp push
    print(f"\n{YELLOW}2/3 Pushing to Google Apps Script (clasp)...{RESET}")
    subprocess.run(["clasp", "push", "-f"], shell=True)

    print(f"\n{GREEN}✓ Done! Code is live on GitHub, Vercel, and Google Apps Script.{RESET}")


# =============================================================================
# MAIN INTERACTIVE MENU
# =============================================================================
def main():
    while True:
        print(f"\n{BOLD}{CYAN}╔══════════════════════════════════════════════════════╗{RESET}")
        print(f"{BOLD}{CYAN}║     DIVINE CLASSES — SUPABASE & PORTAL CONTROL       ║{RESET}")
        print(f"{BOLD}{CYAN}╚══════════════════════════════════════════════════════╝{RESET}")
        print(f" {BOLD}1.{RESET} Update Institute Settings (Name, Admin, Phone, Email)")
        print(f" {BOLD}2.{RESET} View All Students")
        print(f" {BOLD}3.{RESET} Add New Student")
        print(f" {BOLD}4.{RESET} Update Student Fee / Paid Amount")
        print(f" {BOLD}5.{RESET} Delete Student")
        print(f" {BOLD}6.{RESET} View All Teachers")
        print(f" {BOLD}7.{RESET} Add New Teacher")
        print(f" {BOLD}8.{RESET} View All Batches")
        print(f" {BOLD}9.{RESET} Add New Batch")
        print(f" {BOLD}S.{RESET} {YELLOW}Seed All Initial Institute Data into Supabase{RESET}")
        print(f" {BOLD}P.{RESET} {GREEN}1-Click Deploy to GitHub, Vercel & Apps Script{RESET}")
        print(f" {BOLD}0.{RESET} Exit")
        print("-" * 56)

        choice = input(f"{BOLD}Choose an option: {RESET}").strip().upper()

        if choice == "1":
            update_settings_menu()
        elif choice == "2":
            list_students()
        elif choice == "3":
            add_student()
        elif choice == "4":
            update_student_fee()
        elif choice == "5":
            delete_student()
        elif choice == "6":
            list_teachers()
        elif choice == "7":
            add_teacher()
        elif choice == "8":
            list_batches()
        elif choice == "9":
            add_batch()
        elif choice == "S":
            seed_from_dummy_data()
        elif choice == "P":
            cloud_sync_and_push()
        elif choice == "0":
            print(f"\n{GREEN}Goodbye!{RESET}\n")
            break
        else:
            print(f"{RED}Invalid option, please try again.{RESET}")


if __name__ == "__main__":
    main()
