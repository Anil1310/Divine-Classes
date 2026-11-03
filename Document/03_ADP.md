# Application Development Prompts (ADP) Master Specification
## Divine Classes — Coaching & Learning Management Web Application

---

## 1. Executive Overview & Product Vision

### 1.1 Product Description
**Divine Classes** is a high-performance, mobile-responsive Academic ERP and Learning Management System (LMS) specifically tailored for premier coaching institutes preparing students for **JEE (Advanced)**, **NEET-UG**, and **CBSE Board Examinations**.

The application is deployed as a Single-Page Application (SPA) on **Google Apps Script (GAS)**, backed by a dual-database architecture featuring **Supabase (PostgreSQL)** as the primary cloud database with an optional **Google Sheets** real-time sync layer, and an optimistic in-memory client state machine.

### 1.2 User Personas & Access Roles
| Role | Portal Scope | Permissions & Restrictions |
| :--- | :--- | :--- |
| **Administrator / Director** | Master Institute Operations | Unrestricted CRUD access across batches, students, teachers, fee records, settings, and database configurations. |
| **Faculty / Teacher** | Academic & Classroom Management | Full coaching batch visibility with universal student enrollment into any batch; assigned batch highlighted; offline test marks grading; self-service profile & ID card management; fellow mentors displayed in read-only view. |
| **Student / Parent** | Personal Academic Portal | **Strict Batch Isolation**: Can only access their designated batch, review personal attendance history by date, view offline marks, download authorized batch materials, and export digitally signed report cards. |

---

## 2. Technical Architecture & Data Models

### 2.1 Technology Stack
- **Backend**: Google Apps Script (V8 Runtime) using `HtmlService` and `google.script.run`.
- **Database Engine**:
  - **Cloud Primary**: Supabase (PostgreSQL 15) with Row-Level Security (RLS) policies.
  - **Mirror / Offline**: Google Sheets (`SpreadsheetApp`) for spreadsheet exports and backup.
  - **Client State**: In-memory reactive state cache (`state = { students: [], batches: [], ... }`) with optimistic rendering.
- **Frontend Frameworks**:
  - Tailwind CSS (Utility-first styling with dark/light mode compatibility).
  - FontAwesome 6 Pro & Lucide icons.
  - Google Fonts: `Outfit`, `Inter`, `Dancing Script` (for digital director signatures).
- **Export & Document Pipelines**:
  - `html2canvas` for high-DPI client-side rasterization.
  - Pure JavaScript raw binary PDF stream encoder (`buildSingleImagePdf`).
  - WhatsApp Web/App Universal Link Protocol (`wa.me`) with URL-encoded rich text templates.
- **Mobile Container (Planned)**:
  - Trusted Web Activity (TWA) via `@bubblewrap/cli` or Capacitor for native Android `.apk` / `.aab` compilation.

### 2.2 Core Relational Schemas
- `students`: `id`, `roll`, `name`, `phone`, `email`, `batchId`, `parentName`, `totalFee`, `paidFee`, `status`, `password`
- `teachers`: `id`, `name`, `subject`, `phone`, `email`, `batches`, `qualification`, `status`, `password`
- `batches`: `id`, `name`, `subject`, `schedule`, `teacherId`, `maxStudents`
- `attendance_records`: `id`, `date`, `batchId`, `studentId`, `status` (`P` | `A` | `L`), `markedBy`, `timestamp`
- `offline_marks`: `id`, `testName`, `testDate`, `studentId`, `batchId`, `score`, `maxScore`, `topics`, `remarks`, `sectionScores` (Planned)
- `study_materials`: `id`, `batchId`, `title`, `subject`, `type`, `url`, `uploadedBy`, `date`
- `fee_records`: `id`, `studentId`, `receiptNo`, `amount`, `paymentDate`, `mode`, `referenceId`
- `settings_config`: `instituteName`, `adminName`, `adminEmail`, `adminPassword`, `supabaseEnabled`, `supabaseUrl`, `sheetsMirrorEnabled`

