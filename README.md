# Divine Classes — Institute Management System

Official portal for **Divine Classes** (JEE / NEET / Board coaching, New Delhi).
A role-based web app built on **Google Apps Script** with a Cloud Database, Google Drive storage, and a Google Sheet mirror.

### 🌐 Live Web App
- **Live Portal:** [https://script.google.com/macros/s/AKfycbzeohya5AzIYqWHERYwLE85Uhx6uxRiGVPRnTEuhwD5/dev](https://script.google.com/macros/s/AKfycbzeohya5AzIYqWHERYwLE85Uhx6uxRiGVPRnTEuhwD5/dev)
- **Production Exec URL:** [https://script.google.com/macros/s/AKfycbzeohya5AzIYqWHERYwLE85Uhx6uxRiGVPRnTEuhwD5/exec](https://script.google.com/macros/s/AKfycbzeohya5AzIYqWHERYwLE85Uhx6uxRiGVPRnTEuhwD5/exec)

---

## 1. What's Inside

| Module | Description |
|---|---|
| Batches & Students | Create batches, enrol/remove students (Req #1) |
| Fees & Reminders | Admin-only fee tracking, WhatsApp/SMS/UPI reminders, printable receipts (Req #2, #5) |
| Assignments & DPPs | Upload/download PDFs to Google Drive (Req #3) |
| Offline Marks Tracker | Offline test marks, %, teacher remarks, report cards (Req #4) |
| Teacher Profiles | Faculty qualifications, specializations, doubt slots (Req #6) |
| Results & Gallery | Result banners, classroom photos, events (Req #8) |
| External Study Hub | Curated NCERT/NDLI/Khan/PhET/CBSE links, saved to Drive (Req #9) |
| Feedback | Parent & student feedback with ratings (Req #10) |
| Access Control | Block/unblock users, manage passwords (Req #11) |
| Institute Settings | **Developer-only** full configuration console |

---

## 2. Tech Stack

- **Frontend:** HTML + Tailwind CSS (CDN) + Font Awesome, Inter/Outfit fonts, vanilla JS SPA
- **Backend:** Google Apps Script (V8 runtime) — `Code.js`
- **Primary DB:** `PropertiesService` script properties (JSON tables — instant, persistent, NoSQL-style)
- **Mirror DB:** Google Sheet (`DB_JSON` hidden tab + readable tabs: `Students_Master`, `Teachers_Roster`, `Batches_Roster`, `Offline_Test_Marks`, `Feedback_Responses`, `Materials_Repository`, `Gallery_Banners`, `External_Links_Hub`, `Settings_Config`)
- **File storage:** Google Drive folder tree — *Divine Classes Portal Uploads* → Photos / Gallery / Materials / Links (public-view links)
- **Local cache:** `localStorage` + `sessionStorage` (30-day sessions, offline resilience)
- **Deployment tool:** [`clasp`](https://github.com/google/clasp)

---

## 3. Project Structure

```
├── Code.js              # Backend: routing, DB engine, Drive storage, Sheets mirror, CRUD APIs
├── index.html           # Main app shell (sidebar, header, modals, toasts, mobile nav)
├── javascript.html      # All frontend logic: state, auth, views, sync, notifications
├── css.html             # Theme CSS (dark mode, scrollbars, print styles)
├── login.html           # Standalone sign-in screen
├── logout.html          # Signed-out screen
├── appsscript.json      # Apps Script manifest (V8, webapp access: ANYONE)
├── logo.jpeg            # App icon (DC emblem)
├── divine_toppers_banner.jpg # Result banner
├── .clasp.json          # clasp script binding
├── .claspignore         # Only pushes the 7 app files above
└── update_contact_info.py  # (utility placeholder)
```

---

## 4. Web App

### Roles & Access

| Role | Access |
|---|---|
| **Developer** | Everything Admin sees **+ Institute Settings console + Google Drive/Sheet quick links** (header & sidebar) |
| **Admin** | Fees, Access Control, batches, materials, gallery, reminders — no Settings, no Drive/Sheet links |
| **Teacher** | Batches, materials, marks, teachers, gallery, links, feedback — **fees hidden** |
| **Student/Parent** | Own materials, marks, teacher profiles, feedback — fees tab blocked |

### Login Credentials (defaults — change in Settings)

| Role | Login ID | Password |
|---|---|---|
| Developer | `developer` (or `dev`, `developer@divineclasses.in`) | `dev123` |
| Admin | `admin` (or `anil`, `anil chahar`) | `admin123` |
| Teacher | e.g. `dr.sunita@divineclasses.in` | `teacher123` |
| Student | e.g. `DC-101` | `password123` |

> "Remember me" keeps the session for 30 days.

### Institute Settings (Developer only)

Profile, contact & UPI, social channels, Admin/Developer passwords, and **Google Drive Account & Link**:

1. Paste your **Google Drive Email ID**, **password**, and the **Drive link** (My Drive or any folder).
2. Click **Save All Settings** → synced to Cloud Database + Google Sheet.
3. Any **Open Drive** button now launches that link **as the saved account** (auto-switch via `?authuser=`).

**Note:** Google's sign-in page is cross-origin — browsers cannot auto-fill your password into it. Google will ask for the password on its own page; the saved password is your portal-side note.

### Data Flow

```
Browser (state) ──auto-sync──▶ PropertiesService (primary DB)
                     └──mirror──▶ Google Sheet (readable tabs + DB_JSON)
Uploads ──▶ Google Drive folders (public view links)
```

Every edit auto-syncs (350 ms debounce); the header sync button forces an instant write.

---

## 5. Security Notes

- All portal passwords (Admin, Developer, Teacher, Student) are stored in script properties and mirrored to the Sheet's `Settings_Config` / roster tabs — treat Sheet access as sensitive.
- Role gating is enforced client-side (`navigateTo`, `renderMainContent`) and on login; the Sheet/Drive are public-view by design for material sharing.
- Student **DC-110 (Anil Kumar Chahar)** is force-enforced to `Blocked` on every database read (`apiGetInitialData`).
- Rotate default passwords after first deployment (Settings console).

---

## 6. Contact

**Divine Classes** — 235 Paschimpuri Pocket 2, Club Road, New Delhi 110063
Phone: 9555-6787-53 · contact@divineclasses.in · YouTube: [@chem_crush9](https://www.youtube.com/@chem_crush9)
