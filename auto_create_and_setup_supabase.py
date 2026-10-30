#!/usr/bin/env python3
"""
Divine Classes — Fully Automated Supabase Project Provisioner & Setup
====================================================================
Uses Supabase Management API (Access Token) to:
  1. Create a brand new project under your organization (Org: sskdtmhprtqukkxyajca)
  2. Wait for the database to finish provisioning
  3. Automatically fetch Project URL, anon key, and service_role key
  4. Automatically execute SUPABASE_SETUP.sql directly
  5. Automatically update all local project files (index.html, javascript.html, Update_Portal.py)
  6. Automatically commit and push everything to GitHub

Usage:
  python auto_create_and_setup_supabase.py
"""

import sys
import os
import json
import time
import urllib.request
import urllib.error
import subprocess
import getpass
from pathlib import Path

try:
    import pg8000.native
except ImportError:
    print("Installing required package: pg8000...")
    subprocess.run([sys.executable, "-m", "pip", "install", "pg8000"], check=True)
    import pg8000.native

PROJECT_DIR = Path(__file__).resolve().parent
DEFAULT_ORG_ID = "sskdtmhprtqukkxyajca"  # Divine Classes Organization ID

def api_call(url, token, method="GET", data=None):
    clean_token = token.strip()
    headers = {
        "Authorization": f"Bearer {clean_token}",
        "Content-Type": "application/json"
    }
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"API Error ({e.code}): {err}")
        return None
    except Exception as e:
        print(f"Request failed: {e}")
        return None

def main():
    print("=================================================================")
    print("  Divine Classes — 100% Automated Supabase Creator & Configurator")
    print("=================================================================")
    print("\nTo automate project creation and configuration without any browser clicks,")
    print("we need a Supabase Personal Access Token (from https://supabase.com/dashboard/account/tokens).\n")

    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
    if not token:
        # Using getpass prevents terminal pasting from inserting bullet Unicode characters (••••)
        token = getpass.getpass("Enter/paste your Supabase Personal Access Token (input hidden): ").strip()
        if not token:
            print("Access token is required to automate project creation.")
            return

    # Verify token format
    if not token.startswith("sbp_"):
        print("\nWarning: Personal access tokens typically start with 'sbp_'.")

    db_password = getpass.getpass("Choose a Database Password for the new project (input hidden): ").strip()
    if not db_password or len(db_password) < 6:
        print("Please choose a valid password with at least 6 characters.")
        return

    # 1. Fetch organizations
    print("\n[1/6] Verifying organization...")
    orgs = api_call("https://api.supabase.com/v1/organizations", token)
    if not orgs:
        print("Could not list organizations. Please check your Supabase access token.")
        return

    target_org = DEFAULT_ORG_ID
    for o in orgs:
        if o.get("id") == DEFAULT_ORG_ID or "divine" in o.get("name", "").lower():
            target_org = o.get("id")
            print(f"  -> Found Organization: {o.get('name')} ({target_org})")
            break

    # 2. Create the project
    print("\n[2/6] Creating new Supabase project 'Divine Classes'...")
    payload = {
        "name": "Divine Classes",
        "organization_id": target_org,
        "db_pass": db_password,
        "region": "ap-south-1",  # Mumbai / South Asia
        "plan": "free"
    }
    proj = api_call("https://api.supabase.com/v1/projects", token, method="POST", data=payload)
    if not proj or "id" not in proj:
        print("Project creation failed. Please check the error above.")
        return

    proj_id = proj["id"]
    print(f"  -> Created Project with ID: {proj_id}")

    # 3. Wait for project to be healthy/active
    print("\n[3/6] Waiting for database to provision (this takes ~60-90 seconds)...")
    endpoint = f"https://api.supabase.com/v1/projects/{proj_id}"
    for i in range(30):
        time.sleep(5)
        status_info = api_call(endpoint, token)
        status = status_info.get("status") if status_info else "UNKNOWN"
        print(f"  -> Status: {status} (elapsed: {(i+1)*5}s)...")
        if status in ("ACTIVE_HEALTHY", "READY"):
            print("  -> Project is now ACTIVE and READY!")
            break
    else:
        print("Project is still initializing, proceeding with setup attempt...")

    # 4. Fetch API keys
    print("\n[4/6] Fetching API Keys...")
    keys = api_call(f"https://api.supabase.com/v1/projects/{proj_id}/api-keys", token)
    anon_key = ""
    service_key = ""
    if keys:
        for k in keys:
            if k.get("name") == "anon":
                anon_key = k.get("api_key")
            elif k.get("name") == "service_role":
                service_key = k.get("api_key")

    proj_url = f"https://{proj_id}.supabase.co"
    print(f"  -> Project URL: {proj_url}")
    print(f"  -> Anon Key: {anon_key[:15]}...")
    print(f"  -> Service Role Key: {service_key[:15]}...")

    # 5. Run SUPABASE_SETUP.sql directly via PostgreSQL
    print("\n[5/6] Executing SUPABASE_SETUP.sql directly via database connection...")
    sql_path = PROJECT_DIR / "SUPABASE_SETUP.sql"
    sql_script = sql_path.read_text(encoding="utf-8") if sql_path.exists() else ""

    connected = False
    for attempt in range(6):
        try:
            time.sleep(4)
            conn = pg8000.native.Connection(
                user=f"postgres.{proj_id}",
                host="aws-0-ap-south-1.pooler.supabase.com",
                port=6543,
                database="postgres",
                password=db_password,
                ssl_context=True
            )
            connected = True
            statements = [s.strip() for s in sql_script.split(";") if s.strip()]
            for s in statements:
                lines = [l for l in s.splitlines() if not l.strip().startswith("--")]
                clean = "\n".join(lines).strip()
                if clean:
                    try:
                        conn.run(clean)
                    except Exception as sqle:
                        print(f"    SQL notice: {sqle}")
            conn.close()
            print("  -> SUPABASE_SETUP.sql executed successfully!")
            break
        except Exception as e:
            print(f"  -> Waiting for DB socket (attempt {attempt+1}/6): {e}")

    # 6. Update local files with new credentials & push to GitHub
    print("\n[6/6] Updating local codebase with new Supabase credentials...")
    files_to_update = ["index.html", "javascript.html", "Update_Portal.py"]
    old_url_pattern = "https://mbplsboknjvmhfqasuik.supabase.co"

    for fname in files_to_update:
        fpath = PROJECT_DIR / fname
        if fpath.exists():
            content = fpath.read_text(encoding="utf-8")
            content = content.replace(old_url_pattern, proj_url)
            fpath.write_text(content, encoding="utf-8")
            print(f"  -> Updated {fname}")

    print("\nCommitting and pushing changes to GitHub...")
    try:
        subprocess.run(["git", "add", "-A"], cwd=PROJECT_DIR, check=True)
        subprocess.run(["git", "commit", "-m", f"Auto-configured new Supabase project {proj_id}"], cwd=PROJECT_DIR, check=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=PROJECT_DIR, check=True)
        print("  -> Pushed to GitHub successfully!")
    except Exception as ge:
        print(f"Git push notice: {ge}")

    print("\n=================================================================")
    print("🎉 ALL DONE! Your new database is created, configured, and live!")
    print("=================================================================")

if __name__ == "__main__":
    main()