---

## 3. Master Prompt Catalog (The ADP Prompts)

This catalog details the complete prompt prompts, requirements, and design specifications for all modules across the application lifecycle.

---

### PROMPT 01: System Architecture & Dual-Database Sync
```text
SYSTEM ROLE: Full-Stack Cloud & Google Apps Script Engineer
GOAL: Architect a resilient Single-Page Application (SPA) for "Divine Classes" 
coaching institute with dual-database persistence.

REQUIREMENTS:
1. Google Apps Script Backend:
   - Provide doGet() handler rendering index/home HTML structure.
   - Implement apiGetInitialData(), apiSaveRecord(), and apiSyncAll() methods.
2. Dual Database Engine:
   - Primary: Supabase REST API (PostgreSQL) using standard fetch calls.
   - Backup: Google Spreadsheet containing dedicated sheets for Students, 
     Teachers, Batches, Attendance, Marks, Materials, and Settings.
3. Client-Side State Engine:
   - Store loaded data in an in-memory reactive object 'state'.
   - Implement optimistic UI updates with immediate feedback to user.
   - Support seamless offline fallback when network is interrupted.
```

---

### PROMPT 02: Role-Based Authentication & Session Guard
```text
SYSTEM ROLE: Web Security & IAM Specialist
GOAL: Implement a multi-role authentication system supporting Admin, Teacher, 
and Student/Parent portals.

REQUIREMENTS:
1. Authentication Methods:
   - Admin: Authenticates with adminEmail and adminPassword from settings.
   - Teacher: Phone/email matching active teacher records.
   - Student: Roll Number (e.g. DC-102) and registered mobile number.
2. Session & State Scoping:
   - Save session tokens in sessionStorage.
   - Restrict navigation menu items dynamically based on currentUser.role.
   - Prevent unauthorized URL queries or manual function calls from leaking 
     administrative tools to students.
3. Quick Switcher / Impersonation:
   - Provide a role-switch demo bar for testing each portal persona seamlessly.
```

---

### PROMPT 03: Responsive Sidebar & Mobile Navigation UX
```text
SYSTEM ROLE: UI/UX Frontend Specialist (Tailwind CSS)
GOAL: Create an adaptive, mobile-first responsive navigation sidebar.

REQUIREMENTS:
1. Desktop Layout:
   - Fixed, clean left sidebar displaying all navigation icons and module titles.
   - Seamless transition between active and inactive navigation pills.
2. Mobile View Optimization:
   - Replace traditional close (X) buttons with a modern hamburger toggle icon.
   - Carefully size the sidebar width so menu items and submenu labels are 
     fully visible without horizontal truncation or awkward multi-line breaks.
3. Interactive Profile Header:
   - When tapping the user profile badge in mobile view, expand user identity 
     details (Name, Roll, Batch) and automatically auto-dismiss/hide after 
     2 seconds to preserve screen real estate.
```

---

### PROMPT 04: Student Attendance Register & Interactive Date Picker
```text
SYSTEM ROLE: Frontend & Database Engineer
GOAL: Develop an attendance portal that empowers students to monitor their 
daily attendance history.

REQUIREMENTS:
1. Date Selection:
   - Provide an HTML5 date picker in mobile and desktop view allowing students 
     to inspect attendance records for any historical class date.
2. Color-Coded Indicators:
   - Present (Emerald Green), Absent (Rose Red), Late (Amber Orange).
3. Attendance Statistics:
   - Calculate total classes held, attended classes, and monthly attendance percentage.
4. Security Gating:
   - Ensure a student can only view attendance for their own batch and roll number.
```

---

### PROMPT 05: Strict Batch Scoping for Study Materials & Assignments
```text
SYSTEM ROLE: Cloud Storage & LMS Permissions Engineer
GOAL: Build an isolated study materials repository with strict batch gating.

REQUIREMENTS:
1. Batch Isolation:
   - When a student logs in, filter the study materials collection strictly by 
     their student.batchId.
   - Prohibit students from seeing, searching, or downloading study materials 
     assigned to other batches.
2. Faculty Upload Module:
   - Teachers can upload notes, DPPs (Daily Practice Problems), and assignments 
     by tagging the specific Target Batch and subject.
3. Download Mechanism:
   - Provide direct, secure download links opening authorized resources in new tabs.
```

