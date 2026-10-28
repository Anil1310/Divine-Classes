/**
 * ============================================================================
 * Divine Classes - DUMMY / DEMO DATA REPOSITORY (5 RECORDS PER TABLE)
 * ============================================================================
 * Contains exactly 5 seed / demo records for each database table:
 * - Batches: 5 records
 * - Students: 5 records
 * - Materials: 5 records
 * - Offline Tests: 5 records
 * - Teachers: 5 records
 * - Gallery Banners: 5 records
 * - Feedbacks: 5 records
 *
 * External_Links_Hub has 5 permanent official study portals (never deleted).
 *
 * Controlled by Developer via Settings -> Show Dummy / Demo Data:
 * - When ENABLED: Demo data appears in the Web App and is created in Database.
 * - When DISABLED: Demo data is completely deleted from Database,
 *   showing only real production records (or clean header row).
 */

var DUMMY_SEED_ID_SET = {
  'b1': true, 'b2': true, 'b3': true, 'b4': true, 'b5': true,
  's1': true, 's2': true, 's3': true, 's4': true, 's5': true,
  'm1': true, 'm2': true, 'm3': true, 'm4': true, 'm5': true,
  't1': true, 't2': true, 't3': true, 't4': true, 't5': true,
  'tr1': true, 'tr2': true, 'tr3': true, 'tr4': true, 'tr5': true,
  'g1': true, 'g2': true, 'g3': true, 'g4': true, 'g5': true,
  'f1': true, 'f2': true, 'f3': true, 'f4': true, 'f5': true
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
        studentIds: ['s1', 's2', 's6', 'DC-106']
      },
      {
        id: 'b2',
        isDummy: true,
        name: 'NEET Medical Dropper & Foundation (Bio-Elite)',
        subject: 'Botany, Zoology, Physics & Chemistry',
        schedule: 'Mon - Sat • 01:30 PM - 06:00 PM',
        room: 'Medical Hall 202',
        teacher: 'Dr. Sunita Sharma (M.D. AIIMS)',
        studentIds: ['s3', 's4']
      },
      {
        id: 'b3',
        isDummy: true,
        name: 'Class 10th CBSE Board Excellence & NTSE',
        subject: 'Science, Mathematics & Social Science',
        schedule: 'Tue, Thu, Sat • 04:30 PM - 07:00 PM',
        room: 'Classroom 104',
        teacher: 'Mr. Arvind Verma (M.Sc. Gold Medalist)',
        studentIds: ['s5']
      },
      {
        id: 'b4',
        isDummy: true,
        name: 'Class 11th Foundation JEE/NEET Morning',
        subject: 'Physics, Chemistry & Applied Mathematics',
        schedule: 'Mon - Fri • 07:00 AM - 10:00 AM',
        room: 'Lecture Hall 102',
        teacher: 'Dr. Pradeep Rawat (Ph.D)',
        studentIds: ['s1', 's3', 's5']
      },
      {
        id: 'b5',
        isDummy: true,
        name: 'Olympiad & KVPY Special Aptitude Batch',
        subject: 'Advanced Problem Solving & Scientific Reasoning',
        schedule: 'Sundays • 09:00 AM - 01:30 PM',
        room: 'Seminar Hall 301',
        teacher: 'Ms. Kavita Mehra (M.Tech)',
        studentIds: ['s2', 's4']
      }
    ],
    students: [
      { id: 's1', isDummy: true, roll: 'DC-101', name: 'Aarav Sharma', phone: '+91 98765 43210', parentName: 'Rajesh Sharma', admissionDate: '2026-10-10', monthlyFee: 2500, totalFee: 2500, paidFee: 2500, dueDate: '2026-11-11', lastReminder: '2 days ago', password: 'password123', status: 'Active' },
      { id: 's2', isDummy: true, roll: 'DC-102', name: 'Priya Patel', phone: '+91 98234 56789', parentName: 'Mukesh Patel', admissionDate: '2026-09-10', monthlyFee: 2500, totalFee: 2500, paidFee: 2500, dueDate: '2026-11-11', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's3', isDummy: true, roll: 'DC-103', name: 'Rohan Gupta', phone: '+91 97112 23344', parentName: 'Sanjay Gupta', admissionDate: '2026-10-05', monthlyFee: 2500, totalFee: 2500, paidFee: 0, dueDate: '2026-11-06', lastReminder: 'Never', password: 'password123', status: 'Active' },
      { id: 's4', isDummy: true, roll: 'DC-104', name: 'Sneha Iyer', phone: '+91 98989 12345', parentName: 'Venkatesh Iyer', admissionDate: '2026-08-15', monthlyFee: 3000, totalFee: 3000, paidFee: 3000, dueDate: '2026-11-16', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's5', isDummy: true, roll: 'DC-105', name: 'Kabir Khan', phone: '+91 99110 02233', parentName: 'Imran Khan', admissionDate: '2026-09-20', monthlyFee: 2500, totalFee: 2500, paidFee: 0, dueDate: '2026-10-21', lastReminder: '5 days ago', password: 'password123', status: 'Active' },
      { id: 's6', isDummy: false, roll: 'DC-106', name: 'Gia', phone: '8126390611', parentName: 'Anil Chahar', admissionDate: '2026-10-26', monthlyFee: 2500, totalFee: 2500, paidFee: 2500, dueDate: '2026-11-27', lastReminder: 'Never', password: 'password123', status: 'Active', photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Gia&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf', photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Gia&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf' }
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
        downloadUrl: '',
        driveUrl: '',
        description: '50 tough multi-concept questions covering Moment of Inertia, Conservation of Angular Momentum, and Pure Rolling on incline.'
      },
      {
        id: 'm2',
        isDummy: true,
        batchId: 'b1',
        title: 'Chemical Equilibrium & Ionic Equilibria Formula Booster Sheet',
        category: 'Handwritten Notes',
        uploadDate: '10 Oct 2026',
        uploadedBy: 'Ms. Kavita Mehra',
        fileSize: '1.8 MB',
        downloads: 62,
        fileName: 'Ionic_Equilibria_Notes.pdf',
        fileType: 'pdf',
        downloadUrl: '',
        driveUrl: '',
        description: 'Handwritten summary with shortcut relations for pH calculations, solubility product approximations, and salt hydrolysis cases.'
      },
      {
        id: 'm3',
        isDummy: true,
        batchId: 'b3',
        title: 'Calculus & Coordinate Geometry Short Notes + Concept Maps',
        category: 'Assignment PDF',
        uploadDate: '08 Oct 2026',
        uploadedBy: 'Mr. Arvind Verma',
        fileSize: '3.1 MB',
        downloads: 35,
        fileName: 'Calculus_Concept_Map.pdf',
        fileType: 'pdf',
        downloadUrl: '',
        driveUrl: '',
        description: 'Complete flowchart of integration by parts, substitution rules, conic sections eccentricity formulas, and tangent conditions.'
      },
      {
        id: 'm4',
        isDummy: true,
        batchId: 'b2',
        title: 'Plant Physiology NCERT Line-by-Line Objective Question Bank',
        category: 'Worksheet',
        uploadDate: '05 Oct 2026',
        uploadedBy: 'Dr. Sunita Sharma',
        fileSize: '4.2 MB',
        downloads: 91,
        fileName: 'Plant_Physiology_Question_Bank.pdf',
        fileType: 'pdf',
        downloadUrl: '',
        driveUrl: '',
        description: '120 diagram-based MCQs mapped strictly to latest NCERT syllabus for Photosynthesis, Respiration in Plants, and Plant Growth.'
      },
      {
        id: 'm5',
        isDummy: true,
        batchId: 'b3',
        title: 'Class 10th Science & Maths Term-2 Quick Revision Mindmap',
        category: 'Question Paper',
        uploadDate: '02 Oct 2026',
        uploadedBy: 'Mr. Arvind Verma',
        fileSize: '2.0 MB',
        downloads: 74,
        fileName: 'Class10_Term2_Mindmap.pdf',
        fileType: 'pdf',
        downloadUrl: '',
        driveUrl: '',
      },
      {
        id: 'm6',
        isDummy: true,
        batchId: 'b1',
        title: 'Electromagnetism & AC Circuits Advanced Practice DPP #06',
        category: 'Assignment PDF',
        uploadDate: '15 Oct 2026',
        uploadedBy: 'Er. Rajesh Chahar',
        fileSize: '3.2 MB',
        downloads: 54,
        fileName: 'Electromagnetism_AC_DPP_06.pdf',
        fileType: 'pdf',
        downloadUrl: '',
        driveUrl: '',
        description: 'Comprehensive high-yield problems on Electromagnetic Induction, Faraday Law, Mutual Inductance, and LC oscillations.'
      }
    ],
    offlineTests: [
      {
        id: 't1',
        isDummy: true,
        batchId: 'b1',
        title: 'Offline Grand Test #1 - Rotational Dynamics & Gravitation',
        subject: 'Physics',
        date: '14 Oct 2026',
        maxMarks: 100,
        marks: {
          's1': { score: 92, remarks: 'Outstanding conceptual clarity!' },
          's2': { score: 96, remarks: 'Batch Topper • Flawless calculations' },
          's3': { score: 72, remarks: 'Revise constraint motion relations' },
          's4': { score: 86, remarks: 'Very consistent, good speed' },
          's5': { score: 80, remarks: 'Solid effort, improve time management' }
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
          's4': { score: 88, remarks: 'Strong accuracy throughout' },
          's5': { score: 82, remarks: 'Good grasp of coordination complexes' }
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
          's1': { score: 610, remarks: 'Good botany fundamentals' },
          's2': { score: 670, remarks: 'Top Ranker in Divine Classes! AIIMS caliber' },
          's3': { score: 580, remarks: 'Strong attempt, revise plant taxonomy' },
          's4': { score: 645, remarks: 'High accuracy in genetics' },
          's5': { score: 628, remarks: 'Strong Botany score, revise meiosis stages' }
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
          's1': { score: 76, remarks: 'Very methodical step writing' },
          's2': { score: 79, remarks: 'Near perfect algebra & geometry' },
          's3': { score: 68, remarks: 'Revise optics ray diagrams' },
          's4': { score: 74, remarks: 'Neat geometry diagrams and proofs' },
          's5': { score: 73, remarks: 'Strong grasp of chemical reactions' }
        }
      },
      {
        id: 't5',
        isDummy: true,
        batchId: 'b4',
        title: 'Foundation Aptitude & Analytical Problem Solving',
        subject: 'General Aptitude',
        date: '16 Oct 2026',
        maxMarks: 100,
        marks: {
          's1': { score: 95, remarks: 'Exceptional analytical agility' },
          's2': { score: 91, remarks: 'High speed and precision' },
          's3': { score: 84, remarks: 'Solid logic, good accuracy' },
          's4': { score: 88, remarks: 'Commendable problem tackling' },
          's5': { score: 87, remarks: 'Impressive deductive reasoning' }
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
        subject: 'Head of Mathematics (IIT-JEE & Olympiads)',
        qualification: 'M.Sc. Mathematics (Gold Medalist, DU)',
        experience: '10+ Years Experience',
        email: 'arvind.verma@divineclasses.in',
        phone: '+91 97112 23344',
        specialization: 'Integral Calculus, Vectors-3D & Permutations & Combinations',
        bio: 'Specialist in speed-math techniques and Olympiad geometry. Believes in building rigorous mathematical proofs from foundational principles.',
        avatarColor: 'from-amber-600 to-orange-600',
        initials: 'AV',
        password: 'teacher123',
        status: 'Active'
      },
      {
        id: 'tr4',
        isDummy: true,
        name: 'Ms. Kavita Mehra',
        subject: 'Senior Chemistry Faculty (Organic & Inorganic)',
        qualification: 'M.Sc. Chemistry (IIT Delhi), CSIR-NET JRF',
        experience: '8+ Years Experience',
        email: 'kavita.mehra@divineclasses.in',
        phone: '+91 98989 12345',
        specialization: 'Reaction Mechanisms, Stereochemistry & Coordination Chemistry',
        bio: 'Expert in simplifying complex arrow-pushing mechanisms and periodic trends. Her visual charts are student favorites across coaching batches.',
        avatarColor: 'from-purple-600 to-pink-600',
        initials: 'KM',
        password: 'teacher123',
        status: 'Active'
      },
      {
        id: 'tr5',
        isDummy: true,
        name: 'Dr. Pradeep Rawat',
        subject: 'Senior Physical Chemistry & Research Mentor',
        qualification: 'Ph.D. Chemistry (IISc Bangalore)',
        experience: '9+ Years Experience',
        email: 'pradeep.rawat@divineclasses.in',
        phone: '+91 95551 12233',
        specialization: 'Chemical Thermodynamics, Electrochemistry & Quantum Chemistry',
        bio: 'Renowned researcher and educator. Focuses on numerical accuracy and shortcut derivations for competitive exams.',
        avatarColor: 'from-cyan-600 to-blue-600',
        initials: 'PR',
        password: 'teacher123',
        status: 'Active'
      }
    ],
    gallery: [
      {
        id: 'g1',
        isDummy: true,
        title: 'Divine Classes JEE Advanced All India Top Rankers 2026',
        category: 'Result Banner',
        date: 'July 2026',
        caption: 'Heartiest congratulations to our classroom achievers: AIR 42, AIR 118, and AIR 256 in JEE Advanced 2026.',
        badge: 'AIR 42, 118, 256',
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
      },
      {
        id: 'g5',
        isDummy: true,
        title: 'Intensive Sunday Full-Length Mock Test & Rank Analysis',
        category: 'Event',
        date: 'October 2026',
        caption: 'Bi-weekly simulated entrance exam condition tests conducted across all Divine Classes examination halls.',
        badge: 'Sunday Test Series',
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
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
        authorName: 'Priya Patel',
        role: 'Student',
        batchName: 'JEE Advanced Target 2027 (Alpha Batch)',
        category: 'Study Material',
        rating: 5,
        date: '11 Oct 2026',
        comment: 'The DPPs and formula booster sheets are directly relevant to competitive exam patterns. Faculty solves every doubt with extreme patience.'
      },
      {
        id: 'f3',
        isDummy: true,
        authorName: 'Sanjay Gupta (Parent of Rohan Gupta)',
        role: 'Parent',
        batchName: 'NEET Medical Dropper & Foundation',
        category: 'Offline Test Series',
        rating: 5,
        date: '09 Oct 2026',
        comment: 'Very disciplined institute. Receiving regular offline test marks and updates gives us complete peace of mind about our ward’s exam prep.'
      },
      {
        id: 'f4',
        isDummy: true,
        authorName: 'Sneha Iyer',
        role: 'Student',
        batchName: 'NEET Medical Dropper & Foundation',
        category: 'Faculty Guidance',
        rating: 5,
        date: '07 Oct 2026',
        comment: 'Dr. Sunita ma’am’s NCERT biology booster worksheets are the main reason my mock test scores jumped from 520 to 660+!'
      },
      {
        id: 'f5',
        isDummy: true,
        authorName: 'Imran Khan (Parent of Kabir Khan)',
        role: 'Parent',
        batchName: 'Class 10th CBSE Board Excellence & NTSE',
        category: 'Academic Discipline',
        rating: 5,
        date: '04 Oct 2026',
        comment: 'The personalized attention given to Kabir in Science and Mathematics is wonderful. His concepts and exam confidence have improved remarkably.'
      }
    ]
  };

  var clone = JSON.parse(JSON.stringify(data));
  Object.keys(clone).forEach(function(table) {
    if (Array.isArray(clone[table])) {
      clone[table].forEach(function(record) {
        if (record && record.isDummy === true) {
          record.isDemo = true;
          record.demoBatchId = 'divine-demo-v1';
        }
      });
    }
  });
  return clone;
}

