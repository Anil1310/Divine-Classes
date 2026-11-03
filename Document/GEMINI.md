# AI Web Application Golden Architecture & Standards

Whenever working in this codebase or creating/modifying web applications, automatically adhere to the following architectural, UI/UX, and engineering requirements:

---

## 1. Top Navigation Header (Strict 4-Control Standard)
To ensure zero clutter and responsive elegance across mobile, tablet, and desktop:
- **Strict 4-Control Layout**: The top right header must strictly contain only **4 interactive controls**:
  1. **Sync**: Cloud database sync button and indicator (`fa-cloud`).
  2. **Theme**: Light / Dark mode switcher button (`fa-moon` / `fa-sun`).
  3. **Bell**: Institute notification alerts dropdown center (`fa-bell`).
  4. **User Profile Badge**: Unified profile element displaying user avatar icon, display name, and role/identifier.
- **Zero Duplicate Profile Buttons**:
  - NEVER render separate `"My Profile"` buttons alongside the user profile badge in the top header.
  - NEVER render secondary action buttons (like `"Faculty & Feedback"`) inside the top header.
- **Clickable Profile Pill**:
  - The entire user profile badge (avatar icon, user name, and role label) must be clickable (`cursor-pointer`) and trigger `handleProfileIconClick(event)`.
  - Clicking dynamically opens the appropriate modal (Teacher Faculty modal, Student Profile & ID Card modal, or Admin Account modal).
- **Secondary & Role Actions Placement**:
  - Role-specific quick actions (e.g., `"Faculty & Feedback"`, `"My Profile & ID Card"`, `"Edit Profile"`) belong strictly in the **Role Banner** or the **Dashboard**, keeping the top header clean.

---

## 2. Multi-Role RBAC & Profile Modal Architecture
- Teacher, Student, Admin, and Developer roles must have distinct, isolated portal workspaces.
- Teachers access their credentials, ID card, and student reviews directly from their header profile badge or the role banner.
- Students view batch assignments, test marks, attendance, and faculty feedback directly without cluttered header actions.
- The `Log Out` button is integrated cleanly alongside the profile pill on desktop and relocated to the mobile drawer on mobile screens (`@media (max-width: 639px)`).

---

## 3. Responsive & Mobile-First Experience
- **Mobile Bottom Navigation Bar**: Fixed bottom bar (`lg:hidden`) for primary routes with `safe-area-inset-bottom` padding.
- **Text Truncation**: Enforce `truncate`, `max-w`, and `whitespace-nowrap` on all names, emails, and dates to prevent layout shifts.
- **Theme Persistence**: Light/Dark theme state must persist in storage and apply instantly on reload without screen flickering.

---

## 4. Cross-Platform Automation (Windows 11 & macOS)
Every web application must provide ready-to-run automation scripts for both platforms:
- **Windows 11**:
  - Provide `.bat` scripts (e.g., `2_Local_Preview.bat`, `4_Deploy_Update.bat`).
  - In Python preview servers, catch Windows socket error `10048` (WSAEADDRINUSE) alongside Unix `48` and `98`.
- **macOS / Linux**:
  - Provide `.command` or `.sh` scripts.

---

## 5. Dual-Layer Persistence (Database & Google Sheets)
- **Schema Parity**: JavaScript frontend state models, Supabase SQL tables, and Google Sheets column headers must share identical column names and casing.
- **Auto-Formatting**: Google Sheets tabs must maintain Calibri 10pt font, bold frozen header rows, and column auto-sizing.
- **Baseline Seed Data**: Keep complete demo seed files (`Seeds.js` and `Create_Database.sql`) with real-world credentials for instant testing.

