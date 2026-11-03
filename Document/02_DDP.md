# Detailed Design Package (DDP)
# & Distributed Data Protocol Specification
## Divine Classes — Coaching ERP & Learning Management System

---

## Document Control & Metadata
- **Document Title**: Detailed Design Package (DDP) & Distributed Data Architecture
- **System**: Divine Classes Academic Management & Student-Parent Portal
- **Companion Documents**: [`PRD.md`](file:///Users/anilkumarchahar/Desktop/DCV1/Document/01_PRD.md), [`ADP.md`](file:///Users/anilkumarchahar/Desktop/DCV1/Document/03_ADP.md), [`USER_GUIDE.md`](file:///Users/anilkumarchahar/Desktop/DCV1/Document/04_User_Guide.md)
- **Version**: 2.5.0 (Enterprise Specification)
- **Status**: Production Engineering Standard

---

## 1. System Architecture & Distributed Data Protocol (DDP)

### 1.1 Real-Time Data Flow & Latency Compensation
The application implements an optimistic, real-time client-server synchronization pattern (inspired by the Distributed Data Protocol - DDP):

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (BROWSER SPA)                          │
│                                                                        │
│   User Action (e.g. Mark Attendance / Record Fee / Save Test Marks)    │
│                                  │                                     │
│                                  ▼                                     │
│   [Optimistic UI Mutation] ──► Instant UI Update (0ms delay)           │
│   Update in-memory state = { ... }                                     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   │ Background Async RPC
                                   │ (google.script.run)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BACKEND (GOOGLE APPS SCRIPT V8)                    │
│                                                                        │
│                      RouteHandler & ApiDispatcher                      │
│                                  │                                     │
│              ┌───────────────────┴───────────────────┐                 │
│              ▼                                       ▼                 │
│   PRIMARY CLOUD STORAGE                    FAILOVER / MIRROR           │
│   Supabase REST Client                     Google Sheets Service       │
│   (PostgreSQL 15 + RLS)                    (SpreadsheetApp Engine)     │
└──────────────┬───────────────────────────────────────┬─────────────────┘
               │                                       │
               ▼                                       ▼
    ┌──────────────────────┐               ┌───────────────────────┐
    │  Supabase Cloud DB   │               │ Google Drive Sheets   │
    │  (srjqsofkjizwsk...) │               │ (Spreadsheet Tables)  │
    └──────────────────────┘               └───────────────────────┘
```

### 1.2 Latency Compensation Rules
1. **Immediate Execution**: When an admin records a fee, marks attendance, or adds test scores, the client immediately updates the local `state` cache and re-renders the affected DOM node.
2. **Background Dispatch**: A background remote procedure call (`google.script.run`) is dispatched to write the change to Supabase and Google Sheets.
3. **Safe Rollback On Network Error**: If the remote call rejects or times out, the client rolls back the optimistic mutation, alerts the user with a notification toast (`showToast(message, 'error')`), and logs the event.

---

## 2. Physical Data Dictionary & Database Schemas

### 2.1 Table: `students`
Stores registered student demographic, enrollment, and fee status records.

| Column Name | PostgreSQL Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `VARCHAR(64)` | NO | Primary Key | Unique student identifier (e.g., `s1`, `s102`). |
| `roll` | `VARCHAR(32)` | NO | Unique | Official roll number (e.g., `DC-102`). |
| `name` | `VARCHAR(128)` | NO | — | Full name of the student. |
| `phone` | `VARCHAR(20)` | YES | — | Student/parent contact number (+91 format). |
| `email` | `VARCHAR(128)` | YES | — | Student/parent email address. |
| `parentName` | `VARCHAR(128)` | YES | — | Name of parent or legal guardian. |
| `batchId` | `VARCHAR(64)` | NO | — | Foreign key mapping to `batches.id`. |
| `totalFee` | `NUMERIC(10,2)`| NO | `0.00` | Total agreed tuition fee for academic session. |
| `paidFee` | `NUMERIC(10,2)`| NO | `0.00` | Cumulative amount paid to date. |
| `status` | `VARCHAR(20)` | NO | `'Active'` | Enrollment status: `Active`, `Inactive`, `Graduated`. |
| `password` | `VARCHAR(64)` | YES | `'student123'`| Access credential for student portal. |

### 2.2 Table: `batches`
Stores batch groupings, target competitive examination streams, mentor assignments, and enrolled student rosters.

| Column Name | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `VARCHAR(64)` | NO | Primary Key | Unique batch identifier (e.g., `b1`, `b2`, `b3`). |
| `name` | `VARCHAR(128)` | NO | — | Name (e.g., `JEE Advanced Target 2027 (Alpha Batch)`). |
| `subject` | `VARCHAR(128)` | NO | — | Target curricula: `Physics, Chemistry & Mathematics`, etc. |
| `schedule` | `VARCHAR(128)` | YES | — | Class timings (e.g., `Mon - Fri • 08:00 AM - 12:30 PM`). |
| `room` | `VARCHAR(64)` | YES | — | Classroom or hall (e.g., `Lecture Hall 101 (Smart AC)`). |
| `teacher` | `VARCHAR(128)` | YES | — | Lead faculty name (e.g., `Er. Rajesh Chahar (Ex-IITian)`). |
| `teacherId` | `VARCHAR(64)` | YES | — | Foreign key mapping to `teachers.id` (e.g., `tr1`). |
| `teacherEmail` | `VARCHAR(128)` | YES | — | Faculty email address for direct identity verification. |
| `student_ids` | `JSONB` | NO | `'[]'::jsonb` | JSON Array of enrolled student IDs (`["s1", "s2", ...]`). |
| `maxStudents` | `INTEGER` | NO | `40` | Maximum batch seating capacity. |

#### 2.2.1 Faculty Batch Resolution & Universal Student Enrollment Protocol
1. **Multi-Factor Faculty Resolution**:
   The function `isBatchAssignedToCurrentTeacher(batch)` links a batch to a teacher via:
   - **Tier 1 (Explicit ID Match)**: `batch.teacherId === teacher.id`.
   - **Tier 2 (Email Match)**: `batch.teacherEmail === teacher.email`.
   - **Tier 3 (Normalized Name Match)**: Strips titles (`Er.`, `Dr.`, `Mr.`, `Mrs.`) and parenthetical notes (`(Ex-IITian)`) before comparing, ensuring `Er. Rajesh Chahar (Ex-IITian)` seamlessly matches `Er. Rajesh Chahar`.
2. **Universal Teacher Student Enrollment (`openAddStudentToBatchModal`)**:
   - All institute coaching batches are visible in the Faculty Portal with dedicated `+ Add Student` triggers on each batch card and a global `+ Add Student to Any Batch` header action.
   - Assigned batches feature a distinct emerald accent ring and `★ My Assigned Batch` indicator.
   - Any teacher can enroll students into any coaching batch:
     - Option 1 adds existing institute students to the target batch roster and sets `student.batchId = batch.id`.
     - Option 2 registers a brand-new student, auto-generates their ID, and immediately associates them with the chosen batch across local state, Supabase, and Google Sheets.
3. **Faculty Self-Profile & Mentor Grid Visibility**:
   - Upon teacher login, their personal profile card is prominently featured at the top with self-service profile editing (`openEditTeacherModal`), photo upload (`openTeacherPhotoModal`), and print-ready Faculty Identity Card generation (`openTeacherIdCard`).
   - Administrative modification buttons on fellow teachers are strictly hidden.
   - The remaining active faculty roster is displayed in read-only mentor view (similar to student view, but with student-only doubt booking buttons suppressed).
4. **Offline Test Marks Logging & Grading**:
   - Teachers can create new offline tests (`openCreateTestModal`), filter tests by batch, and enter student test scores and remarks.
   - Real-time batch performance analytics (Batch Average, Highest Score, Percentage Progress) are automatically calculated and synchronized to the cloud.

### 2.3 Table: `attendance_records`
Stores daily roll call attendance entries for batch rosters.

| Column Name | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `VARCHAR(64)` | NO | Primary Key | Unique record ID (`att_[TIMESTAMP]_[RAND]`). |
| `date` | `DATE` | NO | — | Attendance date (`YYYY-MM-DD`). |
| `batchId` | `VARCHAR(64)` | NO | — | Batch identifier. |
| `studentId` | `VARCHAR(64)` | NO | — | Student identifier. |
| `status` | `CHAR(1)` | NO | `'P'` | Status: `P` (Present), `A` (Absent), `L` (Late). |
| `markedBy` | `VARCHAR(64)` | YES | — | Name or ID of faculty who recorded attendance. |
| `timestamp` | `TIMESTAMPTZ` | NO | `NOW()` | Audit creation timestamp. |

### 2.4 Table: `offline_marks`
Stores classroom examination and grand test results.

| Column Name | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `VARCHAR(64)` | NO | Primary Key | Unique test score ID. |
| `testName` | `VARCHAR(128)` | NO | — | Test title (e.g., `Minor Test #1 - Kinematics`). |
| `testDate` | `DATE` | NO | — | Examination date (`YYYY-MM-DD`). |
| `studentId` | `VARCHAR(64)` | NO | — | Student identifier. |
| `batchId` | `VARCHAR(64)` | NO | — | Batch identifier. |
| `score` | `NUMERIC(5,1)` | NO | `0.0` | Marks obtained by the student. |
| `maxScore` | `NUMERIC(5,1)` | NO | `100.0`| Maximum test marks. |
| `topics` | `TEXT` | YES | — | Syllabus topics tested. |
| `remarks` | `TEXT` | YES | — | Faculty qualitative feedback (e.g. `Batch Topper`). |

### 2.5 Table: `study_materials` (DPPs & Assignments)
Stores educational resources with strict batch-level isolation.

| Column Name | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `VARCHAR(64)` | NO | Primary Key | Unique material ID. |
| `batchId` | `VARCHAR(64)` | NO | — | **Target Batch ID** (Security isolation key). |
| `title` | `VARCHAR(256)` | NO | — | Material title (e.g., `DPP-04 Electrostatics`). |
| `subject` | `VARCHAR(64)` | NO | — | Subject (Physics, Chemistry, Mathematics, Biology). |
| `type` | `VARCHAR(32)` | NO | `'PDF'` | Format: `PDF`, `DPP`, `Assignment`, `Video`. |
| `url` | `TEXT` | NO | — | Resource URL or Google Drive link. |
| `uploadedBy` | `VARCHAR(128)` | YES | — | Faculty name who uploaded the document. |
| `date` | `DATE` | NO | — | Upload date. |

### 2.6 Table: `settings_config`
Global key-value configuration state for institute branding and cloud databases.

| Column Name | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `instituteName`| `VARCHAR(128)` | NO | `'Divine Classes'`| Official coaching name. |
| `adminName` | `VARCHAR(128)` | NO | `'Er. Rajesh Chahar'`| **Director / Signatory Name** on report cards. |
| `adminEmail` | `VARCHAR(128)` | NO | `'admin@divineclasses.in'`| Admin portal login username. |
| `adminPassword`| `VARCHAR(128)` | NO | `'admin123'`| Admin portal password. |
| `supabaseEnabled`| `BOOLEAN` | NO | `TRUE` | Master toggle for cloud Supabase DB. |
| `supabaseUrl` | `TEXT` | YES | — | Supabase project REST URL. |
| `sheetsMirrorEnabled`| `BOOLEAN` | NO | `FALSE` | Toggle for Google Sheets backup mirror. |

---

## 3. Remote Procedure Call (RPC) API Contracts

All RPC methods are invoked via Google Apps Script client dispatch:

### 3.1 `apiGetInitialData()`
- **Purpose**: Fetches the initial database payload when the web app boots.
- **Return Type**: `Object`
```json
{
  "students": [...],
  "batches": [...],
  "teachers": [...],
  "offlineMarks": [...],
  "attendanceRecords": [...],
  "studyMaterials": [...],
  "settings": { ... }
}
```

### 3.2 `apiRecordStudentPayment(studentId, amount, mode, ref)`
- **Parameters**:
  - `studentId` (`string`): Target student ID.
  - `amount` (`number`): Payment amount in INR.
  - `mode` (`string`): Payment method (`UPI`, `Cash`, `Bank`).
  - `ref` (`string`): Transaction reference or UTR ID.
- **Behavior**:
  - Increments `students.paidFee`.
  - Appends record to `students.paymentHistory`.
  - Generates immutable receipt number `DC-REC-XXXXXX`.

### 3.3 `apiSaveRecord(entityType, recordData)`
- **Parameters**:
  - `entityType` (`string`): Table target (`students`, `batches`, `offline_marks`, etc.).
  - `recordData` (`object`): Column-value mapping.
- **Behavior**: Upserts the record in Supabase and synchronizes the Google Sheet row.

---

## 4. Security, Isolation & Document Rendering Engine

### 4.1 Strict Batch Isolation Algorithm
```javascript
// Enforces batch gating for logged-in students
function getAuthorizedMaterials(currentUser, allMaterials) {
    if (!currentUser || currentUser.role === 'admin' || currentUser.role === 'teacher') {
        return allMaterials; // Admins and teachers view all
    }
    // Student scope: strictly filter by student.batchId
    return allMaterials.filter(item => item.batchId === currentUser.batchId);
}
```

### 4.2 Tamper-Evident Report Card Hash Algorithm
```javascript
// Generates immutable verification token
function generateVerificationHash(studentRoll, studentId) {
    const cleanId = String(studentRoll || studentId).replace(/[^a-zA-Z0-9]/g, '');
    const timeToken = Date.now().toString(36).toUpperCase();
    return `DC-VRF-${cleanId}-${timeToken}`;
}
```

### 4.3 Dynamic Director Signature Binding
```javascript
// Binds digital signature directly to active Admin Name
const adminName = (state.settings && state.settings.adminName)
    || ((state.currentUser && state.currentUser.role === 'admin') ? state.currentUser.name : '')
    || 'Er. Rajesh Chahar';
```

---

## 5. Export Pipelines Architecture

1. **PDF Compilation (`buildSingleImagePdf`)**:
   - Captures DOM element using `html2canvas` at high scale (scale: 2).
   - Converts canvas to raw JPEG stream.
   - Encodes pure binary PDF object tree (Catalog, Pages, Page, Contents, XObject Image) in pure JavaScript.
   - **Advantage**: Zero third-party CDN downtime; renders pixel-perfect identical output across mobile and desktop.
2. **WhatsApp Dispatch Protocol**:
   - Generates URL-encoded intent (`https://wa.me/91[PHONE]?text=[ENCODED_MESSAGE]`).
   - Includes full scores ledger, cumulative grade, digital signature, and verification hash.

---

## 6. Live Synchronization & Cloud Abstraction Engine

### 6.1 Multi-Device Real-Time Polling Engine (`startSupabaseLiveSync`)
- **Cadence**: 4-second continuous polling interval.
- **Event Listeners**: Instant trigger on browser/app `focus` and `visibilitychange` (bringing the mobile APK to foreground).
- **Behavior**:
  - Compares cloud timestamps against local state.
  - Automatically updates `state.settings`, `state.students`, and `state.batches`.
  - Propagates changes made on desktop/laptop immediately to mobile APK devices and vice versa.

### 6.2 26-Key Settings Synchronization & Admin Password Tracking
- The `settings_config` table stores all 26 key parameters matching Google Sheets `Settings_Config` 1:1.
- Parameters include: `instituteName`, `tagline`, `address`, `phone`, `contactDisplay`, `email`, `upiId`, `facebookUrl`, `instagramUrl`, `youtubeUrl`, `adminName`, `adminPassword`, `adminEmail`, `showRequirementLabels`, `allowAdminFeedbackDelete`, `allowAdminLinkDelete`, `showDummyData`, `dummyDataWiped`, `sheetsMirrorEnabled`, `supabaseEnabled`, `supabaseUrl`, `supabaseKey`, `driveFolderUrl`, `driveEmail`, `drivePassword`, `driveUrl`.
- **Master Password Tracking**: When the administrator changes their password via the UI, it is written immediately to Cloud `settings_config`, `db_json`, and Google Sheets. The Developer Settings view provides an eye toggle (`toggleInputPasswordVisibility`) so the Lead Developer (`anil.chahar170@gmail.com`) can inspect and restore lost credentials.

### 6.3 Handover Dummy Clearance with Notification Purge
- `apiPermanentClearDummyData()` removes all seed demo entities (`students`, `batches`, `materials`, `offline_tests`, `teachers`, `gallery`, `feedbacks`) across Cloud database, local storage, and Google Sheets.
- **Notification Purge**: Automatically clears `state.notifications = []`, resets the notification badge count to 0, and issues `DELETE FROM notifications` in the Cloud database.
- **Forever Protected**: Client-added students, external study links, and institute configuration settings are strictly preserved.

### 6.4 Client-Facing White-Label Layer
- All user-facing views, alerts, toasts, badges, and modals for Admin, Teacher, and Student roles strictly use **"Cloud"** terminology with cloud icons (`fa-solid fa-cloud`).
- Technical infrastructure terms ("Google Sheet", "Google Sheets", "spreadsheet", "Supabase", "GSheet") are completely shielded from end-users.

---

## 7. Role-Based Navigation & Profile Component Architecture

### 7.1 Top-Level Profile & Faculty Feedback Orchestration
- **Sidebar Decoupling**: Teacher profiles have been removed from the `sidebarNavigationGroups.community` menu. Non-admin users cannot access faculty directory from the sidebar.
- **Teacher Workspace**:
  - Top header features exactly 4 primary actions: Sync, Theme Toggle, Notification Bell, and the clickable User Profile Badge bound to `openTeacherSelfProfileModal()`. Redundant `[My Profile]` buttons in the header have been removed.
  - Top role banner features `[My Faculty Profile & Reviews]` button.
  - Faculty modal presents teacher identity, photo upload, ID card download, and verified student/parent feedback entries.
- **Student Workspace**:
  - Top header maintains the streamlined 4-icon layout (Sync, Theme, Bell, Profile Badge bound to `openStudentSelfProfileModal()`).
  - Top role banner renders `[Faculty & Feedback]` and `[My Profile]`.
  - `openStudentFacultyFeedbackModal()` displays active faculty mentor cards alongside an interactive feedback form to submit star ratings and qualitative reviews.
- **Legacy Stigma Elimination**:
  - The previous amber badge "Fees Hidden from Teacher" is eradicated and superseded by an affirmative emerald "Faculty Portal" indicator.

### 7.2 Developer Attribution & Global Footers
- Appended synchronously across Login Screen (`renderLoginScreenView`), Logout Screen (`Routes/Logout/page.html`), and all active workspace views (`appendAppFooter`).
- Layout specification:
  - Single streamlined line: `© 2026 Designed & Engineered by Dev. Anil Kumar Chahar • 8126390611 • v2.5 Cloud Edition` (eliminating duplicate address/helpline lines already rendered in portal cards).

### 7.3 Top Header 4-Control Strict Enforcement
- The top header action container `#header-action-controls` strictly accommodates exactly 4 elements:
  1. `btn-sync`: Cloud database sync button (`fa-cloud`).
  2. `btn-theme-toggle`: Theme switch button (`fa-moon` / `fa-sun`).
  3. Notification alerts dropdown (`fa-bell`).
  4. Unified clickable profile badge (`#auth-header-container`).
- Duplicate `#dev-quick-links` (Drive `fa-cloud` and Sheet `fa-cloud-arrow-up`) have been removed from the header; they are exclusively positioned in the sidebar Developer Tools drawer.

### 7.4 Developer-Only Gemini Key RBAC & Speech Diagnostics
- The inline drawer `#gemini-config-drawer` and configuration triggers (`#chatbot-gemini-config-btn`, `#dedicated-gemini-config-btn`) are strictly tagged with `.dev-only-link`.
- `toggleGeminiSettingsDrawer()` and `saveGeminiSettingsFromDrawer()` reject any non-developer execution.
- Web Speech API integration incorporates `showMicrophonePermissionHelpModal()` for instant visual diagnostics when browser security settings block microphone access.
