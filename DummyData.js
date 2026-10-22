/**
 * ============================================================================
 * DIVINE CLASSES - DUMMY / DEMO DATA REPOSITORY
 * ============================================================================
 * Contains all seed / demo records for Divine Classes (batches, students,
 * study materials, offline tests, faculty members, gallery banners, feedbacks).
 *
 * Controlled by Developer via Settings -> Show Dummy / Demo Data:
 * - When ENABLED: Demo data appears in the Web App and is synced to Google Sheets.
 * - When DISABLED: Demo data is completely hidden from Admin, Teachers & Students,
 *   and removed from Google Sheets, showing only real production records.
 */

var DUMMY_SEED_ID_SET = {
  'b1': true, 'b2': true, 'b3': true,
  's1': true, 's2': true, 's3': true, 's4': true, 's5': true,
  's6': true, 's7': true, 's8': true, 's9': true, 's10': true, 's11': true,
  'm1': true, 'm2': true, 'm3': true, 'm4': true, 'm5': true,
  't1': true, 't2': true, 't3': true, 't4': true,
  'tr1': true, 'tr2': true, 'tr3': true, 'tr4': true,
  'g1': true, 'g2': true, 'g3': true, 'g4': true,
  'f1': true, 'f2': true, 'f3': true
};

function isDummyRecord(rec) {
  if (!rec) return false;
  if (rec.isDummy === true) return true;
  if (rec.id && DUMMY_SEED_ID_SET[rec.id] === true) return true;
  return false;
}

