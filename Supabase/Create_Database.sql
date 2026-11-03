-- ============================================================================
-- DIVINE CLASSES - CLEAN SUPABASE SCHEMA & SEED DATA
-- Fully aligned with Frontend UI & Backend Google Apps Script Models
-- ============================================================================

-- 1. DYNAMICALLY & SAFELY CLEAN UP ANY OLD TABLES OR VIEWS
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop views first to avoid dependency blocks
    FOR r IN (
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'batches_roster', 'students_master', 'teachers_roster', 'settings',
            'attendance_register', 'materials_repository', 'offline_test_marks',
            'gallery_banners', 'external_links_hub', 'feedback_responses', 'app_data',
            'batches', 'students', 'teachers', 'materials', 'offline_tests',
            'gallery', 'external_links', 'feedbacks', 'notifications', 'settings_config', 'db_json'
          )
    ) LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;

    -- Drop tables
    FOR r IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name IN (
            'batches_roster', 'students_master', 'teachers_roster', 'settings',
            'attendance_register', 'materials_repository', 'offline_test_marks',
            'gallery_banners', 'external_links_hub', 'feedback_responses', 'app_data',
            'batches', 'students', 'teachers', 'materials', 'offline_tests',
            'gallery', 'external_links', 'feedbacks', 'notifications', 'settings_config', 'db_json'
          )
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;
END $$;

-- 2. CREATE CORE TABLES MATCHING FRONTEND DATA MODEL

