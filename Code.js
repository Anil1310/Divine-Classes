/**
 * DIVINE CLASSES - INSTITUTE MANAGEMENT SYSTEM
 * Google Apps Script Backend
 * 
 * Script ID is configured in .clasp.json for local pushes.
 * Database Sheet ID: 1v7RZX0R8AmVDv02BCr3D_t28B8i3I8PO_qpjqMzFeKM
 */

const SPREADSHEET_ID = '1v7RZX0R8AmVDv02BCr3D_t28B8i3I8PO_qpjqMzFeKM';

/**
 * Web App Entrypoint (doGet)
 */
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action) {
      const act = String(e.parameter.action).toLowerCase();
      if (act === 'sync_settings_to_sheet') {
        const ss = getDbSpreadsheet();
        if (!ss) {
          return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Database sheet unavailable' })).setMimeType(ContentService.MimeType.JSON);
        }
        let appData = apiGetInitialData();
        if (!appData) appData = getDefaultSeedData();
        if (!appData.settings) appData.settings = {};
        let setSheet = ss.getSheetByName('Settings_Config');
        if (!setSheet) {
          setSheet = ss.insertSheet('Settings_Config');
        }
        setSheet.clear();
        const sHeaders = ['Setting Parameter', 'Configured Value', 'Description'];
        const sRows = [sHeaders].concat(getDefaultSettingsConfigRows_(appData.settings));
        setSheet.getRange(1, 1, sRows.length, sHeaders.length).setValues(sRows);
        setSheet.getRange(1, 1, 1, sHeaders.length).setFontWeight('bold').setBackground('#334155').setFontColor('#ffffff');
        formatAndTrimSheet(setSheet, sHeaders.length, sRows.length);
        return ContentService.createTextOutput(JSON.stringify({ success: true, rowsWritten: sRows.length })).setMimeType(ContentService.MimeType.JSON);
      }
      if (act === 'create_dummy_data') {
        const res = apiCreateDummyDataAndSheets();
        return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
      }
    }

    const page = (e && e.parameter && e.parameter.page) ? String(e.parameter.page).toLowerCase() : 'index';
    const routeConfig = typeof ROUTE_MODULES !== 'undefined' ? ROUTE_MODULES : {
      index: { template: 'index', title: 'Divine Classes - Institute Management System' },
      login: { template: 'login', title: 'Sign In - Divine Classes Portal' },
      logout: { template: 'logout', title: 'Signed Out - Divine Classes Portal' },
      loading: { template: 'Routes/Loading/page', title: 'Connecting to Divine Classes...' },
      chatbot: { template: 'Routes/Chatbot/page', title: 'Divine AI Assistant - Divine Classes' }
    };
    const route = routeConfig[page] || routeConfig.index;
    const templateName = route.template;
    const title = route.title;

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

/** One-time settings migration: add the Lead Dev email without exposing a password. */
function addLeadDevEmailToSettingsConfig_() {
  const ss = getDbSpreadsheet();
  if (!ss) throw new Error('Configured database spreadsheet is not available.');

  let sheet = ss.getSheetByName('Settings_Config');
  if (!sheet) {
    sheet = ss.insertSheet('Settings_Config');
    sheet.getRange(1, 1, 1, 2).setValues([['Setting Parameter', 'Configured Value']]);
  }

  const email = 'anil.chahar170@gmail.com';
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const labels = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
    for (let i = 0; i < labels.length; i++) {
      if (String(labels[i][0] || '').trim().toLowerCase() === 'lead dev email') {
        sheet.getRange(i + 2, 2).setValue(email);
        return { success: true, row: i + 2, updated: true };
      }
    }
  }

  const row = Math.max(2, lastRow + 1);
  sheet.getRange(row, 1, 1, 2).setValues([['Lead Dev Email', email]]);
  return { success: true, row: row, updated: false };
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
  STUDENT_PROFILES: 'Students',
  TEACHER_PROFILES: 'Teachers',
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
        studentPhotos: getDriveProfileSubFolder_(DRIVE_FOLDERS.STUDENT_PROFILES).getUrl(),
        teacherPhotos: getDriveProfileSubFolder_(DRIVE_FOLDERS.TEACHER_PROFILES).getUrl(),
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