---

### PROMPT 06: Offline Academic Test & Marks Tracker
```text
SYSTEM ROLE: Academic Evaluation & Analytics Engineer
GOAL: Build an offline test tracking system for classroom minor and grand tests.

REQUIREMENTS:
1. Test Schema:
   - Test Name (e.g. Minor Test #1 - Kinematics & Vectors).
   - Test Date, Batch ID, Maximum Marks, Obtained Score, Topics Covered, Remarks.
2. Real-Time Computation:
   - Automatically calculate percentage, percentile ranks, and letter grades:
     * 85%+ = Grade A+
     * 70%-84% = Grade A
     * 50%-69% = Grade B
     * Below 50% = Grade C
3. Bulk Faculty Entry:
   - Tabular quick-entry interface for teachers to input scores for entire batches.
```

---

### PROMPT 07: Official Academic Report Card Generation (PDF, JPEG, WhatsApp)
```text
SYSTEM ROLE: Document Rendering & Graphic Design Engineer
GOAL: Create an official Academic Report Card modal with multi-channel export.

REQUIREMENTS:
1. Document Aesthetics:
   - Clean, formal layout with the circular Divine Classes emblem logo.
   - Comprehensive student details: Student Name, Roll Number, Parent Name, 
     Batch Name, Academic Session.
   - Test ledger detailing all tests, scores, percentages, and teacher remarks.
   - Cumulative performance metrics (Total Score, Average %, Final Grade).
2. Export Options:
   - Download PDF: Render using html2canvas and a pure-JS raw PDF builder, 
     ensuring sharp fonts and exact dimensions without multi-page bleed.
   - Download JPEG: Direct high-DPI image download via HTML5 Canvas.
   - WhatsApp Share: Action button opening WhatsApp with pre-filled Unicode 
     summary and cloud verification stamp.
   - Direct Print: Print-optimized CSS rules hiding buttons and action controls.
```

---

### PROMPT 08: Digital Verification, Dynamic Admin Signature & Official Seal
```text
SYSTEM ROLE: Security & Document Verification Engineer
GOAL: Implement tamper-evident digital signatures and authenticity verification 
on the student report card.

REQUIREMENTS:
1. Dynamic Director Signature:
   - Dynamically pull the signatory/director name from the configured Admin Name 
     (state.settings.adminName) rather than a hardcoded string.
   - Display an elegant cursive signature font ('Dancing Script') coupled with 
     the official "Director & Academic Head" title.
2. Official Institute Stamp Seal:
   - Render a rotated, circular emerald seal with "DIVINE CLASSES - VERIFIED - 
     ACADEMIC CELL" text and certificate emblem.
3. Tamper-Evident Security Ref ID:
   - Generate unique verification hash: DC-VRF-[ROLL]-[TIMESTAMP_BASE36].
   - Include date and cloud verification notice on both the document and 
     the WhatsApp message.
```

---

### PROMPT 09: Tuition Fee Management & Instant UPI Receipts
```text
SYSTEM ROLE: Financial Systems & Billing Engineer
GOAL: Build a comprehensive coaching fee tracking and receipt generation module.

REQUIREMENTS:
1. Financial Ledger:
   - Track Total Course Fee, Paid Amount, and Balance Due per student.
   - Maintain payment history log with timestamps, mode (UPI/Cash), and reference IDs.
2. Official Fee Receipt:
   - Generate instant, printable fee receipts with unique Receipt No (e.g. DC-REC-XXXXXX), 
     coaching logo, parent details, installment details, and authorized signature.
3. Automated WhatsApp Fee Reminders:
   - One-click trigger sending polite, itemized payment reminders to parents.
```

---