function isDummyForSheetEnabled(settings, sheetKey) {
  if (!settings) return true;
  if (settings.showDummyData === false) return false;
  if (settings.dummyDataConfig && typeof settings.dummyDataConfig === 'object') {
    if (settings.dummyDataConfig[sheetKey] === false) return false;
  }
  return true;
}

function stripDummyData(appData, targetTable) {
  if (!appData) return appData;
  var clone = JSON.parse(JSON.stringify(appData));
  var dummyStudentIds = {};
  (clone.students || []).forEach(function(s) {
    if (s && isDummyRecord(s)) dummyStudentIds[s.id] = true;
  });

  var tablesToStrip = targetTable ? [targetTable] : ['students', 'batches', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'];
  tablesToStrip.forEach(function(tbl) {
    if (!isDummyForSheetEnabled(clone.settings, tbl) || targetTable) {
      clone[tbl] = (clone[tbl] || []).filter(function(r) { return !isDummyRecord(r); });
    }
  });

  if (!isDummyForSheetEnabled(clone.settings, 'students') || targetTable === 'students') {
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
  }
  return clone;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DUMMY_SEED_ID_SET: DUMMY_SEED_ID_SET,
    isDummyRecord: isDummyRecord,
    isDummyForSheetEnabled: isDummyForSheetEnabled,
    getDummySeedData: getDummySeedData,
    stripDummyData: stripDummyData
  };
}

