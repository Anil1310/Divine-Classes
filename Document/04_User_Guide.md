# Divine Classes — Complete User & Operations Guide
## Step-by-Step Instructions for Administrators, Faculty, Students & Parents

---

## 📌 Table of Contents
1. [General Overview & System Access](#1-general-overview--system-access)
2. [Administrator & Director Guide](#2-administrator--director-guide)
3. [Teacher & Faculty Guide](#3-teacher--faculty-guide)
4. [Student & Parent Guide](#4-student--parent-guide)
5. [Report Card Generation & Verification Guide](#5-report-card-generation--verification-guide)
6. [Fee Management & UPI Receipts](#6-fee-management--upi-receipts)
7. [System Settings & Database Maintenance](#7-system-settings--database-maintenance)
8. [Troubleshooting & FAQs](#8-troubleshooting--faqs)

---

## 1. General Overview & System Access

The **Divine Classes Web App** runs in any web browser on smartphones, tablets, laptops, and desktops.

### Web App Access URL
Open the active Google Apps Script Web App URL:
```text
https://script.google.com/macros/s/AKfycbySJOW4-AlwDHziPVoLCsz-X3LAf9CWurzGsJtyyxa4qIi7n9yh-A3lLatRUsOaN_sf/exec
```

### The Quick Persona Switcher (For Testing & Demo)
At the top of the interface, a demo/switch pill bar lets you switch between personas instantly:
- Click **Admin** to manage institute operations.
- Click **Teacher** to test faculty tools.
- Click **Student (Priya Patel)** to experience the student portal.

---

## 2. Administrator & Director Guide

### 2.1 Logging In as Administrator
1. Click the **Profile / Login** button in the header.
2. Select **Admin Portal**.
3. Enter your configured **Admin Email** and **Password** (defaults: `admin@divineclasses.in` / `admin123`).
4. Click **Sign In as Administrator**.

### 2.2 Managing Batches & Student Rosters
1. Navigate to **Batches & Students** from the sidebar.
2. **Create a Batch**:
   - Click `+ Add Batch`.
   - Enter Batch Name (e.g., *Alpha Batch (JEE Target 2026)*), target subjects (PCM/PCB), and assign a faculty mentor.
3. **Enroll a Student**:
   - Click `+ Add Student`.
   - Input Roll Number (e.g. `DC-102`), Student Name, Contact Number, Parent Name, Total Agreed Fee, and select the Target Batch.
   - Click **Save Student**.

### 2.3 Recording Tuition Fee Payments
1. Go to the **Fee Management** module.
2. Search for the student by Name or Roll Number.
3. Click **Record Payment**:
   - Enter Amount Paid (₹).
   - Select Payment Mode (`UPI`, `Cash`, `Bank Transfer`).
   - Enter Transaction / Reference ID.
4. Click **Record & Print Receipt** to generate an official tuition fee receipt immediately.

### 2.4 Managing Faculty & Teachers
1. Open the **Teachers** module.
2. Click `+ Add Faculty`.
3. Fill in Faculty Name, Subject, Qualifications (e.g. *Ex-IITian / Senior Faculty*), Phone, and Batch assignments.

---

## 3. Teacher & Faculty Guide

### 3.1 Logging In as Teacher
1. Open the login modal and choose **Teacher Login**.
2. Enter your registered Phone or Email (e.g. `rajesh.chahar@divineclasses.in` or `+91 95556 78753`).
3. Enter your password (default: `teacher123`).
4. Upon login, the top notification banner greets you with an emerald **Faculty Portal** badge:
   > *"Teacher Mode Active: Welcome to your faculty workspace. You can manage your assigned batches, student attendance, assignments, and test marks."*

### 3.2 Managing Institute Batches & Enrolling Students
1. Navigate to **Batches & Students** from the sidebar.
2. All institute coaching batches are visible, with batches led by your profile marked with an emerald indicator: `My Assigned Batch`.
3. To add a student to any batch, click the **+ Add Student** button on that batch card or click the top **+ Add Student to Any Batch** button:
   - **Option 1: Select from Existing Institute Directory**
     - Select target batch and choose any registered student not yet in that batch.
     - Click **Add Selected Student** to enroll them instantly.
   - **Option 2: Enroll Brand New Student**
     - Enter the student's **Full Name**, **Mobile Number**, and **Parent/Guardian Name**.
     - Optionally upload a profile photo (`.jpg`, `.png`, `.webp`).
     - Click **Enroll & Add to Batch**. The student is assigned a unique Roll Number, enrolled into the batch, and synced across all cloud databases.

### 3.3 Taking Daily Class Attendance
1. Click **Attendance** from the navigation sidebar.
2. Select your assigned batch from the batch dropdown.
3. The student roster for that batch will load.
4. Click the attendance status pills for each student:
   - 🟢 **P**: Present
   - 🔴 **A**: Absent
   - 🟡 **L**: Late
5. Click **Submit Attendance Register** to save.

### 3.4 Entering Offline Test Scores
1. Navigate to **Offline Marks Tracker** from the navigation sidebar or dashboard.
2. **Filter by Batch**: Use the **Batch Filter** dropdown to view tests for a specific coaching batch (defaults to your assigned batch) or select *All Batches*.
3. **Log a New Offline Test**:
   - Click `+ Log New Offline Test` (or `+ Create First Offline Test` if starting fresh).
   - Select the **Target Coaching Batch**, enter the Test Title, Subject, select the test date using the **HTML5 Date Picker**, and configure Maximum Marks (default 100).
   - Click **Create Test Record**.
4. **Grading Students**:
   - **Single Student Save**: Enter the marks and mentor remarks for any student, then click **Save**.
   - **Bulk 1-Click Save**: Enter marks and remarks for all students in the roster simultaneously, then click **Save All Marks** at the top right of the scoreboard.
5. The system automatically computes percentage progress, batch average, highest score, updates the student PTM report card, and syncs directly to Google Sheets and local storage.

### 3.5 Uploading Study Materials & DPPs
1. Go to **Assignments & DPPs**.
2. Click `Upload Study Material`.
3. Choose the **Target Batch** (strictly scoped so other batches cannot access it).
4. Enter Title, Subject, Topic, and paste the Google Drive or PDF link.
5. Click **Publish Material**.

### 3.6 Accessing Your Faculty Profile & Identity Card
1. Your profile is accessible right at the top of your workspace:
   - Click your **User Profile Badge** in the top navigation header (one of the 4 streamlined header controls: Sync, Theme, Bell, and Profile), or
   - Click **My Faculty Profile & Reviews** in your top role banner.
2. **View & Edit Your Profile**:
   - View your credentials, qualifications, subjects, contact phone, and student/parent reviews received.
   - Click `Edit Photo` to capture a live photo or upload an image.
   - Click `Faculty ID Card` to view and print your official Divine Classes Identity Card with institute seal.
3. **Peer Isolation**:
   - Other teachers' profiles are not cluttering your sidebar; your faculty tools are streamlined and focused directly on your teaching activities.

---

## 4. Student & Parent Guide

### 4.1 Logging In as Student / Parent
1. Select **Student / Parent Mode** on the login screen.
2. Enter your **Roll Number** (e.g., `DC-102`).
3. Enter your registered **Mobile Number** or password (default: `student123`).
4. Click **Sign In to Student Portal**.
5. The workspace features a streamlined top header with exactly 4 controls: Cloud Sync, Dark/Light Theme toggle, Notifications Bell, and your Student Profile Badge.

### 4.2 Checking Historical Attendance by Date
1. Navigate to **Attendance**.
2. Select any **Month** from the dropdown filter (e.g., *October 2026*).
3. View your overall attendance percentage and day-by-day record (`P`, `A`, `L`).

### 4.3 Downloading Batch Study Materials
1. Navigate to **Study Materials**.
2. Only materials designated for your enrolled batch will be visible.
3. Click **Download / Open PDF** to open the assignment or DPP.

### 4.4 Viewing Offline Test Marks & Progress Card
1. Navigate to **Marks Tracker**.
2. Inspect your scores, maximum marks, percentage, and teacher remarks.
3. Click **Print Report Card** to view and download your verified Academic Report Card.

### 4.5 Submitting Teacher & Faculty Feedback
1. Click **Faculty & Feedback** in the role banner.
2. Browse active faculty mentor profiles and their doubt-clearing timings.
3. Select your teacher from the dropdown, give a **1 to 5 star rating**, choose a category (Teaching Quality, Doubt Resolution, Punctuality), and write your constructive comments.
4. Click **Submit Feedback to Institute** to record your review.
1. On mobile or laptop, tap **Attendance** in the menu.
2. You will see your batch attendance summary (Present %, Total Classes).
3. **To check a specific date**:
   - Use the **Date Picker** calendar input.
   - Pick any day on the calendar to see if you were marked Present, Absent, or Late with the teacher's time stamp.

### 4.3 Downloading Batch-Specific Study Materials
1. Tap **Assignments & DPPs** in the menu.
2. You will strictly see only materials uploaded for **your enrolled batch**.
3. Tap **Download PDF** on any material card to open or download the practice problem sheet.

### 4.4 Viewing Fee Receipts
1. Open the student fee summary section on your dashboard.
2. Tap **Print / View Receipt** to inspect your paid installments, balance due, and official receipt with the institute emblem.

---

## 5. Report Card Generation & Verification Guide

### 5.1 How to Open the Academic Report Card
1. Navigate to **Offline Marks Tracker** (or student dashboard).
2. Click the purple **🎓 Print / View Report Card** button next to your name.

### 5.2 What the Report Card Contains:
- **Institute Emblem Logo**: Official circular Divine Classes badge.
- **Accreditation Header**: Premier coaching for JEE (Advanced) • NEET-UG • CBSE Boards.
- **Student Demographics**: Name, Roll Number, Parent Name, Batch, Helpline.
- **Performance Ledger**: Complete list of offline tests, scores, max marks, percentages, and teacher remarks.
- **Cumulative Grade**: Automatically calculated overall percentage and grade ($A+, A, B, C$).
- **Official Seal**: Rotated emerald academic cell verification stamp.
- **Dynamic Director Signature**: Cursive signature dynamically matched to the active **Admin Name** (`state.settings.adminName`).
- **Security Hash**: Immutable verification ID (e.g. `DC-VRF-DC102-M4Z8`).

### 5.3 Exporting & Sharing the Report Card
At the bottom of the report card modal, click any of the action buttons:
1. **📥 Download PDF**: Generates a high-resolution, pixel-perfect single-page PDF saved directly to your downloads folder.
2. **🖼️ Download JPEG**: Downloads a high-DPI image copy suitable for gallery viewing.
3. **🖨️ Print Report Card**: Opens your system print dialog for physical printing on A4 paper.
4. **💬 Share on WhatsApp**: Opens WhatsApp with a pre-formatted message summary containing marks, grade, verification hash, and signature to send directly to parents or mentors.

---

## 6. Fee Management & UPI Receipts

### 6.1 Recording a Payment:
1. As Admin, open **Fee Management**.
2. Click **Record Payment** on the student's row.
3. Choose Payment Mode: `UPI`, `Cash`, `Bank Transfer`, or `Cheque`.
4. Enter the Transaction/UTR number.

### 6.2 Generating Receipt:
- Click **Print / View Receipt** on any student row.
- The receipt includes the coaching logo, student roll number, breakdown of course fees, total paid, balance due, and authorized signatory.

---

## 7. System Settings & Database Maintenance

### 7.1 Updating Institute & Director Name
1. Click **Settings** from the Admin navigation.
2. **Institute Name**: Change from `Divine Classes` if needed.
3. **Admin Name**: Enter the Director / Academic Head's name (e.g. `Er. Rajesh Chahar`).
   > *Note: Changing this automatically updates the digital signature on all report cards.*
4. **Helpline & Address**: Update contact phone numbers and institute address.
5. Click **Save Settings**.

### 7.2 Cloud Database & Real-Time Sync
- **Primary Cloud Database**: Manages live, secure cloud storage for students, batches, tests, materials, gallery, and settings.
- **Cloud Mirror Backup**: When enabled, copies data to the secondary backup ledger automatically.
- **Sync with Cloud Button**: Tapping the **Cloud icon** (`<i class="fa-solid fa-cloud"></i>`) in the top navigation manually triggers an instant cloud sync and badge refresh (`✓ Cloud Synced`).
- **Live Multi-Device Sync**: Settings or records edited on a desktop or laptop browser appear automatically on mobile APKs within 4 seconds or when resuming the app.

### 7.3 Master Admin Password & Developer Recovery
- Administrators can update their master login password at any time via **Access Control** or **Settings**.
- Whenever changed, the new password is automatically saved to the Cloud database.
- The Lead Developer console features an **eye toggle** next to the Master Admin Password field, allowing the developer to reveal the plaintext password and assist the administrator if forgotten.

### 7.4 Client Handover & Permanent Demo Data Clearance
- **Create Dummy Data**: Initializes standard demo records and tables for walkthroughs and testing.
- **Clear Dummy Data**: Permanently removes all sample students, batches, tests, and demo notifications (clearing notification badges to 0).
- **Protected Permanently**: All genuine client records, external study links, and institute configuration settings remain safely intact forever.

---

## 8. Troubleshooting & FAQs

### Q1: Why is my student attendance screen blank?
**A**: Ensure your student account has an assigned `batchId`. When logged in as a student, the register automatically filters by your batch. If you are newly enrolled, verify your batch assignment in the Admin portal.

### Q2: Why can't I see study materials from other batches?
**A**: This is an intentional security and privacy feature. The system strictly scopes study materials so each student only sees resources uploaded for their specific batch.

### Q3: How do I change the Director's name on the report card?
**A**: Go to **Settings** $\rightarrow$ **Admin Name**, edit the name, and click Save. The signature and printed title will update immediately across all report cards.

### Q4: How do I save the report card as a PDF on my smartphone?
**A**: Tap the **Download PDF** button at the bottom of the report card modal. Your smartphone will save the `.pdf` file directly to your Files / Downloads folder.

### Q5: How can I recover the Admin password if it is forgotten?
**A**: Master admin passwords are saved securely to the Cloud. The Lead Developer (`anil.chahar170@gmail.com`) can inspect the password via the eye toggle in the Settings Console and restore access for the administrator.

### Q6: If I change a setting on my computer, will it update on my phone?
**A**: Yes. The system runs an automated bi-directional live sync loop every 4 seconds. Any update made on a computer browser is instantly pushed to the mobile APK as soon as the app is opened or focused.