function getDummySeedData() {
  var data = {
    batches: [
      {
        id: 'b1',
        isDummy: true,
        name: 'JEE Advanced Target 2027 (Alpha Batch)',
        subject: 'Physics, Chemistry & Mathematics',
        schedule: 'Mon - Fri • 08:00 AM - 12:30 PM',
        room: 'Lecture Hall 101 (Smart AC)',
        teacher: 'Er. Rajesh Chahar (Ex-IITian)',
        studentIds: ['s1', 's2', 's3', 's4', 's10']
      },
      {
        id: 'b2',
        isDummy: true,
        name: 'NEET Medical Dropper & Foundation (Bio-Elite)',
        subject: 'Botany, Zoology, Physics & Chemistry',
        schedule: 'Mon - Sat • 01:30 PM - 06:00 PM',
        room: 'Medical Hall 202',
        teacher: 'Dr. Sunita Sharma (M.D. AIIMS)',
        studentIds: ['s5', 's6', 's7']
      },
      {
        id: 'b3',
        isDummy: true,
        name: 'Class 10th CBSE Board Excellence & NTSE',
        subject: 'Science, Mathematics & Social Science',
        schedule: 'Tue, Thu, Sat • 04:30 PM - 07:00 PM',
        room: 'Classroom 104',
        teacher: 'Mr. Arvind Verma (M.Sc. Gold Medalist)',
        studentIds: ['s8', 's9']
      }
    ],
    students: [
      { id: 's1', isDummy: true, roll: 'DC-101', name: 'Aarav Sharma', phone: '+91 98765 43210', parentName: 'Rajesh Sharma', totalFee: 48000, paidFee: 32000, dueDate: '2026-10-25', lastReminder: '2 days ago', password: 'password123', status: 'Active' },
      { id: 's2', isDummy: true, roll: 'DC-102', name: 'Priya Patel', phone: '+91 98234 56789', parentName: 'Mukesh Patel', totalFee: 48000, paidFee: 48000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's3', isDummy: true, roll: 'DC-103', name: 'Rohan Gupta', phone: '+91 97112 23344', parentName: 'Sanjay Gupta', totalFee: 48000, paidFee: 16000, dueDate: '2026-10-18', lastReminder: 'Never', password: 'password123', status: 'Active' },
      { id: 's4', isDummy: true, roll: 'DC-104', name: 'Sneha Iyer', phone: '+91 98989 12345', parentName: 'Venkatesh Iyer', totalFee: 48000, paidFee: 48000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's5', isDummy: true, roll: 'DC-201', name: 'Kabir Khan', phone: '+91 99110 02233', parentName: 'Imran Khan', totalFee: 52000, paidFee: 26000, dueDate: '2026-10-20', lastReminder: '5 days ago', password: 'password123', status: 'Active' },
      { id: 's6', isDummy: true, roll: 'DC-202', name: 'Ananya Singh', phone: '+91 96543 21098', parentName: 'Virendra Singh', totalFee: 52000, paidFee: 52000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's7', isDummy: true, roll: 'DC-203', name: 'Devansh Joshi', phone: '+91 95551 12233', parentName: 'Prakash Joshi', totalFee: 52000, paidFee: 36000, dueDate: '2026-10-28', lastReminder: 'Never', password: 'password123', status: 'Active' },
      { id: 's8', isDummy: true, roll: 'DC-301', name: 'Ishita Das', phone: '+91 94443 32211', parentName: 'Subhash Das', totalFee: 30000, paidFee: 22000, dueDate: '2026-10-22', lastReminder: 'Never', password: 'password123', status: 'Active' },
      { id: 's9', isDummy: true, roll: 'DC-302', name: 'Yashvardhan Chauhan', phone: '+91 93123 45678', parentName: 'Manoj Chauhan', totalFee: 30000, paidFee: 30000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's10', isDummy: true, roll: 'DC-110', name: 'Anil Kumar Chahar', phone: '+91 95556 78753', parentName: 'Rajesh Chahar', totalFee: 50000, paidFee: 25000, dueDate: '2026-10-30', lastReminder: '1 day ago', password: 'password123', status: 'Active' },
      { id: 's11', isDummy: true, roll: 'DC-105', name: 'Radhika Chahar', phone: '+91 95556 78754', parentName: 'Anil Chahar', totalFee: 48000, paidFee: 48000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' }
    ],
    materials: [
      {
        id: 'm1',
        isDummy: true,
        batchId: 'b1',
        title: 'Rotational Dynamics - Advanced DPP #05 with Step Hints',
        category: 'Assignment PDF',
        uploadDate: '12 Oct 2026',
        uploadedBy: 'Er. Rajesh Chahar',
        fileSize: '2.4 MB',
        downloads: 48,
        fileName: 'Rotational_Dynamics_DPP_05.pdf',
        fileType: 'pdf',
        downloadUrl: 'https://drive.google.com/',
        driveUrl: 'https://drive.google.com/',
        description: '50 tough multi-concept questions covering Moment of Inertia, Conservation of Angular Momentum, and Pure Rolling on incline.'
      },
      {
        id: 'm2',
        isDummy: true,
        batchId: 'b1',
        title: 'Chemical Equilibrium & Ionic Equilibria Formula Booster Sheet',
        category: 'Worksheet',
        uploadDate: '14 Oct 2026',
        uploadedBy: 'Dr. Meera Krishnan',
        fileSize: '1.1 MB',
        downloads: 39,
        fileName: 'Chemical_Equilibrium_Booster_Sheet.pdf',
        fileType: 'pdf',
        downloadUrl: 'https://drive.google.com/',
        driveUrl: 'https://drive.google.com/',
        description: 'Complete high-yield shortcut formulas, Ostwald dilution law, buffer solutions, and solubility product numerical tables.'
      },
      {
        id: 'm3',
        isDummy: true,
        batchId: 'b1',
        title: 'Divine Classes JEE Mock Test #03 (Paper 1 & 2 + Answer Key)',
        category: 'Test Paper',
        uploadDate: '10 Oct 2026',
        uploadedBy: 'Er. Rajesh Chahar',
        fileSize: '3.6 MB',
        downloads: 55,
        fileName: 'JEE_Mock_Test_03_Paper_and_Solutions.pdf',
        fileType: 'pdf',
        downloadUrl: 'https://drive.google.com/',
        driveUrl: 'https://drive.google.com/',
        description: 'Official full-syllabus simulation offline test paper held on Sunday with detailed marking scheme and video solution links.'
      },
      {
        id: 'm4',
        isDummy: true,
        batchId: 'b2',
        title: 'NEET Human Genetics & Molecular Biology NCERT Drill',
        category: 'Worksheet',
        uploadDate: '13 Oct 2026',
        uploadedBy: 'Dr. Sunita Sharma',
        fileSize: '2.8 MB',
        downloads: 42,
        fileName: 'NEET_Human_Genetics_NCERT_Drill.pdf',
        fileType: 'pdf',
        downloadUrl: 'https://drive.google.com/',
        driveUrl: 'https://drive.google.com/',
        description: 'Line-by-line NCERT diagram drills, pedigree charts, and 120 assertion-reason practice questions.'
      },
      {
        id: 'm5',
        isDummy: true,
        batchId: 'b3',
        title: 'CBSE 10th Standard Mathematics Real Numbers & Polynomials Board Paper',
        category: 'Test Paper',
        uploadDate: '11 Oct 2026',
        uploadedBy: 'Mr. Arvind Verma',
        fileSize: '1.4 MB',
        downloads: 31,
        fileName: 'CBSE_10th_Maths_Board_Paper.pdf',
        fileType: 'pdf',
        downloadUrl: 'https://drive.google.com/',
        driveUrl: 'https://drive.google.com/',
        description: 'CBSE previous 10-year question compilation with step-marking criteria for term exams.'
      }
    ],
    offlineTests: [
      {
        id: 't1',
        isDummy: true,
        batchId: 'b1',
        title: 'Offline Minor Test #1 - Kinematics, NLM & Vectors',
        subject: 'Physics',
        date: '05 Oct 2026',
        maxMarks: 100,
        marks: {
          's1': { score: 92, remarks: 'Outstanding conceptual clarity!' },
          's2': { score: 96, remarks: 'Batch Topper • Flawless calculations' },
          's3': { score: 72, remarks: 'Revise constraint motion relations' },
          's4': { score: 86, remarks: 'Very consistent, good speed' },
          's10': { score: 76, remarks: 'Account Blocked in Database' }
        }
      },
      {
        id: 't2',
        isDummy: true,
        batchId: 'b1',
        title: 'Offline Grand Test #2 - Physical & Inorganic Chemistry',
        subject: 'Chemistry',
        date: '12 Oct 2026',
        maxMarks: 100,
        marks: {
          's1': { score: 89, remarks: 'Great improvement in thermodynamics' },
          's2': { score: 94, remarks: 'Excellent stoichiometry work' },
          's3': { score: 78, remarks: 'Good attempt, practice redox titration' },
          's4': { score: 88, remarks: 'Strong accuracy throughout' }
        }
      },
      {
        id: 't3',
        isDummy: true,
        batchId: 'b2',
        title: 'NEET Offline Minor Test - Cell Division & Plant Kingdom',
        subject: 'Biology',
        date: '08 Oct 2026',
        maxMarks: 720,
        marks: {
          's5': { score: 628, remarks: 'Strong Botany score, revise meiosis stages' },
          's6': { score: 680, remarks: 'Top Ranker in Divine Classes! AIIMS caliber' },
          's7': { score: 595, remarks: 'Improve speed in assertion-reason' }
        }
      },
      {
        id: 't4',
        isDummy: true,
        batchId: 'b3',
        title: 'Class 10 CBSE Offline Term Assessment #1',
        subject: 'Mathematics & Science',
        date: '09 Oct 2026',
        maxMarks: 80,
        marks: {
          's8': { score: 73, remarks: 'Neat geometry diagrams and proofs' },
          's9': { score: 78, remarks: 'Excellent, 100% accuracy in Algebra' }
        }
      }
    ],
    teachers: [
      {
        id: 'tr1',
        isDummy: true,
        name: 'Er. Rajesh Chahar',
        subject: 'Senior Physics Faculty & Academic Director',
        qualification: 'B.Tech (IIT Roorkee), M.Tech',
        experience: '15+ Years Experience',
        email: 'rajesh.chahar@divineclasses.in',
        phone: '+91 95556 78753',
        specialization: 'Rotational Dynamics, Electromagnetism & JEE Advanced Strategy',
        bio: 'Founder of Divine Classes. Mentored 800+ IITians and NITians. Known for breaking down complex physics into crystal-clear intuitive models.',
        avatarColor: 'from-indigo-600 to-blue-600',
        initials: 'RC',
        password: 'teacher123',
        status: 'Active'
      },
      {
        id: 'tr2',
        isDummy: true,
        name: 'Dr. Sunita Sharma',
        subject: 'Head of Biology & Medical Entrance Wing',
        qualification: 'M.B.B.S, M.D. (AIIMS New Delhi)',
        experience: '12+ Years Experience',
        email: 'dr.sunita@divineclasses.in',
        phone: '+91 98234 56789',
        specialization: 'Human Physiology, Genetics & High-Yield NEET Revision',
        bio: 'Former clinical fellow turned passionate NEET coach. Produced multiple top-100 All India Ranks in NEET-UG with 350+/360 biology scores.',
        avatarColor: 'from-emerald-600 to-teal-600',
        initials: 'SS',
        password: 'teacher123',
        status: 'Active'
      },
      {
        id: 'tr3',
        isDummy: true,
        name: 'Mr. Arvind Verma',
        subject: 'Mathematics Mentor & Olympiad Specialist',
        qualification: 'M.Sc. Mathematics (Gold Medalist)',
        experience: '11+ Years Experience',
        email: 'arvind.verma@divineclasses.in',
        phone: '+91 98345 67890',
        specialization: 'Calculus, Vectors-3D & Rapid Problem Solving Shortcuts',
        bio: 'Celebrated for transforming mathematics from a feared subject into a scoring powerhouse. Author of shortcut trick compilations for competitive tests.',
        avatarColor: 'from-amber-500 to-orange-600',
        initials: 'AV',
        password: 'teacher123',
        status: 'Active'
      },
      {
        id: 'tr4',
        isDummy: true,
        name: 'Dr. Meera Krishnan',
        subject: 'Senior Chemistry Faculty (Organic & Physical)',
        qualification: 'Ph.D. Chemistry (IISc Bangalore)',
        experience: '10+ Years Experience',
        email: 'meera.krishnan@divineclasses.in',
        phone: '+91 98456 78901',
        specialization: 'Named Reaction Mechanisms, Thermodynamics & GOC',
        bio: 'Believes in zero rote-memorization. Uses molecular 3D models to make organic synthesis reaction pathways stick effortlessly.',
        avatarColor: 'from-purple-600 to-pink-600',
        initials: 'MK',
        password: 'teacher123',
        status: 'Active'
      }
    ],
    gallery: [
      {
        id: 'g1',
        isDummy: true,
        title: 'JEE Advanced 2026 - All India Top 100 Toppers Felicitation',
        category: 'Result Banner',
        date: 'June 2026',
        caption: 'Divine Classes champions shine bright! AIR 14, AIR 28, and 18 students securing 99.5+ percentile in JEE Advanced.',
        badge: 'AIR 14, 28, 64',
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'g2',
        isDummy: true,
        title: 'NEET Medical Selections Felicitation Ceremony',
        category: 'Result Banner',
        date: 'June 2026',
        caption: '46 selections in Govt. Medical Colleges including AIIMS, MAMC, and LHMC. Highest score: 685/720.',
        badge: '685/720 Highest',
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'g3',
        isDummy: true,
        title: 'Interactive Smart AC Classroom & Doubt Clearing Sessions',
        category: 'Classroom Photo',
        date: 'September 2026',
        caption: 'Lecture Hall 101 equipped with interactive smart panels, live problem projections, and ergonomic seating.',
        badge: 'Smart Hall 101',
        imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'g4',
        isDummy: true,
        title: 'Annual Merit Scholarship & Trophy Distribution Day',
        category: 'Event',
        date: 'August 2026',
        caption: 'Over ₹5 Lakhs worth of merit-cum-means scholarships awarded to meritorious students by Divine Classes management.',
        badge: 'Annual Day',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
      }
    ],
    feedbacks: [
      {
        id: 'f1',
        isDummy: true,
        authorName: 'Rajesh Sharma (Parent of Aarav Sharma)',
        role: 'Parent',
        batchName: 'JEE Advanced Target 2027 (Alpha Batch)',
        category: 'Teaching Quality',
        rating: 5,
        date: '13 Oct 2026',
        comment: 'Divine Classes has transformed Aarav’s problem-solving approach. Er. Rajesh Chahar sir’s physics lectures and individual doubt attention are exceptional!'
      },
      {
        id: 'f2',
        isDummy: true,
        authorName: 'Ananya Singh',
        role: 'Student',
        batchName: 'NEET Medical Dropper & Foundation',
        category: 'Study Material',
        rating: 5,
        date: '10 Oct 2026',
        comment: 'The offline test analysis and Dr. Sunita ma’am’s NCERT biology booster worksheets are the main reason my mock test scores jumped from 520 to 660+!'
      },
      {
        id: 'f3',
        isDummy: true,
        authorName: 'Sanjay Gupta (Parent of Rohan Gupta)',
        role: 'Parent',
        batchName: 'JEE Advanced Target 2027 (Alpha Batch)',
        category: 'Offline Test Series',
        rating: 5,
        date: '06 Oct 2026',
        comment: 'Very disciplined institute. Receiving regular offline test marks and updates gives us complete peace of mind about our ward’s exam prep.'
      }
    ]
  };

  return JSON.parse(JSON.stringify(data));
}

function stripDummyData(appData) {
  if (!appData) return appData;
  var clone = JSON.parse(JSON.stringify(appData));
  var dummyStudentIds = {};
  (clone.students || []).forEach(function(s) {
    if (s && isDummyRecord(s)) dummyStudentIds[s.id] = true;
  });
  ['students', 'batches', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'].forEach(function(tbl) {
    clone[tbl] = (clone[tbl] || []).filter(function(r) { return !isDummyRecord(r); });
  });
  (clone.batches || []).forEach(function(b) {
    if (Array.isArray(b.studentIds)) {
      b.studentIds = b.studentIds.filter(function(id) { return !dummyStudentIds[id]; });
    }
  });
  (clone.offlineTests || []).forEach(function(t) {
    if (t && t.marks && typeof t.marks === 'object') {
      Object.keys(dummyStudentIds).forEach(function(sid) { delete t.marks[sid]; });
    }
  });
  return clone;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DUMMY_SEED_ID_SET: DUMMY_SEED_ID_SET,
    isDummyRecord: isDummyRecord,
    getDummySeedData: getDummySeedData,
    stripDummyData: stripDummyData
  };
}
