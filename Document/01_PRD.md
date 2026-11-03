# Product Requirements Document (PRD)
# Divine Classes — Next-Generation Coaching ERP & Learning Management System

---

## Document Control & Metadata
- **Product Name**: Divine Classes Web ERP & Student-Parent LMS
- **Target Audience**: Coaching Institutes, Students (JEE/NEET/CBSE), Parents, Faculty, Administrators
- **Version**: 2.6.0 (Enterprise Faculty & Batch Release)
- **Deployment Platform**: Google Apps Script (GAS) Web App + Supabase (PostgreSQL 15) + Google Sheets + Android APK (Planned)
- **Active Deployment ID**: `AKfycbySJOW4-AlwDHziPVoLCsz-X3LAf9CWurzGsJtyyxa4qIi7n9yh-A3lLatRUsOaN_sf` (@57)
- **Live Web App URL**: `https://script.google.com/macros/s/AKfycbySJOW4-AlwDHziPVoLCsz-X3LAf9CWurzGsJtyyxa4qIi7n9yh-A3lLatRUsOaN_sf/exec`
- **Author**: Antigravity AI Engineering Team on behalf of Divine Classes Leadership
- **Status**: Production Ready / Approved

---

## 1. Executive Summary & Product Vision

### 1.1 Vision Statement
To provide Divine Classes with an intuitive, unified, tamper-evident Academic ERP and Student-Parent Portal that eliminates administrative friction, enforces strict batch-level privacy, automates fee tracking, and delivers official, digitally-signed academic performance cards across PDF, JPEG, and WhatsApp.

### 1.2 Core Business Objectives
1. **Zero-Friction Administration**: Centralize student onboarding, fee collections, faculty batch assignments, and study materials into a single responsive portal.
2. **Strict Batch-Level Isolation**: Ensure students can strictly view and download only the materials, attendance, and tests corresponding to their assigned batch.
3. **Automated Academic Credentials**: Generate official Academic Progress Report Cards featuring dynamic director signatures, verifiable tamper-evident hashes, and one-click WhatsApp dispatches.
4. **Dual-Database Resilience**: Guarantee uninterrupted operations with primary Supabase PostgreSQL cloud persistence paired with Google Sheets failover/mirroring.
5. **Cross-Platform Accessibility**: Support progressive web deployment with future native Android APK packaging for Google Play Store distribution.
6. **White-Label Client Shielding**: Completely shield technical database names ("Google Sheet", "Supabase") from admin, teacher, and student users using unified "Cloud" terminology and cloud iconography.
7. **Instant Multi-Device Live Synchronization**: Real-time 4-second polling and visibility-aware bi-directional synchronization ensuring settings and record modifications instantly reflect between laptop and mobile APK.
8. **Admin Master Password Tracking & Recovery**: Persistent cloud synchronization of master administrator passwords, allowing lead developers (`anil.chahar170@gmail.com`) to assist and restore credentials on demand.

---

## 2. User Personas & Role-Based Access Control (RBAC)

### 2.1 Persona Breakdown
```
                                 ┌─────────────────────────────────┐
                                 │       ROLE-BASED HIERARCHY      │
                                 └────────────────┬────────────────┘
                                                  │
          ┌───────────────────────────────────────┼──────────────────────────────────────┐
          │                                       │                                      │
          ▼                                       ▼                                      ▼
┌───────────────────┐                   ┌───────────────────┐                  ┌───────────────────┐
│   ADMINISTRATOR   │                   │  FACULTY/TEACHER  │                  │  STUDENT / PARENT │
├───────────────────┤                   ├───────────────────┤                  ├───────────────────┤
│ • Full CRUD       │                   │ • Scoped Batches  │                  │ • View Own Batch  │
│ • Global Settings │                   │ • Daily Register  │                  │ • Personal Ledger │
│ • Fee Collection  │                   │ • Marks Entry     │                  │ • Batch Downloads │
│ • DB Sync Engine  │                   │ • Study Uploads   │                  │ • Official Card   │
└───────────────────┘                   └───────────────────┘                  └───────────────────┘
```

### 2.2 Permissions Matrix

