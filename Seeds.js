/**
 * Demo seed records and seed visibility helpers.
 * Kept separate from Code.js so sample data can be maintained independently.
 */

/**
 * Seed dataset for Divine Classes
 */
function getDefaultSeedData() {
  const data = {
    batches: [
      {
        id: 'b1',
        name: 'JEE Advanced Target 2027 (Alpha Batch)',
        subject: 'Physics, Chemistry & Mathematics',
        schedule: 'Mon - Fri • 08:00 AM - 12:30 PM',
        room: 'Lecture Hall 101 (Smart AC)',
        teacher: 'Er. Rajesh Chahar (Ex-IITian)',
        teacherId: 'tr1',
        teacherEmail: 'rajesh.chahar@divineclasses.in',
        studentIds: ['s1', 's2', 's3', 's4', 's10']
      },
      {
        id: 'b2',
        name: 'NEET Medical Dropper & Foundation (Bio-Elite)',
        subject: 'Botany, Zoology, Physics & Chemistry',
        schedule: 'Mon - Sat • 01:30 PM - 06:00 PM',
        room: 'Medical Hall 202',
        teacher: 'Dr. Sunita Sharma (M.D. AIIMS)',
        teacherId: 'tr2',
        teacherEmail: 'dr.sunita@divineclasses.in',
        studentIds: ['s5', 's6', 's7']
      },
      {
        id: 'b3',
        name: 'Class 10th CBSE Board Excellence & NTSE',
        subject: 'Science, Mathematics & Social Science',
        schedule: 'Tue, Thu, Sat • 04:30 PM - 07:00 PM',
        room: 'Classroom 104',
        teacher: 'Mr. Arvind Verma (M.Sc. Gold Medalist)',
        teacherId: 'tr3',
        teacherEmail: 'arvind.verma@divineclasses.in',
        studentIds: ['s8', 's9']
      }
    ],
    students: [
      { id: 's1', roll: 'DC-101', name: 'Aarav Sharma', phone: '+91 98765 43210', parentName: 'Rajesh Sharma', totalFee: 48000, paidFee: 32000, monthlyFee: 1000, dueDate: '2026-10-25', lastReminder: '2 days ago', password: 'password123', status: 'Active' },
      { id: 's2', roll: 'DC-102', name: 'Priya Patel', phone: '+91 98234 56789', parentName: 'Mukesh Patel', totalFee: 48000, paidFee: 48000, monthlyFee: 1000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's3', roll: 'DC-103', name: 'Rohan Gupta', phone: '+91 97112 23344', parentName: 'Sanjay Gupta', totalFee: 48000, paidFee: 16000, monthlyFee: 1000, dueDate: '2026-10-18', lastReminder: 'Never', password: 'password123', status: 'Active' },
      { id: 's4', roll: 'DC-104', name: 'Sneha Iyer', phone: '+91 98989 12345', parentName: 'Venkatesh Iyer', totalFee: 48000, paidFee: 48000, monthlyFee: 1000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's5', roll: 'DC-201', name: 'Kabir Khan', phone: '+91 99110 02233', parentName: 'Imran Khan', totalFee: 52000, paidFee: 26000, monthlyFee: 1000, dueDate: '2026-10-20', lastReminder: '5 days ago', password: 'password123', status: 'Active' },
      { id: 's6', roll: 'DC-202', name: 'Ananya Singh', phone: '+91 96543 21098', parentName: 'Virendra Singh', totalFee: 52000, paidFee: 52000, monthlyFee: 1000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's7', roll: 'DC-203', name: 'Devansh Joshi', phone: '+91 95551 12233', parentName: 'Prakash Joshi', totalFee: 52000, paidFee: 36000, monthlyFee: 1000, dueDate: '2026-10-28', lastReminder: 'Never', password: 'password123', status: 'Active' },
      { id: 's8', roll: 'DC-301', name: 'Ishita Das', phone: '+91 94443 32211', parentName: 'Subhash Das', totalFee: 30000, paidFee: 22000, monthlyFee: 1000, dueDate: '2026-10-22', lastReminder: 'Never', password: 'password123', status: 'Active' },
      { id: 's9', roll: 'DC-302', name: 'Yashvardhan Chauhan', phone: '+91 93123 45678', parentName: 'Manoj Chauhan', totalFee: 30000, paidFee: 30000, monthlyFee: 1000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's10', roll: 'DC-110', name: 'Anil Kumar Chahar', phone: '+91 95556 78753', parentName: 'Rajesh Chahar', totalFee: 50000, paidFee: 25000, monthlyFee: 1000, dueDate: '2026-10-30', lastReminder: '1 day ago', password: 'password123', status: 'Active' },
      { id: 's11', roll: 'DC-105', name: 'Radhika Chahar', phone: '+91 95556 78754', parentName: 'Anil Chahar', totalFee: 48000, paidFee: 48000, monthlyFee: 1000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' }
    ],
    materials: [
      {
        id: 'm1',
        batchId: 'b1',
        title: 'Rotational Dynamics - Advanced DPP #05 with Step Hints',
        category: 'Assignment PDF',
        uploadDate: '12 Oct 2026',
        uploadedBy: 'Er. Rajesh Chahar',
        fileSize: '2.4 MB',
        downloads: 48,
        description: '50 tough multi-concept questions covering Moment of Inertia, Conservation of Angular Momentum, and Pure Rolling on incline.'
      },
      {
        id: 'm2',
        batchId: 'b1',
        title: 'Chemical Equilibrium & Ionic Equilibria Formula Booster Sheet',
        category: 'Worksheet',
        uploadDate: '14 Oct 2026',
        uploadedBy: 'Dr. Meera Krishnan',
        fileSize: '1.1 MB',
        downloads: 39,
        description: 'Complete high-yield shortcut formulas, Ostwald dilution law, buffer solutions, and solubility product numerical tables.'
      },
      {
        id: 'm3',
        batchId: 'b1',
        title: 'Divine Classes JEE Mock Test #03 (Paper 1 & 2 + Answer Key)',
        category: 'Test Paper',
        uploadDate: '10 Oct 2026',
        uploadedBy: 'Er. Rajesh Chahar',
        fileSize: '3.6 MB',
        downloads: 55,
        description: 'Official full-syllabus simulation offline test paper held on Sunday with detailed marking scheme and video solution links.'
      },
      {
        id: 'm4',
        batchId: 'b2',
        title: 'NEET Human Genetics & Molecular Biology NCERT Drill',
        category: 'Worksheet',
        uploadDate: '13 Oct 2026',
        uploadedBy: 'Dr. Sunita Sharma',
        fileSize: '2.8 MB',
        downloads: 42,
        description: 'Line-by-line NCERT diagram drills, pedigree charts, and 120 assertion-reason practice questions.'
      },
      {
        id: 'm5',
        batchId: 'b3',
        title: 'CBSE 10th Standard Mathematics Real Numbers & Polynomials Board Paper',
        category: 'Test Paper',
        uploadDate: '11 Oct 2026',
        uploadedBy: 'Mr. Arvind Verma',
        fileSize: '1.4 MB',
        downloads: 31,
        description: 'CBSE previous 10-year question compilation with step-marking criteria for term exams.'
      }
    ],
    offlineTests: [
      {
        id: 't1',
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
        title: 'JEE Advanced 2026 - All India Top 100 Toppers Felicitation',
        category: 'Result Banner',
        date: 'June 2026',
        caption: 'Divine Classes champions shine bright! AIR 14, AIR 28, and 18 students securing 99.5+ percentile in JEE Advanced.',
        badge: 'AIR 14, 28, 64',
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'g2',
        title: 'NEET Medical Selections Felicitation Ceremony',
        category: 'Result Banner',
        date: 'June 2026',
        caption: '46 selections in Govt. Medical Colleges including AIIMS, MAMC, and LHMC. Highest score: 685/720.',
        badge: '685/720 Highest',
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'g3',
        title: 'Interactive Smart AC Classroom & Doubt Clearing Sessions',
        category: 'Classroom Photo',
        date: 'September 2026',
        caption: 'Lecture Hall 101 equipped with interactive smart panels, live problem projections, and ergonomic seating.',
        badge: 'Smart Hall 101',
        imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'g4',
        title: 'Annual Merit Scholarship & Trophy Distribution Day',
        category: 'Event',
        date: 'August 2026',
        caption: 'Over ₹5 Lakhs worth of merit-cum-means scholarships awarded to meritorious students by Divine Classes management.',
        badge: 'Annual Day',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
      }
    ],
    externalLinks: [
      {
        id: 'l1',
        title: 'NCERT Official Portal - Free e-Textbooks (Class 6-12)',
        provider: 'NCERT Official',
        subject: 'Physics, Chemistry, Maths, Biology',
        url: 'https://ncert.nic.in/textbook.php',
        description: 'Download authentic chapter-by-chapter NCERT books and revised exemplary problems.',
        icon: 'fa-book-open',
        color: 'bg-blue-600'
      },
      {
        id: 'l2',
        title: 'National Digital Library of India (NDLI)',
        provider: 'Ministry of Education & IIT Kharagpur',
        subject: 'JEE / NEET / Olympiad',
        url: 'https://ndl.iitkgp.ac.in/',
        description: 'Vast repository of video lectures, solved past question archives, and academic monographs.',
        icon: 'fa-building-columns',
        color: 'bg-indigo-600'
      },
      {
        id: 'l3',
        title: 'Khan Academy India - Concept Mastery Modules',
        provider: 'Khan Academy',
        subject: 'Foundation Science & Calculus',
        url: 'https://www.khanacademy.org/',
        description: 'Bite-sized visual lessons, step-by-step calculus proofs, and interactive diagnostic quizzes.',
        icon: 'fa-circle-play',
        color: 'bg-emerald-600'
      },
      {
        id: 'l4',
        title: 'PhET Interactive STEM Laboratory Simulations',
        provider: 'University of Colorado Boulder',
        subject: 'Physics & Chemistry Labs',
        url: 'https://phet.colorado.edu/',
        description: 'Experiment with electrical circuits, wave interference, photo-electric effect, and chemical titrations virtually.',
        icon: 'fa-flask',
        color: 'bg-amber-600'
      },
      {
        id: 'l5',
        title: 'CBSE Academic Official Sample Papers & Marking Keys',
        provider: 'CBSE Board',
        subject: 'Class 10th & 12th Board Exams',
        url: 'https://cbseacademic.nic.in/',
        description: 'Official latest board examination blue-prints, competency-focused question banks, and answer rubrics.',
        icon: 'fa-file-lines',
        color: 'bg-purple-600'
      }
    ],
    feedbacks: [
      {
        id: 'f1',
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
        authorName: 'Sanjay Gupta (Parent of Rohan Gupta)',
        role: 'Parent',
        batchName: 'JEE Advanced Target 2027 (Alpha Batch)',
        category: 'Offline Test Series',
        rating: 5,
        date: '06 Oct 2026',
        comment: 'Very disciplined institute. Receiving regular offline test marks and updates gives us complete peace of mind about our ward’s exam prep.'
      }
    ],
    settings: {
      instituteName: 'Divine Classes',
      tagline: 'Empowering Aspirants for JEE, NEET & Board Excellence',
      phone: '+91 95556 78753',
      contactDisplay: '9555-6787-53',
      email: 'contact@divineclasses.in',
      address: '235 Paschimpuri Pocket 2, Club Rd New Delhi 110063',
      upiId: 'divineclasses@upi',
      facebookUrl: 'https://www.facebook.com/edivineclasses/?_rdr',
      instagramUrl: 'https://www.instagram.com/divineclasses_paschimpuri?utm_source=qr&dlrf=enk4MXRodTU3YTdq',
      youtubeUrl: 'https://www.youtube.com/@chemcrush?si=VyfGmd_WwqQiU7j8',
      adminName: 'Ravi Shankar',
      adminPassword: 'admin123',
      adminEmail: 'edivineclasses@gmail.com',
      leadDevEmail: 'anil.chahar170@gmail.com',
      leadDevPassword: 'Anil@1310',
      showRequirementLabels: false,
      allowAdminFeedbackDelete: false,
      allowAdminLinkDelete: false,
      showDummyData: true,
      dummyDataWiped: false,
      chatbotEnabled: true,
      chatbotAdminEnabled: true,
      chatbotTeacherEnabled: true,
      chatbotStudentEnabled: true,
      supabaseEnabled: true,
      supabaseUrl: 'https://srjqsofkjizwskqnzyfn.supabase.co',
      supabaseKey: 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS'
    }
  };

  // Pad every demo-backed sheet to at least ten sample records. These are
  // deliberately generic examples so they are easy to distinguish from live
  // records. Study-link entries remain visible per the hub's existing behavior.
  for (let i = 4; i <= 10; i++) {
    data.batches.push({
      id: 'b' + i,
      name: 'Demo Batch ' + String(i).padStart(2, '0'),
      subject: ['Physics', 'Chemistry', 'Mathematics'][i % 3],
      schedule: 'Demo schedule — Mon, Wed, Fri • 10:00 AM - 11:00 AM',
      room: 'Demo Classroom ' + String(i).padStart(2, '0'),
      teacher: 'Demo Faculty ' + String(i).padStart(2, '0'),
      studentIds: ['s' + (((i - 1) % 11) + 1)]
    });
  }

  for (let i = 6; i <= 10; i++) {
    data.materials.push({
      id: 'm' + i,
      batchId: 'b' + (((i - 1) % 3) + 1),
      title: '[DEMO] Sample Study Resource ' + String(i).padStart(2, '0'),
      category: ['Worksheet', 'Assignment PDF', 'Test Paper'][i % 3],
      uploadDate: '30 Oct 2026',
      uploadedBy: 'Demo Faculty',
      fileSize: 'Sample',
      downloads: 0,
      description: 'Placeholder demo material for testing the Materials Repository. No real file is attached.'
    });
  }

  for (let i = 5; i <= 10; i++) {
    const studentId = 's' + (((i - 1) % 11) + 1);
    data.offlineTests.push({
      id: 't' + i,
      batchId: 'b' + (((i - 1) % 3) + 1),
      title: '[DEMO] Sample Assessment ' + String(i).padStart(2, '0'),
      subject: ['Physics', 'Chemistry', 'Mathematics'][i % 3],
      date: '30 Oct 2026',
      maxMarks: 100,
      marks: {},
      isDummy: true
    });
    data.offlineTests[data.offlineTests.length - 1].marks[studentId] = {
      score: 60 + (i * 3),
      remarks: '[DEMO] Sample marks for layout and report testing.'
    };
  }

  for (let i = 5; i <= 10; i++) {
    const n = String(i).padStart(2, '0');
    data.teachers.push({
      id: 'tr' + i,
      name: 'Demo Faculty ' + n,
      subject: 'Sample Subject ' + n,
      qualification: 'Demo qualification',
      experience: 'Sample experience',
      email: 'demo.faculty' + n + '@example.invalid',
      phone: '',
      specialization: 'Demo profile for testing only',
      bio: 'This is a placeholder demo teacher record.',
      avatarColor: 'from-slate-600 to-slate-800',
      initials: 'DF',
      password: 'demo-only',
      status: 'Active'
    });
  }

  const demoGalleryImage = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80';
  for (let i = 5; i <= 10; i++) {
    const n = String(i).padStart(2, '0');
    data.gallery.push({
      id: 'g' + i,
      title: '[DEMO] Sample Gallery Item ' + n,
      category: 'Demo Preview',
      date: '30 Oct 2026',
      caption: 'Placeholder gallery entry for testing only; it does not represent a real result or event.',
      badge: 'DEMO',
      imageUrl: demoGalleryImage
    });
  }

  for (let i = 4; i <= 10; i++) {
    const n = String(i).padStart(2, '0');
    data.feedbacks.push({
      id: 'f' + i,
      authorName: 'Demo Respondent ' + n,
      role: i % 2 ? 'Student' : 'Parent',
      batchName: 'Demo Batch ' + n,
      category: 'Demo Feedback',
      rating: 5,
      date: '30 Oct 2026',
      comment: '[DEMO] Placeholder feedback record for testing only; not a real testimonial.'
    });
  }

  for (let i = 6; i <= 10; i++) {
    const n = String(i).padStart(2, '0');
    data.externalLinks.push({
      id: 'l' + i,
      title: '[DEMO] Sample External Resource ' + n,
      provider: 'Demo Provider',
      subject: 'Sample Study Resource',
      url: 'https://example.com/demo/resource-' + n,
      driveUrl: '',
      description: 'Placeholder link for testing the External Links Hub. This is not a real study resource.',
      dateAdded: '30 Oct 2026',
      icon: 'fa-globe',
      color: 'bg-indigo-600',
      isDummy: true
    });
  }

  ['batches', 'students', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'].forEach(function (col) {
    (data[col] || []).forEach(function (rec) { rec.isDummy = true; });
  });
  // External links stay visible when demo data is hidden; demo placeholders are
  // still labeled so they can be identified in sheets and exports.
  return data;
}

