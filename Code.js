/**
 * DIVINE CLASSES - INSTITUTE MANAGEMENT SYSTEM
 * Google Apps Script Backend
 * 
 * Script ID: 1H8yxx2UFoy7Rw6qwF6S4LT7wzSR1762YbX_cFrvPyHwz933AcL4Mx9To
 * Database Sheet ID: 1v7RZX0R8AmVDv02BCr3D_t28B8i3I8PO_qpjqMzFeKM
 */

const SPREADSHEET_ID = '1v7RZX0R8AmVDv02BCr3D_t28B8i3I8PO_qpjqMzFeKM';

/**
 * Web App Entrypoint (doGet)
 */
function doGet(e) {
  try {
    const page = (e && e.parameter && e.parameter.page) ? String(e.parameter.page).toLowerCase() : 'index';
    let templateName = 'index';
    let title = 'Divine Classes - Institute Management System';

    if (page === 'login') {
      templateName = 'login';
      title = 'Sign In - Divine Classes Portal';
    } else if (page === 'logout') {
      templateName = 'logout';
      title = 'Signed Out - Divine Classes Portal';
    }

    const template = HtmlService.createTemplateFromFile(templateName);
    return template.evaluate()
      .setTitle(title)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    try {
      const fallback = HtmlService.createTemplateFromFile('index');
      return fallback.evaluate()
        .setTitle('Divine Classes - Institute Management System')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (innerErr) {
      return HtmlService.createHtmlOutput('<h3>Error loading application: ' + err.toString() + '</h3>');
    }
  }
}

/**
 * Helper to include partial HTML files if needed
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Helper to get Database Spreadsheet safely
 */
function getDbSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } catch (err) {
      Logger.log('Could not open spreadsheet by ID: ' + err.toString());
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Returns the Google Sheet URL
 */
function apiGetSpreadsheetUrl() {
  return 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID + '/edit';
}

/**
 * ============================================================================
 * GOOGLE DRIVE STORAGE ENGINE (Assignments, DPPs, Test Papers)
 * ============================================================================
 * Teacher/Admin file uploads are stored in Google Drive with public-view
 * links. The download URL is saved in the Cloud Database and mirrored to
 * the Materials_Repository Google Sheet tab so students can download it.
 */

const DRIVE_ROOT_FOLDER_NAME = 'Divine Classes Portal Uploads';
const DRIVE_MATERIALS_FOLDER = 'Study Materials & Documents';
const DRIVE_FOLDERS = {
  PHOTOS: 'Student Photographs',
  GALLERY: 'Gallery & Result Banners',
  MATERIALS: 'Study Materials & Documents',
  LINKS: 'External Study Links & Resources'
};

/**
 * Extracts the folder ID from any Google Drive folder link the developer pastes:
 *   https://drive.google.com/drive/folders/ABC123
 *   https://drive.google.com/drive/u/0/folders/ABC123
 *   https://drive.google.com/open?id=ABC123
 */
function extractDriveFolderId(url) {
  if (!url) return '';
  const s = String(url).trim();
  let m = s.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // Bare folder ID pasted
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s;
  return '';
}

function getDriveRootFolder() {
  const props = PropertiesService.getScriptProperties();

  // Coaching Owner's folder (developer pastes the link in Settings console)
  let ownerFolderId = '';
  try {
    const settings = dbGetTable('settings') || {};
    ownerFolderId = extractDriveFolderId(settings.driveFolderUrl || '');
  } catch (e) {
    Logger.log('Settings read for owner folder failed: ' + e.toString());
  }

  if (ownerFolderId) {
    try {
      const ownerFolder = DriveApp.getFolderById(ownerFolderId);
      const subRootCacheKey = 'DRIVE_FOLDER_ID_subroot_' + ownerFolderId;
      const cachedSubRoot = props.getProperty(subRootCacheKey);
      if (cachedSubRoot) {
        try { return DriveApp.getFolderById(cachedSubRoot); } catch (e) { Logger.log('Cached owner subroot gone: ' + e.toString()); }
      }
      // Create/reuse "Divine Classes Portal Uploads" inside the OWNER's folder
      const subs = ownerFolder.getFoldersByName(DRIVE_ROOT_FOLDER_NAME);
      let subRoot;
      if (subs.hasNext()) {
        subRoot = subs.next();
      } else {
        subRoot = ownerFolder.createFolder(DRIVE_ROOT_FOLDER_NAME);
        try { subRoot.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log('Share subroot: ' + e.toString()); }
      }
      props.setProperty(subRootCacheKey, subRoot.getId());
      return subRoot;
    } catch (ownerErr) {
      Logger.log('Owner folder access failed (bad link or no permission): ' + ownerErr.toString());
      // Fall through to the default portal folder
    }
  }

  // Default: portal root folder in the deployer's own Drive
  const cachedId = props.getProperty('DRIVE_FOLDER_ID_root');
  if (cachedId) {
    try { return DriveApp.getFolderById(cachedId); } catch (e) { Logger.log('Cached root folder gone, recreating: ' + e.toString()); }
  }
  const folders = DriveApp.getFoldersByName(DRIVE_ROOT_FOLDER_NAME);
  let root;
  if (folders.hasNext()) {
    root = folders.next();
  } else {
    root = DriveApp.createFolder(DRIVE_ROOT_FOLDER_NAME);
    root.setDescription('Official storage folder for Divine Classes Portal uploads, photographs, materials, and external links.');
    try {
      root.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log('Sharing error on root folder: ' + e.toString());
    }
  }
  props.setProperty('DRIVE_FOLDER_ID_root', root.getId());
  return root;
}

function getDriveSubFolder(subFolderName) {
  const props = PropertiesService.getScriptProperties();
  const cacheKey = 'DRIVE_FOLDER_ID_' + subFolderName.replace(/[^A-Za-z0-9]/g, '_');
  const cachedId = props.getProperty(cacheKey);
  if (cachedId) {
    try { return DriveApp.getFolderById(cachedId); } catch (e) { Logger.log('Cached subfolder gone, recreating: ' + e.toString()); }
  }
  const root = getDriveRootFolder();
  const subs = root.getFoldersByName(subFolderName);
  let sub;
  if (subs.hasNext()) {
    sub = subs.next();
  } else {
    sub = root.createFolder(subFolderName);
    try {
      sub.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log('Sharing error on subfolder: ' + e.toString());
    }
  }
  props.setProperty(cacheKey, sub.getId());
  return sub;
}

/**
 * Returns Google Drive folder URLs (used by the Developer Drive quick links)
 */
function apiGetDriveInfo() {
  try {
    const root = getDriveRootFolder();
    return {
      success: true,
      rootName: root.getName(),
      rootUrl: root.getUrl(),
      rootId: root.getId(),
      folders: {
        photos: getDriveSubFolder(DRIVE_FOLDERS.PHOTOS).getUrl(),
        gallery: getDriveSubFolder(DRIVE_FOLDERS.GALLERY).getUrl(),
        materials: getDriveSubFolder(DRIVE_FOLDERS.MATERIALS).getUrl(),
        links: getDriveSubFolder(DRIVE_FOLDERS.LINKS).getUrl()
      }
    };
  } catch (err) {
    Logger.log('apiGetDriveInfo error: ' + err.toString());
    return { success: false, error: err.toString(), rootUrl: 'https://drive.google.com' };
  }
}

/**
 * Uploads an assignment / DPP / test paper file to Google Drive, saves the
 * material record (with its URL) to the Cloud Database, and mirrors it to
 * the Materials_Repository Google Sheet tab.
 *
 * @param {string} fileBase64OrDataUrl  base64 or data:URL string from the browser
 * @param {string} originalFileName     original file name (e.g. DPP08.pdf)
 * @param {Object} metadata             { batchId, category, title, description, uploadedBy, id }
 * @return {Object} { success, material, driveUrl, downloadUrl, fileId } | { success:false, error }
 */
function apiUploadMaterialToDrive(fileBase64OrDataUrl, originalFileName, metadata) {
  try {
    if (!fileBase64OrDataUrl) {
      return { success: false, error: 'No file data received' };
    }

    let mimeType = 'application/pdf';
    let base64String = fileBase64OrDataUrl;
    if (fileBase64OrDataUrl.indexOf(';base64,') !== -1) {
      const parts = fileBase64OrDataUrl.split(';base64,');
      mimeType = parts[0].replace('data:', '') || 'application/pdf';
      base64String = parts[1];
    }

    let ext = 'pdf';
    if (mimeType.indexOf('wordprocessingml') !== -1 || mimeType.indexOf('msword') !== -1) {
      ext = mimeType.indexOf('wordprocessingml') !== -1 ? 'docx' : 'doc';
    } else if (mimeType.indexOf('pdf') !== -1) {
      ext = 'pdf';
    }

    const fileName = originalFileName || ('Material_' + Date.now() + '.' + ext);
    const folder = getDriveSubFolder(DRIVE_MATERIALS_FOLDER);
    const decodedBytes = Utilities.base64Decode(base64String);
    const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

    const driveFile = folder.createFile(blob);
    try {
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log('Share setting error: ' + shareErr.toString());
    }

    const fileId = driveFile.getId();
    const driveUrl = driveFile.getUrl();
    // Mobile-friendly direct download endpoint — opens PDFs in the browser's
    // viewer on phones and downloads DOC/XLS to the Files/Downloads app
    const downloadUrl = 'https://drive.usercontent.google.com/download?id=' + fileId + '&export=download&confirm=t';
    const fileSizeMB = (driveFile.getSize() / (1024 * 1024)).toFixed(1) + ' MB';

    const meta = metadata || {};
    const newMaterial = {
      id: meta.id || ('m' + Date.now()),
      batchId: meta.batchId || 'b1',
      category: meta.category || 'Assignment PDF',
      uploadedBy: meta.uploadedBy || 'Faculty',
      title: meta.title || fileName,
      description: meta.description || '',
      uploadDate: meta.uploadDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      fileSize: fileSizeMB,
      downloads: 0,
      fileType: ext,
      driveUrl: driveUrl,
      downloadUrl: downloadUrl,
      driveFileId: fileId,
      fileName: fileName
    };

    // Persist to Cloud Database + Google Sheet (URL included in Materials_Repository)
    const data = apiGetInitialData();
    if (!data.materials) data.materials = [];
    data.materials.unshift(newMaterial);

    // In-app notification: alert every student/teacher that a new material is live
    if (!data.notifications || !Array.isArray(data.notifications)) data.notifications = [];
    const batchObj = (data.batches || []).find(b => b.id === newMaterial.batchId);
    const batchLabel = batchObj ? batchObj.name : 'General';
    data.notifications.unshift({
      id: 'notif_mat_' + newMaterial.id + '_' + Date.now(),
      title: 'New ' + newMaterial.category + ' Uploaded',
      message: '"' + newMaterial.title + '" (' + newMaterial.fileSize + ') for ' + batchLabel + ' is now available in Assignments & DPPs. Download link saved to the Google Sheet.',
      time: 'Just now',
      timestamp: Date.now(),
      read: false,
      adminSeen: false,
      type: 'info',
      icon: 'fa-file-arrow-up',
      iconColor: 'text-indigo-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-950/40',
      actionTab: 'materials',
      targetRole: 'all',
      materialId: newMaterial.id,
      batchName: batchLabel
    });
    data.notifications = data.notifications.slice(0, 100);
    apiSyncAllData(data);

    return {
      success: true,
      material: newMaterial,
      driveUrl: driveUrl,
      downloadUrl: downloadUrl,
      fileId: fileId,
      fileName: fileName,
      fileSize: fileSizeMB,
      uploadTargetFolder: folder.getUrl()
    };
  } catch (err) {
    Logger.log('apiUploadMaterialToDrive error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Deletes a material from the Cloud DB, trashes its Drive file (if any),
 * and rewrites the Materials_Repository sheet without that row.
 * Used to clean up legacy fake-upload records that have no download link.
 */
function apiDeleteMaterial(materialId) {
  try {
    const data = apiGetInitialData();
    if (!data.materials) data.materials = [];
    const mat = data.materials.find(m => m.id === materialId);
    if (!mat) return { success: false, error: 'Material not found' };

    // Trash the Drive file so storage does not leak (no-op for legacy rows)
    if (mat.driveFileId) {
      try { DriveApp.getFileById(mat.driveFileId).setTrashed(true); } catch (e) { Logger.log('Drive trash skipped: ' + e.toString()); }
    }

    data.materials = data.materials.filter(m => m.id !== materialId);
    apiSyncAllData(data);
    return { success: true, materialId: materialId, title: mat.title };
  } catch (err) {
    Logger.log('apiDeleteMaterial error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Lightweight poll API: returns the notifications table only.
 * The frontend polls this every 20s so new uploads trigger an
 * in-app sound + badge on clients that are already open.
 */
function apiGetNotifications() {
  try {
    const notifs = dbGetTable('notifications');
    return Array.isArray(notifs) ? notifs : [];
  } catch (err) {
    Logger.log('apiGetNotifications error: ' + err.toString());
    return [];
  }
}

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
        studentIds: ['s1', 's2', 's3', 's4', 's10']
      },
      {
        id: 'b2',
        name: 'NEET Medical Dropper & Foundation (Bio-Elite)',
        subject: 'Botany, Zoology, Physics & Chemistry',
        schedule: 'Mon - Sat • 01:30 PM - 06:00 PM',
        room: 'Medical Hall 202',
        teacher: 'Dr. Sunita Sharma (M.D. AIIMS)',
        studentIds: ['s5', 's6', 's7']
      },
      {
        id: 'b3',
        name: 'Class 10th CBSE Board Excellence & NTSE',
        subject: 'Science, Mathematics & Social Science',
        schedule: 'Tue, Thu, Sat • 04:30 PM - 07:00 PM',
        room: 'Classroom 104',
        teacher: 'Mr. Arvind Verma (M.Sc. Gold Medalist)',
        studentIds: ['s8', 's9']
      }
    ],
    students: [
      { id: 's1', roll: 'DC-101', name: 'Aarav Sharma', phone: '+91 98765 43210', parentName: 'Rajesh Sharma', totalFee: 48000, paidFee: 32000, dueDate: '2026-10-25', lastReminder: '2 days ago', password: 'password123', status: 'Active' },
      { id: 's2', roll: 'DC-102', name: 'Priya Patel', phone: '+91 98234 56789', parentName: 'Mukesh Patel', totalFee: 48000, paidFee: 48000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's3', roll: 'DC-103', name: 'Rohan Gupta', phone: '+91 97112 23344', parentName: 'Sanjay Gupta', totalFee: 48000, paidFee: 16000, dueDate: '2026-10-18', lastReminder: 'Never', password: 'password123', status: 'Active' },
      { id: 's4', roll: 'DC-104', name: 'Sneha Iyer', phone: '+91 98989 12345', parentName: 'Venkatesh Iyer', totalFee: 48000, paidFee: 48000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's5', roll: 'DC-201', name: 'Kabir Khan', phone: '+91 99110 02233', parentName: 'Imran Khan', totalFee: 52000, paidFee: 26000, dueDate: '2026-10-20', lastReminder: '5 days ago', password: 'password123', status: 'Active' },
      { id: 's6', roll: 'DC-202', name: 'Ananya Singh', phone: '+91 96543 21098', parentName: 'Virendra Singh', totalFee: 52000, paidFee: 52000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's7', roll: 'DC-203', name: 'Devansh Joshi', phone: '+91 95551 12233', parentName: 'Prakash Joshi', totalFee: 52000, paidFee: 36000, dueDate: '2026-10-28', lastReminder: 'Never', password: 'password123', status: 'Active' },
      { id: 's8', roll: 'DC-301', name: 'Ishita Das', phone: '+91 94443 32211', parentName: 'Subhash Das', totalFee: 30000, paidFee: 22000, dueDate: '2026-10-22', lastReminder: 'Never', password: 'password123', status: 'Active' },
      { id: 's9', roll: 'DC-302', name: 'Yashvardhan Chauhan', phone: '+91 93123 45678', parentName: 'Manoj Chauhan', totalFee: 30000, paidFee: 30000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' },
      { id: 's10', roll: 'DC-110', name: 'Anil Kumar Chahar', phone: '+91 95556 78753', parentName: 'Rajesh Chahar', totalFee: 50000, paidFee: 25000, dueDate: '2026-10-30', lastReminder: '1 day ago', password: 'password123', status: 'Active' },
      { id: 's11', roll: 'DC-105', name: 'Radhika Chahar', phone: '+91 95556 78754', parentName: 'Anil Chahar', totalFee: 48000, paidFee: 48000, dueDate: 'Paid', lastReminder: '-', password: 'password123', status: 'Active' }
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
        fileName: 'Rotational_Dynamics_DPP_05.pdf',
        fileType: 'pdf',
        downloadUrl: 'https://drive.google.com/',
        driveUrl: 'https://drive.google.com/',
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
        fileName: 'Chemical_Equilibrium_Booster_Sheet.pdf',
        fileType: 'pdf',
        downloadUrl: 'https://drive.google.com/',
        driveUrl: 'https://drive.google.com/',
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
        fileName: 'JEE_Mock_Test_03_Paper_and_Solutions.pdf',
        fileType: 'pdf',
        downloadUrl: 'https://drive.google.com/',
        driveUrl: 'https://drive.google.com/',
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
        fileName: 'NEET_Human_Genetics_NCERT_Drill.pdf',
        fileType: 'pdf',
        downloadUrl: 'https://drive.google.com/',
        driveUrl: 'https://drive.google.com/',
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
      facebookUrl: 'https://facebook.com',
      instagramUrl: 'https://instagram.com',
      youtubeUrl: 'https://www.youtube.com/@chem_crush9',
      adminName: 'Er. Rajesh Chahar',
      adminPassword: 'admin123',
      adminEmail: '',
      showRequirementLabels: true,
      allowAdminFeedbackDelete: true,
      allowAdminLinkDelete: true,
      showDummyData: true
    }
  };
  ['batches', 'students', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'].forEach(function(col) {
    (data[col] || []).forEach(function(rec) { rec.isDummy = true; });
  });
  // Note: externalLinks (study links l1-l5) are NEVER marked dummy — they stay
  // visible for clients even when demo data is hidden.
  return data;
}

/**
 * ============================================================================
 * DUMMY / DEMO DATA TOGGLE (Developer controlled via Settings)
 * ============================================================================
 * settings.showDummyData === false  → seed/demo records are hidden from the
 * portal but NEVER deleted from the database, so flipping the toggle back ON
 * restores them instantly.
 */

const DUMMY_SEED_ID_SET = (function() {
  const set = {};
  // Note: l1-l5 (external study links) are intentionally NOT in this set —
  // they are always visible, even when dummy/demo data is hidden.
  ['b1', 'b2', 'b3',
    's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11',
    'm1', 'm2', 'm3', 'm4', 'm5',
    't1', 't2', 't3', 't4',
    'tr1', 'tr2', 'tr3', 'tr4',
    'g1', 'g2', 'g3', 'g4',
    'f1', 'f2', 'f3'
  ].forEach(function(id) { set[id] = true; });
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
  (appData.students || []).forEach(function(s) {
    if (s && isDummyRecord_(s)) dummyStudentIds[s.id] = true;
  });
  ['students', 'batches', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'].forEach(function(tbl) {
    appData[tbl] = (appData[tbl] || []).filter(function(r) { return !isDummyRecord_(r); });
  });
  (appData.batches || []).forEach(function(b) {
    if (Array.isArray(b.studentIds)) {
      b.studentIds = b.studentIds.filter(function(id) { return !dummyStudentIds[id]; });
    }
  });
  (appData.offlineTests || []).forEach(function(t) {
    if (t && t.marks && typeof t.marks === 'object') {
      Object.keys(dummyStudentIds).forEach(function(sid) { delete t.marks[sid]; });
    }
  });
  return appData;
}

// Re-injects missing dummy records (from current DB or seed) so client syncs
// that carry a stripped state can never permanently wipe demo data.
function restoreDummyData_(incoming) {
  if (!incoming) return incoming;
  let cur = null;
  try { cur = dbLoadAll(); } catch (e) {}
  const incomingOff = !incoming.settings || incoming.settings.showDummyData === false;
  const dbWasOff = !!(cur && cur.settings && cur.settings.showDummyData === false);
  // Restore when the client sends a stripped view (toggle OFF), or when the
  // toggle was just flipped back ON from a previously-stripped session
  // (client state is still missing the dummy records at that moment).
  if (!incomingOff && !dbWasOff) return incoming;
  const src = cur || getDefaultSeedData();
  const dummyStudentIds = {};
  // externalLinks excluded — study links are never stripped, so no restore needed
  ['batches', 'students', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'].forEach(function(tbl) {
    if (!Array.isArray(incoming[tbl])) incoming[tbl] = [];
    const have = {};
    incoming[tbl].forEach(function(r) { if (r && r.id) have[r.id] = true; });
    (src[tbl] || []).forEach(function(r) {
      if (r && r.id && !have[r.id] && isDummyRecord_(r)) incoming[tbl].push(r);
    });
  });
  (src.students || []).forEach(function(s) {
    if (s && isDummyRecord_(s)) dummyStudentIds[s.id] = true;
  });
  // Restore stripped dummy student references in batches/tests that still exist
  (incoming.batches || []).forEach(function(b) {
    if (!Array.isArray(b.studentIds)) b.studentIds = [];
    Object.keys(dummyStudentIds).forEach(function(sid) {
      const orig = (src.batches || []).find(function(ob) { return ob.id === b.id; });
      if (orig && Array.isArray(orig.studentIds) && orig.studentIds.indexOf(sid) !== -1 && b.studentIds.indexOf(sid) === -1) {
        b.studentIds.push(sid);
      }
    });
  });
  return incoming;
}

/**
 * ============================================================================
 * CLOUD DATABASE ENGINE (PropertiesService Persistent NoSQL Store)
 * ============================================================================
 * Primary database engine that runs independently of Google Sheets.
 * Stores tables (students, batches, teachers, tests, materials, settings, etc.)
 * with ultra-fast persistent access across all users and executions.
 */

const DB_TABLES = ['batches', 'students', 'materials', 'offlineTests', 'teachers', 'gallery', 'externalLinks', 'feedbacks', 'settings', 'notifications'];

function dbGetTable(tableName) {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty('DB_' + tableName);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    Logger.log('dbGetTable error for ' + tableName + ': ' + err.toString());
  }
  return null;
}

function dbSetTable(tableName, tableData) {
  try {
    PropertiesService.getScriptProperties().setProperty('DB_' + tableName, JSON.stringify(tableData));
    return true;
  } catch (err) {
    Logger.log('dbSetTable error for ' + tableName + ': ' + err.toString());
    return false;
  }
}

function dbLoadAll() {
  const result = {};
  let count = 0;
  DB_TABLES.forEach(function(tbl) {
    const data = dbGetTable(tbl);
    if (data !== null) {
      result[tbl] = data;
      count++;
    }
  });
  return count > 0 ? result : null;
}

function dbSaveAll(fullData) {
  if (!fullData) return false;
  DB_TABLES.forEach(function(tbl) {
    if (fullData[tbl] !== undefined) {
      dbSetTable(tbl, fullData[tbl]);
    }
  });
  return true;
}

/**
 * ============================================================================
 * DELETION TOMBSTONES (sheet deletions are PERMANENT)
 * ============================================================================
 * When a row is deleted from Students_Master / External_Links_Hub, its roll
 * no / URL is remembered here forever. Any later save (even from a stale
 * browser tab that still holds the record) is stripped of tombstoned entries,
 * so manually deleted records can NEVER reappear. Re-adding the row in the
 * sheet clears its tombstone and the record comes back.
 */
function getTombstones_(key) {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty('DB_tomb_' + key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function addTombstones_(key, values) {
  if (!values || !values.length) return;
  try {
    const cur = getTombstones_(key);
    values.forEach(function(v) {
      v = String(v || '').trim();
      if (v && cur.indexOf(v) === -1) cur.push(v);
    });
    PropertiesService.getScriptProperties().setProperty('DB_tomb_' + key, JSON.stringify(cur.slice(-500)));
  } catch (e) {
    Logger.log('addTombstones_ error: ' + e.toString());
  }
}

function clearTombstone_(key, value) {
  value = String(value || '').trim();
  if (!value) return;
  try {
    const cur = getTombstones_(key);
    const i = cur.indexOf(value);
    if (i !== -1) {
      cur.splice(i, 1);
      PropertiesService.getScriptProperties().setProperty('DB_tomb_' + key, JSON.stringify(cur));
    }
  } catch (e) {}
}

// Strips tombstoned students (by roll) and links (by URL) from a data object.
function applyTombstones_(appData) {
  if (!appData) return appData;
  const deadRolls = getTombstones_('rolls');
  const deadUrls = getTombstones_('linkUrls');

  if (deadRolls.length && Array.isArray(appData.students)) {
    const rollSet = {};
    deadRolls.forEach(function(r) { rollSet[r] = true; });
    const removedIds = {};
    appData.students = appData.students.filter(function(s) {
      if (s && s.roll && rollSet[String(s.roll).trim()]) {
        if (s.id) removedIds[s.id] = true;
        return false;
      }
      return true;
    });
    if (Object.keys(removedIds).length > 0) {
      (appData.batches || []).forEach(function(b) {
        if (Array.isArray(b.studentIds)) {
          b.studentIds = b.studentIds.filter(function(id) { return !removedIds[id]; });
        }
      });
      (appData.offlineTests || []).forEach(function(t) {
        if (t && t.marks && typeof t.marks === 'object') {
          Object.keys(removedIds).forEach(function(sid) { delete t.marks[sid]; });
        }
      });
    }
  }

  if (deadUrls.length && Array.isArray(appData.externalLinks)) {
    const urlSet = {};
    deadUrls.forEach(function(u) { urlSet[u] = true; });
    appData.externalLinks = appData.externalLinks.filter(function(l) {
      return !(l && l.url && deadUrls.indexOf(String(l.url).trim()) !== -1);
    });
  }
  return appData;
}

/**
 * Dynamically merges student records from the Students_Master Google Sheet tab.
 * Adding a row in the sheet (Roll No + Name) creates a new student in the app;
 * editing a row (password, fees, status, contact…) updates the matching student.
 * Students that exist only in the app are preserved. Runs on every data load,
 * so sheet edits appear in the portal on the next refresh.
 */
function mergeStudentsFromSheet_(appData) {
  try {
    const ss = getDbSpreadsheet();
    if (!ss) return appData;
    const sheet = ss.getSheetByName('Students_Master');
    if (!sheet) return appData;
    const values = sheet.getDataRange().getValues();
    // 0 rows = truly empty sheet (likely transient read) → leave data alone.
    // 1 row that looks like the header = ALL data rows deleted by the user →
    // proceed with an empty keep-set so every student is removed + tombstoned.
    if (!values || values.length === 0) return appData;
    if (values.length === 1) {
      const h = String(values[0][0] || '').toLowerCase();
      if (h.indexOf('roll') === -1) return appData; // not a header — leave alone
    }

    if (!appData.students) appData.students = [];
    const tz = Session.getScriptTimeZone();
    let added = 0, updated = 0;
    // Rolls present in the sheet clear their tombstone (row was re-added)
    const sheetRollsNow = {};
    for (let i = 1; i < values.length; i++) {
      const r = String(values[i][0] || '').trim();
      if (r) sheetRollsNow[r] = true;
    }
    getTombstones_('rolls').forEach(function(r) {
      if (sheetRollsNow[r]) clearTombstone_('rolls', r);
    });

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const roll = String(row[0] || '').trim();
      const name = String(row[1] || '').trim();
      if (!roll && !name) continue;

      const password = String(row[2] || '').trim() || 'password123';
      const statusRaw = String(row[3] || 'Active').trim();
      const status = /block/i.test(statusRaw) ? 'Blocked' : (/inactive/i.test(statusRaw) ? 'Inactive' : 'Active');
      const parentName = String(row[4] || '').trim();
      const phone = String(row[5] || '').trim();
      const totalFee = Number(row[6]) || 0;
      const paidFee = Number(row[7]) || 0;
      let dueDate = row[9];
      if (dueDate instanceof Date && !isNaN(dueDate)) {
        dueDate = Utilities.formatDate(dueDate, tz, 'dd MMM yyyy');
      } else {
        dueDate = String(dueDate || '').trim();
      }
      const lastReminder = String(row[10] || '').trim() || 'Never';

      let stu = null;
      if (roll) {
        stu = appData.students.find(function(s) { return String(s.roll || '').trim() === roll; });
      }
      // Name fallback only for rows WITHOUT a roll — so two people sharing the
      // same name (e.g. DC-110 & DC-111) don't overwrite each other.
      if (!stu && !roll && name) {
        stu = appData.students.find(function(s) { return String(s.name || '').trim() === name; });
      }

      if (stu) {
        stu.roll = roll || stu.roll;
        stu.name = name || stu.name;
        stu.password = password;
        stu.status = status;
        stu.parentName = parentName || stu.parentName;
        stu.phone = phone || stu.phone;
        stu.totalFee = totalFee;
        stu.paidFee = paidFee;
        if (dueDate && !/^fully paid$/i.test(dueDate)) stu.dueDate = dueDate;
        stu.lastReminder = lastReminder;
        updated++;
      } else {
        const slug = roll ? roll.toLowerCase().replace(/[^a-z0-9]/g, '') : Date.now().toString(36);
        appData.students.push({
          id: 's_' + slug + '_' + i,
          roll: roll || ('DC-' + (100 + appData.students.length + 1)),
          name: name || 'Unnamed Student',
          password: password,
          status: status,
          parentName: parentName,
          phone: phone,
          totalFee: totalFee,
          paidFee: paidFee,
          dueDate: /^fully paid$/i.test(dueDate) ? '' : dueDate,
          lastReminder: lastReminder,
          photo: null
        });
        added++;
      }
    }

    // Honor row deletions: the sheet is the master roster. Any student whose
    // roll/name no longer appears in the sheet is removed from the app, so a
    // deleted row stays deleted (the sheet rewrite no longer resurrects it).
    {
      const keepRolls = {};
      const keepNames = {};
      for (let i = 1; i < values.length; i++) {
        const r = String(values[i][0] || '').trim();
        const n = String(values[i][1] || '').trim();
        if (r) keepRolls[r] = true;
        if (n) keepNames[n] = true;
      }
      const removedIds = {};
      const removedRolls = [];
      const kept = [];
      appData.students.forEach(function(s) {
        const roll = String(s.roll || '').trim();
        const name = String(s.name || '').trim();
        // Keep if the student's roll row exists; name fallback only for roll-less records
        if ((roll && keepRolls[roll]) || (!roll && name && keepNames[name])) {
          kept.push(s);
        } else {
          if (s.id) removedIds[s.id] = true;
          if (roll) removedRolls.push(roll);
        }
      });
      if (Object.keys(removedIds).length > 0) {
        appData.students = kept;
        (appData.batches || []).forEach(function(b) {
          if (Array.isArray(b.studentIds)) {
            b.studentIds = b.studentIds.filter(function(id) { return !removedIds[id]; });
          }
        });
        (appData.offlineTests || []).forEach(function(t) {
          if (t && t.marks && typeof t.marks === 'object') {
            Object.keys(removedIds).forEach(function(sid) { delete t.marks[sid]; });
          }
        });
        // PERMANENT: tombstone deleted rolls so no future save can resurrect them
        addTombstones_('rolls', removedRolls);
        Logger.log('Students_Master deletions honored: ' + Object.keys(removedIds).length + ' student(s) removed (tombstoned)');
      }
    }

    if (added || updated) {
      Logger.log('Students_Master sheet merge: ' + added + ' added, ' + updated + ' updated');
    }
  } catch (e) {
    Logger.log('mergeStudentsFromSheet_ error: ' + e.toString());
  }
  return appData;
}

/**
 * Dynamically merges external study links from the External_Links_Hub sheet tab.
 * Sheet columns: Link ID | Resource Title | Provider / Portal | Subject Tag |
 *                External URL | Google Drive Shortcut Link | Description | Date Added
 * Adding a row creates a new link in the app; editing a row updates the match.
 * Study links are ALWAYS visible to admin/teacher/student (never dummy-stripped).
 */
function mergeLinksFromSheet_(appData) {
  try {
    const ss = getDbSpreadsheet();
    if (!ss) return appData;
    const sheet = ss.getSheetByName('External_Links_Hub');
    if (!sheet) return appData;
    const values = sheet.getDataRange().getValues();
    // 0 rows = truly empty sheet (likely transient read) → leave data alone.
    // 1 row that looks like the header = ALL link rows deleted by the user →
    // proceed with an empty keep-set so every link is removed + tombstoned.
    if (!values || values.length === 0) return appData;
    if (values.length === 1) {
      const h0 = String(values[0][0] || '').toLowerCase();
      const h4 = String(values[0][4] || '').toLowerCase();
      if (h0.indexOf('link') === -1 && h4.indexOf('url') === -1) return appData;
    }

    if (!appData.externalLinks) appData.externalLinks = [];
    const tz = Session.getScriptTimeZone();
    let added = 0, updated = 0;
    // URLs present in the sheet clear their tombstone (row was re-added)
    const sheetUrlsNow = {};
    for (let i = 1; i < values.length; i++) {
      const u = String(values[i][4] || '').trim();
      if (u) sheetUrlsNow[u] = true;
    }
    getTombstones_('linkUrls').forEach(function(u) {
      if (sheetUrlsNow[u]) clearTombstone_('linkUrls', u);
    });

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const id = String(row[0] || '').trim();
      const title = String(row[1] || '').trim();
      const provider = String(row[2] || '').trim();
      const subject = String(row[3] || '').trim();
      const url = String(row[4] || '').trim();
      const driveUrl = String(row[5] || '').trim();
      const description = String(row[6] || '').trim();
      let dateAdded = row[7];
      if (dateAdded instanceof Date && !isNaN(dateAdded)) {
        dateAdded = Utilities.formatDate(dateAdded, tz, 'dd MMM yyyy');
      } else {
        dateAdded = String(dateAdded || '').trim();
      }
      if (!title && !url) continue;

      let link = null;
      if (id) {
        link = appData.externalLinks.find(function(l) { return String(l.id || '').trim() === id; });
      }
      if (!link && url) {
        link = appData.externalLinks.find(function(l) { return String(l.url || '').trim() === url; });
      }

      if (link) {
        link.id = id || link.id;
        link.title = title || link.title;
        link.provider = provider || link.provider;
        link.subject = subject || link.subject;
        link.url = url || link.url;
        if (driveUrl) link.driveUrl = driveUrl;
        link.description = description || link.description;
        if (dateAdded) link.dateAdded = dateAdded;
        updated++;
      } else {
        appData.externalLinks.push({
          id: id || ('l_sheet_' + i + '_' + Date.now()),
          title: title || 'Untitled Study Resource',
          provider: provider || 'External Portal',
          subject: subject || 'General Studies',
          url: url,
          driveUrl: driveUrl || '',
          description: description,
          dateAdded: dateAdded || '',
          icon: 'fa-globe',
          color: 'bg-indigo-600'
        });
        added++;
      }
    }

    // Honor row deletions: links removed from the sheet are removed from the app
    // (matches by Link ID or URL) AND tombstoned so they can never reappear.
    {
      const keepIds = {};
      const keepUrls = {};
      for (let i = 1; i < values.length; i++) {
        const rid = String(values[i][0] || '').trim();
        const rurl = String(values[i][4] || '').trim();
        if (rid) keepIds[rid] = true;
        if (rurl) keepUrls[rurl] = true;
      }
      const deadUrls = [];
      const beforeCount = appData.externalLinks.length;
      appData.externalLinks = appData.externalLinks.filter(function(l) {
        const lid = String(l.id || '').trim();
        const lurl = String(l.url || '').trim();
        const alive = (lid && keepIds[lid]) || (lurl && keepUrls[lurl]);
        if (!alive && lurl) deadUrls.push(lurl);
        return alive;
      });
      const removedLinks = beforeCount - appData.externalLinks.length;
      if (removedLinks > 0) {
        addTombstones_('linkUrls', deadUrls);
        Logger.log('External_Links_Hub deletions honored: ' + removedLinks + ' link(s) removed (tombstoned)');
      }
    }

    if (added || updated) {
      Logger.log('External_Links_Hub sheet merge: ' + added + ' added, ' + updated + ' updated');
    }
  } catch (e) {
    Logger.log('mergeLinksFromSheet_ error: ' + e.toString());
  }
  return appData;
}

/**
 * Initializes or returns the Database records
 * Primary source is Cloud Database (PropertiesService)
 * Students are dynamically merged from the Students_Master sheet tab
 * Student access (Active/Blocked) is controlled from the app UI only
 */
function apiGetInitialData() {
  try {
    // 1. Primary Source: Cloud Database (PropertiesService)
    let appData = dbLoadAll();

    // 2. Fallback: If database is not initialized yet, check sheet DB_JSON or seed data
    if (!appData) {
      const ss = getDbSpreadsheet();
      if (ss) {
        const dataSheet = ss.getSheetByName('DB_JSON');
        if (dataSheet) {
          const val = dataSheet.getRange(1, 1).getValue();
          if (val && typeof val === 'string' && val.trim().startsWith('{')) {
            try { appData = JSON.parse(val); } catch (e) {}
          }
        }
      }
    }

    if (!appData) {
      appData = getDefaultSeedData();
    }

    // 2b. Dynamically merge students added/edited in the Students_Master sheet tab
    appData = mergeStudentsFromSheet_(appData);

    // 2c. Dynamically merge study links from the External_Links_Hub sheet tab
    //     (always visible to admin/teacher/student — never dummy-stripped)
    appData = mergeLinksFromSheet_(appData);
    // Safety: curated study portals are permanent — re-seed if list ended up empty
    if (!appData.externalLinks || appData.externalLinks.length === 0) {
      appData.externalLinks = getDefaultSeedData().externalLinks;
    }

    // 2d. Strip manually-deleted (tombstoned) records — deletions are forever
    appData = applyTombstones_(appData);

    // 3. Student access (Active/Blocked) and roster membership are controlled
    //    from the app UI and the Students_Master sheet — no forced records.

    // Address normalization: migrate legacy "Club Road" spelling to "Club Rd"
    if (appData.settings && typeof appData.settings.address === 'string' &&
        /Paschimpuri Pocket 2, Club Road New Delhi/i.test(appData.settings.address)) {
      appData.settings.address = appData.settings.address
        .replace(/Club Road/i, 'Club Rd');
    }

    // Persist verified state in the Cloud Database
    dbSaveAll(appData);

    // Auto-restructure Google Sheet tabs with Calibri size 10
    try {
      const ss = getDbSpreadsheet();
      if (ss) {
        syncReadableSheets(ss, appData);
      }
    } catch (sheetSyncErr) {
      Logger.log('Sheet sync in apiGetInitialData: ' + sheetSyncErr.toString());
    }

    // Developer toggle: hide seed/demo records from clients (DB keeps them)
    return stripDummyData_(appData);
  } catch (err) {
    Logger.log('apiGetInitialData error: ' + err.toString());
    const seed = getDefaultSeedData();
    dbSaveAll(seed);
    return seed;
  }
}

/**
 * Direct Database API: Alias to save state to Cloud Database
 */
function apiDatabaseSave(fullData) {
  return apiSyncAllData(fullData);
}

/**
 * Direct Database API: Query database or single table
 */
function apiDatabaseGet(tableName) {
  if (tableName) {
    return dbGetTable(tableName);
  }
  return apiGetInitialData();
}

/**
 * Direct Database API: Update a student's status (Active vs Blocked)
 */
function apiDatabaseUpdateStudentStatus(studentIdOrRoll, newStatus) {
  // Operate on full DB data (not the dummy-stripped client view) so saving
  // never wipes seed/demo records when settings.showDummyData is false.
  let data = dbLoadAll();
  if (!data) data = getDefaultSeedData();
  const student = (data.students || []).find(function(s) { 
    return s.id === studentIdOrRoll || s.roll === studentIdOrRoll; 
  });
  if (!student) return { success: false, message: 'Student not found in database' };
  student.status = (String(newStatus).toLowerCase() === 'blocked') ? 'Blocked' : 'Active';
  dbSaveAll(data);
  return { success: true, student: student };
}

/**
 * Syncs full application state to the Primary Cloud Database
 * and optional background mirror to Google Sheets
 */
function apiSyncAllData(fullData) {
  try {
    // 0. Dummy-data safety: if client state was stripped (showDummyData off),
    //    re-inject seed/demo records so a sync never permanently deletes them.
    try { restoreDummyData_(fullData); } catch (dummyErr) {
      Logger.log('restoreDummyData_ notice: ' + dummyErr.toString());
    }

    // 0b. Deletion safety: strip tombstoned (manually sheet-deleted) records so
    //     a stale browser tab can NEVER resurrect a deleted student/link.
    try { applyTombstones_(fullData); } catch (tombErr) {
      Logger.log('applyTombstones_ notice: ' + tombErr.toString());
    }

    // 1. Primary write: Cloud Database (instant, isolated, persistent)
    dbSaveAll(fullData);

    // 2. Secondary background mirror: Update Google Sheet if available
    try {
      const ss = getDbSpreadsheet();
      if (ss) {
        let jsonSheet = ss.getSheetByName('DB_JSON');
        if (!jsonSheet) {
          jsonSheet = ss.insertSheet('DB_JSON');
          jsonSheet.hideSheet();
        }
        jsonSheet.getRange(1, 1).setValue(JSON.stringify(fullData));
        syncReadableSheets(ss, fullData);
      }
    } catch (sheetErr) {
      Logger.log('Secondary sheet mirror notice (database is primary): ' + sheetErr.toString());
    }

    return { 
      success: true, 
      storage: 'cloud_database', 
      timestamp: new Date().toISOString() 
    };
  } catch (err) {
    Logger.log('Database sync error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Helper to retrieve an existing sheet or rename a legacy sheet, or create if absent
 */
function getOrCreateSheet(ss, targetName, legacyNames) {
  let sheet = ss.getSheetByName(targetName);
  if (!sheet && legacyNames && legacyNames.length > 0) {
    for (let i = 0; i < legacyNames.length; i++) {
      const oldSheet = ss.getSheetByName(legacyNames[i]);
      if (oldSheet) {
        oldSheet.setName(targetName);
        sheet = oldSheet;
        break;
      }
    }
  }
  if (!sheet) {
    sheet = ss.insertSheet(targetName);
  }
  return sheet;
}

/**
 * Universal Formatter for all Google Sheet tabs:
 * 1. Enforces Font Family 'Calibri' across all cells
 * 2. Enforces Font Size 10 across all cells
 * 3. Freezes header row (Row 1) with 28px height, bold font, and custom color
 * 4. Trims all unnecessary blank trailing columns and rows
 * 5. Sets tab color for instant visual navigation
 * 6. Auto-resizes column widths
 */
function formatAndTrimSheet(sheet, numColumns, numRows, headerColor, tabColor) {
  try {
    // 1. Freeze header row
    sheet.setFrozenRows(1);

    // 2. Adjust columns: ensure exactly numColumns exist, delete trailing blank columns
    const maxCols = sheet.getMaxColumns();
    if (maxCols > numColumns) {
      sheet.deleteColumns(numColumns + 1, maxCols - numColumns);
    } else if (maxCols < numColumns) {
      sheet.insertColumnsAfter(maxCols, numColumns - maxCols);
    }

    // 3. Trim extra blank rows (leave 1 row padding for clean boundary)
    const maxRows = sheet.getMaxRows();
    const neededRows = Math.max(numRows, 2);
    if (maxRows > neededRows + 1) {
      sheet.deleteRows(neededRows + 2, maxRows - (neededRows + 1));
    }

    // 4. Set entire active range to Calibri, Font Size 10
    const fullRange = sheet.getRange(1, 1, Math.min(sheet.getMaxRows(), neededRows + 1), numColumns);
    fullRange.setFontFamily('Calibri');
    fullRange.setFontSize(10);
    fullRange.setVerticalAlignment('middle');

    // 5. Header row styling (Calibri, Size 10, Bold, Header Background, White Text)
    const headerRange = sheet.getRange(1, 1, 1, numColumns);
    headerRange.setFontFamily('Calibri');
    headerRange.setFontSize(10);
    headerRange.setFontWeight('bold');
    if (headerColor) {
      headerRange.setBackground(headerColor);
      headerRange.setFontColor('#ffffff');
    }
    sheet.setRowHeight(1, 28);

    // 6. Set tab color if supported
    if (tabColor && sheet.setTabColor) {
      sheet.setTabColor(tabColor);
    }

    // 7. Auto-fit column widths
    sheet.autoResizeColumns(1, numColumns);
  } catch (err) {
    Logger.log('Formatting error on ' + sheet.getName() + ': ' + err.toString());
  }
}

/**
 * Generates human-friendly Google Sheets tab views for the client
 * Includes Login Passwords and Access Status (Active vs Blocked) columns,
 * freezes the first header row on each tab, and deletes blank columns automatically.
 */
function syncReadableSheets(ss, data) {
  try {
    // A. Sync Students Sheet with Passwords and Authorization Status
    if (data.students && data.students.length > 0) {
      let stuSheet = ss.getSheetByName('Students_Master');
      if (!stuSheet) {
        stuSheet = ss.insertSheet('Students_Master');
      }
      stuSheet.clear();
      const headers = ['Roll No', 'Student Name', 'Login Password', 'Access Status', 'Parent Name', 'Contact Phone', 'Total Fee (INR)', 'Paid Fee (INR)', 'Pending Dues (INR)', 'Fee Due Date', 'Last Reminder Sent'];
      const rows = [headers];
      data.students.forEach(function(s) {
        const balance = (s.totalFee || 0) - (s.paidFee || 0);
        rows.push([
          s.roll || '',
          s.name || '',
          s.password || 'password123',
          s.status || 'Active',
          s.parentName || '',
          s.phone || '',
          s.totalFee || 0,
          s.paidFee || 0,
          balance,
          balance <= 0 ? 'Fully Paid' : (s.dueDate || 'Pending'),
          s.lastReminder || 'Never'
        ]);
      });
      stuSheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
      stuSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
      
      // Highlight Access Status column (Active in green, Blocked in rose, Inactive in grey)
      for (let i = 1; i < rows.length; i++) {
        const statusCell = stuSheet.getRange(i + 1, 4);
        if (rows[i][3] === 'Blocked') {
          statusCell.setBackground('#fee2e2').setFontColor('#991b1b').setFontWeight('bold');
        } else if (rows[i][3] === 'Inactive') {
          statusCell.setBackground('#f1f5f9').setFontColor('#64748b').setFontWeight('bold');
        } else {
          statusCell.setBackground('#dcfce7').setFontColor('#166534').setFontWeight('bold');
        }
      }
      
      // Freeze header row and delete all blank columns
      formatAndTrimSheet(stuSheet, headers.length, rows.length);
    }

    // B. Sync Teachers Sheet with Login Email, Passwords and Access Status
    if (data.teachers && data.teachers.length > 0) {
      let teachSheet = ss.getSheetByName('Teachers_Roster');
      if (!teachSheet) {
        teachSheet = ss.insertSheet('Teachers_Roster');
      }
      teachSheet.clear();
      const trHeaders = ['Teacher ID', 'Teacher Name', 'Subject', 'Login Email', 'Login Password', 'Access Status', 'Contact Phone', 'Qualification', 'Experience'];
      const trRows = [trHeaders];
      data.teachers.forEach(function(tr) {
        trRows.push([
          tr.id || '',
          tr.name || '',
          tr.subject || '',
          tr.email || '',
          tr.password || 'teacher123',
          tr.status || 'Active',
          tr.phone || '',
          tr.qualification || '',
          tr.experience || ''
        ]);
      });
      teachSheet.getRange(1, 1, trRows.length, trHeaders.length).setValues(trRows);
      teachSheet.getRange(1, 1, 1, trHeaders.length).setFontWeight('bold').setBackground('#0284c7').setFontColor('#ffffff');
      for (let i = 1; i < trRows.length; i++) {
        const statusCell = teachSheet.getRange(i + 1, 6);
        if (trRows[i][5] === 'Blocked') {
          statusCell.setBackground('#fee2e2').setFontColor('#991b1b').setFontWeight('bold');
        } else if (trRows[i][5] === 'Inactive') {
          statusCell.setBackground('#f1f5f9').setFontColor('#64748b').setFontWeight('bold');
        } else {
          statusCell.setBackground('#dcfce7').setFontColor('#166534').setFontWeight('bold');
        }
      }
      formatAndTrimSheet(teachSheet, trHeaders.length, trRows.length);
    }

    // C. Sync Batches Sheet
    if (data.batches && data.batches.length > 0) {
      let batchSheet = ss.getSheetByName('Batches_Roster');
      if (!batchSheet) {
        batchSheet = ss.insertSheet('Batches_Roster');
      }
      batchSheet.clear();
      const bHeaders = ['Batch ID', 'Batch Name', 'Subjects', 'Schedule', 'Classroom / Hall', 'Lead Faculty', 'Student Count'];
      const bRows = [bHeaders];
      data.batches.forEach(function(b) {
        bRows.push([
          b.id || '',
          b.name || '',
          b.subject || '',
          b.schedule || '',
          b.room || '',
          b.teacher || '',
          (b.studentIds || []).length
        ]);
      });
      batchSheet.getRange(1, 1, bRows.length, bHeaders.length).setValues(bRows);
      batchSheet.getRange(1, 1, 1, bHeaders.length).setFontWeight('bold').setBackground('#059669').setFontColor('#ffffff');
      formatAndTrimSheet(batchSheet, bHeaders.length, bRows.length);
    }

    // D. Sync Offline Tests
    if (data.offlineTests && data.offlineTests.length > 0) {
      let testSheet = ss.getSheetByName('Offline_Test_Marks');
      if (!testSheet) {
        testSheet = ss.insertSheet('Offline_Test_Marks');
      }
      testSheet.clear();
      const tHeaders = ['Test ID', 'Test Title', 'Subject', 'Date', 'Max Marks', 'Student Name', 'Marks Obtained', 'Percentage', 'Teacher Remarks'];
      const tRows = [tHeaders];
      
      const studentMap = {};
      (data.students || []).forEach(function(s) { studentMap[s.id] = s.name + ' (' + s.roll + ')'; });

      data.offlineTests.forEach(function(t) {
        const marks = t.marks || {};
        Object.keys(marks).forEach(function(sid) {
          const entry = marks[sid] || {};
          const pct = t.maxMarks ? Math.round((entry.score / t.maxMarks) * 100) + '%' : '-';
          tRows.push([
            t.id,
            t.title,
            t.subject,
            t.date,
            t.maxMarks,
            studentMap[sid] || sid,
            entry.score !== undefined ? entry.score : '',
            pct,
            entry.remarks || ''
          ]);
        });
      });

      if (tRows.length > 1) {
        testSheet.getRange(1, 1, tRows.length, tHeaders.length).setValues(tRows);
        testSheet.getRange(1, 1, 1, tHeaders.length).setFontWeight('bold').setBackground('#d97706').setFontColor('#ffffff');
        formatAndTrimSheet(testSheet, tHeaders.length, tRows.length);
      }
    }

    // E. Sync Feedback Sheet
    if (data.feedbacks && data.feedbacks.length > 0) {
      let fbSheet = ss.getSheetByName('Feedback_Responses');
      if (!fbSheet) {
        fbSheet = ss.insertSheet('Feedback_Responses');
      }
      fbSheet.clear();
      const fbHeaders = ['Author Name', 'Role (Parent/Student)', 'Batch', 'Category', 'Rating (Stars)', 'Date', 'Feedback Comment'];
      const fbRows = [fbHeaders];
      data.feedbacks.forEach(function(f) {
        fbRows.push([
          f.authorName || '',
          f.role || '',
          f.batchName || '',
          f.category || '',
          f.rating || 5,
          f.date || '',
          f.comment || ''
        ]);
      });
      fbSheet.getRange(1, 1, fbRows.length, fbHeaders.length).setValues(fbRows);
      fbSheet.getRange(1, 1, 1, fbHeaders.length).setFontWeight('bold').setBackground('#7c3aed').setFontColor('#ffffff');
      formatAndTrimSheet(fbSheet, fbHeaders.length, fbRows.length);
    }

    // F. Sync Materials Sheet (Assignments, DPPs, Test Papers)
    if (data.materials && data.materials.length > 0) {
      let matSheet = ss.getSheetByName('Materials_Repository');
      if (!matSheet) {
        matSheet = ss.insertSheet('Materials_Repository');
      }
      matSheet.clear();
      const mHeaders = ['Material ID', 'Title', 'Batch Name', 'Category', 'Upload Date', 'Uploaded By', 'File Size', 'Downloads', 'Description', 'Download URL', 'Google Drive Link'];
      const mRows = [mHeaders];
      const batchMap = {};
      (data.batches || []).forEach(function(b) { batchMap[b.id] = b.name; });

      data.materials.forEach(function(m) {
        mRows.push([
          m.id || '',
          m.title || '',
          batchMap[m.batchId] || m.batchId || 'All Batches',
          m.category || 'Assignment PDF',
          m.uploadDate || '',
          m.uploadedBy || '',
          m.fileSize || '',
          m.downloads || 0,
          m.description || '',
          m.downloadUrl || m.driveUrl || '',
          m.driveUrl || ''
        ]);
      });
      matSheet.getRange(1, 1, mRows.length, mHeaders.length).setValues(mRows);
      matSheet.getRange(1, 1, 1, mHeaders.length).setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
      formatAndTrimSheet(matSheet, mHeaders.length, mRows.length);
    }

    // G. Sync Gallery Banners Sheet (Results & Achievements)
    if (data.gallery && data.gallery.length > 0) {
      let galSheet = ss.getSheetByName('Gallery_Banners');
      if (!galSheet) {
        galSheet = ss.insertSheet('Gallery_Banners');
      }
      galSheet.clear();
      const gHeaders = ['Banner ID', 'Title', 'Category', 'Date', 'Caption', 'Badge / AIR Rank', 'Image URL'];
      const gRows = [gHeaders];
      data.gallery.forEach(function(g) {
        gRows.push([
          g.id || '',
          g.title || '',
          g.category || '',
          g.date || '',
          g.caption || '',
          g.badge || '',
          g.imageUrl || ''
        ]);
      });
      galSheet.getRange(1, 1, gRows.length, gHeaders.length).setValues(gRows);
      galSheet.getRange(1, 1, 1, gHeaders.length).setFontWeight('bold').setBackground('#db2777').setFontColor('#ffffff');
      formatAndTrimSheet(galSheet, gHeaders.length, gRows.length);
    }

    // G2. Sync External Study Links Hub Sheet (always visible to all roles)
    {
      let linkSheet = ss.getSheetByName('External_Links_Hub');
      if (!linkSheet) {
        linkSheet = ss.insertSheet('External_Links_Hub');
      }
      linkSheet.clear();
      const lHeaders = ['Link ID', 'Resource Title', 'Provider / Portal', 'Subject Tag', 'External URL', 'Google Drive Shortcut Link', 'Description', 'Date Added'];
      const lRows = [lHeaders];
      (data.externalLinks || []).forEach(function(l) {
        lRows.push([
          l.id || '',
          l.title || '',
          l.provider || '',
          l.subject || '',
          l.url || '',
          l.driveUrl || '',
          l.description || '',
          l.dateAdded || ''
        ]);
      });
      linkSheet.getRange(1, 1, lRows.length, lHeaders.length).setValues(lRows);
      linkSheet.getRange(1, 1, 1, lHeaders.length).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
      formatAndTrimSheet(linkSheet, lHeaders.length, lRows.length);
    }

    // H. Sync Institute Settings Config
    if (data.settings) {
      let setSheet = ss.getSheetByName('Settings_Config');
      if (!setSheet) {
        setSheet = ss.insertSheet('Settings_Config');
      }
      setSheet.clear();
      const sHeaders = ['Setting Parameter', 'Configured Value', 'Description'];
      const sRows = [sHeaders];
      const s = data.settings;
      sRows.push(['Institute Name', s.instituteName || 'Divine Classes', 'Official Coaching Name']);
      sRows.push(['Tagline', s.tagline || '', 'Coaching Slogan & Mission']);
      sRows.push(['Helpline Phone', s.phone || '', 'Official Contact Number']);
      sRows.push(['Display Contact', s.contactDisplay || '9555-6787-53', 'Formatted Helpline']);
      sRows.push(['Official Email', s.email || 'contact@divineclasses.in', 'Inquiry Email']);
      sRows.push(['Address', s.address || '235 Paschimpuri Pocket 2, Club Rd New Delhi 110063', 'Center Location']);
      sRows.push(['YouTube Channel', s.youtubeUrl || 'https://www.youtube.com/@chem_crush9', 'Official Video Channel']);
      sRows.push(['Admin Name', s.adminName || 'Er. Rajesh Chahar', 'Display Name of Institute Admin']);
      sRows.push(['Master Admin Password', s.adminPassword || 'admin123', 'Password to access Admin portal']);
      sRows.push(['Admin Email ID', s.adminEmail || '', 'Official Admin Contact / Login Email']);
      sRows.push(['UPI Payment ID', s.upiId || 'divineclasses@upi', 'Fee Collection UPI']);
      sRows.push(['Facebook Page', s.facebookUrl || 'https://facebook.com', 'Social Channel']);
      sRows.push(['Instagram Profile', s.instagramUrl || 'https://instagram.com', 'Social Channel']);
      sRows.push(['Show Requirement Labels', (s.showRequirementLabels === false) ? 'Off' : 'On', 'Page header "Requirement #N" tags (toggle in Settings)']);
      sRows.push(['Admin Feedback Delete', (s.allowAdminFeedbackDelete === false) ? 'Off' : 'On', 'Admin delete button on Feedback Wall (toggle in Settings)']);
      sRows.push(['Study Link Delete', (s.allowAdminLinkDelete === false) ? 'Off' : 'On', 'Admin delete button on Study Links cards (toggle in Settings)']);
      sRows.push(['Show Dummy / Demo Data', (s.showDummyData === false) ? 'Off (hidden, not deleted)' : 'On', 'Seed demo students/batches/tests visibility (study links always kept)']);
      sRows.push(['Last Auto-Sync Timestamp', new Date().toLocaleString(), 'Time of last auto-sync from Web App']);

      setSheet.getRange(1, 1, sRows.length, sHeaders.length).setValues(sRows);
      setSheet.getRange(1, 1, 1, sHeaders.length).setFontWeight('bold').setBackground('#334155').setFontColor('#ffffff');
      formatAndTrimSheet(setSheet, sHeaders.length, sRows.length);
    }
  } catch (err) {
    Logger.log('Error creating readable sheets: ' + err.toString());
  }
}

/**
 * Dedicated API to update a student's password and status
 */
function apiUpdateStudentAuth(studentId, newPassword, newStatus) {
  const data = apiGetInitialData();
  const student = (data.students || []).find(function(s) { return s.id === studentId; });
  if (!student) return { success: false, message: 'Student not found' };
  if (newPassword) student.password = String(newPassword).trim();
  if (newStatus) {
    const st = String(newStatus).toLowerCase();
    student.status = (st === 'blocked') ? 'Blocked' : (st === 'inactive') ? 'Inactive' : 'Active';
  }
  return apiSyncAllData(data);
}

/**
 * Dedicated API to update a teacher's password and status
 */
function apiUpdateTeacherAuth(teacherId, newPassword, newStatus) {
  const data = apiGetInitialData();
  const teacher = (data.teachers || []).find(function(t) { return t.id === teacherId; });
  if (!teacher) return { success: false, message: 'Teacher not found' };
  if (newPassword) teacher.password = String(newPassword).trim();
  if (newStatus) {
    const st = String(newStatus).toLowerCase();
    teacher.status = (st === 'blocked') ? 'Blocked' : (st === 'inactive') ? 'Inactive' : 'Active';
  }
  return apiSyncAllData(data);
}

/**
 * Dedicated API for Admin to edit student profile records
 */
function apiUpdateStudentProfile(studentId, profileData) {
  const data = apiGetInitialData();
  const student = (data.students || []).find(function(s) { return s.id === studentId; });
  if (!student) return { success: false, message: 'Student not found' };
  if (profileData) {
    if (profileData.name !== undefined) student.name = String(profileData.name).trim();
    if (profileData.roll !== undefined) student.roll = String(profileData.roll).trim();
    if (profileData.phone !== undefined) student.phone = String(profileData.phone).trim();
    if (profileData.parentName !== undefined) student.parentName = String(profileData.parentName).trim();
    if (profileData.password !== undefined) student.password = String(profileData.password).trim();
    if (profileData.totalFee !== undefined) student.totalFee = Number(profileData.totalFee) || 0;
    if (profileData.paidFee !== undefined) student.paidFee = Number(profileData.paidFee) || 0;
    if (profileData.dueDate !== undefined) student.dueDate = String(profileData.dueDate).trim();
    if (profileData.status !== undefined) student.status = String(profileData.status).trim();
    
    if (profileData.photo !== undefined) student.photo = profileData.photo;
    
    // Batch re-assignment if specified
    if (profileData.batchId !== undefined) {
      (data.batches || []).forEach(function(b) {
        b.studentIds = (b.studentIds || []).filter(function(id) { return id !== studentId; });
        if (b.id === profileData.batchId && student.status !== 'Inactive') {
          b.studentIds.push(studentId);
        }
      });
    }
  }
  return apiSyncAllData(data);
}

/**
 * Dedicated API to update a student's photo
 */
function apiUpdateStudentPhoto(studentId, photoDataUrl) {
  const data = apiGetInitialData();
  const student = (data.students || []).find(function(s) { return s.id === studentId; });
  if (!student) return { success: false, message: 'Student not found' };
  student.photo = photoDataUrl;
  return apiSyncAllData(data);
}

/**
 * Dedicated API for Admin to edit faculty profile records
 */
function apiUpdateTeacherProfile(teacherId, profileData) {
  const data = apiGetInitialData();
  const teacher = (data.teachers || []).find(function(t) { return t.id === teacherId; });
  if (!teacher) return { success: false, message: 'Teacher not found' };
  if (profileData) {
    if (profileData.name !== undefined) {
      teacher.name = String(profileData.name).trim();
      teacher.initials = teacher.name.split(' ').map(function(n) { return n[0]; }).join('').slice(0, 2).toUpperCase();
    }
    if (profileData.email !== undefined) teacher.email = String(profileData.email).trim();
    if (profileData.subject !== undefined) teacher.subject = String(profileData.subject).trim();
    if (profileData.qualification !== undefined) teacher.qualification = String(profileData.qualification).trim();
    if (profileData.experience !== undefined) teacher.experience = String(profileData.experience).trim();
    if (profileData.specialization !== undefined) teacher.specialization = String(profileData.specialization).trim();
    if (profileData.phone !== undefined) teacher.phone = String(profileData.phone).trim();
    if (profileData.bio !== undefined) teacher.bio = String(profileData.bio).trim();
    if (profileData.password !== undefined) teacher.password = String(profileData.password).trim();
    if (profileData.status !== undefined) teacher.status = String(profileData.status).trim();
  }
  return apiSyncAllData(data);
}

/**
 * Dedicated API to change Admin Master Password
 */
function apiUpdateAdminPassword(newPassword) {
  const data = apiGetInitialData();
  if (!data.settings) data.settings = {};
  data.settings.adminPassword = String(newPassword).trim();
  return apiSyncAllData(data);
}
