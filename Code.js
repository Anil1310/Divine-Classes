/**
 * Divine Classes - INSTITUTE MANAGEMENT SYSTEM
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
    // 1. External API invocation for Admin Google Drive authorization and email dispatch
    if (e && e.parameter && (e.parameter.action === 'shareAdminDrive' || e.parameter.action === 'authorizeAdmin')) {
      const email = (e.parameter.email || '').trim();
      const folderLink = (e.parameter.folderUrl || e.parameter.folderLink || '').trim();
      const res = apiShareMaterialsDriveWithAdmin(email, folderLink);
      const callback = e.parameter.callback;
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(res) + ');')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Explicit Sheet Recreate/Restructure/Sync API
    if (e && e.parameter && (e.parameter.action === 'restructure' || e.parameter.action === 'recreate' || e.parameter.action === 'syncSheets')) {
      const res = apiRestructureAllSheets();
      return ContentService.createTextOutput(JSON.stringify(res, null, 2)).setMimeType(ContentService.MimeType.JSON);
    }

    // 2b. JSON API: Get full live data merged from all Database tables
    if (e && e.parameter && (e.parameter.action === 'getData' || e.parameter.action === 'loadData')) {
      const data = apiGetInitialData(e.parameter.token || '');
      const callback = e.parameter.callback;
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(data) + ');')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (e && e.parameter && e.parameter.action === 'getAttendance') {
      const result = apiGetMonthlyAttendance(e.parameter.month || '', e.parameter.token || '');
      const callback = e.parameter.callback || '';
      if (/^attendance_jsonp_\d+$/.test(callback)) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (e && e.parameter && e.parameter.action === 'saveAttendance') {
      let attendancePayload = {};
      if (e.parameter.data) {
        try {
          attendancePayload = JSON.parse(e.parameter.data);
        } catch (jsonErr) {
          attendancePayload = {};
        }
      }
      const result = apiSaveDailyAttendance(attendancePayload, e.parameter.token || '');
      const callback = e.parameter.callback || '';
      if (/^attendance_jsonp_\d+$/.test(callback)) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2c. Save Offline Test Marks via GET (Executes with zero CORS/redirect failures from Vercel)
    if (e && e.parameter && (e.parameter.action === 'saveTestMarks' || e.parameter.action === 'submitTestMarks' || e.parameter.action === 'submitAllMarks')) {
      let testPayload = {};
      if (e.parameter.data) {
        try {
          testPayload = JSON.parse(e.parameter.data);
        } catch (jsonErr) {
          testPayload = e.parameter;
        }
      } else {
        testPayload = e.parameter;
      }
      const res = apiSaveTestMarks(testPayload, e.parameter.token || '');
      const callback = e.parameter.callback;
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(res) + ');')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2d. Sync Data via GET
    if (e && e.parameter && (e.parameter.action === 'syncData' || e.parameter.action === 'saveData')) {
      let statePayload = {};
      if (e.parameter.data) {
        try {
          statePayload = JSON.parse(e.parameter.data);
        } catch (jsonErr) {
          statePayload = e.parameter;
        }
      } else {
        statePayload = e.parameter;
      }
      const session = getPortalSession_(e.parameter.token || '');
      const res = session && (session.role === 'admin' || session.role === 'developer')
        ? syncAllData_(statePayload)
        : { success: false, error: 'Access denied.' };
      const callback = e.parameter.callback;
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(res) + ');')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2e. Toggle Dummy / Demo Data via GET
    if (e && e.parameter && (e.parameter.action === 'setDummyData' || e.parameter.action === 'toggleDemoData')) {
      const session = getPortalSession_(e.parameter.token || '');
      if (!session || session.role !== 'developer') {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Access denied.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const target = e.parameter.target || 'all';
      const enabled = e.parameter.enabled === 'false' ? false : true;
      let clientState = null;
      if (e.parameter.data) {
        try { clientState = JSON.parse(e.parameter.data); } catch(err) { }
      }
      const res = apiSetDummyDataStatus(target, enabled, clientState, e.parameter.token || '');
      const callback = e.parameter.callback;
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(res) + ');')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2f. Append Student via GET (handles mobile apps and redirect fallbacks)
    if (e && e.parameter && (e.parameter.action === 'appendStudent' || e.parameter.action === 'addStudent')) {
      let stuPayload = {};
      if (e.parameter.studentData || e.parameter.data) {
        try {
          stuPayload = JSON.parse(e.parameter.studentData || e.parameter.data);
        } catch (jsonErr) {
          stuPayload = e.parameter;
        }
      } else {
        stuPayload = e.parameter;
      }
      const bId = e.parameter.batchId || '';
      const res = apiAppendStudent(stuPayload, bId);
      const callback = e.parameter.callback;
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(res) + ');')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2g. Append Faculty via GET (handles mobile apps and redirect fallbacks)
    if (e && e.parameter && (e.parameter.action === 'appendTeacher' || e.parameter.action === 'addTeacher')) {
      let teachPayload = {};
      if (e.parameter.teacherData || e.parameter.data) {
        try {
          teachPayload = JSON.parse(e.parameter.teacherData || e.parameter.data);
        } catch (jsonErr) {
          teachPayload = e.parameter;
        }
      } else {
        teachPayload = e.parameter;
      }
      const res = apiAppendTeacher(teachPayload);
      const callback = e.parameter.callback;
      if (callback) {
        return ContentService.createTextOutput(callback + '(' + JSON.stringify(res) + ');')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Regular Web App Page rendering
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
 * Web App Entrypoint (doPost)
 * Handles external file uploads and administrative actions from Vercel / GitHub Pages / Android APK
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = (payload.action || (e && e.parameter && e.parameter.action) || '').trim();

    if (action === 'authenticate') {
      const rememberMe = payload.rememberMe === true || String(payload.rememberMe).toLowerCase() === 'true';
      const result = apiAuthenticatePortalUser(payload.identifier, payload.password, rememberMe);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'logout') {
      const result = apiLogoutPortalSession(payload.token || '');
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'updateStudentPhoto') {
      const result = apiUpdateStudentPhoto(payload.studentId, payload.photoDataUrl, payload.token || '');
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Upload Assignment / Material to Google Drive and sync to Database
    if (action === 'uploadMaterial') {
      const fileData = payload.fileData || payload.fileBase64 || payload.dataUrl;
      const fileName = payload.fileName || payload.name;
      const metadata = payload.metadata || {
        batchId: payload.batchId,
        category: payload.category,
        uploadedBy: payload.uploadedBy,
        title: payload.title,
        description: payload.description
      };
      const result = apiUploadMaterialToDrive(fileData, fileName, metadata);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Authorize Admin Email & Send Invitation Email
    if (action === 'shareAdminDrive' || action === 'authorizeAdmin') {
      const email = (payload.email || (e && e.parameter && e.parameter.email) || '').trim();
      const folderLink = (payload.folderUrl || payload.folderLink || (e && e.parameter && e.parameter.folderUrl) || '').trim();
      const result = apiShareMaterialsDriveWithAdmin(email, folderLink);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Get Data (Full live state merged from all Database tables)
    if (action === 'getData' || action === 'loadData') {
      const data = apiGetInitialData(payload.token || '');
      return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'saveAttendance') {
      const result = apiSaveDailyAttendance(payload.data || payload, payload.token || '');
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Two-Way Sync / Save Data (Persists to Database)
    if (action === 'syncData' || action === 'saveData') {
      const stateToSave = payload.data || payload.fullData || payload;
      const session = getPortalSession_(payload.token || '');
      const result = session && (session.role === 'admin' || session.role === 'developer')
        ? syncAllData_(stateToSave)
        : { success: false, error: 'Access denied.' };
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5. Submit / Save Offline Test Marks
    if (action === 'saveTestMarks' || action === 'submitTestMarks') {
      const testData = payload.data || payload;
      const result = apiSaveTestMarks(testData, payload.token || '');
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 6. Toggle Dummy / Demo Data via POST
    if (action === 'setDummyData' || action === 'toggleDemoData') {
      const session = getPortalSession_(payload.token || '');
      if (!session || session.role !== 'developer') {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Access denied.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const target = payload.target || 'all';
      const enabled = (payload.enabled !== undefined) ? !!payload.enabled : true;
      const clientState = payload.data || payload.clientState || payload;
      const result = apiSetDummyDataStatus(target, enabled, clientState, payload.token || '');
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 7. Append New Student directly to Students_Master in Google Sheet
    if (action === 'appendStudent') {
      const studentData = payload.studentData || payload.data || payload;
      const batchId = payload.batchId || '';
      const result = apiAppendStudent(studentData, batchId);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 8. Append New Faculty directly to Teachers_Roster in Google Sheet
    if (action === 'appendTeacher') {
      const teacherData = payload.teacherData || payload.data || payload;
      const result = apiAppendTeacher(teacherData);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action: ' + action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
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
 * Returns the Database URL
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
 * the Materials_Repository Database table so students can download it.
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
    const settings = dbGetTable_('settings') || {};
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
 * Uploads a base64 or data-URL student or faculty photograph to the Developer's Google Drive.
 * Stored in: Divine Classes Portal Uploads -> Student Photographs
 * Sets file permission to Anyone with link can view.
 * Returns the shareable Google Drive URL.
 */
function uploadPhotoToDeveloperDrive_(base64OrDataUrl, prefix, name, targetFolderKey) {
  if (!base64OrDataUrl || typeof base64OrDataUrl !== 'string') return '';
  const str = base64OrDataUrl.trim();
  if (!str) return '';
  // If already an HTTP / Google Drive link, return it as-is
  if (/^https?:\/\//i.test(str)) {
    return str;
  }
  let base64 = str;
  let mimeType = 'image/jpeg';
  const match = str.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    mimeType = match[1];
    base64 = match[2];
  }
  try {
    const folderKey = targetFolderKey || (prefix === 'banner' ? DRIVE_FOLDERS.GALLERY : DRIVE_FOLDERS.PHOTOS);
    const folder = getDriveSubFolder(folderKey);
    const decodedBytes = Utilities.base64Decode(base64);
    const safeName = (name || 'photo').replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = mimeType.indexOf('png') !== -1 ? '.png' : (mimeType.indexOf('webp') !== -1 ? '.webp' : '.jpg');
    const fileName = (prefix || 'profile') + '_' + safeName + '_' + Date.now() + ext;
    const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
    const file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log('Photo sharing error: ' + shareErr.toString());
    }
    const fileId = file.getId();
    return 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing';
  } catch (err) {
    Logger.log('uploadPhotoToDeveloperDrive_ error: ' + err.toString());
    return str;
  }
}

/**
 * Safely loads the entire database from Cloud Properties or Spreadsheet
 */
function dbGetAll_() {
  let appData = (typeof dbLoadAll_ === 'function') ? dbLoadAll_() : null;
  if (!appData && typeof getFullInitialData_ === 'function') {
    appData = getFullInitialData_();
  }
  return appData || {};
}

/**
 * Uploads a result banner to Google Drive and saves it to Database
 */