/**
 * Settings_Config seed rows. Kept with the other seed records so an initial
 * database and every recreated settings tab use the same configured values.
 */
function getDefaultSettingsConfigRows_(settings, syncedAt) {
  const seedSettings = getDefaultSeedData().settings;
  const s = settings || seedSettings;
  return [
    ['Institute Name', s.instituteName || seedSettings.instituteName, 'Official Coaching Name'],
    ['Tagline', s.tagline || seedSettings.tagline, 'Coaching Slogan & Mission'],
    ['Helpline Phone', s.phone || seedSettings.phone, 'Official Contact Number'],
    ['Display Contact', s.contactDisplay || seedSettings.contactDisplay, 'Formatted Helpline'],
    ['Official Email', s.email || seedSettings.email, 'Inquiry Email'],
    ['Address', s.address || seedSettings.address, 'Center Location'],
    ['YouTube Channel', s.youtubeUrl || seedSettings.youtubeUrl, 'Official Video Channel'],
    ['Admin Name', s.adminName || seedSettings.adminName, 'Display Name of Institute Admin'],
    ['Master Admin Password', s.adminPassword || seedSettings.adminPassword, 'Password to access Admin portal'],
    ['Admin Email ID', s.adminEmail || seedSettings.adminEmail || 'edivineclasses@gmail.com', 'Official Admin Contact / Login Email'],
    ['Lead Developer Email', s.leadDevEmail || 'anil.chahar170@gmail.com', 'Lead Developer login email'],
    ['Lead Developer Password', s.leadDevPassword || 'Anil@1310', 'Lead Developer login password'],
    ['LEAD_DEV_EMAIL', s.leadDevEmail || 'anil.chahar170@gmail.com', 'Lead Developer Login Credentials'],
    ['LEAD_DEV_PASSWORD', s.leadDevPassword || 'Anil@1310', 'Lead Developer login password'],
    ['UPI Payment ID', s.upiId || seedSettings.upiId, 'Fee Collection UPI'],
    ['Facebook Page', s.facebookUrl || seedSettings.facebookUrl, 'Social Channel'],
    ['Instagram Profile', s.instagramUrl || seedSettings.instagramUrl, 'Social Channel'],
    ['Show Requirement Labels', (s.showRequirementLabels === false || s.showRequirementLabels === 'Off' || s.showRequirementLabels === 'off' || s.showRequirementLabels === 'false' || s.showRequirementLabels === 0 || s.showRequirementLabels === '0') ? 'Off' : 'On', 'Page header Requirement #N tags (toggle in Settings)'],
    ['Admin Feedback Delete', (s.allowAdminFeedbackDelete === false || s.allowAdminFeedbackDelete === 'Off' || s.allowAdminFeedbackDelete === 'off' || s.allowAdminFeedbackDelete === 'false') ? 'Off' : 'On', 'Admin delete button on Feedback Wall (toggle in Settings)'],
    ['Study Link Delete', (s.allowAdminLinkDelete === false || s.allowAdminLinkDelete === 'Off' || s.allowAdminLinkDelete === 'off' || s.allowAdminLinkDelete === 'false') ? 'Off' : 'On', 'Admin delete button on Study Links cards (toggle in Settings)'],
    ['Enable Floating Chatbot', (s.chatbotEnabled === false || s.chatbotEnabled === 'Off' || s.chatbotEnabled === 'off' || s.chatbotEnabled === 'false') ? 'Off' : 'On', 'Chatbot launcher & AI assistant visibility (toggle in Settings)'],
    ['Chatbot Visible to Admin', (s.chatbotAdminEnabled === false || s.chatbotAdminEnabled === 'Off' || s.chatbotAdminEnabled === 'false') ? 'Off' : 'On', 'Chatbot visibility on Admin login'],
    ['Chatbot Visible to Teachers', (s.chatbotTeacherEnabled === false || s.chatbotTeacherEnabled === 'Off' || s.chatbotTeacherEnabled === 'false') ? 'Off' : 'On', 'Chatbot visibility on Teacher login'],
    ['Chatbot Visible to Students', (s.chatbotStudentEnabled === false || s.chatbotStudentEnabled === 'Off' || s.chatbotStudentEnabled === 'false') ? 'Off' : 'On', 'Chatbot visibility on Student login'],
    ['Show Dummy / Demo Data', (s.showDummyData === false || s.showDummyData === 'Off' || s.showDummyData === 'off' || s.showDummyData === 'false' || s.dummyDataWiped === true || s.dummyDataWiped === 'true') ? 'Off' : 'On', 'Seed demo students/batches/tests visibility'],
    ['Dummy Data Wiped', (s.dummyDataWiped === true || s.dummyDataWiped === 'true') ? 'Yes' : 'No', 'Permanent clearance status before client handover'],
    ['Supabase Enabled', (s.supabaseEnabled === false || s.supabaseEnabled === 'Off' || s.supabaseEnabled === 'off' || s.supabaseEnabled === 'false') ? 'Off' : 'On', 'Supabase primary database toggle'],
    ['Supabase URL', s.supabaseUrl || 'https://srjqsofkjizwskqnzyfn.supabase.co', 'Supabase Project REST URL'],
    ['Supabase Key', s.supabaseKey || 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS', 'Supabase API Key'],
    ['Last Auto-Sync Timestamp', syncedAt || '31 Oct 2026, 23:20:00', 'Time of last auto-sync from Web App']
  ];
}

/** Updates only legacy sample social URLs, preserving any custom sheet values. */
function migrateLegacySeedSettings_(appData) {
  if (!appData || !appData.settings) return appData;
  const replacements = {
    adminName: {
      oldValue: 'Anil Chahar',
      newValue: 'Ravi Shankar'
    },
    youtubeUrl: {
      oldValue: 'https://www.youtube.com/@chem_crush9',
      newValue: 'https://www.youtube.com/@chemcrush?si=VyfGmd_WwqQiU7j8'
    },
    facebookUrl: {
      oldValue: 'https://facebook.com',
      newValue: 'https://www.facebook.com/edivineclasses/?_rdr'
    },
    instagramUrl: {
      oldValue: 'https://instagram.com',
      newValue: 'https://www.instagram.com/divineclasses_paschimpuri?utm_source=qr&dlrf=enk4MXRodTU3YTdq'
    }
  };
  Object.keys(replacements).forEach(function (key) {
    if (appData.settings[key] === replacements[key].oldValue) {
      appData.settings[key] = replacements[key].newValue;
    }
  });
  return appData;
}

/**
 * Ten clearly marked sample attendance rows for the Attendance_Register tab.
 * Dates follow the current month so the sample data is visible in attendance
 * views regardless of when the demo is opened.
 */
function getDefaultAttendanceDummySeeds_() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const statuses = ['Present', 'Present', 'Late', 'Absent', 'Present', 'Leave', 'Present', 'Late', 'Present', 'Absent'];
  const seeds = [];
  for (let i = 0; i < 10; i++) {
    const studentNum = i + 1;
    const batchNum = studentNum <= 4 || studentNum === 10 ? 1 : studentNum <= 7 ? 2 : 3;
    const day = Math.min(i + 1, new Date(year, month + 1, 0).getDate());
    const date = new Date(year, month, day, 9, 0, 0);
    seeds.push({
      date: Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      batchId: 'b' + batchNum,
      studentId: 's' + studentNum,
      status: statuses[i],
      markedBy: '[DEMO] Seed data',
      updatedAt: date.toISOString()
    });
  }
  return seeds;
}

