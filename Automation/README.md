# Automation Suite — Divine Classes

This folder centralizes the active Python automation tools, database deployment scripts, and local testing utilities for Divine Classes.

---

## 🛠️ Python Scripts Directory

| # | Script | Purpose | How to Run |
| :-: | :--- | :--- | :--- |
| **1** | **[`1_Init_Database.py`](file:///Users/anilkumarchahar/Desktop/DCV1/Automation/1_Init_Database.py)** | Interactive console with safe **"Go Back to Main Menu"** (`0` / `back`), fresh rebuilds, and direct student insertion/deletion. | `/opt/homebrew/bin/python3.14 Automation/1_Init_Database.py` |
| **2** | **[`2_Local_Preview.py`](file:///Users/anilkumarchahar/Desktop/DCV1/Automation/2_Local_Preview.py)** | Lightweight local preview web server to test frontend HTML/CSS/JS files offline (auto-falls back to next port if busy). | `/opt/homebrew/bin/python3.14 Automation/2_Local_Preview.py` |
| **3** | **[`3_Run_Database_Setup.command`](file:///Users/anilkumarchahar/Desktop/DCV1/Automation/3_Run_Database_Setup.command)** | Double-clickable executable shortcut for 1-click automated database rebuilding. | Double-click in Finder or run `./Automation/3_Run_Database_Setup.command` |
| **4** | **[`4_Deploy_Update.command`](file:///Users/anilkumarchahar/Desktop/DCV1/Automation/4_Deploy_Update.command)** | 1-Click Over-The-Air deployment: Pushes code and updates all installed mobile APKs without rebuilding! | Double-click in Finder or run `./Automation/4_Deploy_Update.command` |

---

## 🚀 Quick Execution:
- **Deploy to Live Mobile APKs & Web (1-Click)**:
  ```bash
  ./Automation/4_Deploy_Update.command
  ```
- **Run Database Tool**:
  ```bash
  /opt/homebrew/bin/python3.14 Automation/1_Init_Database.py
  ```
- **Run Local Preview**:
  ```bash
  /opt/homebrew/bin/python3.14 Automation/2_Local_Preview.py
  ```
- **1-Click Reset**:
  ```bash
  ./Automation/3_Run_Database_Setup.command
  ```