### PROMPT 10: Settings, Institute Customization & UI Stability
```text
SYSTEM ROLE: Frontend Systems & Infrastructure Engineer
GOAL: Construct an administrative configuration console with high stability.

REQUIREMENTS:
1. Institute Profile Configuration:
   - Edit Institute Name, Admin/Director Name, Contact Helpline, Address, and Email.
2. Persistence Engine Switching:
   - Toggle Supabase Cloud integration and Google Sheets Mirroring.
   - Eliminate page jitter, scroll displacement, and unintended reloads when toggles 
     are switched.
3. Cloud Database Connection Tester:
   - Provide a connection diagnostic tool verifying Supabase URL, anon key, and table access.
```

---

### PROMPT 11: Android APK Packaging & Google Play Store Distribution (Planned)
```text
SYSTEM ROLE: Mobile Systems & Android Devops Engineer
GOAL: Package the Divine Classes Web Application into an installable Android APK/AAB 
container compliant with Google Play Store guidelines.

REQUIREMENTS:
1. Container & Packaging Architecture:
   - Use Trusted Web Activity (TWA) with Google's Bubblewrap CLI or Capacitor.
   - Package domain with digital asset links (assetlinks.json) ensuring zero browser URL bar.
   - Implement native hardware back-button listener handling SPA history navigation.
2. Google Play Store Compliance & Cost Architecture:
   - One-time Google Play Console developer account setup ($25).
   - Zero Commission Compliance: Coaching tuition fees are physical educational 
     services exempt from Google Play In-App Billing (IAB) 15-30% cut. Ensure fee payments 
     use direct UPI intent links (tez://, paytmmp://, phonepe://) or banking QR codes.
3. Splash Screen & Push Notifications:
   - Native launch screen displaying the circular Divine Classes emblem.
   - Firebase Cloud Messaging (FCM) integration to trigger push alerts on mobile devices 
     for attendance status, test scores, and material releases.
```

---

### PROMPT 12: Multi-Subject Sectional Scoring & CBT Mock Exam Engine (Planned)
```text
SYSTEM ROLE: Academic Testing & EdTech Algorithm Engineer
GOAL: Extend the offline marks tracker into a multi-subject sectional evaluation engine 
and timed Computer-Based Testing (CBT) portal.

REQUIREMENTS:
1. Multi-Subject (PCM/PCB) Grouping:
   - Support test entries partitioned into Physics, Chemistry, and Mathematics/Biology.
   - Render sectional bar charts on the student report card showing subject mastery.
2. Comparative Batch Analytics:
   - Compute percentile curves, batch ranks, and subject toppers automatically.
3. CBT Mock Test Portal:
   - Timed online practice test interface with countdown clock and question status palette 
     (Answered, Marked for Review, Unvisited).
   - Instant score computation applying JEE/NEET marking scheme (+4 for correct, -1 for wrong).
```

---

### PROMPT 13: Universal Teacher Batch Enrollment, Offline Marks & Faculty Profile Architecture
```text
SYSTEM ROLE: Full-Stack RBAC & Educational Workflow Specialist
GOAL: Empower coaching faculty with institute-wide batch access, offline marks tracking, and self-service profile management.

REQUIREMENTS:
1. Universal Batch Visibility & Student Enrollment:
   - All institute coaching batches are visible to teachers, with assigned batches highlighted with an emerald badge (★ My Assigned Batch).
   - Any teacher can enroll students into any coaching batch via "+ Add Student" on batch cards or "+ Add Student to Any Batch" header button.
   - Support both existing student directory selection and brand-new student registration with auto-generated Roll Number and batch association.
2. Offline Test Marks & Grading:
   - Teachers can log new offline tests, select target batches, enter student marks and remarks, and trigger "Save All Marks" bulk synchronization.
   - Batch performance statistics (average score, highest mark, progress bar) calculate in real time.
3. Faculty Profile Privacy & Mentor Grid:
   - Logged-in teacher sees their personal profile card at the top with self-service bio/qualifications/experience/photo edit tools and Faculty ID Card generation.
   - Administrative modification buttons on fellow faculty are hidden.
   - Other institute mentors are displayed in read-only format with doubt booking buttons hidden.
4. Clean White-Label Faculty Workspace:
   - Maintain a clean, professional "Faculty Portal" banner without negative or intrusive restrictions.
```