| Feature / Module | Administrator | Teacher / Faculty | Student / Parent |
| :--- | :---: | :---: | :---: |
| **System Settings & Institute Profile** | Full Edit | Read-Only / Hidden | Hidden |
| **Database Sync (Supabase / Sheets)** | Full Control | Hidden | Hidden |
| **Batch Management & Student Roster** | Full CRUD | **Assigned Batches + Add/Enroll Students** | View Own Batch |
| **Faculty Portal Workspace Banner** | Admin Mode | **Faculty Portal Badge (Clean Workspace)** | Hidden |
| **Attendance Register Taking** | Mark / Override | Mark for Assigned Batch | View Only (Own) |
| **Historical Attendance by Date** | All Batches | Assigned Batches | Own Record Only |
| **Offline Test Marks Entry** | Full CRUD | Enter for Assigned Batch | View Only (Own) |
| **Study Materials Upload** | Full Access | Target Batch Upload | Prohibited |
| **Study Materials Download** | All Materials | All Materials | **Only Assigned Batch** |
| **Fee Collection & Receipts** | Record & Print | View Summary | View & Print Own |
| **Official Academic Report Card** | Generate All | Generate Assigned | Generate & Share Own |
| **WhatsApp Dispatches** | Unlimited | Scoped | Self / Parent |
| **Push Notifications (Mobile App)** | Broadcast All | Batch Broadcast | Receive Personal |

---

## 3. Functional Requirements & Module Specifications

### Module 1: Authentication & Session Management
- **FR-1.1**: The system must provide three distinct login flows:
  - *Admin Login*: Requires configured `adminEmail` and `adminPassword`.
  - *Teacher Login*: Matches verified teacher phone/email with active teacher records.
  - *Student Login*: Authenticates with Student Roll Number (e.g. `DC-102`) and registered mobile phone or password.
- **FR-1.2**: Active sessions must persist securely in `sessionStorage` and survive page refreshes.
- **FR-1.3**: When logged in as a student, the navigation menu must automatically suppress administrative modules (Fees, Settings, Teacher directory management).
- **FR-1.4**: Provide a Developer/Demo Quick-Switch bar to effortlessly switch between personas during administrative reviews.

### Module 2: Responsive Navigation & Mobile Ergonomics
- **FR-2.1**: The sidebar navigation must adapt gracefully across Mobile (< 640px), Tablet (640px - 1024px), and Desktop (> 1024px).
- **FR-2.2**: The mobile sidebar toggle must use an intuitive hamburger icon, replacing obsolete "X" close buttons.
- **FR-2.3**: Sidebar width in mobile and desktop views must ensure all menu titles and badge counts are completely visible without horizontal truncation or awkward wrapping.
- **FR-2.4**: Tapping the student/teacher identity profile chip in mobile view must expand user details and automatically auto-dismiss after 2 seconds to keep the screen uncluttered.

### Module 3: Student Attendance Register & Interactive Date Picker
- **FR-3.1**: Faculty must be able to mark daily attendance with one-click toggles (`Present [P]`, `Absent [A]`, `Late [L]`).
- **FR-3.2**: In mobile and desktop student portals, students must have an interactive HTML5 date picker to view attendance records for any selected calendar date.
- **FR-3.3**: The attendance dashboard must calculate cumulative statistics:
  - Total Classes Conducted
  - Classes Attended
  - Real-time Attendance Percentage with visual status badges (Green >= 85%, Amber 70-84%, Red < 70%).

### Module 4: Batch Management, Faculty Assignment & Student Enrollment
- **FR-4.1**: Students must only see information pertaining to their enrolled batch (e.g., *JEE Advanced Target 2027 (Alpha Batch)*).
- **FR-4.2**: **Teacher Institute Batch Visibility**:
  - Teachers logged in with their faculty profile can view all coaching batches across the institute to facilitate cross-batch mentoring and batch transfers.
  - Batches led by the teacher display an emerald indicator: `My Assigned Batch`, while all batches remain accessible.
- **FR-4.3**: **Teacher Student Enrollment into Any Batch**:
  - Teachers can click `+ Add Student` on any batch card or the global `+ Add Student to Any Batch` action to open the Enrollment Modal with two distinct workflows:
    - *Option 1 (Existing Directory)*: Select any registered institute student and enroll them into any selected batch with 1 click.
    - *Option 2 (New Admission)*: Enroll a brand-new student directly into any target batch with auto-generated Roll Number, student details, contact info, and profile image.
- **FR-4.4**: The Study Materials repository must enforce strict batch gating:
  - Material cards tagged with `batchId` must only render for students enrolled in that specific `batchId`.
  - Material download links for other batches must be completely blocked and inaccessible.
- **FR-4.5**: Faculty members can upload PDFs, assignments, and Daily Practice Problems (DPPs) with subject, topic, and batch tags.

### Module 5: Offline Academic Marks Tracker & Bulk Grading
- **FR-5.1**: Record offline minor, weekly, and grand test results including Test Title, Test Date (via HTML5 date picker), Target Batch ID, Maximum Marks, Obtained Score, and Mentor Remarks.
- **FR-5.2**: The system must compute real-time analytics:
  - Subject-wise score breakdown and batch average vs. highest score.
  - Cumulative score and percentage progress bar.
  - Automated grade assignment ($A+ \ge 85\%$, $A \ge 70\%$, $B \ge 50\%$, $C < 50\%$).