function getDriveProfileSubFolder_(name) {
  const parent = getDriveSubFolder(DRIVE_FOLDERS.PHOTOS);
  const folders = parent.getFoldersByName(name);
  const folder = folders.hasNext() ? folders.next() : parent.createFolder(name);
  try { folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {
    Logger.log('Profile photo folder sharing notice: ' + e.toString());
  }
  return folder;
}

function saveProfilePhotoToDrive_(record, folderName, label) {
  const photo = String(record && record.photo || '');
  if (!photo) {
    if (record && record.photoFileId) {
      try { DriveApp.getFileById(record.photoFileId).setTrashed(true); } catch (e) { Logger.log('Old profile photo cleanup skipped: ' + e.toString()); }
    }
    if (record) { record.photo = ''; record.photoFileId = ''; }
    return { success: true, photo: '', photoFileId: '' };
  }
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(photo)) {
    if (/^https:\/\//i.test(photo)) return { success: true, photo: photo, photoFileId: record.photoFileId || '' };
    return { success: false, error: 'Choose a valid JPG, PNG, or WebP photo.' };
  }
  if (photo.length > 1400000) return { success: false, error: 'The photo is too large after resizing. Please choose another image.' };
  try {
    const parts = photo.split(';base64,');
    const mimeType = parts[0].slice(5);
    const ext = mimeType === 'image/png' ? 'png' : (mimeType === 'image/webp' ? 'webp' : 'jpg');
    const cleanName = String(label || 'profile').replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 70);
    const blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), mimeType, cleanName + '_' + Date.now() + '.' + ext);
    const file = getDriveProfileSubFolder_(folderName).createFile(blob);
    file.setDescription('Divine Classes profile photo');
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const previousId = record.photoFileId;
    record.photoFileId = file.getId();
    record.photo = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200';
    if (previousId && previousId !== file.getId()) {
      try { DriveApp.getFileById(previousId).setTrashed(true); } catch (e) { Logger.log('Previous profile photo cleanup skipped: ' + e.toString()); }
    }
    return { success: true, photo: record.photo, photoFileId: record.photoFileId };
  } catch (err) {
    Logger.log('Profile photo Drive save failed: ' + err.toString());
    return { success: false, error: 'Could not save the photo to Drive: ' + err.message };
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
    const data = dbLoadAll() || apiGetInitialData();
    if (!data.materials) data.materials = [];
    data.materials.unshift(newMaterial);

    // In-app notification: alert every student/teacher that a new material is live
    if (!data.notifications || !Array.isArray(data.notifications)) data.notifications = [];
    const batchObj = (data.batches || []).find(b => b.id === newMaterial.batchId);
    const batchLabel = batchObj ? batchObj.name : 'General';
    data.notifications.unshift({
      id: 'notif_mat_' + newMaterial.id + '_' + Date.now(),
      title: 'New ' + newMaterial.category + ' Uploaded',
      message: '"' + newMaterial.title + '" (' + newMaterial.fileSize + ') for ' + batchLabel + ' is now available in Assignments & DPPs. Download link saved to the database.',
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
    dbSaveAll(data);
    try {
      syncMaterialsRepository_(data.materials, data.batches);
    } catch (sheetErr) {
      // The uploaded Drive file and primary database record are already saved.
      // A secondary sheet mirror problem must not report the upload as failed.
      Logger.log('Materials_Repository mirror notice: ' + sheetErr.toString());
    }

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

function syncMaterialsRepository_(materials, batches) {
  const ss = getDbSpreadsheet();
  if (!ss) return;
  let sheet = ss.getSheetByName('Materials_Repository');
  if (!sheet) sheet = ss.insertSheet('Materials_Repository');
  const headers = ['Material ID', 'Title', 'Batch Name', 'Category', 'Upload Date', 'Uploaded By', 'File Size', 'Downloads', 'Description', 'Download URL', 'Google Drive Link'];
  const batchNames = {};
  (batches || []).forEach(function (batch) { batchNames[String(batch.id)] = batch.name; });
  const rows = [headers].concat((materials || []).map(function (material) {
    return [
      material.id || '', material.title || '', batchNames[String(material.batchId)] || material.batchId || 'All Batches',
      material.category || 'Assignment PDF', material.uploadDate || '', material.uploadedBy || '',
      material.fileSize || '', material.downloads || 0, material.description || '',
      material.downloadUrl || material.driveUrl || '', material.driveUrl || ''
    ];
  }));
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
  formatAndTrimSheet(sheet, headers.length, rows.length);
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
  DB_TABLES.forEach(function (tbl) {
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
  DB_TABLES.forEach(function (tbl) {
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

// Strips tombstoned students (by roll) and links (by URL) from a data object.
function applyTombstones_(appData) {
  if (!appData) return appData;
  const deadRolls = getTombstones_('rolls');
  const deadUrls = getTombstones_('linkUrls');

  if (deadRolls.length && Array.isArray(appData.students)) {
    const rollSet = {};
    deadRolls.forEach(function (r) { rollSet[r] = true; });
    const removedIds = {};
    appData.students = appData.students.filter(function (s) {
      if (s && s.roll && rollSet[String(s.roll).trim()]) {
        if (appData.settings && (appData.settings.showDummyData === true || appData.settings.showDummyData === 'On') && !appData.settings.dummyDataWiped && isDummyRecord_(s)) {
          return true;
        }
        if (s.id) removedIds[s.id] = true;
        return false;
      }
      return true;
    });
    if (Object.keys(removedIds).length > 0) {
      (appData.batches || []).forEach(function (b) {
        if (Array.isArray(b.studentIds)) {
          b.studentIds = b.studentIds.filter(function (id) { return !removedIds[id]; });
        }
      });
      (appData.offlineTests || []).forEach(function (t) {
        if (t && t.marks && typeof t.marks === 'object') {
          Object.keys(removedIds).forEach(function (sid) { delete t.marks[sid]; });
        }
      });
    }
  }

  if (deadUrls.length && Array.isArray(appData.externalLinks)) {
    const urlSet = {};
    deadUrls.forEach(function (u) { urlSet[u] = true; });
    appData.externalLinks = appData.externalLinks.filter(function (l) {
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
function mergeStudentsFromSheet_(appData, spreadsheet) {
  try {
    const ss = spreadsheet || getDbSpreadsheet();
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
    getTombstones_('rolls').forEach(function (r) {
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
        dueDate = Utilities.formatDate(dueDate, tz, 'yyyy-MM-dd');
      } else {
        dueDate = String(dueDate || '').trim();
      }
      const lastReminder = String(row[10] || '').trim() || 'Never';
      const admissionDate = row[11] instanceof Date && !isNaN(row[11]) ? Utilities.formatDate(row[11], tz, 'yyyy-MM-dd') : String(row[11] || '').trim();
      const monthlyFee = Number(row[12]) || 0;

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
        stu.password = password;
        stu.status = status;
        stu.parentName = parentName || stu.parentName;
        stu.phone = phone || stu.phone;
        stu.totalFee = Math.max(totalFee, paidFee);
        stu.paidFee = paidFee;
        if (dueDate && !/^fully paid$/i.test(dueDate)) stu.dueDate = dueDate;
        stu.lastReminder = lastReminder;
        if (admissionDate) stu.admissionDate = admissionDate;
        if (monthlyFee) stu.monthlyFee = monthlyFee;
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
          totalFee: Math.max(totalFee, paidFee),
          paidFee: paidFee,
          dueDate: /^fully paid$/i.test(dueDate) ? '' : dueDate,
          lastReminder: lastReminder,
          admissionDate: admissionDate,
          monthlyFee: monthlyFee,
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
      appData.students.forEach(function (s) {
        const roll = String(s.roll || '').trim();
        const name = String(s.name || '').trim();
        // Keep if the student's roll row exists; name fallback only for roll-less records
        if ((roll && keepRolls[roll]) || (!roll && name && keepNames[name])) {
          kept.push(s);
        } else if (isDummyRecord_(s) && appData.settings && (appData.settings.showDummyData === true || appData.settings.showDummyData === 'On') && !appData.settings.dummyDataWiped) {
          kept.push(s);
        } else {
          if (s.id) removedIds[s.id] = true;
          if (roll) removedRolls.push(roll);
        }
      });
      if (Object.keys(removedIds).length > 0) {
        appData.students = kept;
        (appData.batches || []).forEach(function (b) {
          if (Array.isArray(b.studentIds)) {
            b.studentIds = b.studentIds.filter(function (id) { return !removedIds[id]; });
          }
        });
        (appData.offlineTests || []).forEach(function (t) {
          if (t && t.marks && typeof t.marks === 'object') {
            Object.keys(removedIds).forEach(function (sid) { delete t.marks[sid]; });
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
function mergeLinksFromSheet_(appData, spreadsheet) {
  try {
    const ss = spreadsheet || getDbSpreadsheet();
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
 * Loads supported institute settings from the Settings_Config sheet tab.
 * The sheet is read on each initial data load; saving settings in the app
 * continues to mirror the values back to this tab.
 */
function mergeSettingsFromSheet_(appData, spreadsheet) {
  try {
    const ss = spreadsheet || getDbSpreadsheet();
    if (!ss) return appData;
    const sheet = ss.getSheetByName('Settings_Config');
    if (!sheet || sheet.getLastRow() < 2) return appData;

    if (!appData.settings || typeof appData.settings !== 'object') appData.settings = {};
    const settingKeys = {
      'Institute Name': 'instituteName',
      'Tagline': 'tagline',
      'Helpline Phone': 'phone',
      'Display Contact': 'contactDisplay',
      'Official Email': 'email',
      'Address': 'address',
      'YouTube Channel': 'youtubeUrl',
      'Admin Name': 'adminName',
      'Master Admin Password': 'adminPassword',
      'Admin Email ID': 'adminEmail',
      'Lead Dev Email': 'leadDevEmail',
      'LEAD_DEV_EMAIL': 'leadDevEmail',
      'Lead Developer Email': 'leadDevEmail',
      'Lead Dev Password': 'leadDevPassword',
      'LEAD_DEV_PASSWORD': 'leadDevPassword',
      'Lead Developer Password': 'leadDevPassword',
      'UPI Payment ID': 'upiId',
      'Facebook Page': 'facebookUrl',
      'Instagram Profile': 'instagramUrl',
      'Show Requirement Labels': 'showRequirementLabels',
      'Admin Feedback Delete': 'allowAdminFeedbackDelete',
      'Study Link Delete': 'allowAdminLinkDelete',
      'Show Dummy / Demo Data': 'showDummyData',
      'Dummy Data Wiped': 'dummyDataWiped',
      'Supabase Enabled': 'supabaseEnabled',
      'Supabase URL': 'supabaseUrl',
      'Supabase Key': 'supabaseKey'
    };
    const booleanKeys = {
      showRequirementLabels: true,
      allowAdminFeedbackDelete: true,
      allowAdminLinkDelete: true,
      showDummyData: true,
      dummyDataWiped: true,
      supabaseEnabled: true
    };
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues();
    rows.forEach(function (row) {
      const key = settingKeys[String(row[0] || '').trim()];
      if (!key) return;
      const value = String(row[1] || '').trim();
      appData.settings[key] = booleanKeys[key] ? /^on\b/i.test(value) : value;
    });
  } catch (e) {
    Logger.log('Settings_Config read notice: ' + e.toString());
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
    // 0. Supabase Check: If Supabase is enabled, load directly from Supabase
    let appData = null;
    try {
      const dbSettingsRaw = PropertiesService.getScriptProperties().getProperty('DB_settings');
      const parsedSettings = dbSettingsRaw ? JSON.parse(dbSettingsRaw) : null;
      if (parsedSettings && parsedSettings.supabaseEnabled === true) {
        appData = loadFromSupabase_(parsedSettings);
      }
    } catch (sbErr) {
      Logger.log('Supabase load initial notice: ' + sbErr.toString());
    }

    // 1. Primary Source: Cloud Database (PropertiesService)
    if (!appData) {
      appData = dbLoadAll();
    }

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

    if (!appData) {
      appData = getDefaultSeedData();
    }

    // Reuse one Spreadsheet service handle for the Sheet-backed login/data merge.
    // Reopening the same workbook for each tab added avoidable startup latency.
    let sourceSpreadsheet = null;
    try { sourceSpreadsheet = getDbSpreadsheet(); } catch (sheetOpenErr) {
      Logger.log('Initial spreadsheet access notice: ' + sheetOpenErr.toString());
    }

    // 2b. Dynamically merge students added/edited in the Students_Master sheet tab
    appData = mergeStudentsFromSheet_(appData, sourceSpreadsheet);

    // 2c. Dynamically merge study links from the External_Links_Hub sheet tab
    //     (always visible to admin/teacher/student — never dummy-stripped)
    appData = mergeLinksFromSheet_(appData, sourceSpreadsheet);
    // Demo records are added only by the explicit developer action
    // apiCreateDummyDataAndSheets(), rather than being injected on every load.
    // Settings_Config is the persisted source for these institute settings.
    appData = mergeSettingsFromSheet_(appData, sourceSpreadsheet);
    // Migrate only the old sample social URLs; custom Settings_Config values stay intact.
    appData = migrateLegacySeedSettings_(appData);
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

    // Remove legacy client-side credentials. Developer login secrets live only
    // in Script Properties and are never returned to the browser.
    if (appData.settings) delete appData.settings.devPassword;

    // Persist verified state in the Cloud Database
    dbSaveAll(appData);
    // Keep one daily reminder job installed. Apps Script may ask the owner to
    // authorize this once; failure is non-fatal and the app remains usable.
    try { ensureDailyFeeReminderTrigger_(); } catch (triggerErr) {
      Logger.log('Fee reminder trigger setup notice: ' + triggerErr.toString());
    }

    // Developer toggle: hide seed/demo records from clients (DB keeps them)
    return stripDummyData_(appData);
  } catch (err) {
    Logger.log('apiGetInitialData error: ' + err.toString());
    const seed = getDefaultSeedData();
    if (seed.settings) delete seed.settings.devPassword;
    dbSaveAll(seed);
    return seed;
  }
}

/**
 * Verify Lead Dev credentials without returning either credential to the client.
 * Configure LEAD_DEV_EMAIL and LEAD_DEV_PASSWORD in Apps Script Project Settings > Script Properties.
 */
function apiVerifyDeveloperLogin(email, password) {
  try {
    const props = PropertiesService.getScriptProperties();
    let settingsEmail = '';
    try {
      const appData = dbLoadAll() || apiGetInitialData();
      mergeSettingsFromSheet_(appData, getDbSpreadsheet());
      settingsEmail = appData.settings && appData.settings.leadDevEmail || '';
    } catch (settingsErr) {
      Logger.log('Lead Dev email settings lookup notice: ' + settingsErr.toString());
    }
    const savedEmail = String(props.getProperty('LEAD_DEV_EMAIL') || settingsEmail).trim().toLowerCase();
    const savedPassword = String(props.getProperty('LEAD_DEV_PASSWORD') || '');
    if (!savedEmail || !savedPassword) return { success: false, notConfigured: true };

    const submittedEmail = String(email || '').trim().toLowerCase();
    const submittedPassword = String(password || '');
    if (!constantTimeEquals_(submittedEmail, savedEmail) || !constantTimeEquals_(submittedPassword, savedPassword)) {
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    Logger.log('Developer login verification failed: ' + err.toString());
    return { success: false };
  }
}

function constantTimeEquals_(left, right) {
  left = String(left || '');
  right = String(right || '');
  let difference = left.length ^ right.length;
  const maxLength = Math.max(left.length, right.length);
  for (let i = 0; i < maxLength; i++) {
    difference |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  }
  return difference === 0;
}

function addMonthsClamped_(dateValue, months) {
  var d = dateValue instanceof Date ? new Date(dateValue.getTime()) : new Date(String(dateValue) + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  var day = d.getDate();
  var target = new Date(d.getFullYear(), d.getMonth() + Number(months || 1), 1, 12, 0, 0);
  var lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return Utilities.formatDate(target, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function nextMonthlyDueDateFromAnchor_(admissionDate, currentDueDate) {
  var admission = new Date(String(admissionDate || currentDueDate).slice(0, 10) + 'T12:00:00');
  var current = new Date(String(currentDueDate || '').slice(0, 10) + 'T12:00:00');
  if (isNaN(admission.getTime()) || isNaN(current.getTime())) return '';
  var elapsedMonths = (current.getFullYear() - admission.getFullYear()) * 12 + (current.getMonth() - admission.getMonth());
  var target = new Date(admission.getFullYear(), admission.getMonth() + elapsedMonths + 1, 1, 12, 0, 0);
  target.setDate(Math.min(admission.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
  return Utilities.formatDate(target, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function ensureDailyFeeReminderTrigger_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('DAILY_FEE_REMINDER_TRIGGER_READY') === 'yes') return;
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'apiRunDailyFeeReminders';
  });
  if (!exists) ScriptApp.newTrigger('apiRunDailyFeeReminders').timeBased().everyDays(1).atHour(9).create();
  props.setProperty('DAILY_FEE_REMINDER_TRIGGER_READY', 'yes');
}

function apiRunDailyFeeReminders() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;
  try {
    var data = dbLoadAll();
    if (!data) return;
    if (!Array.isArray(data.notifications)) data.notifications = [];
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    (data.students || []).forEach(function (stu) {
      var due = String(stu.dueDate || stu.nextDueDate || '').slice(0, 10);
      var monthlyFee = Number(stu.monthlyFee || 0);
      if (!due || !/^\d{4}-\d{2}-\d{2}$/.test(due) || !monthlyFee || due === 'Paid') return;
      var reminderDay = addDaysToIsoDate_(due, 1);
      if (today < reminderDay) return;
      var key = 'monthly_fee_' + stu.id + '_' + due;
      if (data.notifications.some(function (n) { return n && n.id === key; })) return;
      data.notifications.unshift({
        id: key, title: 'Monthly fee overdue',
        message: 'Your monthly fee of ₹' + monthlyFee.toLocaleString('en-IN') + ' was due on ' + due + '. Please contact the office after making payment.',
        time: 'Today', timestamp: Date.now(), read: false, adminSeen: false,
        type: 'warning', icon: 'fa-bell', iconColor: 'text-amber-500',
        bgColor: 'bg-amber-100 dark:bg-amber-950/40', actionTab: 'fees',
        targetStudentId: stu.id, targetRoll: stu.roll, targetRole: 'student', studentName: stu.name
      });
      stu.lastReminder = today;
    });
    dbSaveAll(data);
  } finally { lock.releaseLock(); }
}

function addDaysToIsoDate_(iso, days) {
  var d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
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

const ATTENDANCE_SHEET_NAME = 'Attendance_Register';
const ATTENDANCE_HEADERS = ['Date', 'Batch ID', 'Student ID', 'Status', 'Marked By', 'Updated At'];
const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'Leave'];

function getAttendanceSheet_() {
  const ss = getDbSpreadsheet();
  if (!ss) throw new Error('Attendance database is unavailable.');

  let sheet = ss.getSheetByName(ATTENDANCE_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(ATTENDANCE_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, ATTENDANCE_HEADERS.length).setValues([ATTENDANCE_HEADERS]);
    sheet.getRange(1, 1, 1, ATTENDANCE_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#4f46e5')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else {
    const header = sheet.getRange(1, 1, 1, ATTENDANCE_HEADERS.length).getDisplayValues()[0];
    if (ATTENDANCE_HEADERS.some(function (value, index) { return header[index] !== value; })) {
      throw new Error('The Attendance_Register sheet has an unexpected header row.');
    }
  }
  ensureAttendanceDummySeeds_(sheet);
  formatAndTrimSheet(sheet, ATTENDANCE_HEADERS.length, sheet.getLastRow(), '#4f46e5');
  return sheet;
}

function isValidAttendanceDate_(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizeAttendanceDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value || '').trim();
}

function getTeacherAssignedBatchIds_(teacherId) {
  const data = dbLoadAll() || apiGetInitialData();
  const teacher = (data.teachers || []).find(function (item) { return String(item.id) === String(teacherId || ''); });
  if (!teacher) return null;
  const assigned = {};
  (data.batches || []).forEach(function (batch) {
    if (String(batch.teacherId || '') === String(teacher.id) ||
      String(batch.teacher || '').trim().toLowerCase() === String(teacher.name || '').trim().toLowerCase() ||
      String(batch.teacherEmail || '').trim().toLowerCase() === String(teacher.email || '').trim().toLowerCase()) {
      assigned[String(batch.id)] = true;
    }
  });
  return assigned;
}

function apiGetMonthlyAttendance(month, teacherId) {
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return { success: false, error: 'Select a valid attendance month.' };
  }

  try {
    const assignedBatchIds = teacherId ? getTeacherAssignedBatchIds_(teacherId) : null;
    if (teacherId && !assignedBatchIds) return { success: false, error: 'Faculty profile could not be verified.' };
    const sheet = getAttendanceSheet_();
    const lastRow = sheet.getLastRow();
    const records = [];
    if (lastRow > 1) {
      const rows = sheet.getRange(2, 1, lastRow - 1, ATTENDANCE_HEADERS.length).getValues();
      rows.forEach(function (row) {
        const date = normalizeAttendanceDate_(row[0]);
        const status = String(row[3] || '').trim();
        if (date.slice(0, 7) !== month || !isValidAttendanceDate_(date) ||
          (assignedBatchIds && !assignedBatchIds[String(row[1] || '')]) ||
          ATTENDANCE_STATUSES.indexOf(status) === -1) return;
        records.push({
          date: date,
          batchId: String(row[1] || ''),
          studentId: String(row[2] || ''),
          status: status,
          markedBy: String(row[4] || ''),
          updatedAt: row[5] instanceof Date ? row[5].toISOString() : String(row[5] || '')
        });
      });
    }
    return { success: true, records: records };
  } catch (err) {
    Logger.log('apiGetMonthlyAttendance error: ' + err.toString());
    return { success: false, error: 'Could not load attendance: ' + err.message };
  }
}

function apiSaveDailyAttendance(payload) {
  try {
    if (!payload || !isValidAttendanceDate_(payload.date)) {
      return { success: false, error: 'Select a valid attendance date.' };
    }
    if (!payload.batchId || typeof payload.batchId !== 'string') {
      return { success: false, error: 'Select a valid class batch.' };
    }
    const role = String(payload.role || '').toLowerCase();
    if (['admin', 'developer', 'teacher'].indexOf(role) === -1) {
      return { success: false, error: 'Only Admins and Teachers can save attendance.' };
    }
    if (!Array.isArray(payload.entries) || payload.entries.length === 0 || payload.entries.length > 500) {
      return { success: false, error: 'Mark between 1 and 500 students before saving.' };
    }

    const data = dbLoadAll() || apiGetInitialData();
    const batches = Array.isArray(data.batches) ? data.batches : [];
    const students = Array.isArray(data.students) ? data.students : [];
    const batch = batches.find(function (item) { return String(item.id) === payload.batchId; });
    if (!batch) return { success: false, error: 'The selected batch could not be found.' };

    if (role === 'teacher') {
      const teacher = (data.teachers || []).find(function (item) { return String(item.id) === String(payload.teacherId || ''); });
      const cleanTName = teacher ? String(teacher.name || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/^(er\.|dr\.|mr\.|mrs\.|ms\.)\s*/i, '').trim() : '';
      const cleanBTeacher = String(batch.teacher || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/^(er\.|dr\.|mr\.|mrs\.|ms\.)\s*/i, '').trim();
      const assigned = teacher && (
        String(batch.teacherId || '') === String(teacher.id) ||
        String(batch.teacher || '').trim().toLowerCase() === String(teacher.name || '').trim().toLowerCase() ||
        String(batch.teacherEmail || '').trim().toLowerCase() === String(teacher.email || '').trim().toLowerCase() ||
        (cleanTName && cleanBTeacher && cleanTName === cleanBTeacher)
      );
      if (!assigned) return { success: false, error: 'Teachers can record attendance only for batches assigned to their faculty profile.' };
    }

    const batchStudentIds = Array.isArray(batch.studentIds) ? batch.studentIds.map(String) : [];
    const otherBatchStudentIds = [];
    if (String(batch.id) === String(batches[0].id)) {
      batches.slice(1).forEach(function (otherBatch) {
        (otherBatch.studentIds || []).forEach(function (id) { otherBatchStudentIds.push(String(id)); });
      });
    }

    const seenStudents = {};
    const entries = payload.entries.map(function (entry) {
      const studentId = String(entry && entry.studentId || '');
      const status = String(entry && entry.status || '');
      if (!studentId || seenStudents[studentId]) throw new Error('Each student can only be marked once.');
      if (ATTENDANCE_STATUSES.indexOf(status) === -1) throw new Error('Choose a valid attendance status.');
      seenStudents[studentId] = true;

      const student = students.find(function (item) { return String(item.id) === studentId; });
      if (!student || student.status === 'Inactive' || student.status === 'Blocked') {
        throw new Error('An active student in this roster could not be found.');
      }
      const isInBatch = batchStudentIds.some(function (id) {
        return id === studentId || id === String(student.roll || '');
      });
      const isUnassignedForFirstBatch = String(batch.id) === String(batches[0].id) &&
        !otherBatchStudentIds.some(function (id) {
          return id === studentId || id === String(student.roll || '');
        });
      if (!isInBatch && !(role !== 'teacher' && isUnassignedForFirstBatch)) {
        throw new Error('A selected student is not assigned to this batch.');
      }
      return { studentId: studentId, status: status };
    });

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error('Attendance is being updated. Please try again.');
    let updatedAt;
    try {
      const sheet = getAttendanceSheet_();
      const lastRow = sheet.getLastRow();
      const rowByKey = {};
      if (lastRow > 1) {
        const rows = sheet.getRange(2, 1, lastRow - 1, ATTENDANCE_HEADERS.length).getValues();
        rows.forEach(function (row, index) {
          const date = normalizeAttendanceDate_(row[0]);
          const key = JSON.stringify([date, String(row[1] || ''), String(row[2] || '')]);
          rowByKey[key] = index + 2;
        });
      }

      updatedAt = new Date().toISOString();
      const markedBy = String(payload.markedBy || role).slice(0, 120);
      const appendRows = [];
      entries.forEach(function (entry) {
        const key = JSON.stringify([payload.date, payload.batchId, entry.studentId]);
        const row = [payload.date, payload.batchId, entry.studentId, entry.status, markedBy, updatedAt];
        if (rowByKey[key]) {
          sheet.getRange(rowByKey[key], 1, 1, ATTENDANCE_HEADERS.length).setValues([row]);
        } else {
          appendRows.push(row);
        }
      });
      if (appendRows.length) {
        sheet.getRange(sheet.getLastRow() + 1, 1, appendRows.length, ATTENDANCE_HEADERS.length)
          .setValues(appendRows);
      }
    } finally {
      lock.releaseLock();
    }
    return { success: true, timestamp: updatedAt };
  } catch (err) {
    Logger.log('apiSaveDailyAttendance error: ' + err.toString());
    return { success: false, error: 'Could not save attendance: ' + err.message };
  }
}

/**
 * Direct Database API: Update a student's status (Active vs Blocked)
 */
function apiDatabaseUpdateStudentStatus(studentIdOrRoll, newStatus) {
  // Operate on full DB data (not the dummy-stripped client view) so saving
  // never wipes seed/demo records when settings.showDummyData is false.
  let data = dbLoadAll();
  if (!data) data = getDefaultSeedData();
  const student = (data.students || []).find(function (s) {
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
    if (fullData && fullData.settings) delete fullData.settings.devPassword;
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

    const photoUpdates = [];
    (fullData.students || []).forEach(function (student) {
      if (String(student.photo || '').indexOf('data:image/') !== 0) return;
      const saved = saveProfilePhotoToDrive_(student, DRIVE_FOLDERS.STUDENT_PROFILES, (student.roll || student.id || 'student') + '_' + (student.name || 'profile'));
      if (!saved.success) throw new Error(saved.error);
      photoUpdates.push({ type: 'student', id: student.id, photo: saved.photo, photoFileId: saved.photoFileId });
    });
    (fullData.teachers || []).forEach(function (teacher) {
      if (String(teacher.photo || '').indexOf('data:image/') !== 0) return;
      const saved = saveProfilePhotoToDrive_(teacher, DRIVE_FOLDERS.TEACHER_PROFILES, (teacher.id || 'teacher') + '_' + (teacher.name || 'profile'));
      if (!saved.success) throw new Error(saved.error);
      photoUpdates.push({ type: 'teacher', id: teacher.id, photo: saved.photo, photoFileId: saved.photoFileId });
    });

    // 1. Primary write: Cloud Database (instant, isolated, persistent)
    dbSaveAll(fullData);

    // 1b. Supabase Database Sync (keep Supabase in sync with latest settings and state)
    try {
      syncToSupabase_(fullData);
    } catch (sbErr) {
      Logger.log('Supabase sync notice: ' + sbErr.toString());
    }

    // 2. Optional secondary mirror. Existing installs default to enabled;
    //    developers can pause spreadsheet writes from Settings.
    const sheetsMirrorEnabled = !fullData.settings || fullData.settings.sheetsMirrorEnabled !== false;
    if (sheetsMirrorEnabled) {
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
    }

    return {
      success: true,
      storage: 'cloud_database',
      timestamp: new Date().toISOString(),
      photoUpdates: photoUpdates
    };
  } catch (err) {
    Logger.log('Database sync error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Sync entire application data to Supabase (both db_json snapshot and core tables)
 */
function syncToSupabase_(fullData) {
  const settings = (fullData && fullData.settings) || {};
  const supabaseUrl = settings.supabaseUrl || 'https://srjqsofkjizwskqnzyfn.supabase.co';
  const supabaseKey = settings.supabaseKey || 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS';
  if (!supabaseUrl || !supabaseKey) return false;

  const base = supabaseUrl.replace(/\/+$/, '') + '/rest/v1/';
  const headers = {
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal'
  };

  // 1. Snapshot update (db_json)
  try {
    UrlFetchApp.fetch(base + 'db_json?snapshot_key=eq.main', {
      method: 'patch',
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      payload: JSON.stringify({ payload: fullData, updated_at: new Date().toISOString() }),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log('Supabase db_json sync notice: ' + e.toString());
  }

  // 1b. Settings config update in Supabase (persists toggles across mobile APK & browsers)
  if (fullData.settings) {
    try {
      const sRows = getDefaultSettingsConfigRows_(fullData.settings);
      const settingsPayload = sRows.map(function(item) {
        return {
          setting_parameter: item[0],
          configured_value: String(item[1] != null ? item[1] : ''),
          description: item[2] || ''
        };
      });
      UrlFetchApp.fetch(base + 'settings_config?on_conflict=setting_parameter', {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(settingsPayload),
        muteHttpExceptions: true
      });
    } catch (e) {
      Logger.log('Supabase settings_config update error: ' + e.toString());
    }
  }

  // 2. Batches update
  if (Array.isArray(fullData.batches) && fullData.batches.length) {
    const batchesPayload = fullData.batches.map(function(b) {
      return {
        id: b.id,
        name: b.name,
        subject: b.subject,
        schedule: b.schedule,
        room: b.room,
        teacher: b.teacher,
        student_ids: b.studentIds || []
      };
    });
    try {
      UrlFetchApp.fetch(base + 'batches?on_conflict=id', {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(batchesPayload),
        muteHttpExceptions: true
      });
    } catch (e) {
      Logger.log('Supabase batches sync notice: ' + e.toString());
    }
  }

  // 3. Students update
  if (Array.isArray(fullData.students) && fullData.students.length) {
    const studentsPayload = fullData.students.map(function(s) {
      return {
        id: s.id || s.roll,
        roll: s.roll || s.id,
        name: s.name,
        phone: s.phone || '',
        parent_name: s.parentName || '',
        total_fee: Number(s.totalFee || 0),
        paid_fee: Number(s.paidFee || 0),
        monthly_fee: Number(s.monthlyFee || 0),
        due_date: s.dueDate || 'Fully Paid',
        last_reminder: s.lastReminder || '-',
        password: s.password || 'password123',
        status: s.status || 'Active',
        admission_date: s.admissionDate || '',
        batch_id: s.batchId || ''
      };
    });
    try {
      UrlFetchApp.fetch(base + 'students?on_conflict=id', {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(studentsPayload),
        muteHttpExceptions: true
      });
    } catch (e) {
      Logger.log('Supabase students sync notice: ' + e.toString());
    }
  }

  // 4. Materials update
  if (Array.isArray(fullData.materials) && fullData.materials.length) {
    const materialsPayload = fullData.materials.map(function(m) {
      return {
        id: m.id,
        batch_id: m.batchId || '',
        batch_name: m.batchName || '',
        title: m.title || '',
        category: m.category || 'Study Material',
        upload_date: m.uploadDate || m.date || '',
        uploaded_by: m.uploadedBy || 'Faculty',
        file_size: m.fileSize || m.size || '1.0 MB',
        downloads: Number(m.downloads || 0),
        description: m.description || '',
        download_url: m.downloadUrl || m.url || '',
        drive_url: m.driveUrl || m.url || ''
      };
    });
    try {
      UrlFetchApp.fetch(base + 'materials?on_conflict=id', {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(materialsPayload),
        muteHttpExceptions: true
      });
    } catch (e) {
      Logger.log('Supabase materials sync notice: ' + e.toString());
    }
  }

  // 5. Offline Tests update
  if (Array.isArray(fullData.offlineTests) && fullData.offlineTests.length) {
    const testsPayload = fullData.offlineTests.map(function(t) {
      return {
        id: t.id,
        batch_id: t.batchId || '',
        title: t.title || '',
        subject: t.subject || '',
        test_date: t.testDate || t.date || '',
        max_marks: Number(t.maxMarks || 100),
        marks: t.marks || {},
        is_dummy: t.isDummy === true
      };
    });
    try {
      UrlFetchApp.fetch(base + 'offline_tests?on_conflict=id', {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(testsPayload),
        muteHttpExceptions: true
      });
    } catch (e) {
      Logger.log('Supabase offline_tests sync notice: ' + e.toString());
    }
  }

  // 6. Teachers update
  if (Array.isArray(fullData.teachers) && fullData.teachers.length) {
    const teachersPayload = fullData.teachers.map(function(tr) {
      return {
        id: tr.id,
        name: tr.name || '',
        subject: tr.subject || '',
        qualification: tr.qualification || '',
        experience: tr.experience || '',
        email: tr.email || '',
        phone: tr.phone || '',
        specialization: tr.specialization || '',
        bio: tr.bio || '',
        avatar_color: tr.avatarColor || 'bg-indigo-600',
        initials: tr.initials || 'DC',
        password: tr.password || 'teacher123',
        status: tr.status || 'Active'
      };
    });
    try {
      UrlFetchApp.fetch(base + 'teachers?on_conflict=id', {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(teachersPayload),
        muteHttpExceptions: true
      });
    } catch (e) {
      Logger.log('Supabase teachers sync notice: ' + e.toString());
    }
  }

  // 7. Gallery update
  if (Array.isArray(fullData.gallery) && fullData.gallery.length) {
    const galleryPayload = fullData.gallery.map(function(g) {
      return {
        id: g.id,
        title: g.title || '',
        category: g.category || 'Event',
        date: g.date || '',
        caption: g.caption || '',
        badge: g.badge || '',
        image_url: g.imageUrl || g.image || ''
      };
    });
    try {
      UrlFetchApp.fetch(base + 'gallery?on_conflict=id', {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(galleryPayload),
        muteHttpExceptions: true
      });
    } catch (e) {
      Logger.log('Supabase gallery sync notice: ' + e.toString());
    }
  }

  // 8. Feedbacks update
  if (Array.isArray(fullData.feedbacks) && fullData.feedbacks.length) {
    const feedbacksPayload = fullData.feedbacks.map(function(f) {
      return {
        id: f.id,
        name: f.name || 'Anonymous',
        message: f.message || f.comment || '',
        rating: Number(f.rating || 5),
        created_at: f.createdAt || f.date || 'Today',
        batch: f.batch || '',
        role: f.role || 'Student',
        category: f.category || 'General',
        read: f.read === true
      };
    });
    try {
      UrlFetchApp.fetch(base + 'feedbacks?on_conflict=id', {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(feedbacksPayload),
        muteHttpExceptions: true
      });
    } catch (e) {
      Logger.log('Supabase feedbacks sync notice: ' + e.toString());
    }
  }

  return true;
}

/**
 * Load application data from Supabase db_json table
 */
function loadFromSupabase_(settings) {
  const cfg = settings || {};
  const supabaseUrl = cfg.supabaseUrl || 'https://srjqsofkjizwskqnzyfn.supabase.co';
  const supabaseKey = cfg.supabaseKey || 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS';
  if (!supabaseUrl || !supabaseKey) return null;

  const endpoint = supabaseUrl.replace(/\/+$/, '') + '/rest/v1/db_json?snapshot_key=eq.main&select=*';
  const options = {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': 'Bearer ' + supabaseKey
    },
    muteHttpExceptions: true
  };

  const res = UrlFetchApp.fetch(endpoint, options);
  if (res.getResponseCode() === 200) {
    const arr = JSON.parse(res.getContentText());
    if (Array.isArray(arr) && arr.length > 0 && arr[0].payload) {
      return arr[0].payload;
    }
  }
  return null;
}

/**
 * Developer action: merge demo records into the saved app data and rebuild
 * every configured spreadsheet tab from the seed-backed database.
 */
function apiCreateDummyDataAndSheets() {
  try {
    try {
      PropertiesService.getScriptProperties().deleteProperty('DB_tomb_rolls');
      PropertiesService.getScriptProperties().deleteProperty('DB_tomb_linkUrls');
    } catch (e) {}

    // 1. Get seed data baseline
    const seed = getDefaultSeedData();
    let data = dbLoadAll();
    if (!data) data = seed;
    if (!data.settings) data.settings = {};
    data.settings.dummyDataWiped = false;
    data.settings.showDummyData = true;

    // 2. Add missing seed demo records to all tables (preserving genuine client records)
    ['students', 'batches', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks', 'externalLinks'].forEach(function(tbl) {
      if (!Array.isArray(data[tbl])) data[tbl] = [];
      const existingIds = {};
      data[tbl].forEach(function(item) { if (item && item.id) existingIds[String(item.id)] = true; });
      (seed[tbl] || []).forEach(function(seedItem) {
        if (!existingIds[String(seedItem.id)]) {
          const copy = JSON.parse(JSON.stringify(seedItem));
          copy.isDummy = true;
          data[tbl].push(copy);
          existingIds[String(copy.id)] = true;
        }
      });
    });

    // 3. Save directly to Cloud Database
    dbSaveAll(data);

    // 4. Mirror directly to Google Sheets
    const ss = getDbSpreadsheet();
    if (!ss) return { success: false, error: 'The database is unavailable.' };
    syncReadableSheets(ss, data);

    // 5. Sync directly to Supabase tables and snapshot
    syncToSupabase_(data);

    const recordCounts = {};
    const shortTabs = [];
    getRequiredSheetTabNames_().forEach(function (name) {
      if (name === 'DB_JSON') return; // One hidden system snapshot, not a records table.
      const sheet = ss.getSheetByName(name);
      const count = Math.max(0, sheet ? sheet.getLastRow() - 1 : 0);
      recordCounts[name] = count;
      if (count < 10) shortTabs.push(name + ' (' + count + ')');
    });
    if (shortTabs.length) {
      return {
        success: false,
        error: 'Some tabs have fewer than 10 records: ' + shortTabs.join(', '),
        recordCounts: recordCounts
      };
    }
    return {
      success: true,
      sheetCount: getRequiredSheetTabNames_().length,
      recordCounts: recordCounts,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    Logger.log('apiCreateDummyDataAndSheets error: ' + err.toString());
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Developer action: Permanently wipes all dummy/demo seed records from
 * Cloud Database, connected Google Sheets, and Supabase before client handover.
 *
 * CRITICAL RULE:
 * 1. External_Links_Hub & Settings_Config are permanently preserved.
 * 2. All genuine client-created records (students, batches, materials, tests,
 *    faculty, gallery, feedbacks, attendance) are strictly kept.
 */
function apiPermanentClearDummyData() {
  try {
    let data = dbLoadAll();
    if (!data) data = apiGetInitialData();
    if (!data) return { success: false, error: 'Database is unavailable.' };

    if (!data.settings) data.settings = {};
    data.settings.showDummyData = false;
    data.settings.dummyDataWiped = true;

    // Track dummy student IDs to clean foreign keys
    const dummyStudentIds = {};
    (data.students || []).forEach(function(s) {
      if (s && isDummyRecord_(s)) dummyStudentIds[String(s.id)] = true;
    });

    const clearedCounts = {};

    // 1. Filter out dummy records from data tables
    // Note: externalLinks is intentionally excluded and NEVER filtered!
    ['students', 'batches', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'].forEach(function(tbl) {
      const initialCount = (data[tbl] || []).length;
      data[tbl] = (data[tbl] || []).filter(function(r) { return !isDummyRecord_(r); });
      clearedCounts[tbl] = initialCount - data[tbl].length;
    });

    // Clear notifications on dummy data wipe
    data.notifications = [];

    // 2. Remove dummy student references from surviving client batches
    (data.batches || []).forEach(function(b) {
      if (Array.isArray(b.studentIds)) {
        b.studentIds = b.studentIds.filter(function(id) { return !dummyStudentIds[String(id)]; });
      }
    });

    // 3. Remove dummy student marks from surviving client tests
    (data.offlineTests || []).forEach(function(t) {
      if (t && t.marks && typeof t.marks === 'object') {
        Object.keys(dummyStudentIds).forEach(function(sid) { delete t.marks[sid]; });
      }
    });

    // 4. Save to Cloud Database
    dbSaveAll(data);

    // 5. Sync to Google Sheets (overwrites with clean rows, wipes dummy rows)
    try {
      const ss = getDbSpreadsheet();
      if (ss) {
        let jsonSheet = ss.getSheetByName('DB_JSON');
        if (!jsonSheet) {
          jsonSheet = ss.insertSheet('DB_JSON');
          jsonSheet.hideSheet();
        }
        jsonSheet.getRange(1, 1).setValue(JSON.stringify(data));
        syncReadableSheets(ss, data);
      }
    } catch (sheetErr) {
      Logger.log('Spreadsheet wipe mirror notice: ' + sheetErr.toString());
    }

    // 6. Delete dummy records from Supabase tables
    try {
      clearDummyDataFromSupabase_(data);
    } catch (sbErr) {
      Logger.log('Supabase dummy clear notice: ' + sbErr.toString());
    }

    return {
      success: true,
      clearedCounts: clearedCounts,
      remainingCounts: {
        students: (data.students || []).length,
        batches: (data.batches || []).length,
        materials: (data.materials || []).length,
        offlineTests: (data.offlineTests || []).length,
        teachers: (data.teachers || []).length,
        gallery: (data.gallery || []).length,
        feedbacks: (data.feedbacks || []).length,
        externalLinks: (data.externalLinks || []).length
      },
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    Logger.log('apiPermanentClearDummyData error: ' + err.toString());
    return { success: false, error: err.message || String(err) };
  }
}

function clearDummyDataFromSupabase_(data) {
  const settings = (data && data.settings) || {};
  const supabaseUrl = settings.supabaseUrl || 'https://srjqsofkjizwskqnzyfn.supabase.co';
  const supabaseKey = settings.supabaseKey || 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS';
  if (!supabaseUrl || !supabaseKey) return;

  const base = supabaseUrl.replace(/\/+$/, '') + '/rest/v1/';
  const headers = {
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey,
    'Content-Type': 'application/json'
  };

  const dummyTableIds = {
    'batches': 'b1,b2,b3,b4,b5,b6,b7,b8,b9,b10',
    'students': 's1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11',
    'materials': 'm1,m2,m3,m4,m5,m6,m7,m8,m9,m10',
    'offline_tests': 't1,t2,t3,t4,t5,t6,t7,t8,t9,t10',
    'teachers': 'tr1,tr2,tr3,tr4,tr5,tr6,tr7,tr8,tr9,tr10',
    'gallery': 'g1,g2,g3,g4,g5,g6,g7,g8,g9,g10',
    'feedbacks': 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10'
  };

  // Delete dummy rows from Supabase (external_links and settings_config are NEVER deleted)
  Object.keys(dummyTableIds).forEach(function(tbl) {
    try {
      UrlFetchApp.fetch(base + tbl + '?id=in.(' + dummyTableIds[tbl] + ')', {
        method: 'delete',
        headers: headers,
        muteHttpExceptions: true
      });
    } catch (e) {
      Logger.log('Supabase delete ' + tbl + ' error: ' + e.toString());
    }
  });

  // Delete all notifications from Supabase
  try {
    UrlFetchApp.fetch(base + 'notifications?id=neq.placeholder', {
      method: 'delete',
      headers: headers,
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log('Supabase delete notifications error: ' + e.toString());
  }

  // Update settings_config in Supabase
  try {
    UrlFetchApp.fetch(base + 'settings_config?setting_parameter=eq.Show Dummy / Demo Data', {
      method: 'patch',
      headers: headers,
      payload: JSON.stringify({ configured_value: 'Off' }),
      muteHttpExceptions: true
    });
  } catch (e) {}

  // Update snapshot db_json
  try {
    UrlFetchApp.fetch(base + 'db_json?snapshot_key=eq.main', {
      method: 'patch',
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      payload: JSON.stringify({ payload: data, updated_at: new Date().toISOString() }),
      muteHttpExceptions: true
    });
  } catch (e) {}
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
 * Dedicated API to update a student's password and status
 */
function apiUpdateStudentAuth(studentId, newPassword, newStatus) {
  const data = apiGetInitialData();
  const student = (data.students || []).find(function (s) { return s.id === studentId; });
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
  const teacher = (data.teachers || []).find(function (t) { return t.id === teacherId; });
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
  const student = (data.students || []).find(function (s) { return s.id === studentId; });
  if (!student) return { success: false, message: 'Student not found' };
  if (profileData) {
    if (profileData.name !== undefined) student.name = String(profileData.name).trim();
    if (profileData.roll !== undefined) student.roll = String(profileData.roll).trim();
    if (profileData.phone !== undefined) student.phone = String(profileData.phone).trim();
    if (profileData.parentName !== undefined) student.parentName = String(profileData.parentName).trim();
    if (profileData.password !== undefined) student.password = String(profileData.password).trim();
    if (profileData.totalFee !== undefined) student.totalFee = Number(profileData.totalFee) || 0;
    if (profileData.paidFee !== undefined) student.paidFee = Number(profileData.paidFee) || 0;
    student.totalFee = Math.max(Number(student.totalFee || 0), Number(student.paidFee || 0));
    if (profileData.dueDate !== undefined) student.dueDate = String(profileData.dueDate).trim();
    if (profileData.admissionDate !== undefined) student.admissionDate = String(profileData.admissionDate).trim();
    if (profileData.monthlyFee !== undefined) student.monthlyFee = Number(profileData.monthlyFee) || 0;
    if (profileData.status !== undefined) student.status = String(profileData.status).trim();

    if (profileData.photo !== undefined) {
      student.photo = profileData.photo;
      if (String(student.photo || '').indexOf('data:image/') === 0 || !student.photo) {
        const photoResult = saveProfilePhotoToDrive_(student, DRIVE_FOLDERS.STUDENT_PROFILES, (student.roll || student.id) + '_' + student.name);
        if (!photoResult.success) return photoResult;
      }
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
  const result = apiSyncAllData(data);
  if (result.success) { result.photo = student.photo || ''; result.photoFileId = student.photoFileId || ''; }
  return result;
}

/**
 * Dedicated API to update a student's photo
 */
function apiUpdateStudentPhoto(studentId, photoDataUrl) {
  const data = apiGetInitialData();
  const student = (data.students || []).find(function (s) { return s.id === studentId; });
  if (!student) return { success: false, message: 'Student not found' };
  student.photo = String(photoDataUrl || '');
  const saved = saveProfilePhotoToDrive_(student, DRIVE_FOLDERS.STUDENT_PROFILES, (student.roll || student.id) + '_' + student.name);
  if (!saved.success) return saved;
  const result = apiSyncAllData(data);
  if (result.success) { result.photo = student.photo; result.photoFileId = student.photoFileId || ''; }
  return result;
}

function apiRecordStudentPayment(studentId, amount, mode, reference) {
  const paymentAmount = Number(amount);
  if (!isFinite(paymentAmount) || paymentAmount <= 0) return { success: false, error: 'Enter a valid payment amount.' };
  const data = dbLoadAll() || apiGetInitialData();
  const student = (data.students || []).find(function (item) { return String(item.id) === String(studentId); });
  if (!student || student.status === 'Inactive' || student.status === 'Blocked') return { success: false, error: 'Student is not active.' };
  var oldPaid = Number(student.paidFee || 0);
  student.paidFee = oldPaid + paymentAmount;
  student.totalFee = Math.max(Number(student.totalFee || 0), student.paidFee);
  if (!Array.isArray(student.paymentHistory)) student.paymentHistory = [];
  student.paymentHistory.unshift({
    id: 'pay_' + Date.now(), amount: paymentAmount, mode: String(mode || 'UPI'),
    reference: String(reference || 'N/A').slice(0, 160), paidAt: new Date().toISOString()
  });
  var monthlyFee = Number(student.monthlyFee || 0);
  if (monthlyFee > 0 && /^\d{4}-\d{2}-\d{2}$/.test(String(student.dueDate || ''))) {
    var unappliedCyclePayment = Number(student.monthlyPaidThisCycle || 0) + paymentAmount;
    var monthsToAdvance = Math.floor(unappliedCyclePayment / monthlyFee);
    for (var m = 0; m < monthsToAdvance; m++) {
      student.dueDate = nextMonthlyDueDateFromAnchor_(student.admissionDate, student.dueDate);
    }
    student.monthlyPaidThisCycle = unappliedCyclePayment % monthlyFee;
  }
  dbSaveAll(data);
  try {
    const ss = getDbSpreadsheet();
    const sheet = ss && ss.getSheetByName('Students_Master');
    if (sheet && sheet.getLastRow() > 1) {
      const rolls = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
      const rowIndex = rolls.findIndex(function (row) { return String(row[0]).trim() === String(student.roll || '').trim(); });
      if (rowIndex >= 0) {
        const row = rowIndex + 2;
        const remaining = Math.max(0, Number(student.totalFee || 0) - student.paidFee);
        sheet.getRange(row, 8, 1, 3).setValues([[student.paidFee, remaining, remaining === 0 ? 'Fully Paid' : (student.dueDate || 'Pending')]]);
      }
    }
  } catch (err) {
    Logger.log('Payment sheet mirror notice: ' + err.toString());
  }
  return { success: true, paidFee: student.paidFee, dueDate: student.dueDate, payment: student.paymentHistory[0] };
}

/**
 * Dedicated API for Admin to edit faculty profile records
 */
function apiUpdateTeacherProfile(teacherId, profileData) {
  const data = dbLoadAll() || apiGetInitialData();
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
      teacher.photo = String(profileData.photo || '');
      if (String(teacher.photo).indexOf('data:image/') === 0 || !teacher.photo) {
        const photoResult = saveProfilePhotoToDrive_(teacher, DRIVE_FOLDERS.TEACHER_PROFILES, (teacher.id || 'teacher') + '_' + teacher.name);
        if (!photoResult.success) return photoResult;
      }
    }
  }
  const result = apiSyncAllData(data);
  if (result.success) { result.photo = teacher.photo || ''; result.photoFileId = teacher.photoFileId || ''; }
  return result;
}

/** Save a teacher's own profile photo without exposing the admin edit fields. */
function apiUpdateTeacherPhoto(teacherId, photoDataUrl) {
  const photo = String(photoDataUrl || '');
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(photo)) {
    return { success: false, error: 'Choose a valid JPG, PNG, or WebP photo.' };
  }
  if (photo.length > 700000) return { success: false, error: 'The resized photo is too large. Choose a smaller image.' };
  const data = dbLoadAll() || apiGetInitialData();
  const teacher = (data.teachers || []).find(function (item) { return String(item.id) === String(teacherId); });
  if (!teacher || teacher.status === 'Inactive' || teacher.status === 'Blocked') {
    return { success: false, error: 'Active faculty profile could not be found.' };
  }
  teacher.photo = photo;
  const saved = saveProfilePhotoToDrive_(teacher, DRIVE_FOLDERS.TEACHER_PROFILES, (teacher.id || 'teacher') + '_' + teacher.name);
  if (!saved.success) return saved;
  const result = apiSyncAllData(data);
  if (result.success) { result.photo = teacher.photo; result.photoFileId = teacher.photoFileId || ''; }
  return result;
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

/**
 * Backend Gemini AI Integration for Divine Classes
 * Auto-answers academic doubts, institute queries, and extracts student data
 */
function apiAskGeminiAi(userPrompt, conversationHistory, contextData) {
  try {
    let apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) {
      const ss = getDbSpreadsheet();
      if (ss) {
        const setSheet = ss.getSheetByName('Settings_Config');
        if (setSheet) {
          const values = setSheet.getDataRange().getValues();
          for (let i = 1; i < values.length; i++) {
            const keyCol = String(values[i][0] || '').toLowerCase().trim();
            if (keyCol === 'gemini_api_key' || keyCol === 'geminiapikey') {
              apiKey = String(values[i][1] || '').trim();
              break;
            }
          }
        }
      }
    }
    if (!apiKey && contextData && contextData.apiKey) {
      apiKey = String(contextData.apiKey).trim();
    }

    if (!apiKey) {
      return {
        success: false,
        error: 'NO_API_KEY',
        message: 'No Gemini API Key configured yet. Please provide your Gemini Developer Key to auto-connect.'
      };
    }

    const model = (contextData && contextData.model) || 'gemini-2.5-flash';
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);

    const systemPrompt = "You are the advanced official AI Academic Tutor and Institute Assistant for Divine Classes.\n" +
      "Institute Details:\n" +
      "- Center: Divine Classes\n" +
      "- Location: 235 Paschimpuri Pocket 2, Club Rd, New Delhi 110063\n" +
      "- Director & Head Faculty: Er. Rajesh Chahar (Senior Physics & Mathematics Faculty)\n" +
      "- Lead Software Architect: Dev. Anil Kumar Chahar (Phone: 8126390611)\n" +
      "- Standard Tuition Fee: ₹1,000 / month per course\n" +
      (contextData && contextData.studentSummary ? ("- Current User Context: " + contextData.studentSummary + "\n") : "") +
      "Tone & Formatting:\n" +
      "- Format with bold headings, clean bullet points, and step-by-step logic.\n" +
      "- For physics/math questions, give clear formulas and complete solutions.\n" +
      "- Be encouraging, accurate, and concise.";

    const contents = [];
    if (Array.isArray(conversationHistory)) {
      conversationHistory.slice(-6).forEach(function(msg) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();
    const json = JSON.parse(res.getContentText());

    if (code >= 200 && code < 300 && json.candidates && json.candidates.length > 0) {
      const reply = json.candidates[0].content.parts.map(function(p) { return p.text; }).join('\n');
      return { success: true, reply: reply, model: model };
    } else {
      const errMsg = (json.error && json.error.message) ? json.error.message : ('HTTP ' + code);
      return { success: false, error: errMsg };
    }
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}