---

### PROMPT 14: Google Apps Script HTML Pre-Processor & Lexer Defense
```text
SYSTEM ROLE: Google Apps Script Compiler & Syntax Hardening Specialist
GOAL: Prevent silent code deletion caused by GAS HTML comment stripping lexer bugs.

REQUIREMENTS:
1. The Comment Stripper Collision:
   - Google Apps Script's HTML compiler strips comments from <script> tags before evaluation.
   - The compiler lexer does not treat ES6 template literals (backticks) as strings.
   - Never place accept="image/*" inside backticks, as '/*' is misidentified as a block 
     comment start, silently erasing subsequent code until the next '*/'.
   - Use explicit MIME types: accept="image/jpeg,image/png,image/webp".
2. Safe URL Template Literals:
   - Never write `https://wa.me/...` inside backticks, as '//' is misidentified as a line 
     comment, truncating the rest of the line and causing SyntaxError.
   - Use standard quoted string concatenation: 'https://wa.me/' + phone + '?text=' + msg.
```

---

## 4. Operational Playbook & Best Practices

### 4.1 Deployment Workflow
```bash
# Push latest changes to Google Apps Script
clasp push -f

# Verify deployment status
clasp status

# Open web app in browser
clasp open --webapp
```

### 4.2 Security & Quality Checklist
- [x] Input sanitization via `escapeHtml()` across all DOM insertions.
- [x] Strict batch isolation enforced for both attendance and study material downloads.
- [x] Dynamic admin name resolution on all generated credentials and certificates.
- [x] No external CDN dependencies for PDF generation (`buildSingleImagePdf`).
- [x] Responsive on desktop, tablet, and mobile browsers (with PWA/APK wrapping support).
- [x] Documented roadmap prompts for TWA/APK packaging (Prompt 11) and multi-subject CBT scoring (Prompt 12).
- [x] Multi-device live synchronization (4s polling + visibilitychange/focus) active between desktop and mobile APK.
- [x] Complete client white-labeling: all end-user views shielded with "Cloud" branding and `fa-cloud` iconography.
- [x] Admin master password persistently tracked in Cloud with plaintext eye toggle in Developer Settings for recovery.
- [x] Handover dummy data clearance purges seed notifications and sets badge to 0 while preserving client records and links.

### 4.3 Multi-Device Synchronization & White-Label Architecture
1. **Live Synchronization (`startSupabaseLiveSync`)**:
   - Web application and Android APK continuously poll `settings_config` and data entities every 4 seconds.
   - Immediate reactive synchronization triggers whenever the application regains focus or visibility (`visibilitychange`).
   - Changes applied on a laptop browser appear instantaneously on mobile APK devices without manual reloads.
2. **Client-Facing Cloud White-Labeling**:
   - All end-user notifications, toasts, status badges, and settings cards use clean **"Cloud"** terminology and cloud icons (`fa-solid fa-cloud`).
   - Technical infrastructure names ("Google Sheet", "Google Sheets", "spreadsheet", "Supabase", "GSheet") are strictly eliminated from user-facing surfaces.
3. **Master Admin Password Tracking**:
   - Master admin password changes are automatically mirrored to Cloud storage (`settings_config`, `db_json`, Google Sheets `Settings_Config`).
   - Lead Developer (`anil.chahar170@gmail.com`) can view the current password via the eye toggle in the Settings Console to assist the institute admin.
4. **Handover Clearance with Notification Purge**:
   - Permanent dummy clearance wipes demo students, batches, materials, tests, teachers, gallery, and feedbacks.
   - Clears all dummy notifications from memory and Cloud database, resetting the notification counter to zero.
   - External study links, settings configuration, and genuine client entries are protected permanently.