- **FR-5.3**: Real-time validation preventing entered marks from exceeding maximum possible marks.
- **FR-5.4**: Faculty bulk grading support allowing teachers to input scores for all students in a batch and commit in 1 click via **Save All Marks**, with immediate Google Sheets synchronization.
- **FR-5.5**: Multi-batch filtering enabling faculty to seamlessly toggle between assigned batches or view all institute tests.

### Module 6: Faculty Self-Profile & Mentor Directory Architecture
- **FR-6.1**: **Teacher Self-Profile Parity**: When a teacher logs in, they see their own profile prominently:
  - Dedicated "My Faculty Profile" banner at the top of the Teacher Profiles view.
  - Dashboard profile card showing Faculty Name, Subject, Experience, Qualification, and one-click access to their official Faculty ID Card.
- **FR-6.2**: **Faculty Self-Management Controls**: Logged-in teachers have dedicated actions to maintain their profile:
  - *Edit My Profile*: Update academic qualifications, teaching experience, specialization, biography, and contact phone.
  - *Update Photo*: Live camera capture or file upload with automatic client-side resizing.
  - *Faculty Identity Card*: Official Divine Classes Faculty ID Card with photo, qualifications, faculty ID, and authorized institute seal.
- **FR-6.3**: **Administrative Isolation & Data Security**:
  - Administrative actions (editing other teachers, changing access status to Blocked/Inactive) are strictly hidden for non-admin teachers.
  - The rest of the faculty roster is displayed as clean, read-only mentor cards just like in student login (showing photo, name, subject, qualification, experience, specialization, and bio).
- **FR-6.4**: **Student Action Separation**: Student-specific controls (such as `Book Doubt Slot`) are exclusively shown to logged-in students, ensuring a clean peer interface for faculty.

### Module 7: Official Academic Report Card & Digital Verification
- **FR-6.1**: Produce an official Academic Progress Report Card with:
  - Circular high-resolution Divine Classes emblem logo (replacing generic icons).
  - Institute header with accreditation details and helpline.
  - Student and parent demographic information.
  - Tabular performance breakdown across all offline tests.
- **FR-6.2**: **Dynamic Signatory & Director Signature**:
  - The signatory name must dynamically pull from `state.settings.adminName` (e.g. *Er. Rajesh Chahar* or the configured administrator).
  - Display an authentic cursive signature font (`Dancing Script`) with title *"Director & Academic Head"*.
- **FR-6.3**: **Authentic Academic Stamp Seal**:
  - Render an emerald circular seal stamp (`DIVINE CLASSES • VERIFIED • ACADEMIC CELL`).
- **FR-6.4**: **Tamper-Evident Security Ref ID**:
  - Generate an immutable verification hash: `DC-VRF-[ROLL]-[TIMESTAMP_BASE36]`.
- **FR-6.5**: **Multi-Format Export**:
  - *Download PDF*: Clean single-image PDF generation without multi-page bleed or external server latency.
  - *Download JPEG*: High-DPI canvas capture.
  - *WhatsApp Share*: Instant trigger opening WhatsApp with official pre-formatted academic summary and verification hash.
  - *Direct Print*: CSS print rules hiding action buttons.

### Module 7: Tuition Fee Tracker & Instant UPI Receipts
- **FR-7.1**: Maintain an audit ledger for course fees, installments paid, and balance due.
- **FR-7.2**: Generate official, printable fee receipts with unique receipt numbers (`DC-REC-XXXXXX`), student details, mode (UPI/Cash), and authorized stamp.
- **FR-7.3**: One-click WhatsApp fee payment reminders dispatched directly to parent contact numbers.

### Module 8: Settings, Database Sync & Configuration Console
- **FR-8.1**: Provide editing of Institute Name, Admin Name, Contact Numbers, Address, and Helplines.
- **FR-8.2**: Support instant toggling between Supabase PostgreSQL and Google Sheets.
- **FR-8.3**: Toggle interactions must execute silently without page jumping, scroll dislocation, or reload disruptions.

---

### Module 9: Mobile App Packaging & Android APK Distribution (Planned Future Phase)
- **FR-9.1: Progressive Web App (PWA) & TWA / Capacitor Container**:
  - Package the web application into an installable native Android `.apk` / `.aab` (Android App Bundle) via Trusted Web Activity (TWA) or Capacitor.
  - Full-screen native experience with zero browser address bar, custom status bar theming (`#4338ca` indigo), and native back-button handling.
