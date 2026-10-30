#!/usr/bin/env python3
"""
Direct Headless Supabase Database Configurator (Zero Browser)
============================================================
Connects directly to your Supabase PostgreSQL database using pg8000
and runs SUPABASE_SETUP.sql completely in the background without Edge/browser.

Usage:
  python setup_db_headless.py
"""

import sys
import getpass
from pathlib import Path

try:
    import pg8000.native
except ImportError:
    print("pg8000 is not installed. Run: pip install pg8000")
    sys.exit(1)

PROJECT_REF = "mbplsboknjvmhfqasuik"
# Supabase pooled connection host
HOST = f"aws-0-ap-south-1.pooler.supabase.com"  # fallback or direct
DIRECT_HOST = f"db.{PROJECT_REF}.supabase.co"
PORT = 5432
DATABASE = "postgres"
USER = "postgres"

def run_headless_setup():
    print("==========================================================")
    print("  Divine Classes — Headless Supabase DB Setup (No Browser)")
    print("==========================================================")
    print(f"Project Reference: {PROJECT_REF}")
    print("This will execute SUPABASE_SETUP.sql directly via PostgreSQL.\n")

    sql_path = Path("SUPABASE_SETUP.sql")
    if not sql_path.exists():
        print("Error: SUPABASE_SETUP.sql not found in workspace.")
        return

    sql_script = sql_path.read_text(encoding="utf-8")

    db_password = getpass.getpass("Enter your Supabase database password (input hidden): ").strip()
    if not db_password:
        print("Password cannot be empty.")
        return

    print("\nConnecting directly to PostgreSQL...")

    connection = None
    # Try pooler first then direct
    hosts_to_try = [
        {"host": f"aws-0-ap-south-1.pooler.supabase.com", "port": 6543, "user": f"postgres.{PROJECT_REF}"},
        {"host": DIRECT_HOST, "port": 5432, "user": "postgres"}
    ]

    for cfg in hosts_to_try:
        try:
            print(f"-> Trying {cfg['host']}:{cfg['port']}...")
            connection = pg8000.native.Connection(
                user=cfg["user"],
                host=cfg["host"],
                port=cfg["port"],
                database=DATABASE,
                password=db_password,
                ssl_context=True
            )
            print("Connected successfully!")
            break
        except Exception as e:
            print(f"   Failed: {e}")

    if not connection:
        print("\nCould not establish connection. Please check your database password.")
        return

    print("\nExecuting SUPABASE_SETUP.sql statements...")
    
    # Split queries by semicolon and execute
    statements = [stmt.strip() for stmt in sql_script.split(";") if stmt.strip()]

    for idx, stmt in enumerate(statements, 1):
        # Ignore comments
        lines = [line for line in stmt.splitlines() if not line.strip().startswith("--")]
        clean_stmt = "\n".join(lines).strip()
        if not clean_stmt:
            continue
        try:
            connection.run(clean_stmt)
            print(f"  [{idx}/{len(statements)}] Executed statement successfully.")
        except Exception as err:
            print(f"  [{idx}/{len(statements)}] Warning: {err}")

    print("\n==========================================================")
    print("🎉 Database successfully configured without opening Edge!")
    print("==========================================================")
    connection.close()

if __name__ == "__main__":
    run_headless_setup()