function isDummyDataWiped_() {
  try {
    const cur = dbLoadAll();
    return !!(cur && cur.settings && (cur.settings.dummyDataWiped === true || cur.settings.dummyDataWiped === 'true'));
  } catch (e) {
    return false;
  }
}

/**
 * Maintains the demo attendance rows in their sheet. This seed-only helper
 * refreshes existing demo rows or appends missing ones, leaving live rows as-is.
 */
function ensureAttendanceDummySeeds_(sheet) {
  if (!sheet || typeof getDefaultAttendanceDummySeeds_ !== 'function') return;
  if (isDummyDataWiped_()) return;
  const columnCount = 6;
  const lastRow = sheet.getLastRow();
  const rows = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, columnCount).getValues()
    : [];
  const seen = {};
  const demoRowsByStudent = {};
  rows.forEach(function (row, index) {
    const date = row[0] instanceof Date
      ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : String(row[0] || '').trim();
    const key = [date, String(row[1] || ''), String(row[2] || '')].join('|');
    seen[key] = true;
    if (String(row[4] || '') === '[DEMO] Seed data' && row[2]) {
      demoRowsByStudent[String(row[2])] = index + 2;
    }
  });
  const append = [];
  getDefaultAttendanceDummySeeds_().forEach(function (record) {
    const key = [record.date, record.batchId, record.studentId].join('|');
    const existingRow = demoRowsByStudent[record.studentId];
    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, columnCount).setValues([[
        record.date,
        record.batchId,
        record.studentId,
        record.status,
        record.markedBy,
        record.updatedAt
      ]]);
      return;
    }
    if (seen[key]) return;
    append.push([
      record.date,
      record.batchId,
      record.studentId,
      record.status,
      record.markedBy,
      record.updatedAt
    ]);
    seen[key] = true;
  });
  if (append.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, append.length, columnCount).setValues(append);
  }
}