function apiUploadBanner(data) {
  try {
    let driveUrl = data.imageUrl || '';
    if (driveUrl && driveUrl.startsWith('data:image/')) {
      driveUrl = uploadPhotoToDeveloperDrive_(driveUrl, 'banner', data.title || 'banner', DRIVE_FOLDERS.GALLERY);
    }
    const appData = dbGetAll_();
    if (!appData.gallery) appData.gallery = [];
    const newBanner = {
      id: 'g' + Date.now(),
      title: data.title || 'Result Banner',
      category: data.category || 'Result Banner',
      badge: data.badge || 'Top Rank',
      caption: data.caption || '',
      imageUrl: driveUrl,
      date: data.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT+5:30', 'MMMM yyyy')
    };
    appData.gallery.unshift(newBanner);
    dbSaveAll_(appData);
    try {
      const ss = getDbSpreadsheet();
      if (ss) syncReadableSheets(ss, appData);
    } catch (sErr) {
      Logger.log('syncReadableSheets notice in apiUploadBanner: ' + sErr.toString());
    }
    return { success: true, banner: newBanner, driveUrl: driveUrl };
  } catch (err) {
    Logger.log('apiUploadBanner error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Saves/updates marks for all students in an offline test and syncs to Database immediately
 */
function apiSaveTestMarks(data, token) {
  try {
    const session = getPortalSession_(token);
    if (!session || ['admin', 'developer', 'teacher'].indexOf(session.role) === -1) {
      return { success: false, error: 'Access denied.' };
    }
    if (!data || !data.testId) return { success: false, error: 'Missing testId' };
    const appData = dbGetAll_();
    if (!appData.offlineTests) appData.offlineTests = [];
    let test = appData.offlineTests.find(function (t) { return t.id === data.testId; });
    if (!test) {
      test = {
        id: data.testId,
        title: data.title || 'Offline Test',
        subject: data.subject || '',
        date: data.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT+5:30', 'dd MMM yyyy'),
        maxMarks: Number(data.maxMarks) || 100,
        batchId: data.batchId || 'b1',
        marks: {}
      };
      appData.offlineTests.unshift(test);
    } else {
      if (data.title) test.title = data.title;
      if (data.subject) test.subject = data.subject;
      if (data.date) test.date = data.date;
      if (data.maxMarks) test.maxMarks = Number(data.maxMarks);
      if (data.batchId) test.batchId = data.batchId;
    }
    if (data.marks && typeof data.marks === 'object') {
      if (!test.marks) test.marks = {};
      Object.keys(data.marks).forEach(function (sid) {
        test.marks[sid] = data.marks[sid];
      });
    }
    dbSaveAll_(appData);
    try {
      const ss = getDbSpreadsheet();
      if (ss) syncReadableSheets(ss, appData);
    } catch (sErr) {
      Logger.log('syncReadableSheets notice in apiSaveTestMarks: ' + sErr.toString());
    }
    return { success: true, test: test };
  } catch (err) {
    Logger.log('apiSaveTestMarks error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Generates a vibrant, professional random avatar URL for a student or faculty member
 * when no custom photo has been uploaded.
 */
function getRandomAvatarUrl_(seed, role) {
  const cleanSeed = (seed || 'User').toString().trim().replace(/[^a-zA-Z0-9 ]/g, '') || 'User';
  if (role === 'teacher') {
    return 'https://api.dicebear.com/7.x/lorelei/svg?seed=' + encodeURIComponent(cleanSeed) + '&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';
  } else {
    return 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + encodeURIComponent(cleanSeed) + '&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';
  }
}

/**
 * Uploads an assignment / DPP / test paper file to Google Drive, saves the
 * material record (with its URL) to the Cloud Database, and mirrors it to
 * the Materials_Repository Database table.
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

    // Resolve target folder (use authorized admin folder if configured)
    let folder;
    const currentSettings = dbGetTable_('settings') || {};
    if (currentSettings.adminDriveFolderId) {
      try {
        folder = DriveApp.getFolderById(currentSettings.adminDriveFolderId);
      } catch (e) {
        Logger.log('Admin drive folder by ID failed: ' + e.toString());
      }
    }
    if (!folder && currentSettings.adminDriveFolderUrl) {
      const customId = extractDriveFolderId(currentSettings.adminDriveFolderUrl);
      if (customId) {
        try {
          folder = DriveApp.getFolderById(customId);
        } catch (e) {
          Logger.log('Admin drive folder by URL failed: ' + e.toString());
        }
      }
    }
    if (!folder) {
      folder = getDriveSubFolder(DRIVE_MATERIALS_FOLDER);
    }

    // Ensure authorized email has Editor access to this folder
    try {
      const targetAdmin = (currentSettings.adminEmail || '').trim();
      if (targetAdmin && targetAdmin.indexOf('@') !== -1) {
        folder.addEditor(targetAdmin);
      }
    } catch (adminShareErr) {
      Logger.log('Auto-grant admin folder editor skipped: ' + adminShareErr.toString());
    }

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
      previewUrl: 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing',
      driveFileId: fileId,
      fileName: fileName
    };

    // Persist to Database (URL included in Materials_Repository)
    const data = getFullInitialData_();
    if (!data.materials) data.materials = [];
    data.materials.unshift(newMaterial);

    // In-app notification: alert every student/teacher that a new material is live
    if (!data.notifications || !Array.isArray(data.notifications)) data.notifications = [];
    const batchObj = (data.batches || []).find(b => b.id === newMaterial.batchId);
    const batchLabel = batchObj ? batchObj.name : 'General';
    data.notifications.unshift({
      id: 'notif_mat_' + newMaterial.id + '_' + Date.now(),
      title: 'New ' + newMaterial.category + ' Uploaded',
      message: '"' + newMaterial.title + '" (' + newMaterial.fileSize + ') for ' + batchLabel + ' is now available in Assignments & DPPs. Download link saved to the Database.',
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
    syncAllData_(data);

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
    const data = getFullInitialData_();
    if (!data.materials) data.materials = [];
    const mat = data.materials.find(m => m.id === materialId);
    if (!mat) return { success: false, error: 'Material not found' };

    // Trash the Drive file so storage does not leak (no-op for legacy rows)
    if (mat.driveFileId) {
      try { DriveApp.getFileById(mat.driveFileId).setTrashed(true); } catch (e) { Logger.log('Drive trash skipped: ' + e.toString()); }
    }

    data.materials = data.materials.filter(m => m.id !== materialId);
    syncAllData_(data);
    return { success: true, materialId: materialId, title: mat.title };
  } catch (err) {
    Logger.log('apiDeleteMaterial error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Shares the Study Materials & Assignments Drive folder with the Admin's email,
 * sends an official authorization/access email with a direct 1-click link,
 * and records the Admin Google Drive folder link in Settings_Config and External_Links_Hub.
 *
 * @param {string} adminEmail        The Admin's Google/Gmail address to grant Editor access to
 * @param {string} customFolderLink  Optional custom Google Drive folder URL provided by Admin
 * @return {Object} { success, folderUrl, folderId, adminEmail, emailSent, message }
 */
function apiShareMaterialsDriveWithAdmin(adminEmail, customFolderLink) {
  try {
    let emailToUse = String(adminEmail || '').trim();
    if (!emailToUse || emailToUse.indexOf('@') === -1) {
      return { success: false, error: 'Please enter a valid email address to authorize Google Drive.' };
    }

    const data = getFullInitialData_();
    if (!data.settings) data.settings = {};
    data.settings.instituteName = 'Divine Classes';

    // Resolve target folder
    let folder;
    if (customFolderLink) {
      const customId = extractDriveFolderId(customFolderLink);
      if (customId) {
        try {
          folder = DriveApp.getFolderById(customId);
          data.settings.driveFolderUrl = customFolderLink;
        } catch (e) {
          Logger.log('Custom folder ID failed: ' + e.toString());
        }
      }
    }
    if (!folder) {
      folder = getDriveSubFolder(DRIVE_MATERIALS_FOLDER);
    }

    const folderId = folder.getId();
    const folderUrl = folder.getUrl();

    // Ensure public view so students can download uploaded files
    try {
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log('Folder public share setting error: ' + shareErr.toString());
    }

    // Grant Editor access and attempt Ownership transfer to Admin's email
    let editorAdded = false;
    let ownerTransferred = false;
    let ownerError = '';
    try {
      folder.addEditor(emailToUse);
      editorAdded = true;
    } catch (addEditorErr) {
      Logger.log('folder.addEditor error: ' + addEditorErr.toString());
    }

    try {
      folder.setOwner(emailToUse);
      ownerTransferred = true;
      Logger.log('folder.setOwner succeeded for: ' + emailToUse);
    } catch (setOwnerErr) {
      ownerError = setOwnerErr.toString();
      Logger.log('folder.setOwner note: ' + ownerError);
    }

    // Compose official authorization email to Admin
    const instituteName = 'Divine Classes';
    const adminName = data.settings.adminName || 'Admin';
    const subject = 'Action Required: Divine Classes Study Materials & Assignment Drive Access';

    const textBody = 'Dear ' + adminName + ',\n\n' +
      'Google Drive Editor access has been granted to your email (' + emailToUse + ') for the official Divine Classes Study Materials & Assignments Folder.\n\n' +
      'Click this link to authorize and open the folder in your Google Drive:\n' +
      folderUrl + '\n\n' +
      '• Folder: Divine Classes Portal Uploads > ' + DRIVE_MATERIALS_FOLDER + '\n' +
      '• Master apps script and storage are hosted in Developer Google account.\n' +
      '• All assignments, test files, and worksheets uploaded by you or faculty are automatically linked in your Database (Materials_Repository tab) for student downloads.\n\n' +
      'Regards,\nDivine Classes System';

    const htmlBody = '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">' +
      '<div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #4f46e5;">' +
      '<h1 style="color: #1e1b4b; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">DIVINE CLASSES</h1>' +
      '<p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">Premier Coaching for JEE Advanced, NEET & Foundations</p>' +
      '</div>' +
      '<div style="padding: 24px 0;">' +
      '<div style="display: inline-block; padding: 4px 12px; background-color: #e0e7ff; color: #4338ca; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Admin Authorization Required</div>' +
      '<h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">Authorize Google Drive Access for Assignments & Materials</h2>' +
      '<p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>' + adminName + '</strong>,</p>' +
      '<p style="font-size: 14px; line-height: 1.6; color: #334155;">You have been designated as an authorized administrator for the <strong>Divine Classes Assignment & Study Material Cloud Repository</strong>. Your Google account (<strong>' + emailToUse + '</strong>) now has full Editor access to the folder.</p>' +
      '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">' +
      '<p style="margin: 0 0 6px 0; font-size: 13px; color: #0f172a;"><strong>📂 Shared Folder:</strong> ' + DRIVE_MATERIALS_FOLDER + '</p>' +
      '<p style="margin: 0 0 6px 0; font-size: 13px; color: #0f172a;"><strong>📧 Authorized Email:</strong> ' + emailToUse + '</p>' +
      '<p style="margin: 0 0 6px 0; font-size: 13px; color: #0f172a;"><strong>📊 Database Sync:</strong> Auto-logged to <code>Materials_Repository</code></p>' +
      '<p style="margin: 0 0 6px 0; font-size: 13px; color: #0f172a;"><strong>📲 Student Download:</strong> Instant 1-click mobile download & PDF preview</p>' +
      '</div>' +
      '<p style="font-size: 14px; line-height: 1.6; color: #334155;">Whenever you or faculty upload study material, test papers, or worksheets, the files are stored here and direct download links are published instantly for all enrolled students.</p>' +
      '<div style="text-align: center; margin: 30px 0;">' +
      '<a href="' + folderUrl + '" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);">' +
      '🚀 Open & Authorize Google Drive Folder' +
      '</a>' +
      '</div>' +
      '<p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">If clicking the button does not open Drive directly, copy and open this link:<br>' +
      '<a href="' + folderUrl + '" style="color: #4f46e5; word-break: break-all;">' + folderUrl + '</a>' +
      '</p>' +
      '</div>' +
      '<div style="border-top: 1px solid #f1f5f9; padding-top: 18px; font-size: 11px; color: #94a3b8; text-align: center;">' +
      '<p style="margin: 0;">Main Apps Script code & system database hosted in Developer Google account. Client Admin authorized via email.</p>' +
      '<p style="margin: 4px 0 0 0;">Divine Classes Paschimpuri New Delhi • Official Portal System</p>' +
      '</div>' +
      '</div>';

    let emailSent = false;
    let mailError = '';
    try {
      MailApp.sendEmail({
        to: emailToUse,
        subject: subject,
        body: textBody,
        htmlBody: htmlBody,
        name: instituteName + ' Portal'
      });
      emailSent = true;
      Logger.log('Authorization email sent via MailApp to ' + emailToUse);
    } catch (e1) {
      Logger.log('MailApp.sendEmail failed: ' + e1.toString() + ' — trying GmailApp...');
      try {
        GmailApp.sendEmail(emailToUse, subject, textBody, {
          name: instituteName + ' Portal',
          htmlBody: htmlBody
        });
        emailSent = true;
        Logger.log('Authorization email sent via GmailApp to ' + emailToUse);
      } catch (e2) {
        mailError = 'MailApp: ' + e1.toString() + ' | GmailApp: ' + e2.toString();
        Logger.log('All email delivery attempts failed: ' + mailError);
      }
    }

    // Persist configuration in app data
    data.settings.adminEmail = emailToUse;
    data.settings.adminDriveFolderUrl = folderUrl;
    data.settings.adminDriveFolderId = folderId;
    data.settings.adminDriveShared = true;
    data.settings.adminDriveSharedDate = new Date().toLocaleDateString('en-GB');

    // Add / update in External Links Hub so Admin can access it anytime
    if (!data.externalLinks) data.externalLinks = [];
    const linkIndex = data.externalLinks.findIndex(l => l.id === 'link_admin_drive');
    const driveLinkObj = {
      id: 'link_admin_drive',
      title: 'Official Google Drive — Assignments & Study Materials Folder',
      category: 'Drive Repository',
      url: folderUrl,
      description: 'Shared Google Drive folder for Divine Classes assignments, test papers, and worksheets. Authorized for ' + emailToUse,
      clicks: 0
    };
    if (linkIndex >= 0) {
      data.externalLinks[linkIndex] = driveLinkObj;
    } else {
      data.externalLinks.push(driveLinkObj);
    }

    syncAllData_(data);

    return {
      success: true,
      folderUrl: folderUrl,
      folderId: folderId,
      adminEmail: emailToUse,
      emailSent: emailSent,
      editorAdded: editorAdded,
      ownerTransferred: ownerTransferred,
      ownerError: ownerError,
      message: emailSent
        ? '✓ Google Drive folder authorized and invitation email sent to ' + emailToUse + '!'
        : '✓ Google Drive folder configured (' + (editorAdded ? 'access granted to ' + emailToUse : 'shared via link') + '). Email notice: ' + (mailError || 'Check quota')
    };
  } catch (err) {
    Logger.log('apiShareMaterialsDriveWithAdmin error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Returns current status of Admin Google Drive integration
 */
function apiGetAdminDriveStatus() {
  try {
    const settings = dbGetTable_('settings') || {};
    const folder = getDriveSubFolder(DRIVE_MATERIALS_FOLDER);
    return {
      success: true,
      folderUrl: (folder ? folder.getUrl() : (settings.adminDriveFolderUrl || '')),
      folderId: (folder ? folder.getId() : (settings.adminDriveFolderId || '')),
      adminEmail: settings.adminEmail || '',
      isShared: !!settings.adminDriveShared,
      sharedDate: settings.adminDriveSharedDate || ''
    };
  } catch (err) {
    Logger.log('apiGetAdminDriveStatus error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Lightweight poll API: returns the notifications table only.
 * The frontend polls this every 20s so new uploads trigger an
 * in-app sound + badge on clients that are already open.
 */
function apiGetNotifications(token) {
  try {
    const session = getPortalSession_(token);
    if (!session) return [];
    const notifs = dbGetTable_('notifications');
    if (session.role === 'admin' || session.role === 'developer') {
      return Array.isArray(notifs) ? notifs : [];
    }
    if (session.role === 'student') {
      let studentRoll = String(session.identifier || '').trim();
      if (!studentRoll) {
        const students = dbGetTable_('students');
        const student = (Array.isArray(students) ? students : []).find(function (record) {
          return record && record.id === session.userId;
        });
        studentRoll = student ? String(student.roll || '').trim() : '';
      }
      return (Array.isArray(notifs) ? notifs : []).filter(function (notification) {
        return notification.targetStudentId === session.userId ||
          (studentRoll && notification.targetRoll === studentRoll) ||
          notification.targetRole === 'all';
      });
    }
    return (Array.isArray(notifs) ? notifs : []).filter(function (notification) {
      return notification.targetRole === 'all';
    });
  } catch (err) {
    Logger.log('apiGetNotifications error: ' + err.toString());
    return [];
  }
}

var OFFICIAL_GALLERY_BANNERS = [
  {
    id: 'g1',
    title: 'Divine Classes JEE Advanced All India Top Rankers 2026',
    category: 'Result Banner',
    date: 'July 2026',
    caption: 'Heartiest congratulations to our classroom achievers: AIR 42, AIR 118, and AIR 256 in JEE Advanced 2026.',
    badge: 'AIR 42, 118, 256',
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
  },
  {
    id: 'g5',
    title: 'Intensive Sunday Full-Length Mock Test & Rank Analysis',
    category: 'Event',
    date: 'October 2026',
    caption: 'Bi-weekly simulated entrance exam condition tests conducted across all Divine Classes examination halls.',
    badge: 'Sunday Test Series',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
  }
];

var OFFICIAL_EXTERNAL_LINKS = [
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
];

/**
 * Seed dataset for Divine Classes (modularized via DummyData.js)
 */
function getDefaultSeedData() {
  const data = (typeof getDummySeedData === 'function') ? getDummySeedData() : { batches: [], students: [], materials: [], offlineTests: [], teachers: [], feedbacks: [] };
  data.externalLinks = OFFICIAL_EXTERNAL_LINKS.slice();
  if (!Array.isArray(data.gallery) || data.gallery.length === 0) {
    data.gallery = OFFICIAL_GALLERY_BANNERS.slice();
  }
  if (!data.settings) {
    data.settings = {
      instituteName: 'Divine Classes',
      tagline: 'Empowering Aspirants for JEE, NEET & Board Excellence',
      phone: '+91 95556 78753',
      contactDisplay: '9555-6787-53',
      email: 'contact@divineclasses.in',
      address: '235 Paschimpuri Pocket 2, Club Rd New Delhi 110063',
      upiId: 'divineclasses@upi',
      facebookUrl: 'https://www.facebook.com/edivineclasses/',
      instagramUrl: 'https://www.instagram.com/divineclasses_paschimpuri?utm_source=qr&dlrf=enk4MXRodTU3YTdq',
      youtubeUrl: 'https://youtube.com/@chemcrush?si=VyfGmd_WwqQiU7j8',
      adminName: 'Er. Rajesh Chahar',
      adminPassword: 'admin123',
      adminEmail: '',
      showRequirementLabels: true,
      allowAdminFeedbackDelete: true,
      allowAdminLinkDelete: true,
      showDummyData: true,
      dummyDataConfig: {
        students: true,
        teachers: true,
        batches: true,
        offlineTests: true,
        materials: true,
        gallery: true,
        feedbacks: true
      }
    };
  }
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

function isDummyRecord_(rec) {
  if (!rec) return false;
  // External links (l1..l5) are PERMANENT institute assets — NEVER dummy!
  if (rec.id && String(rec.id).startsWith('l')) return false;
  if (rec.isDummy === true) return true;
  if (typeof DUMMY_SEED_ID_SET !== 'undefined' && DUMMY_SEED_ID_SET && DUMMY_SEED_ID_SET[rec.id] === true) return true;
  var fallbackIds = {
    'b1': true, 'b2': true, 'b3': true, 'b4': true, 'b5': true,
    's1': true, 's2': true, 's3': true, 's4': true, 's5': true,
    'm1': true, 'm2': true, 'm3': true, 'm4': true, 'm5': true,
    't1': true, 't2': true, 't3': true, 't4': true, 't5': true,
    'tr1': true, 'tr2': true, 'tr3': true, 'tr4': true, 'tr5': true,
    'g1': true, 'g2': true, 'g3': true, 'g4': true, 'g5': true,
    'f1': true, 'f2': true, 'f3': true, 'f4': true, 'f5': true
  };
  return fallbackIds[rec.id] === true;
}

// Removes seed/demo records from the data RETURNED to clients (DB untouched).
// externalLinks are ALWAYS kept — never stripped.
function isDummyForSheetEnabled_(settings, sheetKey) {
  if (!settings) return true;
  if (settings.showDummyData === false) return false;
  if (settings.dummyDataConfig && typeof settings.dummyDataConfig === 'object') {
    if (settings.dummyDataConfig[sheetKey] === false) return false;
  }
  return true;
}

// Removes seed/demo records per sheet or globally (DB untouched).
// All tabs except External_Links_Hub & Settings_Config have dummy records stripped!
function stripDummyData_(appData, targetTable) {
  if (!appData || !appData.settings) return appData;
  const dummyStudentIds = {};
  (appData.students || []).forEach(function (s) {
    if (s && isDummyRecord_(s)) dummyStudentIds[s.id] = true;
  });

  const tbls = targetTable ? [targetTable] : ['students', 'batches', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'];
  tbls.forEach(function (tbl) {
    if (!isDummyForSheetEnabled_(appData.settings, tbl) || targetTable) {
      appData[tbl] = (appData[tbl] || []).filter(function (r) { return !isDummyRecord_(r); });
    }
  });

  if (!isDummyForSheetEnabled_(appData.settings, 'students') || targetTable === 'students') {
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
  }
  return appData;
}

// When demo data is enabled: ensure rows 2 to 6 (5 records) are filled in all 7 tabs.
// When demo data is disabled: ensure all dummy records are completely stripped!
function restoreDummyData_(incoming) {
  if (!incoming) return incoming;
  const isExplicitlyEnabled = incoming.settings && incoming.settings.showDummyData === true;
  if (isExplicitlyEnabled) {
    try {
      PropertiesService.getScriptProperties().deleteProperty('DUMMY_DATA_DISABLED');
    } catch (e) { }
  }
  const isDemoDisabled = !isExplicitlyEnabled && (
    (incoming.settings && incoming.settings.showDummyData === false) ||
    (incoming.settings && incoming.settings.demoDataPermanentlyDisabled === true) ||
    PropertiesService.getScriptProperties().getProperty('DUMMY_DATA_DISABLED') === 'true'
  );
  if (isDemoDisabled) {
    if (incoming.settings) {
      incoming.settings.showDummyData = false;
      incoming.settings.demoDataPermanentlyDisabled = true;
    }
    stripDummyData_(incoming);
    return incoming;
  }

  // When demo is enabled: restore exactly 5 dummy records (rows 2 to 6) in all 7 tabs
  const seed = (typeof getDummySeedData === 'function') ? getDummySeedData() : getDefaultSeedData();
  const tables = ['students', 'batches', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'];
  tables.forEach(function (tbl) {
    if (!Array.isArray(incoming[tbl])) incoming[tbl] = [];
    const have = {};
    incoming[tbl].forEach(function (r) { if (r && r.id) have[r.id] = true; });
    (seed[tbl] || []).forEach(function (r) {
      if (r && r.id && !have[r.id]) {
        incoming[tbl].push(JSON.parse(JSON.stringify(r)));
      }
    });
  });

  return incoming;
}

/**
 * ============================================================================
 * CLOUD DATABASE ENGINE (PropertiesService Persistent NoSQL Store)
 * ============================================================================
 * Primary database engine that runs independently of Database.
 * Stores tables (students, batches, teachers, tests, materials, settings, etc.)
 * with ultra-fast persistent access across all users and executions.
 */

const DB_TABLES = ['batches', 'students', 'materials', 'offlineTests', 'teachers', 'gallery', 'externalLinks', 'feedbacks', 'settings', 'notifications'];

function dbGetTable_(tableName) {
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

function dbSetTable_(tableName, tableData) {
  try {
    PropertiesService.getScriptProperties().setProperty('DB_' + tableName, JSON.stringify(tableData));
    return true;
  } catch (err) {
    Logger.log('dbSetTable error for ' + tableName + ': ' + err.toString());
    return false;
  }
}

function dbLoadAll_() {
  const result = {};
  let count = 0;
  DB_TABLES.forEach(function (tbl) {
    const data = dbGetTable_(tbl);
    if (data !== null) {
      result[tbl] = data;
      count++;
    }
  });
  return count > 0 ? result : null;
}

function dbSaveAll_(fullData) {
  if (!fullData) return false;
  if (Array.isArray(fullData.students)) {
    const seenRolls = {};
    fullData.students = fullData.students.filter(function (s) {
      const k = String(s.roll || s.id || "").trim().toLowerCase();
      if (!k || seenRolls[k]) return false;
      seenRolls[k] = true;
      return true;
    });
  }
  DB_TABLES.forEach(function (tbl) {
    if (fullData[tbl] !== undefined) {
      dbSetTable_(tbl, fullData[tbl]);
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
    values.forEach(function (v) {
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
  } catch (e) { }
}

// Strips tombstoned records from a data object safely without deleting valid active students.
function applyTombstones_(appData) {
  if (!appData) return appData;
  try {
    PropertiesService.getScriptProperties().deleteProperty('DB_tomb_rolls');
  } catch (e) { }

  const deadUrls = getTombstones_('linkUrls');
  if (deadUrls && deadUrls.length && Array.isArray(appData.externalLinks)) {
    const urlSet = {};
    deadUrls.forEach(function (u) { urlSet[u] = true; });
    appData.externalLinks = appData.externalLinks.filter(function (l) {
      return !(l && l.url && deadUrls.indexOf(String(l.url).trim()) !== -1);
    });
  }
  return appData;
}

function calculateNextFeeReminder_(admissionDateStr, monthsCount) {
  if (!admissionDateStr) return '2026-11-11';
  if (monthsCount === undefined || monthsCount === null) monthsCount = 1;
  const parts = String(admissionDateStr).split('-');
  if (parts.length !== 3) return String(admissionDateStr);
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  let day = parseInt(parts[2], 10);

  let targetMonth = month + monthsCount;
  let targetYear = year + Math.floor((targetMonth - 1) / 12);
  targetMonth = ((targetMonth - 1) % 12) + 1;

  let targetDay = day + 1;
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  if (targetDay > daysInMonth) {
    targetDay = daysInMonth;
  }

  const yStr = String(targetYear);
  const mStr = String(targetMonth < 10 ? '0' + targetMonth : targetMonth);
  const dStr = String(targetDay < 10 ? '0' + targetDay : targetDay);
  return yStr + '-' + mStr + '-' + dStr;
}

/**
 * Dynamically merges student records from the Students_Master Database table.
 * Adding a row in the sheet (Roll No + Name) creates a new student in the app;
 * editing a row (password, fees, status, contact…) updates the matching student.
 * Students that exist only in the app are preserved. Runs on every data load,
 * so sheet edits appear in the portal on the next refresh.
 */
function mergeStudentsFromSheet_(appData) {
  try {
    const ss = getDbSpreadsheet();
    if (!ss) return appData;
    const sheet = getOrCreateSheet(ss, 'Students_Master', ['Students', 'Students Master']);
    if (!sheet) return appData;
    SpreadsheetApp.flush();
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
    getTombstones_('rolls').forEach(function (r) {
      if (sheetRollsNow[r]) clearTombstone_('rolls', r);
    });

    const headers = values[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
    function getCol(names, fallback) {
      for (let k = 0; k < names.length; k++) {
        const idx = headers.indexOf(names[k].toLowerCase());
        if (idx !== -1) return idx;
      }
      return fallback;
    }
    const cRoll = getCol(['roll no', 'roll'], 0);
    const cName = getCol(['student name', 'name'], 1);
    const cAdmission = getCol(['admission date', 'admission', 'joining date', 'join date'], 2);
    const cPwd = getCol(['login password', 'password'], 3);
    const cStatus = getCol(['access status', 'status'], 4);
    const cParent = getCol(['parent name', 'parent'], 5);
    const cPhone = getCol(['contact phone', 'phone'], 6);
    const cMonthlyFee = getCol(['monthly fee (inr)', 'monthly fee', 'monthly tuition fee', 'total fee (inr)', 'total fee'], 7);
    const cPaidFee = getCol(['paid fee (inr)', 'paid fee', 'fee deposited', 'fees deposited'], 8);
    const cPending = getCol(['pending dues (inr)', 'pending dues', 'balance'], 9);
    const cFeeStatus = getCol(['fee payment status', 'fee status', 'payment status'], 10);
    const cDueDate = getCol(['next fee due date', 'fee due date', 'due date', 'fee reminder date'], cFeeStatus !== -1 ? 11 : 10);
    const cLastReminder = getCol(['last reminder sent', 'last reminder'], cFeeStatus !== -1 ? 12 : 11);
    const cPhoto = getCol(['photo url', 'photo'], cFeeStatus !== -1 ? 13 : 12);

    const duplicateRowsToDelete = [];
    const seenRollsInSheet = {};
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const roll = String(row[cRoll] || '').trim();
      const name = String(row[cName] || '').trim();
      if (!roll && !name) continue;

      const rollKey = roll ? roll.toLowerCase() : "";
      if (rollKey && seenRollsInSheet[rollKey]) {
        duplicateRowsToDelete.push(i + 1); // 1-indexed row number in sheet
        continue;
      }
      if (rollKey) seenRollsInSheet[rollKey] = true;

      let admissionDate = cAdmission !== -1 ? row[cAdmission] : '';
      if (admissionDate instanceof Date && !isNaN(admissionDate)) {
        admissionDate = Utilities.formatDate(admissionDate, tz, 'yyyy-MM-dd');
      } else {
        admissionDate = String(admissionDate || '').trim();
      }

      const password = String(row[cPwd] || '').trim() || 'password123';
      const statusRaw = String(row[cStatus] || 'Active').trim();
      const status = /block/i.test(statusRaw) ? 'Blocked' : (/inactive/i.test(statusRaw) ? 'Inactive' : 'Active');
      const parentName = String(row[cParent] || '').trim();
      const phone = String(row[cPhone] || '').trim();
      let monthlyFee = Number(row[cMonthlyFee]) || 2500;
      let paidFee = Number(row[cPaidFee]) || 0;
      if (monthlyFee > 10000) {
        monthlyFee = Math.round(monthlyFee / 12);
        paidFee = Math.min(paidFee, monthlyFee);
      }
      let dueDate = row[cDueDate];
      if (dueDate instanceof Date && !isNaN(dueDate)) {
        dueDate = Utilities.formatDate(dueDate, tz, 'yyyy-MM-dd');
      } else {
        dueDate = String(dueDate || '').trim();
      }
      if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        if (paidFee >= monthlyFee && monthlyFee > 0) {
          dueDate = 'Paid';
        } else {
          dueDate = calculateNextFeeReminder_(admissionDate || '2026-10-10', 1);
        }
      }
      const lastReminder = String(row[cLastReminder] || '').trim() || 'Never';
      const photoUrl = String(row[cPhoto] || '').trim();

      let stu = null;
      if (roll) {
        stu = appData.students.find(function (s) { return String(s.roll || '').trim() === roll; });
      }
      // Name fallback only for rows WITHOUT a roll — so two people sharing the
      // same name (e.g. DC-110 & DC-111) don't overwrite each other.
      if (!stu && !roll && name) {
        stu = appData.students.find(function (s) { return String(s.name || '').trim() === name; });
      }

      if (stu) {
        stu.roll = roll || stu.roll;
        stu.name = name || stu.name;
        if (admissionDate) stu.admissionDate = admissionDate;
        stu.password = password;
        stu.status = status;
        stu.parentName = parentName || stu.parentName;
        stu.phone = phone || stu.phone;
        stu.monthlyFee = monthlyFee;
        stu.totalFee = monthlyFee;
        stu.paidFee = paidFee;
        if (dueDate && !/^fully paid$/i.test(dueDate)) stu.dueDate = dueDate;
        stu.lastReminder = lastReminder;
        if (photoUrl && photoUrl !== 'Photo URL') {
          stu.photo = photoUrl;
          stu.photoUrl = photoUrl;
        }
        updated++;
      } else {
        const cleanRoll = roll || ('DC-' + (100 + appData.students.length + 1));
        const stuId = 'stu_' + cleanRoll.replace(/\D/g, '');
        appData.students.push({
          id: stuId,
          roll: cleanRoll,
          name: name || 'Unnamed Student',
          admissionDate: admissionDate || '2026-10-10',
          password: password,
          status: status,
          parentName: parentName,
          phone: phone,
          monthlyFee: monthlyFee,
          totalFee: monthlyFee,
          paidFee: paidFee,
          dueDate: /^fully paid$/i.test(dueDate) ? '' : (dueDate || '2026-11-11'),
          lastReminder: lastReminder,
          photo: (photoUrl && photoUrl !== 'Photo URL') ? photoUrl : null,
          photoUrl: (photoUrl && photoUrl !== 'Photo URL') ? photoUrl : ''
        });
        added++;
      }
    }

    // Automatically delete any duplicate rows found in Students_Master sheet (bottom to top)
    if (duplicateRowsToDelete.length > 0) {
      Logger.log("Deleting " + duplicateRowsToDelete.length + " duplicate student row(s) from Students_Master sheet.");
      for (let d = duplicateRowsToDelete.length - 1; d >= 0; d--) {
        try {
          sheet.deleteRow(duplicateRowsToDelete[d]);
        } catch (delErr) {
          Logger.log("deleteRow error in Students_Master: " + delErr.toString());
        }
      }
      SpreadsheetApp.flush();
    }

    // Ensure appData.students contains unique rolls only
    const uniqueStudents = [];
    const seenRollsInApp = {};
    (appData.students || []).forEach(function (s) {
      const k = String(s.roll || s.id || "").trim().toLowerCase();
      if (k && !seenRollsInApp[k]) {
        seenRollsInApp[k] = true;
        uniqueStudents.push(s);
      }
    });
    appData.students = uniqueStudents;

    // Ensure all sheet students are assigned to at least one batch so they always show on web app
    if (appData.batches && appData.batches.length > 0) {
      const allBatchStudentIds = {};
      appData.batches.forEach(function (b) {
        (b.studentIds || []).forEach(function (id) { allBatchStudentIds[id] = true; });
      });
      const firstBatch = appData.batches[0];
      if (!firstBatch.studentIds) firstBatch.studentIds = [];
      appData.students.forEach(function (s) {
        if (!allBatchStudentIds[s.id] && !allBatchStudentIds[s.roll]) {
          firstBatch.studentIds.push(s.id);
          firstBatch.studentIds.push(s.roll);
          allBatchStudentIds[s.id] = true;
          allBatchStudentIds[s.roll] = true;
        }
      });
    }

    if (added || updated) {
      Logger.log('Students_Master sheet merge: ' + added + ' added, ' + updated + ' updated');
    }

    // All student fee data is now unified in Students_Master - clean up deprecated Student_Fees_Ledger tab if present
    try {
      ['Student_Fees_Ledger', 'Student_Fees', 'Fees_Master', 'Fees_Ledger', 'Fees'].forEach(function(shName) {
        const feeSh = ss.getSheetByName(shName);
        if (feeSh && ss.getSheets().length > 1) {
          try {
            ss.deleteSheet(feeSh);
            Logger.log('Deleted deprecated sheet tab: ' + shName);
          } catch (e) { }
        }
      });
    } catch (fErr) { }
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
    getTombstones_('linkUrls').forEach(function (u) {
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
        link = appData.externalLinks.find(function (l) { return String(l.id || '').trim() === id; });
      }
      if (!link && url) {
        link = appData.externalLinks.find(function (l) { return String(l.url || '').trim() === url; });
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
      appData.externalLinks = appData.externalLinks.filter(function (l) {
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
 * Dynamically merges teachers from the Teachers_Roster sheet tab
 */
function mergeTeachersFromSheet_(appData) {
  try {
    const ss = getDbSpreadsheet();
    if (!ss) return appData;
    const sheet = ss.getSheetByName('Teachers_Roster');
    if (!sheet) return appData;
    const values = sheet.getDataRange().getValues();
    if (!values || values.length <= 1) return appData;

    if (!appData.teachers) appData.teachers = [];
    const keepIds = {};

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const id = String(row[0] || '').trim();
      const name = String(row[1] || '').trim();
      if (!id && !name) continue;

      const subject = String(row[2] || '').trim();
      const email = String(row[3] || '').trim();
      const password = String(row[4] || 'teacher123').trim();
      const statusRaw = String(row[5] || 'Active').trim();
      const status = /block/i.test(statusRaw) ? 'Blocked' : (/inactive/i.test(statusRaw) ? 'Inactive' : 'Active');
      const phone = String(row[6] || '').trim();
      const qualification = String(row[7] || '').trim();
      const experience = String(row[8] || '').trim();
      const photoUrl = String(row[9] || '').trim();

      let teacher = null;
      if (id) {
        teacher = appData.teachers.find(t => String(t.id || '').trim() === id);
      }
      if (!teacher && email) {
        teacher = appData.teachers.find(t => String(t.email || '').trim().toLowerCase() === email.toLowerCase());
      }
      if (!teacher && name) {
        teacher = appData.teachers.find(t => String(t.name || '').trim().toLowerCase() === name.toLowerCase());
      }

      if (teacher) {
        teacher.id = id || teacher.id;
        teacher.name = name || teacher.name;
        teacher.subject = subject || teacher.subject;
        teacher.email = email || teacher.email;
        teacher.password = password || teacher.password;
        teacher.status = status;
        teacher.phone = phone || teacher.phone;
        teacher.qualification = qualification || teacher.qualification;
        teacher.experience = experience || teacher.experience;
        if (photoUrl && photoUrl !== 'Photo URL') {
          teacher.photo = photoUrl;
          teacher.photoUrl = photoUrl;
        }
        keepIds[teacher.id] = true;
      } else {
        const newId = id || ('t_' + Date.now().toString(36) + '_' + i);
        appData.teachers.push({
          id: newId,
          name: name || 'Faculty Member',
          subject: subject,
          email: email,
          password: password,
          status: status,
          phone: phone,
          qualification: qualification,
          experience: experience,
          photo: (photoUrl && photoUrl !== 'Photo URL') ? photoUrl : null,
          photoUrl: (photoUrl && photoUrl !== 'Photo URL') ? photoUrl : ''
        });
        keepIds[newId] = true;
      }
    }

    if (Object.keys(keepIds).length > 0) {
      appData.teachers = appData.teachers.filter(t => keepIds[t.id]);
    }
  } catch (e) {
    Logger.log('mergeTeachersFromSheet_ error: ' + e.toString());
  }
  return appData;
}

/**
 * Dynamically merges batches from the Batches_Roster sheet tab
 */
function mergeBatchesFromSheet_(appData) {
  try {
    const ss = getDbSpreadsheet();
    if (!ss) return appData;
    const sheet = ss.getSheetByName('Batches_Roster');
    if (!sheet) return appData;
    const values = sheet.getDataRange().getValues();
    if (!values || values.length <= 1) return appData;

    if (!appData.batches) appData.batches = [];
    const keepIds = {};

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const id = String(row[0] || '').trim();
      const name = String(row[1] || '').trim();
      if (!id && !name) continue;

      const subject = String(row[2] || '').trim();
      const schedule = String(row[3] || '').trim();
      const room = String(row[4] || '').trim();
      const teacher = String(row[5] || '').trim();

      let batch = null;
      if (id) {
        batch = appData.batches.find(b => String(b.id || '').trim() === id);
      }
      if (!batch && name) {
        batch = appData.batches.find(b => String(b.name || '').trim().toLowerCase() === name.toLowerCase());
      }

      if (batch) {
        batch.id = id || batch.id;
        batch.name = name || batch.name;
        batch.subject = subject || batch.subject;
        batch.schedule = schedule || batch.schedule;
        batch.room = room || batch.room;
        batch.teacher = teacher || batch.teacher;
        keepIds[batch.id] = true;
      } else {
        const newId = id || ('b_' + Date.now().toString(36) + '_' + i);
        appData.batches.push({
          id: newId,
          name: name || 'General Batch',
          subject: subject,
          schedule: schedule,
          room: room,
          teacher: teacher,
          studentIds: []
        });
        keepIds[newId] = true;
      }
    }

    if (Object.keys(keepIds).length > 0) {
      appData.batches = appData.batches.filter(b => keepIds[b.id]);
    }
  } catch (e) {
    Logger.log('mergeBatchesFromSheet_ error: ' + e.toString());
  }
  return appData;
}

/**
 * Dynamically merges assignments & DPPs from the Materials_Repository sheet tab
 */
function mergeMaterialsFromSheet_(appData) {
  try {
    const ss = getDbSpreadsheet();
    if (!ss) return appData;
    const sheet = ss.getSheetByName('Materials_Repository');
    if (!sheet) return appData;
    const values = sheet.getDataRange().getValues();
    if (!values || values.length <= 1) return appData;

    if (!appData.materials) appData.materials = [];
    const keepIds = {};
    const tz = Session.getScriptTimeZone();

    const batchNameToId = {};
    (appData.batches || []).forEach(b => {
      batchNameToId[String(b.name || '').toLowerCase()] = b.id;
    });

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const id = String(row[0] || '').trim();
      const title = String(row[1] || '').trim();
      if (!id && !title) continue;

      const batchName = String(row[2] || '').trim();
      const category = String(row[3] || 'Assignment PDF').trim();
      let uploadDate = row[4];
      if (uploadDate instanceof Date && !isNaN(uploadDate)) {
        uploadDate = Utilities.formatDate(uploadDate, tz, 'dd MMM yyyy');
      } else {
        uploadDate = String(uploadDate || '').trim();
      }
      const uploadedBy = String(row[5] || 'Faculty').trim();
      const fileSize = String(row[6] || 'PDF').trim();
      const downloads = Number(row[7]) || 0;
      const description = String(row[8] || '').trim();
      const downloadUrl = String(row[9] || '').trim();
      const driveUrl = String(row[10] || '').trim();

      const batchId = batchNameToId[batchName.toLowerCase()] || (appData.batches && appData.batches[0] ? appData.batches[0].id : 'b1');

      let mat = null;
      if (id) {
        mat = appData.materials.find(m => String(m.id || '').trim() === id);
      }
      if (!mat && title) {
        mat = appData.materials.find(m => String(m.title || '').trim().toLowerCase() === title.toLowerCase());
      }

      if (mat) {
        mat.id = id || mat.id;
        mat.title = title || mat.title;
        mat.batchId = batchId || mat.batchId;
        mat.category = category || mat.category;
        mat.uploadDate = uploadDate || mat.uploadDate;
        mat.uploadedBy = uploadedBy || mat.uploadedBy;
        mat.fileSize = fileSize || mat.fileSize;
        mat.downloads = downloads;
        mat.description = description || mat.description;
        if (downloadUrl) mat.downloadUrl = downloadUrl;
        if (driveUrl) mat.driveUrl = driveUrl;
        keepIds[mat.id] = true;
      } else {
        const newId = id || ('m_' + Date.now().toString(36) + '_' + i);
        appData.materials.push({
          id: newId,
          title: title || 'Study Document',
          batchId: batchId,
          category: category,
          uploadDate: uploadDate || 'October 2026',
          uploadedBy: uploadedBy,
          fileSize: fileSize,
          downloads: downloads,
          description: description,
          downloadUrl: downloadUrl,
          driveUrl: driveUrl
        });
        keepIds[newId] = true;
      }
    }

    if (Object.keys(keepIds).length > 0) {
      appData.materials = appData.materials.filter(m => keepIds[m.id]);
    }
  } catch (e) {
    Logger.log('mergeMaterialsFromSheet_ error: ' + e.toString());
  }
  return appData;
}

/**
 * Dynamically merges offline tests and student marks from the Offline_Test_Marks sheet tab
 */
function mergeTestsFromSheet_(appData) {
  try {
    const ss = getDbSpreadsheet();
    if (!ss) return appData;
    const sheet = ss.getSheetByName('Offline_Test_Marks');
    if (!sheet) return appData;
    const values = sheet.getDataRange().getValues();
    if (!values || values.length <= 1) return appData;

    if (!appData.offlineTests) appData.offlineTests = [];
    const keepIds = {};
    const tz = Session.getScriptTimeZone();

    const header = values[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
    const isStudentFormat = header.indexOf('student id') >= 0 || header.indexOf('roll no') >= 0 || header.indexOf('marks scored') >= 0 || header.indexOf('student name') >= 0;

    const batchNameToId = {};
    (appData.batches || []).forEach(function (b) {
      batchNameToId[String(b.name || '').toLowerCase()] = b.id;
    });

    const studentMap = {};
    (appData.students || []).forEach(function (s) {
      if (s.id) studentMap[String(s.id).toLowerCase()] = s.id;
      if (s.roll) studentMap[String(s.roll).toLowerCase()] = s.id;
      if (s.name) studentMap[String(s.name).toLowerCase()] = s.id;
    });

    if (isStudentFormat) {
      const colTestId = header.indexOf('test id') >= 0 ? header.indexOf('test id') : 0;
      const colTitle = header.indexOf('test title') >= 0 ? header.indexOf('test title') : 1;
      const colSubject = header.indexOf('subject') >= 0 ? header.indexOf('subject') : 2;
      const colDate = header.indexOf('conducted date') >= 0 ? header.indexOf('conducted date') : 3;
      const colMax = header.indexOf('max marks') >= 0 ? header.indexOf('max marks') : 4;
      const colBatch = header.indexOf('assigned batch') >= 0 ? header.indexOf('assigned batch') : (header.indexOf('batch') >= 0 ? header.indexOf('batch') : 5);
      const colStuId = header.indexOf('student id') >= 0 ? header.indexOf('student id') : 6;
      const colRoll = header.indexOf('roll no') >= 0 ? header.indexOf('roll no') : 7;
      const colStuName = header.indexOf('student name') >= 0 ? header.indexOf('student name') : 8;
      const colScore = header.indexOf('marks scored') >= 0 ? header.indexOf('marks scored') : 9;
      const colRemarks = header.indexOf('remarks') >= 0 ? header.indexOf('remarks') : 11;

      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const id = String(row[colTestId] || '').trim();
        const title = String(row[colTitle] || '').trim();
        if (!id && !title) continue;

        const subject = String(row[colSubject] || '').trim();
        let date = row[colDate];
        if (date instanceof Date && !isNaN(date)) {
          date = Utilities.formatDate(date, tz, 'dd MMM yyyy');
        } else {
          date = String(date || '').trim();
        }
        const maxMarks = Number(row[colMax]) || 100;
        const batchName = String(row[colBatch] || '').trim();
        const batchId = batchNameToId[batchName.toLowerCase()] || (appData.batches && appData.batches[0] ? appData.batches[0].id : 'b1');

        let test = appData.offlineTests.find(function (t) {
          return (id && String(t.id || '').trim() === id) || (title && String(t.title || '').trim().toLowerCase() === title.toLowerCase());
        });

        if (!test) {
          test = {
            id: id || ('t_' + Date.now().toString(36) + '_' + i),
            title: title || 'Offline Test',
            subject: subject,
            date: date,
            maxMarks: maxMarks,
            batchId: batchId,
            marks: {}
          };
          appData.offlineTests.push(test);
        } else {
          test.id = id || test.id;
          test.title = title || test.title;
          if (subject) test.subject = subject;
          if (date) test.date = date;
          if (maxMarks) test.maxMarks = maxMarks;
          if (batchId) test.batchId = batchId;
          if (!test.marks) test.marks = {};
        }
        keepIds[test.id] = true;

        const rowStuId = String(row[colStuId] || '').trim();
        const rowRoll = String(row[colRoll] || '').trim();
        const rowName = String(row[colStuName] || '').trim();
        const resolvedStuId = (rowStuId && studentMap[rowStuId.toLowerCase()]) ||
                              (rowRoll && studentMap[rowRoll.toLowerCase()]) ||
                              (rowName && studentMap[rowName.toLowerCase()]) ||
                              (rowStuId && rowStuId !== '-' ? rowStuId : null);

        if (resolvedStuId) {
          const rawScore = row[colScore];
          const score = (rawScore !== '' && rawScore !== null && !isNaN(Number(rawScore))) ? Number(rawScore) : 0;
          const remarks = String(row[colRemarks] || '').trim();
          test.marks[resolvedStuId] = {
            score: score,
            remarks: remarks || (test.marks[resolvedStuId] ? test.marks[resolvedStuId].remarks : '')
          };
        }
      }
    } else {
      // Legacy format fallback
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const id = String(row[0] || '').trim();
        const title = String(row[1] || '').trim();
        if (!id && !title) continue;

        const subject = String(row[2] || '').trim();
        let date = row[3];
        if (date instanceof Date && !isNaN(date)) {
          date = Utilities.formatDate(date, tz, 'dd MMM yyyy');
        } else {
          date = String(date || '').trim();
        }
        const maxMarks = Number(row[4]) || 100;
        const batchName = String(row[5] || '').trim();
        const batchId = batchNameToId[batchName.toLowerCase()] || (appData.batches && appData.batches[0] ? appData.batches[0].id : 'b1');

        let test = appData.offlineTests.find(function (t) {
          return (id && String(t.id || '').trim() === id) || (title && String(t.title || '').trim().toLowerCase() === title.toLowerCase());
        });

        if (test) {
          test.id = id || test.id;
          test.title = title || test.title;
          test.subject = subject || test.subject;
          test.date = date || test.date;
          test.maxMarks = maxMarks || test.maxMarks;
          test.batchId = batchId || test.batchId;
          keepIds[test.id] = true;
        } else {
          const newId = id || ('t_' + Date.now().toString(36) + '_' + i);
          appData.offlineTests.push({
            id: newId,
            title: title || 'Offline Test',
            subject: subject,
            date: date,
            maxMarks: maxMarks,
            batchId: batchId,
            marks: {}
          });
          keepIds[newId] = true;
        }
      }
    }

    if (Object.keys(keepIds).length > 0) {
      appData.offlineTests = appData.offlineTests.filter(function (t) { return keepIds[t.id]; });
    }
  } catch (e) {
    Logger.log('mergeTestsFromSheet_ error: ' + e.toString());
  }
  return appData;
}

/**
 * Dynamically merges gallery banners from the Gallery_Banners sheet tab
 */
function mergeGalleryFromSheet_(appData) {
  try {
    if (!appData) appData = {};
    if (!appData.gallery) appData.gallery = [];

    const ss = getDbSpreadsheet();
    if (!ss) return appData;
    const sheet = ss.getSheetByName('Gallery_Banners');
    if (!sheet) return appData;
    const values = sheet.getDataRange().getValues();
    if (!values || values.length <= 1) return appData;

    const tz = Session.getScriptTimeZone();

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const id = String(row[0] || '').trim();
      const title = String(row[1] || '').trim();
      if (!id && !title) continue;

      const category = String(row[2] || '').trim();
      let date = row[3];
      if (date instanceof Date && !isNaN(date)) {
        date = Utilities.formatDate(date, tz, 'dd MMM yyyy');
      } else {
        date = String(date || '').trim();
      }
      const caption = String(row[4] || '').trim();
      const badge = String(row[5] || '').trim();
      const imageUrl = String(row[6] || '').trim();

      let item = null;
      if (id) {
        item = appData.gallery.find(g => String(g.id || '').trim() === id);
      }
      if (!item && title) {
        item = appData.gallery.find(g => String(g.title || '').trim().toLowerCase() === title.toLowerCase());
      }

      if (item) {
        item.id = id || item.id;
        item.title = title || item.title;
        item.category = category || item.category;
        item.date = date || item.date;
        item.caption = caption || item.caption;
        item.badge = badge || item.badge;
        if (imageUrl) item.imageUrl = imageUrl;
      } else {
        const newId = id || ('g_' + Date.now().toString(36) + '_' + i);
        appData.gallery.push({
          id: newId,
          title: title || 'Gallery Image',
          category: category,
          date: date,
          caption: caption,
          badge: badge,
          imageUrl: imageUrl
        });
      }
    }
  } catch (e) {
    Logger.log('mergeGalleryFromSheet_ error: ' + e.toString());
  }
  return appData;
}

/**
 * Dynamically merges feedback from the Feedback_Responses sheet tab
 */
function mergeFeedbackFromSheet_(appData) {
  try {
    const ss = getDbSpreadsheet();
    if (!ss) return appData;
    const sheet = ss.getSheetByName('Feedback_Responses');
    if (!sheet) return appData;
    const values = sheet.getDataRange().getValues();
    if (!values || values.length <= 1) return appData;

    if (!appData.feedbacks) appData.feedbacks = [];
    const keepKeys = {};
    const tz = Session.getScriptTimeZone();

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const authorName = String(row[0] || '').trim();
      const comment = String(row[6] || '').trim();
      if (!authorName && !comment) continue;

      const role = String(row[1] || 'Student').trim();
      const batchName = String(row[2] || '').trim();
      const category = String(row[3] || 'General').trim();
      const rating = Number(row[4]) || 5;
      let date = row[5];
      if (date instanceof Date && !isNaN(date)) {
        date = Utilities.formatDate(date, tz, 'dd MMM yyyy');
      } else {
        date = String(date || '').trim();
      }

      const key = (authorName + '_' + date + '_' + comment.slice(0, 20)).toLowerCase();
      let fb = appData.feedbacks.find(f => (String(f.authorName || '') + '_' + String(f.date || '') + '_' + String(f.comment || '').slice(0, 20)).toLowerCase() === key);

      if (fb) {
        fb.authorName = authorName || fb.authorName;
        fb.role = role || fb.role;
        fb.batchName = batchName || fb.batchName;
        fb.category = category || fb.category;
        fb.rating = rating;
        fb.date = date || fb.date;
        fb.comment = comment || fb.comment;
        keepKeys[key] = true;
      } else {
        const newFb = {
          id: 'fb_' + Date.now().toString(36) + '_' + i,
          authorName: authorName || 'Anonymous',
          role: role,
          batchName: batchName,
          category: category,
          rating: rating,
          date: date || 'October 2026',
          comment: comment
        };
        appData.feedbacks.push(newFb);
        keepKeys[key] = true;
      }
    }

    if (Object.keys(keepKeys).length > 0) {
      appData.feedbacks = appData.feedbacks.filter(f => {
        const k = (String(f.authorName || '') + '_' + String(f.date || '') + '_' + String(f.comment || '').slice(0, 20)).toLowerCase();
        return keepKeys[k];
      });
    }
  } catch (e) {
    Logger.log('mergeFeedbackFromSheet_ error: ' + e.toString());
  }
  return appData;
}

/**
 * Dynamically merges settings from the Settings_Config sheet tab
 */
function mergeSettingsFromSheet_(appData) {
  try {
    const ss = getDbSpreadsheet();
    if (!ss) return appData;
    const sheet = ss.getSheetByName('Settings_Config');
    if (!sheet) return appData;
    const values = sheet.getDataRange().getValues();
    if (!values || values.length <= 1) return appData;

    if (!appData.settings) appData.settings = {};
    if (!appData.settings.dummyDataConfig) appData.settings.dummyDataConfig = {};

    for (let i = 1; i < values.length; i++) {
      const param = String(values[i][0] || '').trim().toLowerCase();
      const val = String(values[i][1] || '').trim();
      if (!param) continue;

      if (param.indexOf('institute name') !== -1) {
        if (val && !/^mia$/i.test(val)) appData.settings.instituteName = val;
      } else if (param.indexOf('tagline') !== -1) {
        appData.settings.tagline = val;
      } else if (param.indexOf('helpline') !== -1 || param === 'phone') {
        appData.settings.phone = val;
        appData.settings.helplinePhone = val;
      } else if (param.indexOf('display contact') !== -1) {
        appData.settings.contactDisplay = val;
      } else if (param.indexOf('official email') !== -1) {
        appData.settings.email = val;
      } else if (param.indexOf('address') !== -1) {
        appData.settings.address = val;
      } else if (param.indexOf('upi') !== -1) {
        appData.settings.upiId = val;
      } else if (param.indexOf('admin name') !== -1) {
        appData.settings.adminName = val;
      } else if (param.indexOf('master admin password') !== -1 || param.indexOf('admin password') !== -1) {
        appData.settings.adminPassword = val;
      } else if (param.indexOf('developer name') !== -1) {
        appData.settings.devName = val;
      } else if (param.indexOf('developer password') !== -1) {
        appData.settings.devPassword = val;
      } else if (param.indexOf('admin email') !== -1) {
        appData.settings.adminEmail = val;
        appData.settings.adminDriveEmail = val;
      } else if (param.indexOf('admin google drive folder link') !== -1 || param.indexOf('drive folder') !== -1) {
        appData.settings.adminDriveFolderUrl = val;
        appData.settings.driveFolderUrl = val;
      } else if (param.indexOf('admin drive access status') !== -1) {
        appData.settings.adminDriveAccessStatus = val;
        appData.settings.adminDriveShared = (val.toLowerCase().indexOf('authorized') !== -1);
      } else if (param.indexOf('facebook') !== -1) {
        appData.settings.facebookUrl = /^https?:\/\//i.test(val) ? val : ('https://' + val);
      } else if (param.indexOf('instagram') !== -1) {
        appData.settings.instagramUrl = /^https?:\/\//i.test(val) ? val : ('https://' + val);
      } else if (param.indexOf('youtube') !== -1) {
        appData.settings.youtubeUrl = /^https?:\/\//i.test(val) ? val : ('https://' + val);
      } else if (param.indexOf('show requirement labels') !== -1) {
        appData.settings.showRequirementLabels = (val.toLowerCase() === 'on' || val.toLowerCase() === 'true' || val.toLowerCase() === 'yes');
      } else if (param.indexOf('admin feedback delete') !== -1) {
        appData.settings.allowAdminFeedbackDelete = (val.toLowerCase() === 'on' || val.toLowerCase() === 'true' || val.toLowerCase() === 'yes');
      } else if (param.indexOf('study link delete') !== -1) {
        appData.settings.allowAdminLinkDelete = (val.toLowerCase() === 'on' || val.toLowerCase() === 'true' || val.toLowerCase() === 'yes');
      } else if (param.indexOf('overall dummy data master') !== -1) {
        const isMasterOff = (val.toLowerCase().indexOf('off') !== -1);
        appData.settings.showDummyData = !isMasterOff;
        appData.settings.demoDataPermanentlyDisabled = isMasterOff;
        try {
          if (isMasterOff) {
            PropertiesService.getScriptProperties().setProperty('DUMMY_DATA_DISABLED', 'true');
          } else {
            PropertiesService.getScriptProperties().deleteProperty('DUMMY_DATA_DISABLED');
          }
        } catch (propErr) { }
      } else if (param.indexOf('students master dummy data') !== -1) {
        appData.settings.dummyDataConfig.students = (val.toLowerCase().indexOf('off') === -1);
      } else if (param.indexOf('teachers roster dummy data') !== -1) {
        appData.settings.dummyDataConfig.teachers = (val.toLowerCase().indexOf('off') === -1);
      } else if (param.indexOf('batches roster dummy data') !== -1) {
        appData.settings.dummyDataConfig.batches = (val.toLowerCase().indexOf('off') === -1);
      } else if (param.indexOf('offline tests dummy data') !== -1) {
        appData.settings.dummyDataConfig.offlineTests = (val.toLowerCase().indexOf('off') === -1);
      } else if (param.indexOf('materials dummy data') !== -1) {
        appData.settings.dummyDataConfig.materials = (val.toLowerCase().indexOf('off') === -1);
      } else if (param.indexOf('gallery dummy data') !== -1) {
        appData.settings.dummyDataConfig.gallery = (val.toLowerCase().indexOf('off') === -1);
      } else if (param.indexOf('feedback dummy data') !== -1) {
        appData.settings.dummyDataConfig.feedbacks = (val.toLowerCase().indexOf('off') === -1);
      } else if (param.indexOf('last auto-sync') !== -1) {
        appData.settings.lastSyncTimestamp = val;
      }
    }
  } catch (e) {
    Logger.log('mergeSettingsFromSheet_ error: ' + e.toString());
  }
  return appData;
}

/**
 * Initializes or returns the Database records
 * Primary source is Cloud Database (PropertiesService) & Database tables
 */
function getFullInitialData_() {
  try {
    // 1. Primary Source: Cloud Database (PropertiesService)
    let appData = dbLoadAll_();
    const hasCloudDatabase = !!appData;

    // 2. Fallback: If database is not initialized yet, check sheet DB_JSON or seed data
    if (!appData) {
      const ss = getDbSpreadsheet();
      if (ss) {
        const dataSheet = ss.getSheetByName('DB_JSON');
        if (dataSheet) {
          const val = dataSheet.getRange(1, 1).getValue();
          if (val && typeof val === 'string' && val.trim().startsWith('{')) {
            try { appData = JSON.parse(val); } catch (e) { }
          }
        }
      }
    }

    const isExplicitlyEnabled = appData && appData.settings && appData.settings.showDummyData === true;
    const isDemoDisabled = !isExplicitlyEnabled && (
      (appData && appData.settings && appData.settings.showDummyData === false) ||
      (appData && appData.settings && appData.settings.demoDataPermanentlyDisabled === true) ||
      PropertiesService.getScriptProperties().getProperty('DUMMY_DATA_DISABLED') === 'true'
    );

    if (!appData) {
      if (isDemoDisabled) {
        appData = { batches: [], students: [], materials: [], offlineTests: [], teachers: [], gallery: [], externalLinks: OFFICIAL_EXTERNAL_LINKS.slice(), feedbacks: [], settings: { showDummyData: false, demoDataPermanentlyDisabled: true } };
      } else {
        appData = getDefaultSeedData();
      }
    }
    const initialDataJson = JSON.stringify(appData);

    // 2b. Dynamically merge records added/edited/deleted directly in Database tables
    appData = mergeStudentsFromSheet_(appData);
    appData = mergeTeachersFromSheet_(appData);
    appData = mergeBatchesFromSheet_(appData);
    appData = mergeMaterialsFromSheet_(appData);
    appData = mergeTestsFromSheet_(appData);
    appData = mergeGalleryFromSheet_(appData);
    appData = mergeFeedbackFromSheet_(appData);
    appData = mergeLinksFromSheet_(appData);
    appData = mergeSettingsFromSheet_(appData);

    // Safety: curated study portals are permanent — re-seed if list ended up empty
    if (!appData.externalLinks || appData.externalLinks.length === 0) {
      appData.externalLinks = OFFICIAL_EXTERNAL_LINKS.slice();
    }
    if (!isDemoDisabled && (!appData.gallery || appData.gallery.length === 0)) {
      appData.gallery = OFFICIAL_GALLERY_BANNERS.slice();
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

    // Institute name normalization: ensure Divine Classes is always used instead of Mia/MIA
    if (appData.settings) {
      if (!appData.settings.instituteName || /^mia$/i.test(String(appData.settings.instituteName).trim())) {
        appData.settings.instituteName = 'Divine Classes';
      }
    }

    // Enforce demo data purge if disabled
    if (isDemoDisabled) {
      if (!appData.settings) appData.settings = {};
      appData.settings.showDummyData = false;
      appData.settings.demoDataPermanentlyDisabled = true;
      stripDummyData_(appData);
    }

    // Keep sheet-imported changes in sync, but avoid rewriting every sheet for an unchanged read.
    const dataChanged = !hasCloudDatabase || JSON.stringify(appData) !== initialDataJson;
    if (dataChanged) {
      dbSaveAll_(appData);
      try {
        const ss = getDbSpreadsheet();
        if (ss) {
          const sheetData = isDemoDisabled
            ? stripDummyData_(JSON.parse(JSON.stringify(appData)))
            : appData;
          syncReadableSheets(ss, sheetData);
        }
      } catch (sheetSyncErr) {
        Logger.log('Sheet sync after imported data change: ' + sheetSyncErr.toString());
      }
    }

    // Developer toggle: hide seed/demo records from clients (DB keeps clean state)
    return isDemoDisabled ? stripDummyData_(appData) : appData;
  } catch (err) {
    Logger.log('apiGetInitialData error: ' + err.toString());
    try {
      const saved = dbLoadAll_();
      if (saved && (saved.students || saved.batches)) return saved;
    } catch (loadErr) { }
    const seed = getDefaultSeedData();
    return seed;
  }
}

var PORTAL_SESSION_PROPERTY_PREFIX = 'DIVINE_PORTAL_SESSION_';
var PORTAL_REMEMBERED_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function removeExpiredRememberedPortalSessions_() {
  const properties = PropertiesService.getScriptProperties();
  const storedProperties = properties.getProperties();
  const now = Date.now();
  Object.keys(storedProperties).forEach(function (key) {
    if (key.indexOf(PORTAL_SESSION_PROPERTY_PREFIX) !== 0) return;
    try {
      const record = JSON.parse(storedProperties[key]);
      if (!record || !record.expiresAt || now >= record.expiresAt) {
        properties.deleteProperty(key);
      }
    } catch (err) {
      properties.deleteProperty(key);
    }
  });
}

function getPortalSession_(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(PORTAL_SESSION_PROPERTY_PREFIX + token);
    if (cached) return JSON.parse(cached);

    const propertyKey = PORTAL_SESSION_PROPERTY_PREFIX + token;
    const stored = PropertiesService.getScriptProperties().getProperty(propertyKey);
    if (!stored) return null;
    const record = JSON.parse(stored);
    if (!record || !record.session || !record.expiresAt || Date.now() >= record.expiresAt) {
      PropertiesService.getScriptProperties().deleteProperty(propertyKey);
      return null;
    }
    const remainingSeconds = Math.ceil((record.expiresAt - Date.now()) / 1000);
    cache.put(propertyKey, JSON.stringify(record.session), Math.min(21600, remainingSeconds));
    return record.session;
  } catch (err) {
    Logger.log('getPortalSession_ error: ' + err.toString());
    return null;
  }
}

function filterPortalData_(fullData, session) {
  const data = JSON.parse(JSON.stringify(fullData || {}));
  const role = session && session.role;
  const userId = session && session.userId;
  if (role === 'admin' || role === 'developer') {
    data.students = data.students || [];
    return data;
  }

  const settings = data.settings || {};
  [
    'adminPassword', 'devPassword', 'drivePassword', 'driveEmail',
    'adminDriveEmail', 'adminDriveFolderUrl', 'driveFolderUrl',
    'driveUrl', 'googleApiKey'
  ].forEach(function (key) { delete settings[key]; });
  data.settings = settings;

  data.teachers = (data.teachers || []).map(function (teacher) {
    const copy = Object.assign({}, teacher);
    delete copy.password;
    if (role === 'teacher' && copy.id !== userId) {
      return {
        id: copy.id,
        name: copy.name,
        initials: copy.initials,
        subject: copy.subject,
        photo: copy.photo,
        photoUrl: copy.photoUrl,
        qualification: copy.qualification,
        experience: copy.experience,
        specialization: copy.specialization,
        bio: copy.bio
      };
    }
    return copy;
  });

  if (role === 'teacher') {
    const allStudents = data.students || [];
    data.students = (data.students || []).map(function (student) {
      return {
        id: student.id,
        name: student.name,
        roll: student.roll,
        status: student.status,
        batchId: student.batchId
      };
    });
    data.batches = (data.batches || []).map(function (batch) {
      const copy = Object.assign({}, batch);
      copy.studentIds = (copy.studentIds || []).map(function (identifier) {
        const student = allStudents.find(function (record) {
          return record.id === identifier || record.roll === identifier;
        });
        return student ? student.id : identifier;
      });
      return copy;
    });
    data.notifications = [];
    data.feedbacks = [];
    return data;
  }

  if (role === 'student') {
    const student = (data.students || []).find(function (record) { return record.id === userId; });
    data.students = student ? [student] : [];
    if (student) delete data.students[0].password;
    data.batches = (data.batches || []).map(function (batch) {
      const copy = Object.assign({}, batch);
      copy.studentIds = (copy.studentIds || []).filter(function (id) {
        return id === userId || (student && id === student.roll);
      });
      return copy;
    });
    data.offlineTests = (data.offlineTests || []).map(function (test) {
      const copy = Object.assign({}, test);
      const marks = test.marks || {};
      copy.marks = {};
      if (marks[userId] !== undefined) copy.marks[userId] = marks[userId];
      if (student && student.roll && marks[student.roll] !== undefined) copy.marks[student.roll] = marks[student.roll];
      return copy;
    });
    data.notifications = (data.notifications || []).filter(function (notification) {
      return notification.targetStudentId === userId ||
        (student && notification.targetRoll === student.roll) ||
        notification.targetRole === 'all';
    });
    data.feedbacks = [];
    return data;
  }

  data.students = [];
  data.offlineTests = [];
  data.notifications = [];
  data.feedbacks = [];
  data.batches = (data.batches || []).map(function (batch) {
    const copy = Object.assign({}, batch);
    delete copy.studentIds;
    return copy;
  });
  return data;
}

function apiAuthenticatePortalUser(identifier, password, rememberMe) {
  const loginId = String(identifier || '').trim();
  const loginPassword = String(password || '').trim();
  if (!loginId || !loginPassword) return { success: false, error: 'Enter your login ID and password.' };

  let spreadsheet;
  let settings = {};
  let students = [];
  let teachers = [];
  try {
    spreadsheet = getDbSpreadsheet();
    if (!spreadsheet) throw new Error('The configured Google spreadsheet is unavailable.');

    const settingsSheet = spreadsheet.getSheetByName('Settings_Config');
    if (settingsSheet) {
      settingsSheet.getDataRange().getValues().forEach(function (row) {
        const key = String(row[0] || '').trim().toLowerCase();
        if (!key) return;
        const value = String(row[1] || '').trim();
        if (key.indexOf('admin name') !== -1) settings.adminName = value;
        else if (key.indexOf('master admin password') !== -1 || key.indexOf('admin password') !== -1) settings.adminPassword = value;
        else if (key.indexOf('admin email') !== -1) settings.adminEmail = value;
        else if (key.indexOf('developer name') !== -1) settings.devName = value;
        else if (key.indexOf('developer password') !== -1) settings.devPassword = value;
      });
    }

    function readAccountSheet_(sheetName, columns) {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) return [];
      const values = sheet.getDataRange().getValues();
      if (!values.length) return [];
      const headers = values[0].map(function (value) { return String(value || '').trim().toLowerCase(); });
      function column_(names, fallback) {
        for (let i = 0; i < names.length; i++) {
          const index = headers.indexOf(names[i].toLowerCase());
          if (index !== -1) return index;
        }
        return fallback;
      }
      const indexes = {};
      Object.keys(columns).forEach(function (key) {
        indexes[key] = column_(columns[key].names, columns[key].fallback);
      });
      return values.slice(1).map(function (row) {
        const account = {};
        Object.keys(indexes).forEach(function (key) {
          account[key] = String(row[indexes[key]] || '').trim();
        });
        return account;
      }).filter(function (account) {
        return account.name || account.identifier;
      });
    }

    students = readAccountSheet_('Students_Master', {
      identifier: { names: ['roll no', 'roll'], fallback: 0 },
      name: { names: ['student name', 'name'], fallback: 1 },
      password: { names: ['login password', 'password'], fallback: 3 },
      status: { names: ['access status', 'status'], fallback: 4 },
      phone: { names: ['contact phone', 'phone'], fallback: 6 }
    });
    teachers = readAccountSheet_('Teachers_Roster', {
      id: { names: ['teacher id', 'id'], fallback: 0 },
      name: { names: ['teacher name', 'name'], fallback: 1 },
      email: { names: ['login email', 'email'], fallback: 3 },
      password: { names: ['login password', 'password'], fallback: 4 },
      status: { names: ['access status', 'status'], fallback: 5 },
      phone: { names: ['contact phone', 'phone'], fallback: 6 }
    });
  } catch (sheetError) {
    Logger.log('Portal authentication could not read Google Sheets: ' + sheetError.toString());
    return { success: false, error: 'Could not verify your account from Google Sheets. Please try again.' };
  }

  const lowerId = loginId.toLowerCase();
  let session = null;
  let studentToResolve = null;
  let error = 'Invalid login ID or password.';

  const developerIds = ['dev', 'developer', 'developer@divineclasses.in', 'system architect', String(settings.devName || '').toLowerCase()];
  if (developerIds.indexOf(lowerId) !== -1 && settings.devPassword &&
      loginPassword === String(settings.devPassword)) {
    session = {
      role: 'developer',
      userId: 'developer',
      name: settings.devName || 'Lead Developer',
      identifier: settings.devName || 'System Architect'
    };
  } else {
    const configuredAdminEmail = String(settings.adminEmail || '').toLowerCase();
    const adminIds = ['admin', 'admin@divineclasses.in', 'divineclasses1010@gmail.com', configuredAdminEmail, 'anil', 'anil chahar', String(settings.adminName || '').toLowerCase()];
    const isAdmin = adminIds.indexOf(lowerId) !== -1;
    if (isAdmin && settings.adminPassword && loginPassword === String(settings.adminPassword)) {
      session = {
        role: 'admin',
        userId: 'admin',
        name: settings.adminName || 'Administrator',
        identifier: settings.adminName || 'Admin Master'
      };
    }
  }

  if (!session) {
    const normalizedPhone = loginId.replace(/[\s+-]/g, '');
    const teacher = teachers.find(function (record) {
      return (record.email && record.email.toLowerCase() === lowerId) ||
        (normalizedPhone && record.phone.replace(/[\s+-]/g, '').includes(normalizedPhone)) ||
        record.name.toLowerCase() === lowerId;
    });
    if (teacher) {
      if (/inactive/i.test(teacher.status)) error = 'This faculty account is inactive.';
      else if (/blocked/i.test(teacher.status)) error = 'This faculty account is blocked.';
      else if (teacher.password && loginPassword === teacher.password) {
        session = { role: 'teacher', userId: teacher.id, name: teacher.name, identifier: teacher.email };
      }
    }
  }

  if (!session) {
    const normalizedPhone = loginId.replace(/[\s+-]/g, '');
    const student = students.find(function (record) {
      return record.identifier.toLowerCase() === lowerId ||
        (normalizedPhone && record.phone.replace(/[\s+-]/g, '').includes(normalizedPhone)) ||
        record.name.toLowerCase() === lowerId;
    });
    if (student) {
      if (/inactive/i.test(student.status)) error = 'This student record is inactive.';
      else if (/blocked/i.test(student.status)) error = 'This student account is blocked.';
      else if (student.password && loginPassword === student.password) {
        studentToResolve = student;
        session = { role: 'student', userId: '', name: student.name, identifier: student.identifier };
      }
    }
  }

  if (!session) return { success: false, error: error };
  const data = getFullInitialData_();
  if (studentToResolve) {
    const appStudent = (data.students || []).find(function (record) {
      return studentToResolve.identifier
        ? String(record.roll || '').trim().toLowerCase() === studentToResolve.identifier.toLowerCase()
        : String(record.name || '').trim().toLowerCase() === studentToResolve.name.toLowerCase();
    });
    if (!appStudent || !appStudent.id) {
      return { success: false, error: 'Your student record could not be loaded. Please contact the institute.' };
    }
    session.userId = appStudent.id;
  }
  const token = Utilities.getUuid() + Utilities.getUuid();
  const sessionKey = PORTAL_SESSION_PROPERTY_PREFIX + token;
  const sessionCache = CacheService.getScriptCache();
  removeExpiredRememberedPortalSessions_();
  const sessionTtlMs = rememberMe === true
    ? PORTAL_REMEMBERED_SESSION_TTL_MS
    : 6 * 60 * 60 * 1000;
  const expiresAt = Date.now() + sessionTtlMs;
  PropertiesService.getScriptProperties().setProperty(sessionKey, JSON.stringify({
    session: session,
    expiresAt: expiresAt
  }));
  sessionCache.put(sessionKey, JSON.stringify(session), Math.min(21600, Math.ceil(sessionTtlMs / 1000)));
  return {
    success: true,
    token: token,
    session: session,
    data: filterPortalData_(data, session)
  };
}

function apiGetInitialData(token) {
  const data = getFullInitialData_();
  const session = getPortalSession_(token);
  const safeData = filterPortalData_(data, session);
  if (session) safeData.portalSession = session;
  return safeData;
}

const ATTENDANCE_DB_PREFIX_ = 'DB_attendance_';
const ATTENDANCE_DB_CHUNK_SIZE_ = 7800;
const ATTENDANCE_SHEET_MIGRATION_KEY_ = 'DB_attendance_sheet_migration_v1';
const ATTENDANCE_SHEET_NAME_ = 'attendance';
const ATTENDANCE_SHEET_HEADERS_ = ['Date', 'Batch ID', 'Batch Name', 'Student ID', 'Roll No', 'Student Name', 'Status', 'Marked By', 'Updated At'];

function attendanceDatabaseManifestKey_(month) {
  return ATTENDANCE_DB_PREFIX_ + month + '_manifest';
}

function attendanceDatabaseRecordKey_(record) {
  return [record.date, record.batchId, record.studentId].join('|');
}

function formatAttendanceTimestamp_(value) {
  if (!value) return '';
  const timestamp = value instanceof Date ? value : new Date(value);
  if (isNaN(timestamp.getTime())) throw new Error('An attendance record has an invalid timestamp.');
  return Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'dd:MM:yyyy:HH:mm:ss');
}

function getAttendanceDatabaseRecords_(month) {
  const properties = PropertiesService.getScriptProperties();
  const rawManifest = properties.getProperty(attendanceDatabaseManifestKey_(month));
  if (!rawManifest) return [];

  let manifest;
  try {
    manifest = JSON.parse(rawManifest);
  } catch (error) {
    throw new Error('Attendance database manifest is invalid for ' + month + '.');
  }
  if (!manifest || typeof manifest.revision !== 'string' ||
      !Number.isInteger(manifest.chunks) || manifest.chunks < 0) {
    throw new Error('Attendance database manifest is incomplete for ' + month + '.');
  }
  if (manifest.chunks === 0) return [];

  const records = [];
  for (let i = 0; i < manifest.chunks; i++) {
    const chunk = properties.getProperty(ATTENDANCE_DB_PREFIX_ + month + '_' + manifest.revision + '_' + i);
    if (chunk === null) throw new Error('Attendance database chunk is missing for ' + month + '.');
    let rows;
    try {
      rows = JSON.parse(chunk);
    } catch (error) {
      throw new Error('Attendance database chunk is invalid for ' + month + '.');
    }
    if (!Array.isArray(rows)) throw new Error('Attendance database chunk has an invalid format for ' + month + '.');
    Array.prototype.push.apply(records, rows);
  }
  return records;
}

function getAllAttendanceDatabaseRecords_() {
  const properties = PropertiesService.getScriptProperties().getProperties();
  const months = Object.keys(properties).map(function (key) {
    const match = key.match(/^DB_attendance_(\d{4}-\d{2})_manifest$/);
    return match ? match[1] : '';
  }).filter(Boolean);
  const records = [];
  months.forEach(function (month) {
    Array.prototype.push.apply(records, getAttendanceDatabaseRecords_(month));
  });
  return records;
}

function syncAttendanceDatabaseToSheet_() {
  const spreadsheet = getDbSpreadsheet();
  if (!spreadsheet) throw new Error('Could not open the attendance spreadsheet.');

  let sheet = spreadsheet.getSheetByName(ATTENDANCE_SHEET_NAME_);
  if (!sheet) {
    const legacySheet = spreadsheet.getSheetByName('Attendance');
    if (legacySheet) {
      legacySheet.setName(ATTENDANCE_SHEET_NAME_);
      sheet = legacySheet;
    } else {
      sheet = spreadsheet.insertSheet(ATTENDANCE_SHEET_NAME_);
    }
  }

  const records = getAllAttendanceDatabaseRecords_().sort(function (a, b) {
    return [a.date, a.batchId, a.studentId].join('|').localeCompare([b.date, b.batchId, b.studentId].join('|'));
  });
  const rows = [ATTENDANCE_SHEET_HEADERS_].concat(records.map(function (record) {
    return [
      record.date,
      record.batchId,
      record.batchName,
      record.studentId,
      record.roll,
      record.name,
      record.status,
      record.markedBy,
      formatAttendanceTimestamp_(record.updatedAt)
    ];
  }));
  const range = sheet.getRange(1, 1, rows.length, ATTENDANCE_SHEET_HEADERS_.length);
  range.setNumberFormat('@');
  range.setValues(rows);
  const lastRow = sheet.getLastRow();
  if (lastRow > rows.length) {
    sheet.getRange(rows.length + 1, 1, lastRow - rows.length, ATTENDANCE_SHEET_HEADERS_.length).clearContent();
  }
  sheet.setFrozenRows(1);
}

function saveAttendanceDatabaseRecords_(month, records) {
  const properties = PropertiesService.getScriptProperties();
  const serializedRecords = records.map(function (record) { return JSON.stringify(record); });
  const chunks = [];
  let current = [];
  let currentSize = 2;
  serializedRecords.forEach(function (serialized) {
    const recordSize = Utilities.newBlob(serialized).getBytes().length;
    const nextSize = currentSize + recordSize + (current.length ? 1 : 0);
    if (nextSize > ATTENDANCE_DB_CHUNK_SIZE_ && current.length) {
      chunks.push('[' + current.join(',') + ']');
      current = [];
      currentSize = 2;
    }
    if (Utilities.newBlob(serialized).getBytes().length + 2 > ATTENDANCE_DB_CHUNK_SIZE_) {
      throw new Error('An attendance record exceeds the database storage limit.');
    }
    if (current.length) currentSize++;
    current.push(serialized);
    currentSize += recordSize;
  });
  if (current.length) chunks.push('[' + current.join(',') + ']');

  const previousRaw = properties.getProperty(attendanceDatabaseManifestKey_(month));
  let previousManifest = null;
  if (previousRaw) {
    try {
      previousManifest = JSON.parse(previousRaw);
    } catch (error) {
      throw new Error('Attendance database manifest is invalid for ' + month + '.');
    }
  }
  if (chunks.length === 0) {
    properties.deleteProperty(attendanceDatabaseManifestKey_(month));
    if (previousManifest && typeof previousManifest.revision === 'string') {
      for (let i = 0; i < previousManifest.chunks; i++) {
        properties.deleteProperty(ATTENDANCE_DB_PREFIX_ + month + '_' + previousManifest.revision + '_' + i);
      }
    }
    return;
  }
  const revision = Date.now().toString(36) + Math.floor(Math.random() * 1000000).toString(36);
  chunks.forEach(function (chunk, index) {
    properties.setProperty(ATTENDANCE_DB_PREFIX_ + month + '_' + revision + '_' + index, chunk);
  });
  properties.setProperty(attendanceDatabaseManifestKey_(month), JSON.stringify({
    revision: revision,
    chunks: chunks.length
  }));

  if (previousManifest && typeof previousManifest.revision === 'string') {
    for (let i = 0; i < previousManifest.chunks; i++) {
      properties.deleteProperty(ATTENDANCE_DB_PREFIX_ + month + '_' + previousManifest.revision + '_' + i);
    }
  }
}

function migrateAttendanceSheetToDatabase_() {
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty(ATTENDANCE_SHEET_MIGRATION_KEY_) === 'complete') return;

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (properties.getProperty(ATTENDANCE_SHEET_MIGRATION_KEY_) === 'complete') return;
    const spreadsheet = getDbSpreadsheet();
    if (!spreadsheet) throw new Error('Could not open the legacy attendance sheet for its one-time database import.');

    const sheets = spreadsheet.getSheets().filter(function (sheet) {
      return sheet.getName() === 'attendance' || sheet.getName() === 'Attendance' || /^Attendance_\d{4}_\d{2}$/.test(sheet.getName());
    });
    const recordsByMonth = {};
    sheets.forEach(function (sheet) {
      const values = sheet.getDataRange().getValues();
      if (values.length < 2) return;
      const headers = values[0].map(function (value) { return String(value || '').trim(); });
      const requiredHeaders = ['Date', 'Batch ID', 'Batch Name', 'Student ID', 'Roll No', 'Student Name', 'Status', 'Marked By', 'Updated At'];
      const indexes = requiredHeaders.map(function (header) { return headers.indexOf(header); });
      if (indexes.some(function (index) { return index === -1; })) {
        Logger.log('Attendance database import skipped ' + sheet.getName() + ': unexpected columns.');
        return;
      }

      for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
        const row = values[rowIndex];
        const rawDate = row[indexes[0]];
        const date = rawDate instanceof Date
          ? Utilities.formatDate(rawDate, Session.getScriptTimeZone(), 'yyyy-MM-dd')
          : String(rawDate || '').trim();
        const batchId = String(row[indexes[1]] || '').trim();
        const studentId = String(row[indexes[3]] || '').trim();
        const status = String(row[indexes[6]] || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !batchId || !studentId ||
            ['Present', 'Absent', 'Late', 'Leave'].indexOf(status) === -1) continue;

        const month = date.slice(0, 7);
        if (!recordsByMonth[month]) recordsByMonth[month] = {};
        const record = {
          date: date,
          batchId: batchId,
          batchName: String(row[indexes[2]] || ''),
          studentId: studentId,
          roll: String(row[indexes[4]] || ''),
          name: String(row[indexes[5]] || ''),
          status: status,
          markedBy: String(row[indexes[7]] || ''),
          updatedAt: row[indexes[8]] instanceof Date
            ? row[indexes[8]].toISOString()
            : String(row[indexes[8]] || '')
        };
        recordsByMonth[month][attendanceDatabaseRecordKey_(record)] = record;
      }
    });

    Object.keys(recordsByMonth).forEach(function (month) {
      const existing = getAttendanceDatabaseRecords_(month);
      const byKey = {};
      existing.forEach(function (record) { byKey[attendanceDatabaseRecordKey_(record)] = record; });
      Object.keys(recordsByMonth[month]).forEach(function (key) {
        if (!byKey[key]) byKey[key] = recordsByMonth[month][key];
      });
      saveAttendanceDatabaseRecords_(month, Object.keys(byKey).map(function (key) { return byKey[key]; }));
    });
    properties.setProperty(ATTENDANCE_SHEET_MIGRATION_KEY_, 'complete');
  } finally {
    lock.releaseLock();
  }
}

function apiGetMonthlyAttendance(month, token) {
  const session = getPortalSession_(token);
  if (!session || ['admin', 'developer', 'teacher'].indexOf(session.role) === -1) {
    return { success: false, error: 'Access denied.' };
  }
  if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month) ||
      Number(month.slice(5, 7)) < 1 || Number(month.slice(5, 7)) > 12) {
    return { success: false, error: 'A valid attendance month is required.' };
  }

  try {
    migrateAttendanceSheetToDatabase_();
  } catch (error) {
    Logger.log('Attendance database migration error: ' + error.toString());
    return { success: false, error: 'Could not import existing attendance into the database: ' + error.message };
  }
  try {
    const spreadsheet = getDbSpreadsheet();
    const sheet = spreadsheet && spreadsheet.getSheetByName(ATTENDANCE_SHEET_NAME_);
    if (!sheet || sheet.getLastRow() <= 1) syncAttendanceDatabaseToSheet_();
  } catch (error) {
    Logger.log('Attendance sheet recovery error: ' + error.toString());
    return { success: false, error: 'Could not restore attendance records to the attendance sheet: ' + error.message };
  }
  const appData = dbLoadAll_();
  if (!appData) return { success: false, error: 'The application database is not initialized.' };
  const roster = {
    students: (Array.isArray(appData.students) ? appData.students : []).map(function (student) {
      return {
        id: String(student.id || ''),
        roll: String(student.roll || ''),
        name: String(student.name || ''),
        photo: String(student.photo || student.photoUrl || ''),
        photoUrl: String(student.photoUrl || student.photo || ''),
        status: String(student.status || 'Active')
      };
    }).filter(function (student) { return student.id; }),
    batches: (Array.isArray(appData.batches) ? appData.batches : []).map(function (batch) {
      return {
        id: String(batch.id || ''),
        name: String(batch.name || ''),
        studentIds: Array.isArray(batch.studentIds) ? batch.studentIds.map(String) : []
      };
    }).filter(function (batch) { return batch.id; })
  };
  let records;
  try {
    records = getAttendanceDatabaseRecords_(month);
  } catch (error) {
    Logger.log('Attendance database read error: ' + error.toString());
    return { success: false, error: 'Could not read attendance from the database: ' + error.message };
  }
  return { success: true, records: records, roster: roster };
}

function apiSaveDailyAttendance(payload, token) {
  const session = getPortalSession_(token);
  if (!session || ['admin', 'developer', 'teacher'].indexOf(session.role) === -1) {
    return { success: false, error: 'Access denied.' };
  }
  if (!payload || typeof payload.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(payload.date) ||
      isNaN(Date.parse(payload.date + 'T00:00:00Z')) ||
      Utilities.formatDate(new Date(payload.date + 'T00:00:00Z'), 'UTC', 'yyyy-MM-dd') !== payload.date) {
    return { success: false, error: 'A valid attendance date is required.' };
  }
  if (typeof payload.batchId !== 'string' || !payload.batchId.trim() ||
      !Array.isArray(payload.entries) || payload.entries.length === 0) {
    return { success: false, error: 'Select a batch and mark at least one student.' };
  }

  try {
    migrateAttendanceSheetToDatabase_();
  } catch (error) {
    Logger.log('Attendance database migration error: ' + error.toString());
    return { success: false, error: 'Could not import existing attendance into the database: ' + error.message };
  }
  const allowedStatuses = ['Present', 'Absent', 'Late', 'Leave'];
  const appData = dbLoadAll_();
  if (!appData) return { success: false, error: 'The application database is not initialized.' };
  const batches = Array.isArray(appData.batches) ? appData.batches : [];
  const students = Array.isArray(appData.students) ? appData.students : [];
  const batch = batches.find(function (record) { return record.id === payload.batchId; });
  if (!batch) return { success: false, error: 'The selected batch could not be found.' };

  const batchStudentIds = batch.studentIds || [];
  const otherBatchStudentIds = [];
  batches.forEach(function (record) {
    if (record.id !== batch.id) {
      (record.studentIds || []).forEach(function (studentId) {
        otherBatchStudentIds.push(String(studentId));
      });
    }
  });
  const seenStudents = {};
  const validatedRows = [];
  for (let i = 0; i < payload.entries.length; i++) {
    const entry = payload.entries[i] || {};
    const student = students.find(function (record) {
      return String(record.id) === String(entry.studentId);
    });
    if (!student || student.status === 'Inactive' || student.status === 'Blocked') {
      return { success: false, error: 'An active student in this roster could not be found.' };
    }
    const isInBatch = batchStudentIds.some(function (identifier) {
      return String(identifier) === String(student.id) || String(identifier) === String(student.roll);
    });
    const isUnassignedPrimaryBatchStudent = batches[0] && batches[0].id === batch.id &&
      !otherBatchStudentIds.some(function (identifier) {
        return identifier === String(student.id) || identifier === String(student.roll);
      });
    if (!isInBatch && !isUnassignedPrimaryBatchStudent) {
      return { success: false, error: 'A student is not assigned to the selected batch.' };
    }
    if (seenStudents[student.id] || allowedStatuses.indexOf(entry.status) === -1) {
      return { success: false, error: 'Attendance contains a duplicate student or an invalid status.' };
    }
    seenStudents[student.id] = true;
    validatedRows.push([
      payload.date,
      batch.id,
      batch.name || '',
      student.id,
      student.roll || '',
      student.name || '',
      entry.status,
      session.name || session.identifier || '',
      new Date().toISOString()
    ]);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const records = getAttendanceDatabaseRecords_(payload.date.slice(0, 7));
    const recordIndexes = {};
    records.forEach(function (record, index) {
      recordIndexes[attendanceDatabaseRecordKey_(record)] = index;
    });
    validatedRows.forEach(function (row) {
      const record = {
        date: row[0],
        batchId: row[1],
        batchName: row[2],
        studentId: row[3],
        roll: row[4],
        name: row[5],
        status: row[6],
        markedBy: row[7],
        updatedAt: row[8]
      };
      const key = attendanceDatabaseRecordKey_(record);
      if (recordIndexes[key] !== undefined) {
        records[recordIndexes[key]] = record;
      } else {
        recordIndexes[key] = records.length;
        records.push(record);
      }
    });
    saveAttendanceDatabaseRecords_(payload.date.slice(0, 7), records);
    syncAttendanceDatabaseToSheet_();
  } catch (error) {
    Logger.log('Attendance database or sheet save error: ' + error.toString());
    return { success: false, error: 'Could not save attendance to the database and attendance sheet: ' + error.message };
  } finally {
    lock.releaseLock();
  }
  return { success: true, savedCount: validatedRows.length, month: payload.date.slice(0, 7) };
}

function apiLogoutPortalSession(token) {
  if (!token || typeof token !== 'string') return { success: true };
  CacheService.getScriptCache().remove(PORTAL_SESSION_PROPERTY_PREFIX + token);
  PropertiesService.getScriptProperties().deleteProperty(PORTAL_SESSION_PROPERTY_PREFIX + token);
  return { success: true };
}

/**
 * Direct Database API: Alias to save state to Cloud Database
 */
function apiDatabaseSave(fullData, token) {
  const session = getPortalSession_(token);
  if (!session || (session.role !== 'admin' && session.role !== 'developer')) {
    return { success: false, error: 'Access denied.' };
  }
  return syncAllData_(fullData);
}

/**
 * Direct Database API: Query database or single table
 */
function apiDatabaseGet(tableName, token) {
  const session = getPortalSession_(token);
  if (!session || (session.role !== 'admin' && session.role !== 'developer')) {
    return { success: false, error: 'Access denied.' };
  }
  if (tableName) {
    return dbGetTable_(tableName);
  }
  return filterPortalData_(getFullInitialData_(), session);
}

/**
 * Direct Database API: Update a student's status (Active vs Blocked)
 */
function apiDatabaseUpdateStudentStatus(studentIdOrRoll, newStatus, token) {
  const session = getPortalSession_(token);
  if (!session || (session.role !== 'admin' && session.role !== 'developer')) {
    return { success: false, message: 'Access denied' };
  }
  // Operate on full DB data (not the dummy-stripped client view) so saving
  // never wipes seed/demo records when settings.showDummyData is false.
  let data = dbLoadAll_();
  if (!data) data = getDefaultSeedData();
  const student = (data.students || []).find(function (s) {
    return s.id === studentIdOrRoll || s.roll === studentIdOrRoll;
  });
  if (!student) return { success: false, message: 'Student not found in database' };
  student.status = (String(newStatus).toLowerCase() === 'blocked') ? 'Blocked' : 'Active';
  dbSaveAll_(data);
  return { success: true };
}

/**
 * Developer API: Toggle Dummy/Demo Data visibility in Web App and Database
 * - enabled = true:  Demo records are restored to Web App and written to Database
 * - enabled = false: Demo records are hidden from all client roles and wiped from Database
 */
/**
 * Developer API: Toggle Dummy/Demo Data for EACH SHEET individually or for all sheets
 * - target: 'students' | 'teachers' | 'batches' | 'offlineTests' | 'materials' | 'gallery' | 'feedbacks' | 'all'
 * - enabled: true (populate into sheet) | false (delete completely from sheet)
 * Note: External_Links_Hub is permanent and ALWAYS unchanged!
 */
function apiSetDummyDataStatus(target, enabled, clientState, token) {
  const session = getPortalSession_(token);
  if (!session || session.role !== 'developer') {
    return { success: false, error: 'Access denied.' };
  }
  let appData = dbLoadAll_();
  if (!appData) appData = getDefaultSeedData();
  const seed = (typeof getDummySeedData === 'function') ? getDummySeedData() : getDefaultSeedData();

  if (!appData.settings) appData.settings = {};
  if (!appData.settings.dummyDataConfig || typeof appData.settings.dummyDataConfig !== 'object') {
    appData.settings.dummyDataConfig = {
      students: true,
      teachers: true,
      batches: true,
      offlineTests: true,
      materials: true,
      gallery: true,
      feedbacks: true
    };
  }

  if (typeof target === 'boolean') {
    enabled = target;
    target = 'all';
  }

  const allTables = ['students', 'teachers', 'batches', 'offlineTests', 'materials', 'gallery', 'feedbacks'];
  const tables = (target === 'all' || !target) ? allTables : [target];

  if (enabled) {
    try {
      PropertiesService.getScriptProperties().deleteProperty('DUMMY_DATA_DISABLED');
    } catch (e) { }

    // 1. Enable in config
    if (target === 'all' || !target) {
      appData.settings.showDummyData = true;
      appData.settings.demoDataPermanentlyDisabled = false;
      allTables.forEach(function (tbl) { appData.settings.dummyDataConfig[tbl] = true; });
    } else {
      appData.settings.dummyDataConfig[target] = true;
      appData.settings.showDummyData = true;
      appData.settings.demoDataPermanentlyDisabled = false;
    }

    // 2. CRITICAL: Inject the seed dummy records for the enabled table(s) into appData
    // so they are immediately created in the Database tables!
    tables.forEach(function (tbl) {
      if (!Array.isArray(appData[tbl])) appData[tbl] = [];
      const have = {};
      appData[tbl].forEach(function (r) { if (r && r.id) have[r.id] = true; });
      (seed[tbl] || []).forEach(function (r) {
        if (r && r.id && !have[r.id]) {
          appData[tbl].push(JSON.parse(JSON.stringify(r)));
        }
      });
    });

    // Ensure student IDs are linked into demo batches
    if (tables.indexOf('students') !== -1 || tables.indexOf('batches') !== -1) {
      (seed.batches || []).forEach(function (sb) {
        const mb = (appData.batches || []).find(function (b) { return b.id === sb.id; });
        if (mb && Array.isArray(sb.studentIds)) {
          if (!Array.isArray(mb.studentIds)) mb.studentIds = [];
          sb.studentIds.forEach(function (sid) {
            if (mb.studentIds.indexOf(sid) === -1) mb.studentIds.push(sid);
          });
        }
      });
    }

    // If clientState was passed, also preserve any newly created real records from client
    if (clientState && typeof clientState === 'object') {
      tables.forEach(function (tbl) {
        if (Array.isArray(clientState[tbl])) {
          const existingIds = {};
          (appData[tbl] || []).forEach(function (r) { if (r && r.id) existingIds[r.id] = true; });
          clientState[tbl].forEach(function (cr) {
            if (cr && cr.id && !existingIds[cr.id]) {
              appData[tbl].push(JSON.parse(JSON.stringify(cr)));
            }
          });
        }
      });
    }
  } else {
    try {
      PropertiesService.getScriptProperties().setProperty('DUMMY_DATA_DISABLED', 'true');
    } catch (e) { }

    // 1. Disable in config
    if (target === 'all' || !target) {
      appData.settings.showDummyData = false;
      appData.settings.demoDataPermanentlyDisabled = true;
      allTables.forEach(function (tbl) { appData.settings.dummyDataConfig[tbl] = false; });
    } else {
      appData.settings.dummyDataConfig[target] = false;
      const anyOn = allTables.some(function (tbl) { return appData.settings.dummyDataConfig[tbl] === true; });
      appData.settings.showDummyData = anyOn;
      if (!anyOn) appData.settings.demoDataPermanentlyDisabled = true;
    }

    // 2. CRITICAL USER RULE: ONLY delete dummy records (b1..b5, s1..s5, etc.).
    // ANY client records created while demo was on are 100% PRESERVED and shift to Row 2!
    tables.forEach(function (tbl) {
      appData[tbl] = (appData[tbl] || []).filter(function (r) { return !isDummyRecord_(r); });
    });

    // If clientState was passed, ensure client's newly created non-dummy records are preserved
    if (clientState && typeof clientState === 'object') {
      tables.forEach(function (tbl) {
        if (Array.isArray(clientState[tbl])) {
          const existingIds = {};
          (appData[tbl] || []).forEach(function (r) { if (r && r.id) existingIds[r.id] = true; });
          clientState[tbl].forEach(function (cr) {
            if (cr && cr.id && !isDummyRecord_(cr) && !existingIds[cr.id]) {
              appData[tbl].push(JSON.parse(JSON.stringify(cr)));
            }
          });
        }
      });
    }

    if (tables.indexOf('students') !== -1) {
      const dummyStudentIds = {};
      (seed.students || []).forEach(function (s) { dummyStudentIds[s.id] = true; });
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
    }
  }

  // Persist updated state in master database
  dbSaveAll_(appData);

  // Sync to Database: directly writes or deletes data across the different sheet tabs!
  try {
    const ss = getDbSpreadsheet();
    if (ss) {
      let jsonSheet = ss.getSheetByName('DB_JSON');
      if (!jsonSheet) {
        jsonSheet = ss.insertSheet('DB_JSON');
        jsonSheet.hideSheet();
      }
      jsonSheet.getRange(1, 1).setValue(JSON.stringify(appData)).setFontFamily('Calibri');
      syncReadableSheets(ss, appData);
    }
  } catch (err) {
    Logger.log('apiSetDummyDataStatus sheet sync error: ' + err.toString());
  }

  return {
    success: true,
    target: target,
    enabled: enabled,
    showDummyData: appData.settings.showDummyData,
    dummyDataConfig: appData.settings.dummyDataConfig,
    timestamp: new Date().toISOString()
  };
}

/**
 * Developer API: Completely audits, restructures, formats, and orders all Database tables
 * Applies Calibri 10, freezes header row, custom tab colors, auto-resizes columns,
 * and deletes all unnecessary trailing empty rows/columns.
 * External_Links_Hub is preserved and unchanged!
 */
function apiRestructureAllSheets() {
  try {
    const ss = getDbSpreadsheet();
    if (!ss) return { success: false, error: 'Cannot open Database' };

    // Clear any deletion tombstones that might suppress demo rolls
    try {
      PropertiesService.getScriptProperties().deleteProperty('DB_tomb_rolls');
    } catch (tErr) { }

    let appData = dbLoadAll_();
    if (!appData) appData = getDefaultSeedData();

    const isExplicitlyEnabled = appData && appData.settings && appData.settings.showDummyData === true;
    const isDemoDisabled = !isExplicitlyEnabled && (
      (appData.settings && appData.settings.showDummyData === false) ||
      (appData.settings && appData.settings.demoDataPermanentlyDisabled === true) ||
      PropertiesService.getScriptProperties().getProperty('DUMMY_DATA_DISABLED') === 'true'
    );

    if (!isDemoDisabled) {
      const seed = (typeof getDummySeedData === 'function') ? getDummySeedData() : getDefaultSeedData();
      if (!appData.settings) appData.settings = {};
      appData.settings.showDummyData = true;
      if (!appData.settings.dummyDataConfig || typeof appData.settings.dummyDataConfig !== 'object') {
        appData.settings.dummyDataConfig = {};
      }
      ['students', 'teachers', 'batches', 'offlineTests', 'materials', 'gallery', 'feedbacks'].forEach(function (tbl) {
        appData.settings.dummyDataConfig[tbl] = true;
      });

      // Populate each table with records
      ['batches', 'students', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'].forEach(function (tbl) {
        if (!Array.isArray(appData[tbl])) appData[tbl] = [];
        const have = {};
        appData[tbl].forEach(function (r) { if (r && r.id) have[r.id] = true; });
        (seed[tbl] || []).slice(0, 5).forEach(function (r) {
          if (r && r.id && !have[r.id]) {
            appData[tbl].push(JSON.parse(JSON.stringify(r)));
          }
        });
      });
    } else {
      stripDummyData_(appData);
    }

    // Ensure externalLinks has exactly all 5 permanent links
    if (!Array.isArray(appData.externalLinks) || appData.externalLinks.length === 0) {
      appData.externalLinks = seed.externalLinks;
    }

    // Persist verified 5-records state in master database
    dbSaveAll_(appData);

    // 1. Sync & format all readable sheets (each tab trimmed to exactly 6 rows: 1 header + 5 records)
    syncReadableSheets(ss, appData);

    // 2. Order tabs in standard intuitive sequence
    const tabOrder = [
      'Students_Master',
      'Teachers_Roster',
      'Batches_Roster',
      'Offline_Test_Marks',
      'Materials_Repository',
      'Gallery_Banners',
      'Feedback_Responses',
      'External_Links_Hub',
      'Settings_Config'
    ];

    for (let i = 0; i < tabOrder.length; i++) {
      const sh = ss.getSheetByName(tabOrder[i]);
      if (sh) {
        try {
          ss.setActiveSheet(sh);
          ss.moveActiveSheet(i + 1);
        } catch (e) { }
      }
    }

    // Hide DB_JSON sheet
    const dbJson = ss.getSheetByName('DB_JSON');
    if (dbJson) dbJson.hideSheet();

    // Default front tab to Students_Master
    const firstTab = ss.getSheetByName('Students_Master');
    if (firstTab) ss.setActiveSheet(firstTab);

    return {
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      restructuredTabs: tabOrder,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    Logger.log('apiRestructureAllSheets error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Syncs full application state to the Primary Cloud Database
 * and optional background mirror to Database
 */
function syncAllData_(fullData) {
  try {
    const isExplicitlyEnabled = fullData && fullData.settings && fullData.settings.showDummyData === true;
    if (isExplicitlyEnabled) {
      try {
        PropertiesService.getScriptProperties().deleteProperty('DUMMY_DATA_DISABLED');
      } catch (e) { }
    }
    const isDemoDisabled = !isExplicitlyEnabled && (
      (fullData && fullData.settings && fullData.settings.showDummyData === false) ||
      (fullData && fullData.settings && fullData.settings.demoDataPermanentlyDisabled === true) ||
      PropertiesService.getScriptProperties().getProperty('DUMMY_DATA_DISABLED') === 'true'
    );

    if (isDemoDisabled) {
      if (!fullData.settings) fullData.settings = {};
      fullData.settings.showDummyData = false;
      fullData.settings.demoDataPermanentlyDisabled = true;
      try {
        PropertiesService.getScriptProperties().setProperty('DUMMY_DATA_DISABLED', 'true');
      } catch (pErr) { }
      stripDummyData_(fullData);
    } else {
      if (!fullData.settings) fullData.settings = {};
      fullData.settings.showDummyData = true;
      fullData.settings.demoDataPermanentlyDisabled = false;
      try { restoreDummyData_(fullData); } catch (dummyErr) {
        Logger.log('restoreDummyData_ notice: ' + dummyErr.toString());
      }
    }

    // 0b. Deletion safety: strip tombstoned (manually sheet-deleted) records
    try { applyTombstones_(fullData); } catch (tombErr) {
      Logger.log('applyTombstones_ notice: ' + tombErr.toString());
    }

    // 0c. Ensure Gallery Banners and External Links are preserved and merged from sheet
    try {
      fullData = mergeGalleryFromSheet_(fullData);
      fullData = mergeLinksFromSheet_(fullData);
      fullData = mergeSettingsFromSheet_(fullData);
      if (!isDemoDisabled && (!Array.isArray(fullData.gallery) || fullData.gallery.length === 0)) {
        fullData.gallery = OFFICIAL_GALLERY_BANNERS.slice();
      }
      if (!Array.isArray(fullData.externalLinks) || fullData.externalLinks.length === 0) {
        fullData.externalLinks = OFFICIAL_EXTERNAL_LINKS.slice();
      }
    } catch (galMergeErr) {
      Logger.log('Gallery merge in apiSyncAllData notice: ' + galMergeErr.toString());
    }

    // 1. Primary write: Cloud Database (instant, isolated, persistent)
    dbSaveAll_(fullData);

    // 2. Secondary background mirror: Update Database if available
    try {
      const ss = getDbSpreadsheet();
      if (ss) {
        let jsonSheet = ss.getSheetByName('DB_JSON');
        if (!jsonSheet) {
          jsonSheet = ss.insertSheet('DB_JSON');
          jsonSheet.hideSheet();
        }
        jsonSheet.getRange(1, 1).setValue(JSON.stringify(fullData)).setFontFamily('Calibri');

        // When demo data is disabled: Human-readable sheets reflect ONLY real production records!
        const sheetData = isDemoDisabled ? stripDummyData_(JSON.parse(JSON.stringify(fullData))) : fullData;
        syncReadableSheets(ss, sheetData);
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

function apiSyncAllData(fullData, token) {
  const session = getPortalSession_(token);
  if (!session || (session.role !== 'admin' && session.role !== 'developer')) {
    return { success: false, error: 'Access denied.' };
  }
  return syncAllData_(fullData);
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
 * Universal Formatter for all Database tables:
 * 1. Enforces Font Family 'Calibri' across all cells
 * 2. Enforces Font Size 10 across all cells
 * 3. Freezes header row (Row 1) with 28px height, bold font, and custom color
 * 4. Trims all unnecessary blank trailing columns and rows
 * 5. Sets tab color for instant visual navigation
 * 6. Auto-resizes column widths
 */
function formatAndTrimSheet(sheet, numColumns, numRows, headerColor, tabColor) {
  try {
    sheet.setFrozenRows(1);
    const maxCols = sheet.getMaxColumns();
    if (maxCols > numColumns) {
      sheet.deleteColumns(numColumns + 1, maxCols - numColumns);
    } else if (maxCols < numColumns) {
      sheet.insertColumnsAfter(maxCols, numColumns - maxCols);
    }

    const maxRows = sheet.getMaxRows();
    const neededRows = Math.max(numRows, 2);
    if (maxRows > neededRows) {
      sheet.deleteRows(neededRows + 1, maxRows - neededRows);
    } else if (maxRows < neededRows) {
      sheet.insertRowsAfter(maxRows, neededRows - maxRows);
    }

    const fullRange = sheet.getRange(1, 1, Math.min(sheet.getMaxRows(), neededRows), numColumns);
    fullRange.setFontFamily('Calibri');
    fullRange.setFontSize(10);
    fullRange.setVerticalAlignment('middle');

    const headerRange = sheet.getRange(1, 1, 1, numColumns);
    headerRange.setFontFamily('Calibri');
    headerRange.setFontSize(10);
    headerRange.setFontWeight('bold');
    if (headerColor) {
      headerRange.setBackground(headerColor);
      headerRange.setFontColor('#ffffff');
    }
    sheet.setRowHeight(1, 28);

    if (tabColor && sheet.setTabColor) {
      sheet.setTabColor(tabColor);
    }

    sheet.autoResizeColumns(1, numColumns);
  } catch (err) {
    Logger.log('Formatting error on ' + sheet.getName() + ': ' + err.toString());
  }
}

/**
 * Ensures the Database has at least the required rows and columns
 * so that sheet.getRange(...).setValues(...) never fails with out-of-bounds errors.
 */
function ensureSheetDimensions_(sheet, requiredRows, requiredCols) {
  try {
    const curRows = sheet.getMaxRows();
    if (curRows < requiredRows) {
      sheet.insertRowsAfter(curRows, requiredRows - curRows);
    }
    const curCols = sheet.getMaxColumns();
    if (curCols < requiredCols) {
      sheet.insertColumnsAfter(curCols, requiredCols - curCols);
    }
  } catch (err) {
    Logger.log('ensureSheetDimensions_ error on ' + sheet.getName() + ': ' + err.toString());
  }
}

function removeDemoStudentRows_(sheet, seedData) {
  const demoStudentsByRoll = {};
  ((seedData && seedData.students) || []).forEach(function (student) {
    if (student && student.roll && isDummyRecord_(student)) {
      demoStudentsByRoll[String(student.roll).trim().toUpperCase()] = String(student.name || '').trim().toLowerCase();
    }
  });
  if (Object.keys(demoStudentsByRoll).length === 0) return;

  const values = sheet.getDataRange().getValues();
  const rowsToDelete = [];
  for (let i = 1; i < values.length; i++) {
    const roll = String(values[i][0] || '').trim().toUpperCase();
    const name = String(values[i][1] || '').trim().toLowerCase();
    if (roll && demoStudentsByRoll[roll] && name === demoStudentsByRoll[roll]) {
      rowsToDelete.push(i + 1);
    }
  }

  for (let i = rowsToDelete.length - 1; i >= 0; i--) {
    sheet.deleteRow(rowsToDelete[i]);
  }
  if (rowsToDelete.length) {
    Logger.log('Removed ' + rowsToDelete.length + ' demo student row(s) from Students_Master.');
  }
}

/**
 * Generates human-friendly Database table views for the client.
 * Respects showDummyData: when false, removes demo data and displays clean production records.
 */
function syncReadableSheets(ss, data) {
  try {
    const seed = (typeof getDummySeedData === 'function') ? getDummySeedData() : getDefaultSeedData();

    // Helper: extracts all records for a table (no artificial limits)
    function getAllRecords_(tableKey, filterFn) {
      let list = Array.isArray(data[tableKey]) ? data[tableKey].slice() : [];
      if (filterFn) list = list.filter(filterFn);
      return list;
    }

    // A. Sync Students Sheet (Students_Master) - Unified Student & Fee Master Table (APPEND ONLY, NEVER CLEAR)
    {
      let stuSheet = getOrCreateSheet(ss, 'Students_Master', ['Students', 'Students Master']);
      const headers = ['Roll No', 'Student Name', 'Admission Date', 'Login Password', 'Access Status', 'Parent Name', 'Contact Phone', 'Monthly Fee (INR)', 'Paid Fee (INR)', 'Pending Dues (INR)', 'Fee Payment Status', 'Next Fee Due Date', 'Last Reminder Sent', 'Photo URL'];
      
      if (!isDummyForSheetEnabled_(data.settings, 'students')) {
        removeDemoStudentRows_(stuSheet, seed);
      }
      SpreadsheetApp.flush();
      let curVals = stuSheet.getDataRange().getValues();
      if (!curVals || curVals.length === 0 || curVals[0].length < headers.length) {
        stuSheet.clear();
        stuSheet.appendRow(headers);
        curVals = [headers];
      }
      
      const sheetRollRowMap = {};
      for (let r = 1; r < curVals.length; r++) {
        const rRoll = String(curVals[r][0] || '').trim().toUpperCase();
        if (rRoll) sheetRollRowMap[rRoll] = r + 1; // 1-indexed row number
      }

      const stuList = getAllRecords_('students');
      const seenRollsInSync = {};
      stuList.forEach(function(s) {
        const rollStr = String(s.roll || '').trim();
        const rollKey = rollStr.toUpperCase();
        if (!rollKey || seenRollsInSync[rollKey]) return;
        seenRollsInSync[rollKey] = true;

        const monthly = Number(s.monthlyFee || s.totalFee) || 0;
        const paid = Number(s.paidFee) || 0;
        const balance = Math.max(0, monthly - paid);
        const isPaid = balance <= 0;
        let pUrl = s.photoUrl || s.photo || '';
        if (!pUrl) {
          pUrl = getRandomAvatarUrl_(s.name || s.roll, 'student');
        }
        const rowData = [
          rollStr,
          s.name || 'Student Name',
          s.admissionDate || '2026-10-10',
          s.password || 'password123',
          s.status || 'Active',
          s.parentName || 'Parent Name',
          s.phone || '',
          monthly,
          paid,
          balance,
          isPaid ? 'Paid' : 'Pending',
          s.dueDate || calculateNextFeeReminder_(s.admissionDate || '2026-10-10', 1),
          s.lastReminder || 'Never',
          pUrl
        ];

        if (sheetRollRowMap[rollKey]) {
          // Update existing row in place (preserve position)
          const targetRow = sheetRollRowMap[rollKey];
          stuSheet.getRange(targetRow, 1, 1, headers.length).setValues([rowData]);
        } else {
          // APPEND NEW RECORD (never replace)
          stuSheet.appendRow(rowData);
          sheetRollRowMap[rollKey] = stuSheet.getLastRow();
        }
      });
      stuSheet.getDataRange().setFontFamily('Calibri');
      SpreadsheetApp.flush();
    }

    // B. Delete Deprecated Student_Fees_Ledger Tab (Fee records fully unified inside Students_Master)
    {
      const deprecatedFeeTabs = ['Student_Fees_Ledger', 'Student_Fees', 'Fees_Master', 'Fees_Ledger', 'Fees'];
      deprecatedFeeTabs.forEach(function(shName) {
        const feeSh = ss.getSheetByName(shName);
        if (feeSh && ss.getSheets().length > 1) {
          try {
            ss.deleteSheet(feeSh);
            Logger.log('Successfully deleted deprecated sheet tab: ' + shName);
          } catch (delErr) {
            Logger.log('Notice: could not delete ' + shName + ': ' + delErr.toString());
          }
        }
      });
    }

    // C. Sync Teachers Sheet (Teachers_Roster) - All Records
    {
      let teachSheet = getOrCreateSheet(ss, 'Teachers_Roster', ['Teachers', 'Teachers Roster']);
      teachSheet.clear();
      const trHeaders = ['Teacher ID', 'Teacher Name', 'Subject', 'Login Email', 'Login Password', 'Access Status', 'Contact Phone', 'Qualification', 'Experience', 'Photo URL'];
      const trRows = [trHeaders];
      const teachList = getAllRecords_('teachers');
      teachList.forEach(function(tr) {
        let pUrl = tr.photoUrl || tr.photo || '';
        if (pUrl && pUrl.startsWith('data:image')) {
          try {
            pUrl = uploadPhotoToDeveloperDrive_(pUrl, 'teacher_' + (tr.id || 'faculty'), tr.name);
            tr.photo = pUrl;
            tr.photoUrl = pUrl;
          } catch (e) {
            Logger.log('Drive photo upload error for teacher: ' + e.toString());
          }
        }
        if (!pUrl) {
          pUrl = getRandomAvatarUrl_(tr.name || tr.id, 'teacher');
        }
        trRows.push([
          tr.id || '',
          tr.name || '',
          tr.subject || '',
          tr.email || '',
          tr.password || 'teacher123',
          tr.status || 'Active',
          tr.phone || '',
          tr.qualification || '',
          tr.experience || '',
          pUrl || ''
        ]);
      });
      ensureSheetDimensions_(teachSheet, trRows.length, trHeaders.length);
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
      formatAndTrimSheet(teachSheet, trHeaders.length, trRows.length, '#0284c7', '#0284c7');
    }

    // C. Sync Batches Sheet (Batches_Roster) - All Records
    {
      let batchSheet = getOrCreateSheet(ss, 'Batches_Roster', ['Batches', 'Batches Roster']);
      batchSheet.clear();
      const bHeaders = ['Batch ID', 'Batch Name', 'Subjects', 'Schedule', 'Classroom / Hall', 'Lead Faculty', 'Student Count'];
      const bRows = [bHeaders];
      const batchList = getAllRecords_('batches');
      batchList.forEach(function (b) {
        bRows.push([
          b.id || '',
          b.name || '',
          b.subject || '',
          b.schedule || '',
          b.room || '',
          b.teacher || '',
          (b.studentIds || []).length || 0
        ]);
      });
      ensureSheetDimensions_(batchSheet, bRows.length, bHeaders.length);
      batchSheet.getRange(1, 1, bRows.length, bHeaders.length).setValues(bRows);
      batchSheet.getRange(1, 1, 1, bHeaders.length).setFontWeight('bold').setBackground('#059669').setFontColor('#ffffff');
      formatAndTrimSheet(batchSheet, bHeaders.length, bRows.length, '#059669', '#059669');
    }

    // D. Sync Offline Tests Sheet (Offline_Test_Marks) - All Student Test Marks
    {
      let testSheet = getOrCreateSheet(ss, 'Offline_Test_Marks', ['Test_Marks', 'Offline Tests']);
      testSheet.clear();
      const tHeaders = ['Test ID', 'Test Title', 'Subject', 'Conducted Date', 'Max Marks', 'Assigned Batch', 'Student ID', 'Roll No', 'Student Name', 'Marks Scored', 'Percentage', 'Remarks', 'Status'];
      const tRows = [tHeaders];

      const studentMap = {};
      (data.students || []).forEach(function (s) { studentMap[s.id] = s; });

      const batchMap = {};
      (data.batches || []).forEach(function (b) { batchMap[b.id] = b; });

      const testList = getAllRecords_('offlineTests');
      testList.forEach(function (t) {
        const marks = t.marks || {};
        const maxMarks = Number(t.maxMarks) || 100;
        const bObj = batchMap[t.batchId];
        const batchName = bObj ? bObj.name : (t.batchId || 'All Batches');

        const targetStudentIds = [];
        if (bObj && Array.isArray(bObj.studentIds) && bObj.studentIds.length > 0) {
          bObj.studentIds.forEach(function (sid) {
            if (targetStudentIds.indexOf(sid) === -1) targetStudentIds.push(sid);
          });
        }
        Object.keys(marks).forEach(function (sid) {
          if (targetStudentIds.indexOf(sid) === -1) targetStudentIds.push(sid);
        });

        if (targetStudentIds.length === 0) {
          tRows.push([
            t.id || '',
            t.title || '',
            t.subject || '',
            t.date || '',
            maxMarks,
            batchName,
            '-',
            '-',
            'No Students Enrolled',
            0,
            '0%',
            'No marks recorded yet',
            'Pending'
          ]);
        } else {
          targetStudentIds.forEach(function (sid) {
            const stu = studentMap[sid] || { id: sid, roll: '-', name: 'Student ' + sid };
            const m = marks[sid] || { score: 0, remarks: '' };
            const score = Number(m.score) || 0;
            const pct = maxMarks > 0 ? Math.round((score / maxMarks) * 100) + '%' : '0%';
            const remarks = m.remarks || '';
            const status = score > 0 ? 'Evaluated' : 'Pending';

            tRows.push([
              t.id || '',
              t.title || '',
              t.subject || '',
              t.date || '',
              maxMarks,
              batchName,
              stu.id || sid,
              stu.roll || '',
              stu.name || '',
              score,
              pct,
              remarks,
              status
            ]);
          });
        }
      });

      ensureSheetDimensions_(testSheet, tRows.length, tHeaders.length);
      testSheet.getRange(1, 1, tRows.length, tHeaders.length).setValues(tRows);
      testSheet.getRange(1, 1, 1, tHeaders.length).setFontWeight('bold').setBackground('#d97706').setFontColor('#ffffff');
      formatAndTrimSheet(testSheet, tHeaders.length, tRows.length, '#d97706', '#d97706');
    }

    // E. Sync Feedback Sheet (Feedback_Responses) - All Records
    {
      let fbSheet = getOrCreateSheet(ss, 'Feedback_Responses', ['Feedback', 'Feedback Wall']);
      fbSheet.clear();
      const fbHeaders = ['Author Name', 'Role (Parent/Student)', 'Batch', 'Category', 'Rating (Stars)', 'Date', 'Feedback Comment'];
      const fbRows = [fbHeaders];
      const fbList = getAllRecords_('feedbacks');
      fbList.forEach(function (f) {
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
      ensureSheetDimensions_(fbSheet, fbRows.length, fbHeaders.length);
      fbSheet.getRange(1, 1, fbRows.length, fbHeaders.length).setValues(fbRows);
      fbSheet.getRange(1, 1, 1, fbHeaders.length).setFontWeight('bold').setBackground('#7c3aed').setFontColor('#ffffff');
      formatAndTrimSheet(fbSheet, fbHeaders.length, fbRows.length, '#7c3aed', '#7c3aed');
    }

    // F. Sync Materials Sheet (Materials_Repository) - All Records with URLs
    {
      let matSheet = getOrCreateSheet(ss, 'Materials_Repository', ['Materials', 'Study Materials']);
      matSheet.clear();
      const mHeaders = ['Material ID', 'Title', 'Batch Name', 'Category', 'Upload Date', 'Uploaded By', 'File Size', 'Downloads', 'Description', 'Download URL', 'Google Drive Link'];
      const mRows = [mHeaders];
      const batchMap = {};
      (data.batches || []).forEach(function (b) { batchMap[b.id] = b.name; });

      const matList = getAllRecords_('materials');
      matList.forEach(function (m) {
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
      ensureSheetDimensions_(matSheet, mRows.length, mHeaders.length);
      matSheet.getRange(1, 1, mRows.length, mHeaders.length).setValues(mRows);
      matSheet.getRange(1, 1, 1, mHeaders.length).setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
      formatAndTrimSheet(matSheet, mHeaders.length, mRows.length, '#2563eb', '#2563eb');
    }

    // G. Sync Gallery Banners Sheet (Gallery_Banners)
    {
      let galSheet = getOrCreateSheet(ss, 'Gallery_Banners', ['Gallery', 'Gallery Banners']);
      galSheet.clear();
      const gHeaders = ['Banner ID', 'Title', 'Category', 'Date', 'Caption', 'Badge / AIR Rank', 'Image URL'];
      const gRows = [gHeaders];
      const galList = getAllRecords_('gallery');
      galList.forEach(function (g) {
        let bannerUrl = g.imageUrl || '';
        if (bannerUrl && bannerUrl.startsWith('data:image/')) {
          bannerUrl = uploadPhotoToDeveloperDrive_(bannerUrl, 'banner', g.title || 'banner', DRIVE_FOLDERS.GALLERY);
          g.imageUrl = bannerUrl;
        }
        gRows.push([
          g.id || '',
          g.title || '',
          g.category || '',
          g.date || '',
          g.caption || '',
          g.badge || '',
          bannerUrl
        ]);
      });
      ensureSheetDimensions_(galSheet, gRows.length, gHeaders.length);
      galSheet.getRange(1, 1, gRows.length, gHeaders.length).setValues(gRows);
      galSheet.getRange(1, 1, 1, gHeaders.length).setFontWeight('bold').setBackground('#db2777').setFontColor('#ffffff');
      formatAndTrimSheet(galSheet, gHeaders.length, gRows.length, '#db2777', '#db2777');
    }

    // G2. External_Links_Hub (ALWAYS PERMANENT - NEVER DELETED ON DISABLE)
    {
      let linkSheet = ss.getSheetByName('External_Links_Hub');
      if (!linkSheet) {
        linkSheet = ss.insertSheet('External_Links_Hub');
      }
      linkSheet.clear();
      const lHeaders = ['Link ID', 'Resource Title', 'Provider / Portal', 'Subject Tag', 'External URL', 'Google Drive Shortcut Link', 'Description', 'Date Added'];
      const lRows = [lHeaders];
      (data.externalLinks || []).forEach(function (l) {
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
      ensureSheetDimensions_(linkSheet, lRows.length, lHeaders.length);
      linkSheet.getRange(1, 1, lRows.length, lHeaders.length).setValues(lRows);
      linkSheet.getRange(1, 1, 1, lHeaders.length).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
      formatAndTrimSheet(linkSheet, lHeaders.length, lRows.length, '#4f46e5', '#4f46e5');
    }

    // H. Sync Institute Settings Config
    if (data.settings) {
      let setSheet = getOrCreateSheet(ss, 'Settings_Config', ['Institute_Settings']);
      setSheet.clear();
      const sHeaders = ['Setting Parameter', 'Configured Value', 'Description'];
      const sRows = [sHeaders];
      const s = data.settings;
      const sInstName = (s.instituteName && s.instituteName !== 'Mia' && s.instituteName !== 'MIA') ? s.instituteName : 'Divine Classes';
      sRows.push(['Institute Name', sInstName, 'Official Coaching Name']);
      sRows.push(['Tagline', s.tagline || '', 'Coaching Slogan & Mission']);
      sRows.push(['Helpline Phone', s.phone || '', 'Official Contact Number']);
      sRows.push(['Display Contact', s.contactDisplay || '9555-6787-53', 'Formatted Helpline']);
      sRows.push(['Official Email', s.email || 'contact@divineclasses.in', 'Inquiry Email']);
      sRows.push(['Address', s.address || '235 Paschimpuri Pocket 2, Club Rd New Delhi 110063', 'Center Location']);
      sRows.push(['YouTube Channel', s.youtubeUrl || 'https://youtube.com/@chemcrush?si=VyfGmd_WwqQiU7j8', 'Official Video Channel']);
      sRows.push(['Admin Name', s.adminName || 'Er. Rajesh Chahar', 'Display Name of Institute Admin']);
      sRows.push(['Master Admin Password', s.adminPassword || 'admin123', 'Password to access Admin portal']);
      sRows.push(['Admin Email ID', s.adminEmail || '', 'Official Admin Contact / Login Email']);
      sRows.push(['Developer Name', s.devName || 'Lead Developer', 'Display name of the developer account']);
      sRows.push(['Developer Password', s.devPassword || '', 'Password to access Developer portal']);
      sRows.push(['Admin Google Drive Folder Link', s.adminDriveFolderUrl || '', 'Official Shared Assignments & Materials Google Drive Folder']);
      sRows.push(['Admin Drive Access Status', s.adminDriveShared ? ('Authorized (' + (s.adminEmail || 'Admin') + ')') : 'Pending Authorization Mail', 'Google Drive Permission Status']);
      sRows.push(['UPI Payment ID', s.upiId || 'divineclasses@upi', 'Fee Collection UPI']);
      sRows.push(['Facebook Page', s.facebookUrl || 'https://www.facebook.com/edivineclasses/', 'Social Channel']);
      sRows.push(['Instagram Profile', s.instagramUrl || 'https://www.instagram.com/divineclasses_paschimpuri?utm_source=qr&dlrf=enk4MXRodTU3YTdq', 'Social Channel']);
      sRows.push(['Show Requirement Labels', (s.showRequirementLabels === false) ? 'Off' : 'On', 'Page header "Requirement #N" tags (toggle in Settings)']);
      sRows.push(['Admin Feedback Delete', (s.allowAdminFeedbackDelete === false) ? 'Off' : 'On', 'Admin delete button on Feedback Wall (toggle in Settings)']);
      sRows.push(['Study Link Delete', (s.allowAdminLinkDelete === false) ? 'Off' : 'On', 'Admin delete button on Study Links cards (toggle in Settings)']);

      // Dummy Data Status per sheet
      const cfg = s.dummyDataConfig || {};
      sRows.push(['Overall Dummy Data Master', (s.showDummyData === false) ? 'OFF (All Demo Data Deleted)' : 'ON', 'Master toggle']);
      sRows.push(['Students Master Dummy Data', (cfg.students === false || s.showDummyData === false) ? 'OFF (Deleted from Database)' : 'ON (11 demo rows)', 'Controlled by Developer']);
      sRows.push(['Teachers Roster Dummy Data', (cfg.teachers === false || s.showDummyData === false) ? 'OFF (Deleted from Database)' : 'ON (4 demo rows)', 'Controlled by Developer']);
      sRows.push(['Batches Roster Dummy Data', (cfg.batches === false || s.showDummyData === false) ? 'OFF (Deleted from Database)' : 'ON (3 demo rows)', 'Controlled by Developer']);
      sRows.push(['Offline Tests Dummy Data', (cfg.offlineTests === false || s.showDummyData === false) ? 'OFF (Deleted from Database)' : 'ON (4 demo rows)', 'Controlled by Developer']);
      sRows.push(['Materials Dummy Data', (cfg.materials === false || s.showDummyData === false) ? 'OFF (Deleted from Database)' : 'ON (5 demo rows)', 'Controlled by Developer']);
      sRows.push(['Gallery Dummy Data', (cfg.gallery === false || s.showDummyData === false) ? 'OFF (Deleted from Database)' : 'ON (4 demo rows)', 'Controlled by Developer']);
      sRows.push(['Feedback Dummy Data', (cfg.feedbacks === false || s.showDummyData === false) ? 'OFF (Deleted from Database)' : 'ON (3 demo rows)', 'Controlled by Developer']);
      sRows.push(['External_Links_Hub Status', 'PERMANENT (All 5 portals active)', 'Curated official study links never deleted']);
      sRows.push(['Last Auto-Sync Timestamp', new Date().toLocaleString(), 'Time of last auto-sync from Web App']);

      ensureSheetDimensions_(setSheet, sRows.length, sHeaders.length);
      setSheet.getRange(1, 1, sRows.length, sHeaders.length).setValues(sRows);
      setSheet.getRange(1, 1, 1, sHeaders.length).setFontWeight('bold').setBackground('#334155').setFontColor('#ffffff');
      formatAndTrimSheet(setSheet, sHeaders.length, sRows.length, '#334155', '#334155');
    }
  } catch (err) {
    Logger.log('Error creating readable sheets: ' + err.toString());
  }
}

function apiUpdateStudentAuth(studentId, newPassword, newStatus, token) {
  const session = getPortalSession_(token);
  if (!session || (session.role !== 'admin' && session.role !== 'developer')) {
    return { success: false, message: 'Access denied' };
  }
  const data = getFullInitialData_();
  const student = (data.students || []).find(function (s) { return s.id === studentId; });
  if (!student) return { success: false, message: 'Student not found' };
  if (newPassword) student.password = String(newPassword).trim();
  if (newStatus) {
    const st = String(newStatus).toLowerCase();
    student.status = (st === 'blocked') ? 'Blocked' : (st === 'inactive') ? 'Inactive' : 'Active';
  }
  return syncAllData_(data);
}

/**
 * Dedicated API to update a teacher's password and status
 */
function apiUpdateTeacherAuth(teacherId, newPassword, newStatus, token) {
  const session = getPortalSession_(token);
  if (!session || (session.role !== 'admin' && session.role !== 'developer')) {
    return { success: false, message: 'Access denied' };
  }
  const data = getFullInitialData_();
  const teacher = (data.teachers || []).find(function (t) { return t.id === teacherId; });
  if (!teacher) return { success: false, message: 'Teacher not found' };
  if (newPassword) teacher.password = String(newPassword).trim();
  if (newStatus) {
    const st = String(newStatus).toLowerCase();
    teacher.status = (st === 'blocked') ? 'Blocked' : (st === 'inactive') ? 'Inactive' : 'Active';
  }
  return syncAllData_(data);
}

/**
 * Dedicated API for Admin to edit student profile records
 */
function apiUpdateStudentProfile(studentId, profileData, token) {
  const session = getPortalSession_(token);
  if (!session || (session.role !== 'admin' && session.role !== 'developer')) {
    return { success: false, message: 'Access denied' };
  }
  const data = getFullInitialData_();
  const student = (data.students || []).find(function (s) { return s.id === studentId; });
  if (!student) return { success: false, message: 'Student not found' };
  if (profileData) {
    if (profileData.name !== undefined) student.name = String(profileData.name).trim();
    if (profileData.roll !== undefined) student.roll = String(profileData.roll).trim();
    if (profileData.phone !== undefined) student.phone = String(profileData.phone).trim();
    if (profileData.parentName !== undefined) student.parentName = String(profileData.parentName).trim();
    if (profileData.admissionDate !== undefined) student.admissionDate = String(profileData.admissionDate).trim();
    if (profileData.password !== undefined) student.password = String(profileData.password).trim();
    if (profileData.monthlyFee !== undefined) {
      student.monthlyFee = Number(profileData.monthlyFee) || 0;
      student.totalFee = student.monthlyFee;
    } else if (profileData.totalFee !== undefined) {
      student.monthlyFee = Number(profileData.totalFee) || 0;
      student.totalFee = student.monthlyFee;
    }
    if (profileData.paidFee !== undefined) student.paidFee = Number(profileData.paidFee) || 0;
    if (profileData.dueDate !== undefined) student.dueDate = String(profileData.dueDate).trim();
    if (profileData.status !== undefined) student.status = String(profileData.status).trim();

    if (profileData.photo !== undefined) {
      const photoValue = String(profileData.photo || '').trim();
      let photoUrl = '';
      if (photoValue) {
        if (/^data:image\/(?:jpeg|png|webp);base64,/i.test(photoValue)) {
          photoUrl = uploadPhotoToDeveloperDrive_(photoValue, 'student_' + (student.roll || student.id), student.name);
          if (!/^https:\/\/drive\.google\.com\/file\/d\//i.test(photoUrl)) {
            return { success: false, message: 'The photo could not be uploaded to Google Drive. The profile was not changed.' };
          }
        } else if (/^https:\/\/drive\.google\.com\/file\/d\//i.test(photoValue)) {
          photoUrl = photoValue;
        } else {
          return { success: false, message: 'Invalid photo data. Choose or capture a valid image.' };
        }
      }
      student.photo = photoUrl;
      student.photoUrl = photoUrl;
    }

    // Batch re-assignment if specified
    if (profileData.batchId !== undefined) {
      (data.batches || []).forEach(function (b) {
        b.studentIds = (b.studentIds || []).filter(function (id) { return id !== studentId; });
        if (b.id === profileData.batchId && student.status !== 'Inactive') {
          b.studentIds.push(studentId);
        }
      });
    }
  }
  const syncResult = syncAllData_(data);
  if (!syncResult || !syncResult.success) return syncResult;
  const sheetCheck = student.photo ? verifyStudentPhotoUrlInSheet_(student) : { success: true };
  if (!sheetCheck.success) {
    return { success: false, profileSaved: true, photoUrl: student.photo || '', message: sheetCheck.message };
  }
  return { success: true, photoUrl: student.photo || '' };
}

function verifyStudentPhotoUrlInSheet_(student) {
  try {
    const spreadsheet = getDbSpreadsheet();
    const sheet = spreadsheet && spreadsheet.getSheetByName('Students_Master');
    if (!sheet) {
      return { success: false, message: 'The photo was uploaded, but the Students_Master sheet could not be verified.' };
    }
    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 14).getValues() : [];
    const matchingRow = rows.find(function (row) {
      return String(row[0] || '').trim() === String(student.roll || '').trim();
    });
    if (!matchingRow || String(matchingRow[13] || '').trim() !== String(student.photoUrl || student.photo || '').trim()) {
      return { success: false, message: 'The photo was uploaded and saved to the profile, but the Google Sheet did not confirm its Drive URL.' };
    }
    return { success: true };
  } catch (sheetErr) {
    Logger.log('Student photo sheet verification error: ' + sheetErr.toString());
    return { success: false, message: 'The photo was uploaded and saved to the profile, but the Google Sheet could not be verified.' };
  }
}

/**
 * Dedicated API to update a student's photo
 */
function apiUpdateStudentPhoto(studentId, photoDataUrl, token) {
  const session = getPortalSession_(token);
  if (!session || (session.role !== 'admin' && session.role !== 'developer')) {
    return { success: false, message: 'Access denied' };
  }
  const data = getFullInitialData_();
  const student = (data.students || []).find(function (s) { return s.id === studentId; });
  if (!student) return { success: false, message: 'Student not found' };
  const photoValue = String(photoDataUrl || '').trim();
  let finalUrl = '';
  if (photoValue) {
    if (/^data:image\/(?:jpeg|png|webp);base64,/i.test(photoValue)) {
      finalUrl = uploadPhotoToDeveloperDrive_(photoValue, 'student_' + (student.roll || student.id), student.name);
      if (!/^https:\/\/drive\.google\.com\/file\/d\//i.test(finalUrl)) {
        return { success: false, message: 'The photo could not be uploaded to Google Drive. The profile was not changed.' };
      }
    } else if (/^https:\/\/drive\.google\.com\/file\/d\//i.test(photoValue)) {
      finalUrl = photoValue;
    } else {
      return { success: false, message: 'Invalid photo data. Choose or capture a valid image.' };
    }
  }
  student.photo = finalUrl;
  student.photoUrl = finalUrl;
  const syncResult = syncAllData_(data);
  if (!syncResult || !syncResult.success) {
    return { success: false, message: (syncResult && syncResult.error) || 'The photo profile update could not be saved.' };
  }

  if (finalUrl) {
    const sheetCheck = verifyStudentPhotoUrlInSheet_(student);
    if (!sheetCheck.success) {
      return { success: false, profileSaved: true, photoUrl: finalUrl, message: sheetCheck.message };
    }
  }

  return { success: true, photoUrl: finalUrl };
}

/**
 * Dedicated API for Admin to edit faculty profile records
 */
function apiUpdateTeacherProfile(teacherId, profileData, token) {
  const session = getPortalSession_(token);
  if (!session || (session.role !== 'admin' && session.role !== 'developer')) {
    return { success: false, message: 'Access denied' };
  }
  const data = getFullInitialData_();
  const teacher = (data.teachers || []).find(function (t) { return t.id === teacherId; });
  if (!teacher) return { success: false, message: 'Teacher not found' };
  if (profileData) {
    if (profileData.name !== undefined) {
      teacher.name = String(profileData.name).trim();
      teacher.initials = teacher.name.split(' ').map(function (n) { return n[0]; }).join('').slice(0, 2).toUpperCase();
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
    if (profileData.photo !== undefined) {
      let finalPhotoUrl = profileData.photo || '';
      if (finalPhotoUrl && finalPhotoUrl.startsWith('data:image')) {
        finalPhotoUrl = uploadPhotoToDeveloperDrive_(finalPhotoUrl, 'teacher_' + (teacher.id || 'faculty'), teacher.name);
      }
      teacher.photo = finalPhotoUrl;
      teacher.photoUrl = finalPhotoUrl;
    }
  }
  return syncAllData_(data);
}

/**
 * Dedicated API to change Admin Master Password
 */
function apiUpdateAdminPassword(newPassword, token) {
  const session = getPortalSession_(token);
  if (!session || (session.role !== 'admin' && session.role !== 'developer')) {
    return { success: false, message: 'Access denied' };
  }
  const data = getFullInitialData_();
  if (!data.settings) data.settings = {};
  data.settings.adminPassword = String(newPassword).trim();
  return syncAllData_(data);
}


/**
 * Automatically executed when any user opens the Database.
 * Provides a custom menu to recreate and populate the 6-row demo data with 1 click.
 */
function onOpen(e) {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🌟 Divine Classes')
      .addItem('⚡ Recreate & Populate 6-Row Demo Data (All Sheets)', 'apiRestructureAllSheets')
      .addItem('🔄 Sync All Sheets to Web App', 'apiRestructureAllSheets')
      .addToUi();
  } catch (uiErr) {
    Logger.log('onOpen menu warning: ' + uiErr.toString());
  }

  try {
    apiRestructureAllSheets();
  } catch (syncErr) {
    Logger.log('onOpen auto sync error: ' + syncErr.toString());
  }
}

function debugShareAdminDrive() {
  try {
    const data = getFullInitialData_();
    const instName = (data.settings && data.settings.instituteName) || 'Divine Classes';
    const driveFolder = getDriveSubFolder(DRIVE_MATERIALS_FOLDER);
    Logger.log('System verified: ' + instName + ' | Drive folder: ' + driveFolder.getUrl());
    return {
      success: true,
      instituteName: 'Divine Classes',
      driveFolderUrl: driveFolder.getUrl(),
      message: 'Drive and database verified. Authorization emails are triggered directly from the UI when a user enters an email address.'
    };
  } catch (e) {
    Logger.log('debugShareAdminDrive error: ' + e.toString() + ' Stack: ' + e.stack);
    return { success: false, error: e.toString(), stack: e.stack };
  }
}


/**
 * Dedicated API to append a new student to Students_Master in Google Sheet
 * Ensures new students enrolled from the web app are directly appended
 * to the Google Sheet in an appended manner and saved in backend database.
 */
function apiAppendStudent(studentData, batchId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (lockErr) {
    Logger.log("Lock wait notice in apiAppendStudent: " + lockErr.toString());
  }

  try {
    const ss = getDbSpreadsheet();
    if (!ss) return { success: false, message: 'Database not found' };
    const stuSheet = getOrCreateSheet(ss, 'Students_Master', ['Students', 'Students Master']);
    
    SpreadsheetApp.flush();
    const data = getFullInitialData_();
    if (!data.students) data.students = [];
    if (!data.batches) data.batches = [];

    // Find the absolute highest numeric roll number across BOTH sheet AND data.students
    const sheetVals = stuSheet.getDataRange().getValues();
    let maxRollNum = 100;
    
    for (let r = 1; r < sheetVals.length; r++) {
      const valStr = String(sheetVals[r][0] || '');
      const m = valStr.match(/\d+/);
      if (m) {
        const n = parseInt(m[0], 10);
        if (n > maxRollNum) maxRollNum = n;
      }
    }
    data.students.forEach(function(s) {
      const valStr = String((s && s.roll) || '');
      const m = valStr.match(/\d+/);
      if (m) {
        const n = parseInt(m[0], 10);
        if (n > maxRollNum) maxRollNum = n;
      }
    });

    // Check if the provided roll already exists in the sheet or data
    let roll = studentData.roll;
    let rollAlreadyExists = false;
    if (roll) {
      const checkRoll = String(roll).trim().toUpperCase();
      for (let r = 1; r < sheetVals.length; r++) {
        if (String(sheetVals[r][0] || '').trim().toUpperCase() === checkRoll) {
          rollAlreadyExists = true;
          break;
        }
      }
      if (!rollAlreadyExists) {
        rollAlreadyExists = data.students.some(function(s) {
          return String((s && s.roll) || '').trim().toUpperCase() === checkRoll;
        });
      }
    }

    // If roll wasn't given, or is already taken, ALWAYS assign the next highest roll!
    if (!roll || rollAlreadyExists) {
      roll = 'DC-' + (maxRollNum + 1);
    }
    
    const stuId = 'stu_' + roll.replace(/\D/g, '');

    // Store each new student's required photo in Drive before saving the profile.
    let pUrl = studentData.photoUrl || studentData.photo || '';
    if (pUrl && pUrl.startsWith('data:image')) {
      try {
        pUrl = uploadPhotoToDeveloperDrive_(pUrl, 'student_' + roll, studentData.name);
      } catch (photoErr) {
        Logger.log('Drive photo upload error: ' + photoErr.toString());
        return { success: false, message: 'The student photo could not be uploaded to Google Drive. The student was not enrolled.' };
      }
    }
    if (!/^https:\/\/drive\.google\.com\/file\/d\//i.test(pUrl)) {
      return { success: false, message: pUrl
        ? 'The student photo was not saved to Google Drive. Please capture or choose the photo again.'
        : 'A student photo is required. Capture or choose a photo before enrolling.' };
    }

    const monthly = Number(studentData.monthlyFee || studentData.totalFee) || 2500;
    const paid = Number(studentData.paidFee) || 0;
    const balance = Math.max(0, monthly - paid);
    const isPaid = balance <= 0;
    const admDate = studentData.admissionDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const dueDate = studentData.dueDate || calculateNextFeeReminder_(admDate, 1);
    const status = studentData.status || 'Active';
    const pwd = studentData.password || 'password123';
    const parentName = studentData.parentName || 'Parent Name';
    const phone = studentData.phone || '';
    const lastReminder = studentData.lastReminder || 'Never';

    const newStudentObj = {
      id: stuId,
      roll: roll,
      name: studentData.name,
      parentName: parentName,
      phone: phone,
      admissionDate: admDate,
      monthlyFee: monthly,
      totalFee: monthly,
      paidFee: paid,
      dueDate: dueDate,
      lastReminder: lastReminder,
      photo: pUrl,
      photoUrl: pUrl,
      password: pwd,
      status: status
    };

    // Push new student object
    data.students.push(newStudentObj);

    // Assign to batch
    const targetBatchId = batchId || (data.batches[0] ? data.batches[0].id : 'b1');
    const b = data.batches.find(function(batch) { return batch.id === targetBatchId; }) || data.batches[0];
    if (b) {
      if (!b.studentIds) b.studentIds = [];
      if (b.studentIds.indexOf(stuId) === -1) b.studentIds.push(stuId);
      if (b.studentIds.indexOf(roll) === -1) b.studentIds.push(roll);
    }
    // Also ensure primary batch has this student
    if (data.batches[0] && data.batches[0] !== b) {
      if (!data.batches[0].studentIds) data.batches[0].studentIds = [];
      if (data.batches[0].studentIds.indexOf(stuId) === -1) data.batches[0].studentIds.push(stuId);
      if (data.batches[0].studentIds.indexOf(roll) === -1) data.batches[0].studentIds.push(roll);
    }

    // Clear any tombstone for this roll
    clearTombstone_('rolls', roll);

    // Save to Database Properties
    dbSaveAll_(data);

    // Always APPEND a new row to Students_Master in Google Sheet (never replace existing student row)
    const newRow = [
      roll,
      newStudentObj.name,
      admDate,
      pwd,
      status,
      parentName,
      phone,
      monthly,
      paid,
      balance,
      isPaid ? 'Paid' : 'Pending',
      dueDate,
      lastReminder,
      pUrl
    ];

    stuSheet.appendRow(newRow);
    const targetRow = stuSheet.getLastRow();
    SpreadsheetApp.flush();
    
    // Style the new row
    stuSheet.getRange(targetRow, 1, 1, 14).setFontFamily('Calibri').setFontSize(10).setVerticalAlignment('middle');
    stuSheet.getRange(targetRow, 5)
      .setBackground(status === 'Active' ? '#dcfce7' : (status === 'Blocked' ? '#fee2e2' : '#f1f5f9'))
      .setFontColor(status === 'Active' ? '#166534' : (status === 'Blocked' ? '#991b1b' : '#64748b'))
      .setFontWeight('bold');
    stuSheet.getRange(targetRow, 11)
      .setBackground(isPaid ? '#dcfce7' : '#fee2e2')
      .setFontColor(isPaid ? '#166534' : '#991b1b')
      .setFontWeight('bold');

    Logger.log('Successfully appended student ' + newStudentObj.name + ' (' + roll + ') to Students_Master row ' + targetRow);
    return { success: true, student: newStudentObj, batches: data.batches, row: targetRow };
  } catch (err) {
    Logger.log('apiAppendStudent error: ' + err.toString());
    return { success: false, message: err.toString() };
  } finally {
    try { lock.releaseLock(); } catch (e) { }
  }
}

/**
 * Dedicated API to append a new teacher to Teachers_Roster in Google Sheet
 * Ensures new faculty added from the web app are directly appended
 * to the Google Sheet in an appended manner and saved in backend database.
 */
function apiAppendTeacher(teacherData) {
  try {
    const ss = getDbSpreadsheet();
    if (!ss) return { success: false, message: 'Database not found' };
    const teachSheet = getOrCreateSheet(ss, 'Teachers_Roster', ['Teachers', 'Teachers Roster']);
    
    const data = getFullInitialData_();
    if (!data.teachers) data.teachers = [];

    const trId = teacherData.id || ('tr' + Date.now());
    let pUrl = teacherData.photoUrl || teacherData.photo || '';
    if (pUrl && pUrl.startsWith('data:image')) {
      try {
        pUrl = uploadPhotoToDeveloperDrive_(pUrl, 'teacher_' + trId, teacherData.name);
      } catch (photoErr) {
        Logger.log('Drive photo upload error for faculty: ' + photoErr.toString());
      }
    }
    if (!pUrl) {
      pUrl = getRandomAvatarUrl_(teacherData.name || trId, 'teacher');
    }

    const initials = (teacherData.name || 'Faculty').split(' ').map(function(n) { return n[0]; }).join('').slice(0, 2).toUpperCase();
    const newTeacherObj = {
      id: trId,
      name: teacherData.name,
      subject: teacherData.subject || '',
      qualification: teacherData.qualification || '',
      experience: teacherData.experience || '',
      specialization: teacherData.specialization || '',
      bio: teacherData.bio || '',
      email: teacherData.email || 'faculty@divineclasses.in',
      avatarColor: teacherData.avatarColor || 'from-rose-500 to-orange-500',
      initials: initials,
      photo: pUrl,
      photoUrl: pUrl,
      password: teacherData.password || 'teacher123',
      status: teacherData.status || 'Active',
      phone: teacherData.phone || '+91 98765 43210'
    };

    let existingIndex = data.teachers.findIndex(function(t) { return t.id === trId; });
    if (existingIndex >= 0) {
      data.teachers[existingIndex] = newTeacherObj;
    } else {
      data.teachers.push(newTeacherObj);
    }

    // Save to Database Properties
    dbSaveAll_(data);

    // Append or update directly to Teachers_Roster in Google Sheet
    const newTrRow = [
      trId,
      newTeacherObj.name,
      newTeacherObj.subject,
      newTeacherObj.email,
      newTeacherObj.password,
      newTeacherObj.status,
      newTeacherObj.phone,
      newTeacherObj.qualification,
      newTeacherObj.experience,
      pUrl
    ];

    const trVals = teachSheet.getDataRange().getValues();
    let trRow = -1;
    for (let r = 1; r < trVals.length; r++) {
      if (String(trVals[r][0] || '').trim() === trId) {
        trRow = r + 1;
        break;
      }
    }

    if (trRow > 0) {
      teachSheet.getRange(trRow, 1, 1, 10).setValues([newTrRow]);
    } else {
      teachSheet.appendRow(newTrRow);
      trRow = teachSheet.getLastRow();
    }

    // Style the row
    teachSheet.getRange(trRow, 1, 1, 10).setFontFamily('Calibri').setFontSize(10).setVerticalAlignment('middle');
    // Access status cell (Col 6)
    const stCell = teachSheet.getRange(trRow, 6);
    stCell.setBackground(newTeacherObj.status === 'Active' ? '#dcfce7' : (newTeacherObj.status === 'Blocked' ? '#fee2e2' : '#f1f5f9'))
          .setFontColor(newTeacherObj.status === 'Active' ? '#166534' : (newTeacherObj.status === 'Blocked' ? '#991b1b' : '#64748b'))
          .setFontWeight('bold');

    Logger.log('Successfully appended teacher ' + newTeacherObj.name + ' (' + trId + ') to Teachers_Roster sheet row ' + trRow);
    return { success: true, teacher: newTeacherObj, row: trRow };
  } catch (err) {
    Logger.log('apiAppendTeacher error: ' + err.toString());
    return { success: false, message: err.toString() };
  }
}