-- BATCHES
CREATE TABLE public.batches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT,
    schedule TEXT,
    room TEXT,
    teacher TEXT,
    student_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE public.students (
    id TEXT PRIMARY KEY,
    roll TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    parent_name TEXT,
    total_fee NUMERIC(12,2) DEFAULT 0,
    paid_fee NUMERIC(12,2) DEFAULT 0,
    monthly_fee NUMERIC(12,2) DEFAULT 1000,
    admission_date TEXT,
    due_date TEXT DEFAULT 'Fully Paid',
    last_reminder TEXT DEFAULT '-',
    monthly_paid_this_cycle NUMERIC(12,2) DEFAULT 0,
    payment_history JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Active',
    batch_id TEXT,
    photo TEXT,
    password TEXT DEFAULT 'password123',
    is_dummy BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEACHERS
CREATE TABLE public.teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT,
    qualification TEXT,
    experience TEXT,
    email TEXT,
    phone TEXT,
    specialization TEXT,
    bio TEXT,
    avatar_color TEXT DEFAULT 'from-indigo-600 to-blue-600',
    initials TEXT,
    password TEXT DEFAULT 'teacher123',
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MATERIALS
CREATE TABLE public.materials (
    id TEXT PRIMARY KEY,
    batch_id TEXT,
    batch_name TEXT,
    title TEXT NOT NULL,
    category TEXT,
    upload_date TEXT,
    uploaded_by TEXT,
    file_size TEXT,
    downloads INTEGER DEFAULT 0,
    description TEXT,
    download_url TEXT DEFAULT '',
    drive_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OFFLINE TESTS
CREATE TABLE public.offline_tests (
    id TEXT PRIMARY KEY,
    batch_id TEXT,
    title TEXT NOT NULL,
    subject TEXT,
    test_date TEXT,
    max_marks INTEGER DEFAULT 100,
    marks JSONB DEFAULT '{}'::jsonb,
    is_dummy BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GALLERY BANNERS
CREATE TABLE public.gallery (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    date TEXT,
    caption TEXT,
    badge TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXTERNAL STUDY LINKS
CREATE TABLE public.external_links (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    provider TEXT,
    subject TEXT,
    url TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'fa-book-open',
    color TEXT DEFAULT 'bg-blue-600',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEEDBACKS
CREATE TABLE public.feedbacks (
    id TEXT PRIMARY KEY,
    name TEXT,
    message TEXT,
    rating INTEGER DEFAULT 5,
    created_at TEXT,
    batch TEXT,
    role TEXT DEFAULT 'Parent',
    category TEXT DEFAULT 'Teaching Quality',
    read BOOLEAN DEFAULT FALSE,
    created_at_ts TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    time TEXT,
    timestamp BIGINT,
    read BOOLEAN DEFAULT FALSE,
    admin_seen BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'info',
    icon TEXT,
    icon_color TEXT,
    bg_color TEXT,
    action_tab TEXT,
    target_role TEXT DEFAULT 'all',
    material_id TEXT,
    batch_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS CONFIG
CREATE TABLE public.settings_config (
    setting_parameter TEXT PRIMARY KEY,
    configured_value TEXT,
    description TEXT
);

-- DB_JSON (SNAPSHOT CATCH-ALL FOR FULL FAST PERSISTENCE)
CREATE TABLE public.db_json (
    snapshot_key TEXT PRIMARY KEY,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY WITH FULL PUBLIC ACCESS POLICIES
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.db_json ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access" ON public.batches;
CREATE POLICY "Public full access" ON public.batches FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access" ON public.students;
CREATE POLICY "Public full access" ON public.students FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access" ON public.teachers;
CREATE POLICY "Public full access" ON public.teachers FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access" ON public.materials;
CREATE POLICY "Public full access" ON public.materials FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access" ON public.offline_tests;
CREATE POLICY "Public full access" ON public.offline_tests FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access" ON public.gallery;
CREATE POLICY "Public full access" ON public.gallery FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access" ON public.external_links;
CREATE POLICY "Public full access" ON public.external_links FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access" ON public.feedbacks;
CREATE POLICY "Public full access" ON public.feedbacks FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access" ON public.notifications;
CREATE POLICY "Public full access" ON public.notifications FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access" ON public.settings_config;
CREATE POLICY "Public full access" ON public.settings_config FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access" ON public.db_json;
CREATE POLICY "Public full access" ON public.db_json FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);

-- 4. CREATE BACKWARD COMPATIBLE VIEWS (WITH SECURITY INVOKER ENFORCED)
CREATE OR REPLACE VIEW public.batches_roster WITH (security_invoker = true) AS
SELECT 
    id,
    id AS batch_id,
    name,
    name AS batch_name,
    subject,
    subject AS subjects,
    schedule,
    room,
    room AS classroom_hall,
    teacher,
    teacher AS lead_faculty,
    student_ids,
    jsonb_array_length(student_ids) AS student_count
FROM public.batches;

CREATE OR REPLACE VIEW public.students_master WITH (security_invoker = true) AS
SELECT 
    id,
    roll,
    roll AS roll_no,
    name,
    name AS student_name,
    password,
    password AS login_password,
    status,
    status AS access_status,
    parent_name,
    parent_name AS parentName,
    phone,
    phone AS contact_phone,
    total_fee,
    total_fee AS total_fee_inr,
    paid_fee,
    paid_fee AS paid_fee_inr,
    (total_fee - paid_fee) AS pending_dues_inr,
    due_date,
    due_date AS fee_due_date,
    last_reminder,
    last_reminder AS last_reminder_sent,
    admission_date,
    monthly_fee,
    monthly_fee AS monthly_fee_inr,
    batch_id,
    batch_id AS batchId
FROM public.students;

CREATE OR REPLACE VIEW public.teachers_roster WITH (security_invoker = true) AS
SELECT 
    id,
    id AS teacher_id,
    name,
    name AS teacher_name,
    subject,
    email,
    email AS login_email,
    password,
    password AS login_password,
    status,
    status AS access_status,
    phone,
    phone AS contact_phone,
    qualification,
    experience,
    specialization,
    bio,
    initials
FROM public.teachers;

CREATE OR REPLACE VIEW public.settings WITH (security_invoker = true) AS
SELECT 
    setting_parameter AS key,
    jsonb_build_object('value', configured_value) AS value
FROM public.settings_config;

-- 5. SEED COMPLETE MATCHING DATA

-- INSERT BATCHES
INSERT INTO public.batches (id, name, subject, schedule, room, teacher, student_ids) VALUES
('b1', 'JEE Advanced Target 2027 (Alpha Batch)', 'Physics, Chemistry & Mathematics', 'Mon - Fri • 08:00 AM - 12:30 PM', 'Lecture Hall 101 (Smart AC)', 'Er. Rajesh Chahar (Ex-IITian)', '["s1", "s2", "s3", "s4", "s10", "s11"]'::jsonb),
('b2', 'NEET Medical Dropper & Foundation (Bio-Elite)', 'Botany, Zoology, Physics & Chemistry', 'Mon - Sat • 01:30 PM - 06:00 PM', 'Medical Hall 202', 'Dr. Sunita Sharma (M.D. AIIMS)', '["s5", "s6", "s7"]'::jsonb),
('b3', 'Class 10th CBSE Board Excellence & NTSE', 'Science, Mathematics & Social Science', 'Tue, Thu, Sat • 04:30 PM - 07:00 PM', 'Classroom 104', 'Mr. Arvind Verma (M.Sc. Gold Medalist)', '["s8", "s9"]'::jsonb);

-- INSERT STUDENTS
INSERT INTO public.students (id, roll, name, phone, parent_name, total_fee, paid_fee, monthly_fee, due_date, last_reminder, password, status, batch_id) VALUES
('s1', 'DC-101', 'Aarav Sharma', '+91 98765 43210', 'Rajesh Sharma', 48000, 32000, 4000, '2026-10-25', '2 days ago', 'password123', 'Active', 'b1'),
('s2', 'DC-102', 'Priya Patel', '+91 98234 56789', 'Mukesh Patel', 48000, 48000, 4000, 'Paid', '-', 'password123', 'Active', 'b1'),
('s3', 'DC-103', 'Rohan Gupta', '+91 97112 23344', 'Sanjay Gupta', 48000, 16000, 4000, '2026-10-18', 'Never', 'password123', 'Active', 'b1'),
('s4', 'DC-104', 'Sneha Iyer', '+91 98989 12345', 'Venkatesh Iyer', 48000, 48000, 4000, 'Paid', '-', 'password123', 'Active', 'b1'),
('s5', 'DC-201', 'Kabir Khan', '+91 99110 02233', 'Imran Khan', 52000, 26000, 4500, '2026-10-20', '5 days ago', 'password123', 'Active', 'b2'),
('s6', 'DC-202', 'Ananya Singh', '+91 96543 21098', 'Virendra Singh', 52000, 52000, 4500, 'Paid', '-', 'password123', 'Active', 'b2'),
('s7', 'DC-203', 'Devansh Joshi', '+91 95551 12233', 'Prakash Joshi', 52000, 36000, 4500, '2026-10-28', 'Never', 'password123', 'Active', 'b2'),
('s8', 'DC-301', 'Ishita Das', '+91 94443 32211', 'Subhash Das', 30000, 22000, 3000, '2026-10-22', 'Never', 'password123', 'Active', 'b3'),
('s9', 'DC-302', 'Yashvardhan Chauhan', '+91 93123 45678', 'Manoj Chauhan', 30000, 30000, 3000, 'Paid', '-', 'password123', 'Active', 'b3'),
('s10', 'DC-110', 'Anil Kumar Chahar', '+91 95556 78753', 'Rajesh Chahar', 50000, 25000, 4500, '2026-10-30', '1 day ago', 'password123', 'Active', 'b1'),
('s11', 'DC-105', 'Radhika Chahar', '+91 95556 78754', 'Anil Chahar', 48000, 48000, 4000, 'Paid', '-', 'password123', 'Active', 'b1');

-- INSERT TEACHERS
INSERT INTO public.teachers (id, name, subject, qualification, experience, email, phone, specialization, bio, initials, password, status) VALUES
('tr1', 'Er. Rajesh Chahar', 'Senior Physics Faculty & Academic Director', 'B.Tech (IIT Roorkee), M.Tech', '15+ Years Experience', 'rajesh.chahar@divineclasses.in', '+91 95556 78753', 'Rotational Dynamics, Electromagnetism & JEE Advanced Strategy', 'Founder of Divine Classes. Mentored 800+ IITians and NITians.', 'RC', 'teacher123', 'Active'),
('tr2', 'Dr. Sunita Sharma', 'Head of Biology & Medical Entrance Wing', 'M.B.B.S, M.D. (AIIMS New Delhi)', '12+ Years Experience', 'dr.sunita@divineclasses.in', '+91 98234 56789', 'Human Physiology, Genetics & High-Yield NEET Revision', 'Former clinical fellow turned passionate NEET coach. Produced multiple top-100 AIRs in NEET-UG.', 'SS', 'teacher123', 'Active'),
('tr3', 'Mr. Arvind Verma', 'Mathematics Mentor & Olympiad Specialist', 'M.Sc. Mathematics (Gold Medalist)', '11+ Years Experience', 'arvind.verma@divineclasses.in', '+91 98345 67890', 'Calculus, Vectors-3D & Rapid Problem Solving Shortcuts', 'Celebrated for transforming mathematics from a feared subject into a scoring powerhouse.', 'AV', 'teacher123', 'Active'),
('tr4', 'Dr. Meera Krishnan', 'Senior Chemistry Faculty (Organic & Physical)', 'Ph.D. Chemistry (IISc Bangalore)', '10+ Years Experience', 'meera.krishnan@divineclasses.in', '+91 98456 78901', 'Named Reaction Mechanisms, Thermodynamics & GOC', 'Believes in zero rote-memorization. Uses molecular 3D models to make organic synthesis stick effortlessly.', 'MK', 'teacher123', 'Active');

-- INSERT MATERIALS
INSERT INTO public.materials (id, batch_id, batch_name, title, category, upload_date, uploaded_by, file_size, downloads, description) VALUES
('m1', 'b1', 'JEE Advanced Target 2027 (Alpha Batch)', 'Rotational Dynamics - Advanced DPP #05 with Step Hints', 'Assignment PDF', '12 Oct 2026', 'Er. Rajesh Chahar', '2.4 MB', 48, '50 tough multi-concept questions covering Moment of Inertia, Conservation of Angular Momentum, and Pure Rolling on incline.'),
('m2', 'b1', 'JEE Advanced Target 2027 (Alpha Batch)', 'Chemical Equilibrium & Ionic Equilibria Formula Booster Sheet', 'Worksheet', '14 Oct 2026', 'Dr. Meera Krishnan', '1.1 MB', 39, 'Complete high-yield shortcut formulas, Ostwald dilution law, buffer solutions, and solubility product numerical tables.'),
('m3', 'b1', 'JEE Advanced Target 2027 (Alpha Batch)', 'Divine Classes JEE Mock Test #03 (Paper 1 & 2 + Answer Key)', 'Test Paper', '10 Oct 2026', 'Er. Rajesh Chahar', '3.6 MB', 55, 'Official full-syllabus simulation offline test paper held on Sunday with detailed marking scheme.'),
('m4', 'b2', 'NEET Medical Dropper & Foundation (Bio-Elite)', 'NEET Human Genetics & Molecular Biology NCERT Drill', 'Worksheet', '13 Oct 2026', 'Dr. Sunita Sharma', '2.8 MB', 42, 'Line-by-line NCERT diagram drills, pedigree charts, and 120 assertion-reason practice questions.'),
('m5', 'b3', 'Class 10th CBSE Board Excellence & NTSE', 'CBSE 10th Standard Mathematics Real Numbers & Polynomials Board Paper', 'Test Paper', '11 Oct 2026', 'Mr. Arvind Verma', '1.4 MB', 31, 'CBSE previous 10-year question compilation with step-marking criteria for term exams.');

-- INSERT OFFLINE TESTS
INSERT INTO public.offline_tests (id, batch_id, title, subject, test_date, max_marks, marks) VALUES
('t1', 'b1', 'Offline Minor Test #1 - Kinematics, NLM & Vectors', 'Physics', '05 Oct 2026', 100, '{"s1": {"score": 92, "remarks": "Outstanding conceptual clarity!"}, "s2": {"score": 96, "remarks": "Batch Topper • Flawless calculations"}, "s3": {"score": 72, "remarks": "Revise constraint motion relations"}, "s4": {"score": 86, "remarks": "Very consistent, good speed"}, "s10": {"score": 76, "remarks": "Good conceptual grasp"}}'::jsonb),
('t2', 'b1', 'Offline Grand Test #2 - Physical & Inorganic Chemistry', 'Chemistry', '12 Oct 2026', 100, '{"s1": {"score": 89, "remarks": "Great improvement in thermodynamics"}, "s2": {"score": 94, "remarks": "Excellent stoichiometry work"}, "s3": {"score": 78, "remarks": "Good attempt, practice redox titration"}, "s4": {"score": 88, "remarks": "Strong accuracy throughout"}}'::jsonb),
('t3', 'b2', 'NEET Offline Minor Test - Cell Division & Plant Kingdom', 'Biology', '08 Oct 2026', 720, '{"s5": {"score": 628, "remarks": "Strong Botany score, revise meiosis stages"}, "s6": {"score": 680, "remarks": "Top Ranker in Divine Classes! AIIMS caliber"}, "s7": {"score": 595, "remarks": "Improve speed in assertion-reason"}}'::jsonb),
('t4', 'b3', 'Class 10 CBSE Offline Term Assessment #1', 'Mathematics & Science', '09 Oct 2026', 80, '{"s8": {"score": 73, "remarks": "Neat geometry diagrams and proofs"}, "s9": {"score": 78, "remarks": "Excellent, 100% accuracy in Algebra"}}'::jsonb);

-- INSERT GALLERY
INSERT INTO public.gallery (id, title, category, date, caption, badge, image_url) VALUES
('g1', 'JEE Advanced 2026 - All India Top 100 Toppers Felicitation', 'Result Banner', 'June 2026', 'Divine Classes champions shine bright! AIR 14, AIR 28, and 18 students securing 99.5+ percentile.', 'AIR 14, 28, 64', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80'),
('g2', 'NEET Medical Selections Felicitation Ceremony', 'Result Banner', 'June 2026', '46 selections in Govt. Medical Colleges including AIIMS, MAMC, and LHMC. Highest score: 685/720.', '685/720 Highest', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'),
('g3', 'Interactive Smart AC Classroom & Doubt Clearing Sessions', 'Classroom Photo', 'September 2026', 'Lecture Hall 101 equipped with interactive smart panels, live problem projections, and ergonomic seating.', 'Smart Hall 101', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80'),
('g4', 'Annual Merit Scholarship & Trophy Distribution Day', 'Event', 'August 2026', 'Over ₹5 Lakhs worth of merit scholarships awarded to meritorious students by Divine Classes management.', 'Annual Day', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80');

-- INSERT EXTERNAL LINKS
INSERT INTO public.external_links (id, title, provider, subject, url, description, icon, color) VALUES
('l1', 'NCERT Official Portal - Free e-Textbooks (Class 6-12)', 'NCERT Official', 'Physics, Chemistry, Maths, Biology', 'https://ncert.nic.in/textbook.php', 'Download authentic chapter-by-chapter NCERT books and revised exemplary problems.', 'fa-book-open', 'bg-blue-600'),
('l2', 'National Digital Library of India (NDLI)', 'Ministry of Education & IIT Kharagpur', 'All Subjects, Previous Years & Research Papers', 'https://ndl.iitkgp.ac.in/', 'Vast repository of millions of academic books, audio lectures, thesis papers, and video modules.', 'fa-landmark', 'bg-amber-600'),
('l3', 'Khan Academy India - Interactive STEM Practice', 'Khan Academy Non-Profit', 'Pure Mathematics, Physics & Biology Drills', 'https://www.khanacademy.org/', 'Master conceptual fundamentals with gamified practice sets, step hints, and self-paced mastery trees.', 'fa-graduation-cap', 'bg-emerald-600'),
('l4', 'PhET Interactive Science & Math Simulations', 'University of Colorado Boulder', 'Physics & Chemistry Virtual Lab Demonstrations', 'https://phet.colorado.edu/', 'Explore physics and chemical reactions visually with interactive virtual laboratory experiments.', 'fa-flask-vial', 'bg-purple-600'),
('l5', 'CBSE Academic & Sample Question Papers Portal', 'Central Board of Secondary Education', 'Board Marking Schemes & Sample Papers', 'https://cbseacademic.nic.in/', 'Official sample question papers, marking scheme blueprints, curriculum circulars, and toppers answer sheets.', 'fa-award', 'bg-indigo-600');

-- INSERT FEEDBACKS
INSERT INTO public.feedbacks (id, name, message, rating, created_at, batch, role, category) VALUES
('f1', 'Rajesh Sharma (Parent of Aarav Sharma)', 'Divine Classes has transformed Aarav’s problem-solving approach. Er. Rajesh Chahar sir’s physics lectures and individual doubt attention are exceptional!', 5, '13 Oct 2026', 'JEE Advanced Target 2027 (Alpha Batch)', 'Parent', 'Teaching Quality'),
('f2', 'Dr. Mukesh Patel (Parent of Priya Patel)', 'The discipline, regular Sunday minor tests, and transparent fee/attendance system make Divine Classes the finest institute in West Delhi.', 5, '10 Oct 2026', 'JEE Advanced Target 2027 (Alpha Batch)', 'Parent', 'Test Series & Discipline'),
('f3', 'Virendra Singh (Parent of Ananya Singh)', 'Dr. Sunita Sharma ma’am’s line-by-line NCERT Biology mastery gave Ananya enormous confidence for NEET. She scored 680 in the last grand test!', 5, '12 Oct 2026', 'NEET Medical Dropper & Foundation (Bio-Elite)', 'Parent', 'Biology & Doubt Support');

-- INSERT SETTINGS CONFIG
INSERT INTO public.settings_config (setting_parameter, configured_value, description) VALUES
('Institute Name', 'Divine Classes', 'Official Coaching Name'),
('Tagline', 'Empowering Aspirants for JEE, NEET & Board Excellence', 'Coaching Slogan & Mission'),
('Helpline Phone', '+91 95556 78753', 'Official Contact Number'),
('Display Contact', '9555-6787-53', 'Formatted Helpline'),
('Official Email', 'contact@divineclasses.in', 'Inquiry Email'),
('Address', '235 Paschimpuri Pocket 2, Club Rd New Delhi 110063', 'Center Location'),
('YouTube Channel', 'https://www.youtube.com/@chemcrush?si=VyfGmd_WwqQiU7j8', 'Official Video Channel'),
('Admin Name', 'Ravi Shankar', 'Display Name of Institute Admin'),
('Master Admin Password', 'admin123', 'Password to access Admin portal'),
('Admin Email ID', 'edivineclasses@gmail.com', 'Official Admin Contact / Login Email'),
('LEAD_DEV_EMAIL', 'anil.chahar170@gmail.com', 'Lead Developer login email'),
('Lead Developer Email', 'anil.chahar170@gmail.com', 'Lead Developer login email'),
('LEAD_DEV_PASSWORD', 'Anil@1310', 'Lead Developer login password'),
('Lead Developer Password', 'Anil@1310', 'Lead Developer login password'),
('UPI Payment ID', 'divineclasses@upi', 'Fee Collection UPI'),
('Facebook Page', 'https://www.facebook.com/edivineclasses/?_rdr', 'Social Channel'),
('Instagram Profile', 'https://www.instagram.com/divineclasses_paschimpuri?utm_source=qr&dlrf=enk4MXRodTU3YTdq', 'Social Channel'),
('Show Requirement Labels', 'Off', 'Page header Requirement #N tags (toggle in Settings)'),
('Admin Feedback Delete', 'Off', 'Admin delete button on Feedback Wall (toggle in Settings)'),
('Study Link Delete', 'Off', 'Admin delete button on Study Links cards (toggle in Settings)'),
('Show Dummy / Demo Data', 'Off', 'Seed demo students/batches/tests visibility'),
('Dummy Data Wiped', 'No', 'Permanent clearance status before client handover'),
('Last Auto-Sync Timestamp', '31 Oct 2026, 23:20:00', 'Time of last auto-sync from Web App'),
('Supabase Enabled', 'On', 'Supabase primary database toggle'),
('Supabase URL', 'https://srjqsofkjizwskqnzyfn.supabase.co', 'Supabase Project REST URL'),
('Supabase Key', 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS', 'Supabase API Key');

-- INSERT DB_JSON SNAPSHOT
INSERT INTO public.db_json (snapshot_key, payload, updated_at) VALUES
('main', '{
  "batches": [
    {"id": "b1", "name": "JEE Advanced Target 2027 (Alpha Batch)", "subject": "Physics, Chemistry & Mathematics", "schedule": "Mon - Fri • 08:00 AM - 12:30 PM", "room": "Lecture Hall 101 (Smart AC)", "teacher": "Er. Rajesh Chahar (Ex-IITian)", "studentIds": ["s1", "s2", "s3", "s4", "s10", "s11"]},
    {"id": "b2", "name": "NEET Medical Dropper & Foundation (Bio-Elite)", "subject": "Botany, Zoology, Physics & Chemistry", "schedule": "Mon - Sat • 01:30 PM - 06:00 PM", "room": "Medical Hall 202", "teacher": "Dr. Sunita Sharma (M.D. AIIMS)", "studentIds": ["s5", "s6", "s7"]},
    {"id": "b3", "name": "Class 10th CBSE Board Excellence & NTSE", "subject": "Science, Mathematics & Social Science", "schedule": "Tue, Thu, Sat • 04:30 PM - 07:00 PM", "room": "Classroom 104", "teacher": "Mr. Arvind Verma (M.Sc. Gold Medalist)", "studentIds": ["s8", "s9"]}
  ],
  "students": [
    {"id": "s1", "roll": "DC-101", "name": "Aarav Sharma", "phone": "+91 98765 43210", "parentName": "Rajesh Sharma", "totalFee": 48000, "paidFee": 32000, "monthlyFee": 4000, "dueDate": "2026-10-25", "lastReminder": "2 days ago", "password": "password123", "status": "Active", "batchId": "b1"},
    {"id": "s2", "roll": "DC-102", "name": "Priya Patel", "phone": "+91 98234 56789", "parentName": "Mukesh Patel", "totalFee": 48000, "paidFee": 48000, "monthlyFee": 4000, "dueDate": "Paid", "lastReminder": "-", "password": "password123", "status": "Active", "batchId": "b1"},
    {"id": "s3", "roll": "DC-103", "name": "Rohan Gupta", "phone": "+91 97112 23344", "parentName": "Sanjay Gupta", "totalFee": 48000, "paidFee": 16000, "monthlyFee": 4000, "dueDate": "2026-10-18", "lastReminder": "Never", "password": "password123", "status": "Active", "batchId": "b1"},
    {"id": "s4", "roll": "DC-104", "name": "Sneha Iyer", "phone": "+91 98989 12345", "parentName": "Venkatesh Iyer", "totalFee": 48000, "paidFee": 48000, "monthlyFee": 4000, "dueDate": "Paid", "lastReminder": "-", "password": "password123", "status": "Active", "batchId": "b1"},
    {"id": "s5", "roll": "DC-201", "name": "Kabir Khan", "phone": "+91 99110 02233", "parentName": "Imran Khan", "totalFee": 52000, "paidFee": 26000, "monthlyFee": 4500, "dueDate": "2026-10-20", "lastReminder": "5 days ago", "password": "password123", "status": "Active", "batchId": "b2"},
    {"id": "s6", "roll": "DC-202", "name": "Ananya Singh", "phone": "+91 96543 21098", "parentName": "Virendra Singh", "totalFee": 52000, "paidFee": 52000, "monthlyFee": 4500, "dueDate": "Paid", "lastReminder": "-", "password": "password123", "status": "Active", "batchId": "b2"},
    {"id": "s7", "roll": "DC-203", "name": "Devansh Joshi", "phone": "+91 95551 12233", "parentName": "Prakash Joshi", "totalFee": 52000, "paidFee": 36000, "monthlyFee": 4500, "dueDate": "2026-10-28", "lastReminder": "Never", "password": "password123", "status": "Active", "batchId": "b2"},
    {"id": "s8", "roll": "DC-301", "name": "Ishita Das", "phone": "+91 94443 32211", "parentName": "Subhash Das", "totalFee": 30000, "paidFee": 22000, "monthlyFee": 3000, "dueDate": "2026-10-22", "lastReminder": "Never", "password": "password123", "status": "Active", "batchId": "b3"},
    {"id": "s9", "roll": "DC-302", "name": "Yashvardhan Chauhan", "phone": "+91 93123 45678", "parentName": "Manoj Chauhan", "totalFee": 30000, "paidFee": 30000, "monthlyFee": 3000, "dueDate": "Paid", "lastReminder": "-", "password": "password123", "status": "Active", "batchId": "b3"},
    {"id": "s10", "roll": "DC-110", "name": "Anil Kumar Chahar", "phone": "+91 95556 78753", "parentName": "Rajesh Chahar", "totalFee": 50000, "paidFee": 25000, "monthlyFee": 4500, "dueDate": "2026-10-30", "lastReminder": "1 day ago", "password": "password123", "status": "Active", "batchId": "b1"},
    {"id": "s11", "roll": "DC-105", "name": "Radhika Chahar", "phone": "+91 95556 78754", "parentName": "Anil Chahar", "totalFee": 48000, "paidFee": 48000, "monthlyFee": 4000, "dueDate": "Paid", "lastReminder": "-", "password": "password123", "status": "Active", "batchId": "b1"}
  ],
  "teachers": [
    {"id": "tr1", "name": "Er. Rajesh Chahar", "subject": "Senior Physics Faculty & Academic Director", "qualification": "B.Tech (IIT Roorkee), M.Tech", "experience": "15+ Years Experience", "email": "rajesh.chahar@divineclasses.in", "phone": "+91 95556 78753", "specialization": "Rotational Dynamics, Electromagnetism & JEE Advanced Strategy", "bio": "Founder of Divine Classes. Mentored 800+ IITians and NITians.", "avatarColor": "from-indigo-600 to-blue-600", "initials": "RC", "password": "teacher123", "status": "Active"},
    {"id": "tr2", "name": "Dr. Sunita Sharma", "subject": "Head of Biology & Medical Entrance Wing", "qualification": "M.B.B.S, M.D. (AIIMS New Delhi)", "experience": "12+ Years Experience", "email": "dr.sunita@divineclasses.in", "phone": "+91 98234 56789", "specialization": "Human Physiology, Genetics & High-Yield NEET Revision", "bio": "Former clinical fellow turned passionate NEET coach.", "avatarColor": "from-emerald-600 to-teal-600", "initials": "SS", "password": "teacher123", "status": "Active"},
    {"id": "tr3", "name": "Mr. Arvind Verma", "subject": "Mathematics Mentor & Olympiad Specialist", "qualification": "M.Sc. Mathematics (Gold Medalist)", "experience": "11+ Years Experience", "email": "arvind.verma@divineclasses.in", "phone": "+91 98345 67890", "specialization": "Calculus, Vectors-3D & Rapid Problem Solving Shortcuts", "bio": "Celebrated for transforming mathematics into a scoring powerhouse.", "avatarColor": "from-amber-500 to-orange-600", "initials": "AV", "password": "teacher123", "status": "Active"},
    {"id": "tr4", "name": "Dr. Meera Krishnan", "subject": "Senior Chemistry Faculty (Organic & Physical)", "qualification": "Ph.D. Chemistry (IISc Bangalore)", "experience": "10+ Years Experience", "email": "meera.krishnan@divineclasses.in", "phone": "+91 98456 78901", "specialization": "Named Reaction Mechanisms, Thermodynamics & GOC", "bio": "Uses molecular 3D models to make organic synthesis stick effortlessly.", "avatarColor": "from-purple-600 to-pink-600", "initials": "MK", "password": "teacher123", "status": "Active"}
  ]
}'::jsonb, NOW())
ON CONFLICT (snapshot_key) DO UPDATE
SET payload = EXCLUDED.payload, updated_at = NOW();