/**
 * Adds missing demo seed records to an existing database without overwriting
 * real records. Tombstoned students and external links stay deleted.
 */
function mergeDefaultDummySeeds_(appData) {
  if (!appData) return appData;
  if (appData.settings && (appData.settings.dummyDataWiped === true || appData.settings.dummyDataWiped === 'true')) {
    return appData;
  }
  const seed = getDefaultSeedData();
  const blockedRolls = typeof getTombstones_ === 'function' ? getTombstones_('rolls') : [];
  const blockedUrls = typeof getTombstones_ === 'function' ? getTombstones_('linkUrls') : [];
  const tables = ['batches', 'students', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks', 'externalLinks'];

  tables.forEach(function (table) {
    if (!Array.isArray(appData[table])) appData[table] = [];
    const have = {};
    appData[table].forEach(function (record) {
      if (record && record.id) have[String(record.id)] = true;
    });
    (seed[table] || []).forEach(function (record) {
      if (!record || !record.id || have[String(record.id)]) return;
      if (table === 'students' && blockedRolls.indexOf(String(record.roll || '').trim()) !== -1) return;
      if (table === 'externalLinks' && blockedUrls.indexOf(String(record.url || '').trim()) !== -1) return;
      const sample = JSON.parse(JSON.stringify(record));
      sample.isDummy = true;
      appData[table].push(sample);
      have[String(record.id)] = true;
    });
  });

  if (!appData.settings || typeof appData.settings !== 'object') appData.settings = {};
  Object.keys(seed.settings || {}).forEach(function (key) {
    if (appData.settings[key] === undefined) appData.settings[key] = seed.settings[key];
  });
  return appData;
}

/** Recreates the complete seed set on explicit developer request. */
function createDefaultSeedRecords_(appData) {
  if (!appData) appData = getDefaultSeedData();
  if (!appData.settings) appData.settings = {};
  appData.settings.dummyDataWiped = false;
  appData.settings.showDummyData = true;
  try {
    PropertiesService.getScriptProperties().deleteProperty('DB_tomb_rolls');
    PropertiesService.getScriptProperties().deleteProperty('DB_tomb_linkUrls');
  } catch (e) { }
  return mergeDefaultDummySeeds_(appData);
}

/**
 * ============================================================================
 * DUMMY / DEMO DATA TOGGLE (Developer controlled via Settings)
 * ============================================================================
 * settings.showDummyData === false  → seed/demo records are hidden from the
 * portal but NEVER deleted from the database, so flipping the toggle back ON
 * restores them instantly.
 */

const DUMMY_SEED_ID_SET = (function () {
  const set = {};
  // Note: l1-l5 (external study links) are intentionally NOT in this set —
  // they are always visible, even when dummy/demo data is hidden.
  ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10',
    's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11',
    'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10',
    't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10',
    'tr5', 'tr6', 'tr7', 'tr8', 'tr9', 'tr10',
    'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g10',
    'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10',
    'l6', 'l7', 'l8', 'l9', 'l10'
  ].forEach(function (id) { set[id] = true; });
  return set;
})();