- **FR-9.2: Google Play Store Compliance & Cost Architecture**:
  - Requires a standard one-time Google Play Developer registration fee (\$25).
  - **Zero Ongoing Transaction Fees**: Because tuition fee payments are categorized as physical educational services / coaching tuition, payments are processed directly via UPI, Net Banking, or QR codes without being subject to Google Play In-App Billing (IAB) 15-30% service commissions.
- **FR-9.3: Native Push Notifications (Firebase Cloud Messaging - FCM)**:
  - Send direct Android push alerts to parents and students whenever a test score is posted, daily absence is logged, or study material is released.
- **FR-9.4: Offline Asset Caching & Splash Screen**:
  - High-resolution native launch screen displaying the circular Divine Classes emblem and offline asset caching for instant app startups.

---

### Module 10: Advanced Academic Testing, Multi-Subject Batches & Analytics (Planned Future Phase)
- **FR-10.1: Multi-Subject Batch Architecture**:
  - Support granular subject grouping for JEE (Physics, Chemistry, Mathematics) and NEET (Physics, Chemistry, Biology) with subject-specific faculty mentors.
- **FR-10.2: Granular Sectional Test Scoring**:
  - Capability to record multi-part test scores (e.g., Grand Test #1: Physics 85/100, Chemistry 90/100, Math 95/100 = Total 270/300) and render sectional performance progress bars on report cards.
- **FR-10.3: Comparative Batch Percentiles & Rank Curves**:
  - Automated calculation of Batch Rank, Overall Rank, and Percentile rankings to provide actionable feedback before board and entrance exams.
- **FR-10.4: Computer-Based Test (CBT) Engine with Timer**:
  - Timed online mock test interface featuring auto-submit, negative marking calculations (-1 for incorrect answers in JEE/NEET patterns), and instant solution key releases.

---

## 4. Non-Functional Requirements (NFR)

1. **Performance & Latency**: Initial SPA load time $< 1.5$ seconds; optimistic UI mutations respond in $< 100\text{ ms}$.
2. **Reliability & Availability**: $99.9\%$ operational uptime backed by Google Apps Script infrastructure and Supabase cloud.
3. **Security & Sanitization**:
   - Zero unsanitized DOM insertions; all dynamic strings pass through `escapeHtml()`.
   - Batch-level data isolation preventing student cross-batch inspection.
   - Row-Level Security (RLS) active on Supabase tables.
4. **Mobile Responsiveness**: Complete touch support across iOS Safari, Android Chrome, and PWA/Web-APK wrappers.
5. **Zero External Dependency PDF**: Raw client-side binary stream PDF compilation eliminates third-party CDN downtime risks.

---

## 5. Release Roadmap & Milestones

| Phase | Milestone | Scope / Deliverables | Status |
| :---: | :--- | :--- | :---: |
| **Phase 1** | **Core Architecture & Storage** | Google Apps Script SPA setup, Supabase PostgreSQL REST integration, Google Sheets fallback engine, optimistic state machine. | ✅ **Completed** |
| **Phase 2** | **Academic Operations & Billing** | Attendance register, offline test marks engine, tuition fee billing ledger, UPI receipts. | ✅ **Completed** |
| **Phase 3** | **Mobile UI & Batch Privacy** | Mobile hamburger navigation, responsive sidebar, 2-sec auto-collapsing profile chip, strict batch-level study material isolation. | ✅ **Completed** |
| **Phase 4** | **Official Verifiable Report Card** | Circular Divine Classes emblem logo, dynamic Director signature (`state.settings.adminName`), emerald academic seal, verification hash, PDF/JPEG export, WhatsApp dispatch. | ✅ **Completed** |
| **Phase 5** | **Cloud White-Label & Real-Time Sync** | 4-second live bi-directional sync (Laptop $\leftrightarrow$ Mobile APK), 9-table cloud sync, notification purge on dummy wipe, Admin master password cloud tracking, unified "Cloud" branding. | ✅ **Completed** |
| **Phase 6** | **Android APK & Store Readiness** | TWA / Capacitor packaging, Play Store developer setup (\$25 one-time), splash screen, APK compilation (Planned). | ⏳ **Planned** |
| **Phase 7** | **Multi-Subject Sectional Analytics** | Granular PCM/PCB score breakdown, comparative batch percentiles, batch topper recognition (Planned). | ⏳ **Planned** |
| **Phase 8** | **Online CBT Mock Test Engine** | Timed examination portal with negative marking, question palettes, and automated answer explanations (Planned). | ⏳ **Planned** |