function isDummyRecord_(rec) {
  if (!rec) return false;
  if (rec.isDummy === true) return true;
  return DUMMY_SEED_ID_SET[rec.id] === true;
}

// Removes seed/demo records from the data RETURNED to clients (DB untouched).
// externalLinks (study links) are ALWAYS kept — never stripped.
function stripDummyData_(appData) {
  if (!appData || !appData.settings || appData.settings.showDummyData !== false) return appData;
  const dummyStudentIds = {};
  (appData.students || []).forEach(function (s) {
    if (s && isDummyRecord_(s)) dummyStudentIds[s.id] = true;
  });
  ['students', 'batches', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'].forEach(function (tbl) {
    appData[tbl] = (appData[tbl] || []).filter(function (r) { return !isDummyRecord_(r); });
  });
  (appData.batches || []).forEach(function (b) {
    if (Array.isArray(b.studentIds)) {
      b.studentIds = b.studentIds.filter(function (id) { return !dummyStudentIds[id]; });
    }
  });
  (appData.offlineTests || []).forEach(function (t) {
    if (t && t.marks && typeof t.marks === 'object') {
      Object.keys(dummyStudentIds).forEach(function (sid) { delete t.marks[sid]; });
    }
  });
  return appData;
}

// Re-injects missing dummy records (from current DB or seed) so client syncs
// that carry a stripped state can never permanently wipe demo data.
function restoreDummyData_(incoming) {
  if (!incoming) return incoming;
  if (incoming.settings && (incoming.settings.dummyDataWiped === true || incoming.settings.dummyDataWiped === 'true')) {
    return incoming;
  }
  // Keep existing databases up to date when new demo seeds are added.
  mergeDefaultDummySeeds_(incoming);
  let cur = null;
  try { cur = dbLoadAll(); } catch (e) { }
  const incomingOff = !incoming.settings || incoming.settings.showDummyData === false;
  const dbWasOff = !!(cur && cur.settings && cur.settings.showDummyData === false);
  // Restore when the client sends a stripped view (toggle OFF), or when the
  // toggle was just flipped back ON from a previously-stripped session
  // (client state is still missing the dummy records at that moment).
  if (!incomingOff && !dbWasOff) return incoming;
  const src = cur || getDefaultSeedData();
  const dummyStudentIds = {};
  // externalLinks excluded — study links are never stripped, so no restore needed
  ['batches', 'students', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'].forEach(function (tbl) {
    if (!Array.isArray(incoming[tbl])) incoming[tbl] = [];
    const have = {};
    incoming[tbl].forEach(function (r) { if (r && r.id) have[r.id] = true; });
    (src[tbl] || []).forEach(function (r) {
      if (r && r.id && !have[r.id] && isDummyRecord_(r)) incoming[tbl].push(r);
    });
  });
  (src.students || []).forEach(function (s) {
    if (s && isDummyRecord_(s)) dummyStudentIds[s.id] = true;
  });
  // Restore stripped dummy student references in batches/tests that still exist
  (incoming.batches || []).forEach(function (b) {
    if (!Array.isArray(b.studentIds)) b.studentIds = [];
    Object.keys(dummyStudentIds).forEach(function (sid) {
      const orig = (src.batches || []).find(function (ob) { return ob.id === b.id; });
      if (orig && Array.isArray(orig.studentIds) && orig.studentIds.indexOf(sid) !== -1 && b.studentIds.indexOf(sid) === -1) {
        b.studentIds.push(sid);
      }
    });
  });
  return incoming;
}
