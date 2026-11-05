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
        if (!appData) appData = getEmptyAppData_();
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
      logout: { template: 'logout', title: 'Signed Out - Divine Classes Portal' }
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
  let uploadedDriveFile = null;
  let materialSaved = false;
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
    uploadedDriveFile = driveFile;
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
    const fileSizeMB = (decodedBytes.length / (1024 * 1024)).toFixed(1) + ' MB';

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

    // Only the affected collections are needed for a material upload.
    let materials = dbGetTable('materials');
    let notifications = dbGetTable('notifications');
    let batches = dbGetTable('batches');
    if (materials === null && notifications === null && batches === null) {
      const initialData = apiGetInitialData();
      materials = initialData.materials || [];
      notifications = initialData.notifications || [];
      batches = initialData.batches || [];
    }
    if (!Array.isArray(materials)) materials = [];
    if (!Array.isArray(notifications)) notifications = [];
    if (!Array.isArray(batches)) batches = [];
    materials.unshift(newMaterial);

    // In-app notification: alert every student/teacher that a new material is live
    const batchObj = batches.find(b => b.id === newMaterial.batchId);
    const batchLabel = batchObj ? batchObj.name : 'General';
    notifications.unshift({
      id: 'notif_mat_' + newMaterial.id,
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
    notifications = notifications.slice(0, 100);
    if (!dbSetTable('materials', materials)) {
      throw new Error('The material record could not be saved to the cloud database.');
    }
    materialSaved = true;
    if (!dbSetTable('notifications', notifications)) {
      Logger.log('Material notification could not be saved to the cloud database.');
    }
    try {
      prependMaterialToRepository_(newMaterial, batchLabel);
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
    if (uploadedDriveFile && !materialSaved) {
      try { uploadedDriveFile.setTrashed(true); } catch (cleanupErr) {
        Logger.log('Uncommitted material Drive file cleanup failed: ' + cleanupErr.toString());
      }
    }
    Logger.log('apiUploadMaterialToDrive error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

function prependMaterialToRepository_(material, batchName) {
  const ss = getDbSpreadsheet();
  if (!ss) return;
  let sheet = ss.getSheetByName('Materials_Repository');
  if (!sheet) sheet = ss.insertSheet('Materials_Repository');

  const headers = ['Material ID', 'Title', 'Batch Name', 'Category', 'Upload Date', 'Uploaded By', 'File Size', 'Downloads', 'Description', 'Download URL', 'Google Drive Link'];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
  }
  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, headers.length).setValues([[
    material.id || '', material.title || '', batchName || material.batchId || 'All Batches',
    material.category || 'Assignment PDF', material.uploadDate || '', material.uploadedBy || '',
    material.fileSize || '', material.downloads || 0, material.description || '',
    material.downloadUrl || material.driveUrl || '', material.driveUrl || ''
  ]]);
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
        if (appData.settings && (appData.settings.showDummyData === true || appData.settings.showDummyData === 'On') && !appData.settings.dummyDataWiped && !appData.settings.studentSeedDataDisabled && isDummyRecord_(s)) {
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
          createdAt: new Date().toISOString(),
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
        } else if (isDummyRecord_(s) && appData.settings && (appData.settings.showDummyData === true || appData.settings.showDummyData === 'On') && !appData.settings.dummyDataWiped && !appData.settings.studentSeedDataDisabled) {
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

    if (appData.settings && (appData.settings.studentSeedDataDisabled === true || appData.settings.studentSeedDataDisabled === 'true')) {
      const clearedAt = Date.parse(appData.settings.studentTableClearedAt || '');
      const removedIds = {};
      appData.students = (appData.students || []).filter(function (student) {
        if (!student || isDummyRecord_(student)) {
          if (student && student.id) removedIds[String(student.id)] = true;
          if (student && student.roll) removedIds[String(student.roll)] = true;
          return false;
        }
        if (isNaN(clearedAt)) return true;
        const createdAt = Date.parse(student.createdAt || '');
        if (!isNaN(createdAt) && createdAt >= clearedAt) return true;
        if (student.id) removedIds[String(student.id)] = true;
        if (student.roll) removedIds[String(student.roll)] = true;
        return false;
      });
      if (Object.keys(removedIds).length) {
        (appData.batches || []).forEach(function (batch) {
          if (Array.isArray(batch.studentIds)) {
            batch.studentIds = batch.studentIds.filter(function (id) { return !removedIds[String(id)]; });
          }
        });
        (appData.offlineTests || []).forEach(function (test) {
          if (!test || !test.marks || typeof test.marks !== 'object') return;
          Object.keys(removedIds).forEach(function (id) { delete test.marks[id]; });
        });
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

    let rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getDisplayValues();
    const duplicateSettingRows = [
      { canonical: 'Lead Developer Email', aliases: ['LEAD_DEV_EMAIL', 'Lead Dev Email'] },
      { canonical: 'Lead Developer Password', aliases: ['LEAD_DEV_PASSWORD', 'Lead Dev Password'] }
    ];
    const rowsToDelete = [];
    duplicateSettingRows.forEach(function (setting) {
      const matchingIndexes = [];
      let canonicalIndex = -1;
      rows.forEach(function (row, index) {
        const parameter = String(row[0] || '').trim();
        if (parameter === setting.canonical) {
          if (canonicalIndex < 0) canonicalIndex = index;
          matchingIndexes.push(index);
        } else if (setting.aliases.indexOf(parameter) >= 0) {
          matchingIndexes.push(index);
        }
      });
      if (!matchingIndexes.length) return;

      const keepIndex = canonicalIndex >= 0 ? canonicalIndex : matchingIndexes[0];
      if (canonicalIndex < 0) {
        sheet.getRange(keepIndex + 2, 1).setValue(setting.canonical);
      }
      matchingIndexes.forEach(function (index) {
        if (index !== keepIndex) rowsToDelete.push(index + 2);
      });
    });
    rowsToDelete.sort(function (a, b) { return b - a; }).forEach(function (rowNumber) {
      sheet.deleteRow(rowNumber);
    });

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
      'Chatbot Enabled': 'chatbotEnabled',
      'Admin Feedback Delete': 'allowAdminFeedbackDelete',
      'Study Link Delete': 'allowAdminLinkDelete',
      'Show Dummy / Demo Data': 'showDummyData',
      'Dummy Data Wiped': 'dummyDataWiped',
      'Student Seed Data Disabled': 'studentSeedDataDisabled',
      'Student Table Cleared At': 'studentTableClearedAt',
      'Supabase Enabled': 'supabaseEnabled',
      'Supabase URL': 'supabaseUrl',
      'Supabase Key': 'supabaseKey'
    };
    const booleanKeys = {
      showRequirementLabels: true,
      chatbotEnabled: true,
      allowAdminFeedbackDelete: true,
      allowAdminLinkDelete: true,
      showDummyData: true,
      dummyDataWiped: true,
      studentSeedDataDisabled: true,
      supabaseEnabled: true
    };
    rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues();
    rows.forEach(function (row) {
      const key = settingKeys[String(row[0] || '').trim()];
      if (!key) return;
      const value = String(row[1] || '').trim();
      appData.settings[key] = booleanKeys[key] ? /^(on|true|yes|1)$/i.test(value) : value;
    });
  } catch (e) {
    Logger.log('Settings_Config read notice: ' + e.toString());
  }
  return appData;
}

function removeDuplicateDeveloperSettingsFromSupabase_(settings) {
  const config = settings || {};
  const supabaseUrl = config.supabaseUrl || 'https://srjqsofkjizwskqnzyfn.supabase.co';
  const supabaseKey = config.supabaseKey || 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS';
  if (!supabaseUrl || !supabaseKey) return;

  const base = supabaseUrl.replace(/\/+$/, '') + (/\/rest\/v1$/i.test(supabaseUrl) ? '' : '/rest/v1');
  try {
    const response = UrlFetchApp.fetch(
      base + '/settings_config?setting_parameter=in.(LEAD_DEV_EMAIL,LEAD_DEV_PASSWORD)',
      {
        method: 'delete',
        headers: {
          apikey: supabaseKey,
          Authorization: 'Bearer ' + supabaseKey,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        muteHttpExceptions: true
      }
    );
    if (response.getResponseCode() >= 300) {
      Logger.log('Supabase duplicate developer setting cleanup failed: ' +
        response.getContentText());
    }
  } catch (e) {
    Logger.log('Supabase duplicate developer setting cleanup error: ' + e.toString());
  }
}

function migrateAdminEmailSetting_(appData, spreadsheet) {
  const propertyKey = 'ADMIN_EMAIL_ID_MIGRATED_20261104';
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty(propertyKey) === 'done') return appData;

  const adminEmail = 'divineclasses1010@gmail.com';
  if (!appData.settings || typeof appData.settings !== 'object') appData.settings = {};
  appData.settings.adminEmail = adminEmail;

  try {
    const ss = spreadsheet || getDbSpreadsheet();
    const sheet = ss && ss.getSheetByName('Settings_Config');
    if (sheet) {
      const lastRow = sheet.getLastRow();
      const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues() : [];
      let rowNumber = rows.findIndex(function (row) {
        return String(row[0] || '').trim() === 'Admin Email ID';
      });
      if (rowNumber >= 0) {
        sheet.getRange(rowNumber + 2, 2).setValue(adminEmail);
      } else {
        sheet.appendRow(['Admin Email ID', adminEmail, 'Official Admin Contact / Login Email']);
      }
    } else {
      Logger.log('Admin Email ID migration notice: Settings_Config sheet was not available.');
    }

    const settings = appData.settings;
    const supabaseUrl = settings.supabaseUrl || 'https://srjqsofkjizwskqnzyfn.supabase.co';
    const supabaseKey = settings.supabaseKey || 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS';
    const base = supabaseUrl.replace(/\/+$/, '') + (/\/rest\/v1$/i.test(supabaseUrl) ? '' : '/rest/v1');
    const response = UrlFetchApp.fetch(base + '/settings_config?on_conflict=setting_parameter', {
      method: 'post',
      headers: {
        apikey: supabaseKey,
        Authorization: 'Bearer ' + supabaseKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      payload: JSON.stringify([{
        setting_parameter: 'Admin Email ID',
        configured_value: adminEmail,
        description: 'Official Admin Contact / Login Email'
      }]),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() >= 300) {
      throw new Error('Supabase update failed (' + response.getResponseCode() + '): ' +
        response.getContentText());
    }

    properties.setProperty(propertyKey, 'done');
  } catch (e) {
    Logger.log('Admin Email ID migration error: ' + e.toString());
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

    // 2. Fallback: If the database is not initialized, check only the saved snapshot.
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

    if (!appData) appData = getEmptyAppData_();

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
    removeDuplicateDeveloperSettingsFromSupabase_(appData.settings);
    appData = migrateAdminEmailSetting_(appData, sourceSpreadsheet);
    // Migrate only the old sample social URLs; custom Settings_Config values stay intact.
    appData = migrateLegacySeedSettings_(appData);
    // Safety: curated study portals are permanent — re-seed if list ended up empty
    if (!appData.externalLinks || appData.externalLinks.length === 0) {
      appData.externalLinks = getDefaultSeedData().externalLinks.filter(function (link) {
        return link && !isDummyRecord_(link);
      });
    }

    // 2d. Strip manually-deleted (tombstoned) records — deletions are forever
    appData = applyTombstones_(appData);
    appData = applyDummySeedLocks_(appData);

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

    // The persistent lock filters demo/test records from both returned and saved state.
    return stripDummyData_(appData);
  } catch (err) {
    Logger.log('apiGetInitialData error: ' + err.toString());
    const emptyData = getEmptyAppData_();
    if (emptyData.settings) delete emptyData.settings.devPassword;
    try { applyDummySeedLocks_(emptyData); } catch (lockErr) {
      Logger.log('Empty database seed lock notice: ' + lockErr.toString());
    }
    return emptyData;
  }
}

/**
 * Verify Lead Dev credentials without returning either credential to the client.
 * Configure LEAD_DEV_EMAIL and LEAD_DEV_PASSWORD in Apps Script Project Settings > Script Properties.
 */
function apiVerifyDeveloperLogin(email, password) {
  try {
    return verifyDeveloperCredentials_(email, password);
  } catch (err) {
    Logger.log('Developer login verification failed: ' + err.toString());
    return { success: false };
  }
}

function verifyDeveloperCredentials_(email, password) {
  const props = PropertiesService.getScriptProperties();
  let savedEmail = String(props.getProperty('LEAD_DEV_EMAIL') || '').trim().toLowerCase();
  if (!savedEmail) {
    let settingsEmail = '';
    try {
      const appData = dbLoadAll() || apiGetInitialData();
      mergeSettingsFromSheet_(appData, getDbSpreadsheet());
      settingsEmail = appData.settings && appData.settings.leadDevEmail || '';
    } catch (settingsErr) {
      Logger.log('Lead Dev email settings lookup notice: ' + settingsErr.toString());
    }
    savedEmail = String(settingsEmail).trim().toLowerCase();
  }
  const savedPassword = String(props.getProperty('LEAD_DEV_PASSWORD') || '');
  if (!savedEmail || !savedPassword) return { success: false, notConfigured: true };

  const submittedEmail = String(email || '').trim().toLowerCase();
  const submittedPassword = String(password || '');
  if (!constantTimeEquals_(submittedEmail, savedEmail) || !constantTimeEquals_(submittedPassword, savedPassword)) {
    return { success: false };
  }
  return { success: true };
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
  // Update only an existing saved record; this path must not initialize demo data.
  let data = dbLoadAll();
  if (!data) data = getEmptyAppData_();
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
    // Apply the server-side seed lock before persisting any client state.
    restoreDummyData_(fullData);

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
    let supabaseSync = { success: false, error: 'Supabase sync did not run.' };
    try {
      supabaseSync = syncToSupabase_(fullData);
    } catch (sbErr) {
      Logger.log('Supabase sync notice: ' + sbErr.toString());
      supabaseSync = { success: false, error: sbErr.message || sbErr.toString() };
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
      supabaseSync: supabaseSync,
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
  if (!supabaseUrl || !supabaseKey) {
    return { success: false, error: 'Supabase URL or API key is missing.' };
  }

  const normalizedUrl = supabaseUrl.replace(/\/+$/, '');
  const base = normalizedUrl + (/\/rest\/v1$/i.test(normalizedUrl) ? '/' : '/rest/v1/');
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
      const duplicateRowsResponse = UrlFetchApp.fetch(
        base + 'settings_config?setting_parameter=in.(LEAD_DEV_EMAIL,LEAD_DEV_PASSWORD)',
        {
          method: 'delete',
          headers: headers,
          muteHttpExceptions: true
        }
      );
      if (duplicateRowsResponse.getResponseCode() >= 300) {
        Logger.log('Supabase duplicate developer setting cleanup failed: ' +
          duplicateRowsResponse.getContentText());
      }
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
  let studentTable = '';
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
    let studentResponse;
    try {
      studentResponse = UrlFetchApp.fetch(base + 'students?on_conflict=id', {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(studentsPayload),
        muteHttpExceptions: true
      });
      if (studentResponse.getResponseCode() < 300) {
        studentTable = 'students';
      }
    } catch (e) {
      Logger.log('Supabase students sync notice: ' + e.toString());
    }
    if (!studentTable) {
      const primaryError = studentResponse
        ? 'HTTP ' + studentResponse.getResponseCode() + ': ' + studentResponse.getContentText()
        : 'The students table request could not be completed.';
      try {
        const fallbackResponse = UrlFetchApp.fetch(base + 'students_master?on_conflict=roll_no', {
          method: 'post',
          headers: headers,
          payload: JSON.stringify(fullData.students.map(function(s) {
            return {
              roll_no: s.roll || s.id,
              student_name: s.name || '',
              login_password: s.password || 'password123',
              access_status: s.status || 'Active',
              parent_name: s.parentName || '',
              contact_phone: s.phone || '',
              total_fee_inr: Number(s.totalFee || 0),
              paid_fee_inr: Number(s.paidFee || 0),
              pending_dues_inr: Number(s.totalFee || 0) - Number(s.paidFee || 0),
              monthly_fee_inr: Number(s.monthlyFee || 0),
              fee_due_date: s.dueDate || 'Fully Paid',
              last_reminder_sent: s.lastReminder || '-',
              admission_date: s.admissionDate || '',
              batch_id: s.batchId || ''
            };
          })),
          muteHttpExceptions: true
        });
        if (fallbackResponse.getResponseCode() >= 300) {
          throw new Error('HTTP ' + fallbackResponse.getResponseCode() + ': ' + fallbackResponse.getContentText());
        }
        studentTable = 'students_master';
      } catch (fallbackError) {
        throw new Error('Student records could not be saved to Supabase. ' + primaryError + ' Fallback failed: ' + fallbackError.toString());
      }
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

  return { success: true, studentTable: studentTable || '' };
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
function syncDummySeedRecordsToSupabase_(data, excessDummyIds) {
  const settings = (data && data.settings) || {};
  const supabaseUrl = settings.supabaseUrl || 'https://srjqsofkjizwskqnzyfn.supabase.co';
  const supabaseKey = settings.supabaseKey || 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS';
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or API key is missing.');
  }

  const normalizedUrl = supabaseUrl.replace(/\/+$/, '');
  const base = normalizedUrl + (/\/rest\/v1$/i.test(normalizedUrl) ? '' : '/rest/v1');
  const headers = {
    apikey: supabaseKey,
    Authorization: 'Bearer ' + supabaseKey,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal'
  };
  const dummyRecords = function (key) {
    return (data[key] || []).filter(function (record) {
      return !!(record && record.isDummy === true);
    });
  };
  const tableConfigs = [
    {
      stateKey: 'batches',
      variants: [
        { table: 'batches', conflict: 'id', map: function (r) {
          return { id: r.id, name: r.name, subject: r.subject, schedule: r.schedule, room: r.room, teacher: r.teacher, student_ids: r.studentIds || [] };
        } },
        { table: 'batches_roster', conflict: 'batch_id', map: function (r) {
          return { batch_id: r.id, batch_name: r.name, subjects: r.subject, schedule: r.schedule, classroom_hall: r.room, lead_faculty: r.teacher, student_ids: r.studentIds || [], student_count: (r.studentIds || []).length };
        } }
      ]
    },
    {
      stateKey: 'students',
      variants: [
        { table: 'students', conflict: 'id', map: function (r) {
          return { id: r.id || r.roll, roll: r.roll || r.id, name: r.name, phone: r.phone || '', parent_name: r.parentName || '', total_fee: Number(r.totalFee || 0), paid_fee: Number(r.paidFee || 0), monthly_fee: Number(r.monthlyFee || 0), due_date: r.dueDate || 'Fully Paid', last_reminder: r.lastReminder || '-', password: r.password || '', status: r.status || 'Active', admission_date: r.admissionDate || '', batch_id: r.batchId || '' };
        } },
        { table: 'students_master', conflict: 'roll_no', map: function (r) {
          return { roll_no: r.roll || r.id, student_name: r.name, login_password: r.password || '', access_status: r.status || 'Active', parent_name: r.parentName || '', contact_phone: r.phone || '', total_fee_inr: Number(r.totalFee || 0), paid_fee_inr: Number(r.paidFee || 0), monthly_fee_inr: Number(r.monthlyFee || 0), fee_due_date: r.dueDate || 'Fully Paid', last_reminder_sent: r.lastReminder || '-', admission_date: r.admissionDate || '', batch_id: r.batchId || '' };
        } }
      ]
    },
    {
      stateKey: 'materials',
      variants: [
        { table: 'materials', conflict: 'id', map: function (r) {
          return { id: r.id, batch_id: r.batchId || '', batch_name: r.batchName || '', title: r.title || '', category: r.category || 'Study Material', upload_date: r.uploadDate || r.date || '', uploaded_by: r.uploadedBy || 'Faculty', file_size: r.fileSize || r.size || '', downloads: Number(r.downloads || 0), description: r.description || '', download_url: r.downloadUrl || r.url || '', drive_url: r.driveUrl || r.url || '' };
        } },
        { table: 'materials_repository', conflict: 'material_id', map: function (r) {
          return { material_id: r.id, batch_id: r.batchId || '', batch_name: r.batchName || '', title: r.title || '', category: r.category || 'Study Material', upload_date: r.uploadDate || r.date || '', uploaded_by: r.uploadedBy || 'Faculty', file_size: r.fileSize || r.size || '', downloads: Number(r.downloads || 0), description: r.description || '', download_url: r.downloadUrl || r.url || '', google_drive_link: r.driveUrl || r.url || '' };
        } }
      ]
    },
    {
      stateKey: 'offlineTests',
      variants: [
        { table: 'offline_tests', conflict: 'id', map: function (r) {
          return { id: r.id, batch_id: r.batchId || '', title: r.title || '', subject: r.subject || '', test_date: r.date || '', max_marks: Number(r.maxMarks || 100), marks: r.marks || {}, is_dummy: true };
        } },
        { table: 'offline_test_marks', conflict: 'test_id', map: function (r) {
          return { test_id: r.id, batch_id: r.batchId || '', test_title: r.title || '', subject: r.subject || '', test_date: r.date || '', max_marks: Number(r.maxMarks || 100), marks: r.marks || {}, is_dummy: true };
        } }
      ]
    },
    {
      stateKey: 'teachers',
      variants: [
        { table: 'teachers', conflict: 'id', map: function (r) {
          return { id: r.id, name: r.name || '', subject: r.subject || '', qualification: r.qualification || '', experience: r.experience || '', email: r.email || '', phone: r.phone || '', specialization: r.specialization || '', bio: r.bio || '', avatar_color: r.avatarColor || '', initials: r.initials || '', password: r.password || '', status: r.status || 'Active' };
        } },
        { table: 'teachers_roster', conflict: 'teacher_id', map: function (r) {
          return { teacher_id: r.id, teacher_name: r.name || '', primary_subject: r.subject || '', academic_qualifications: r.qualification || '', teaching_experience: r.experience || '', login_email: r.email || '', contact_phone: r.phone || '', specialization_focus: r.specialization || '', faculty_biography: r.bio || '', avatar_color: r.avatarColor || '', initials: r.initials || '', login_password: r.password || '', access_status: r.status || 'Active' };
        } }
      ]
    },
    {
      stateKey: 'gallery',
      variants: [
        { table: 'gallery', conflict: 'id', map: function (r) {
          return { id: r.id, title: r.title || '', category: r.category || 'Event', date: r.date || '', caption: r.caption || '', badge: r.badge || '', image_url: r.imageUrl || r.image || '' };
        } },
        { table: 'gallery_banners', conflict: 'banner_id', map: function (r) {
          return { banner_id: r.id, title: r.title || '', category: r.category || 'Event', banner_date: r.date || '', caption: r.caption || '', badge_air_rank: r.badge || '', image_url: r.imageUrl || r.image || '' };
        } }
      ]
    },
    {
      stateKey: 'feedbacks',
      variants: [
        { table: 'feedbacks', conflict: 'id', map: function (r) {
          return { id: r.id, name: r.authorName || r.name || '', message: r.comment || r.message || '', rating: Number(r.rating || 5), created_at: r.date || '', batch: r.batchName || r.batch || '', role: r.role || 'Student', category: r.category || 'General', read: r.read === true };
        } },
        { table: 'feedback_responses', conflict: 'row_id', map: function (r) {
          return { row_id: r.id, author_name: r.authorName || r.name || '', feedback_comment: r.comment || r.message || '', rating_stars: Number(r.rating || 5), feedback_date: r.date || '', batch_name: r.batchName || r.batch || '', role: r.role || 'Student', topic: r.category || 'General', read: r.read === true };
        } }
      ]
    },
    {
      stateKey: 'notifications',
      variants: [
        { table: 'notifications', conflict: 'id', map: function (r) {
          return {
            id: r.id,
            title: r.title || 'Demo notification',
            message: r.message || '',
            time: r.time || '',
            timestamp: Number(r.timestamp || Date.now()),
            read: r.read === true,
            admin_seen: r.adminSeen === true,
            type: r.type || 'info',
            icon: r.icon || '',
            icon_color: r.iconColor || '',
            bg_color: r.bgColor || '',
            action_tab: r.actionTab || '',
            target_role: r.targetRole || 'all',
            material_id: r.materialId || '',
            batch_name: r.batchName || ''
          };
        } }
      ]
    }
  ];

  const failures = [];
  excessDummyIds = excessDummyIds || {};
  const extraDummyIds = {
    batches: ['b7', 'b8', 'b9', 'b10'],
    students: ['s3', 's4', 's7', 's10', 's11'],
    materials: ['m7', 'm8', 'm9', 'm10'],
    offlineTests: ['t7', 't8', 't9', 't10'],
    teachers: ['tr7', 'tr8', 'tr9', 'tr10'],
    gallery: ['g7', 'g8', 'g9', 'g10'],
    feedbacks: ['f7', 'f8', 'f9', 'f10']
  };
  const obsoleteTableConfigs = [
    { stateKey: 'batches', tables: [{ name: 'batches', columns: ['id'] }, { name: 'batches_roster', columns: ['batch_id'] }] },
    { stateKey: 'students', tables: [{ name: 'students', columns: ['id'] }, { name: 'students_master', columns: ['roll_no'] }] },
    { stateKey: 'materials', tables: [{ name: 'materials', columns: ['id'] }, { name: 'materials_repository', columns: ['material_id'] }] },
    { stateKey: 'offlineTests', tables: [{ name: 'offline_tests', columns: ['id'] }, { name: 'offline_test_marks', columns: ['test_id'] }] },
    { stateKey: 'teachers', tables: [{ name: 'teachers', columns: ['id'] }, { name: 'teachers_roster', columns: ['teacher_id'] }] },
    { stateKey: 'gallery', tables: [{ name: 'gallery', columns: ['id'] }, { name: 'gallery_banners', columns: ['banner_id'] }] },
    { stateKey: 'feedbacks', tables: [{ name: 'feedbacks', columns: ['id'] }, { name: 'feedback_responses', columns: ['row_id'] }] },
    { stateKey: 'notifications', tables: [{ name: 'notifications', columns: ['id'] }] }
  ];
  obsoleteTableConfigs.forEach(function (config) {
    const ids = (extraDummyIds[config.stateKey] || []).concat(excessDummyIds[config.stateKey] || [])
      .filter(function (id, index, list) { return id && list.indexOf(id) === index; });
    if (!ids.length) return;
    config.tables.forEach(function (table) {
      table.columns.forEach(function (column) {
        const filter = ids.map(function (id) { return encodeURIComponent(id); }).join(',');
        const response = UrlFetchApp.fetch(base + '/' + table.name + '?' + column + '=in.(' + filter + ')', {
          method: 'delete',
          headers: headers,
          muteHttpExceptions: true
        });
        const status = response.getResponseCode();
        if (status >= 300 && table.name === config.tables[0].name && column === config.tables[0].columns[0]) {
          failures.push(table.name + ' demo-row cleanup: ' + (response.getContentText() || status));
        }
      });
    });
  });

  tableConfigs.forEach(function (config) {
    const records = dummyRecords(config.stateKey);
    if (!records.length) return;
    let synced = false;
    const tableErrors = [];
    config.variants.forEach(function (variant) {
      if (synced) return;
      const payload = records.map(variant.map);
      const response = UrlFetchApp.fetch(
        base + '/' + variant.table + '?on_conflict=' + encodeURIComponent(variant.conflict),
        {
          method: 'post',
          headers: headers,
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        }
      );
      if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
        synced = true;
      } else {
        tableErrors.push(variant.table + ': ' +
          (response.getContentText() || ('HTTP ' + response.getResponseCode())));
      }
    });
    if (!synced) failures.push(config.stateKey + ' (' + tableErrors.join('; ') + ')');
  });

  const snapshotResponse = UrlFetchApp.fetch(base + '/db_json?on_conflict=snapshot_key', {
    method: 'post',
    headers: headers,
    payload: JSON.stringify([{ snapshot_key: 'main', payload: data, updated_at: new Date().toISOString() }]),
    muteHttpExceptions: true
  });
  if (snapshotResponse.getResponseCode() >= 300) {
    failures.push('db_json: ' + (snapshotResponse.getContentText() || snapshotResponse.getResponseCode()));
  }

  if (failures.length) {
    throw new Error('Supabase demo-data sync failed: ' + failures.join('; '));
  }
  return true;
}

function enforceSixDummySeedRecordsPerTable_(data, seed) {
  const tableKeys = ['batches', 'students', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks', 'notifications'];
  const removedIds = {};
  tableKeys.forEach(function (tableKey) {
    if (tableKey === 'students' && data.settings &&
      (data.settings.studentSeedDataDisabled === true || data.settings.studentSeedDataDisabled === 'true')) {
      removedIds[tableKey] = [];
      data[tableKey] = (data[tableKey] || []).filter(function (record) {
        if (!record || !isDummyRecord_(record)) return true;
        if (record.id) removedIds[tableKey].push(String(record.id));
        return false;
      });
      return;
    }
    const seedRecords = (seed[tableKey] || []).slice(0, 6);
    const allowed = {};
    seedRecords.forEach(function (record) { allowed[String(record.id)] = true; });
    const keptIds = {};
    removedIds[tableKey] = [];
    data[tableKey] = (data[tableKey] || []).filter(function (record) {
      if (!record || !isDummyRecord_(record)) return true;
      const id = String(record.id || '');
      if (!allowed[id] || keptIds[id]) {
        if (id && removedIds[tableKey].indexOf(id) < 0) removedIds[tableKey].push(id);
        return false;
      }
      record.isDummy = true;
      keptIds[id] = true;
      return true;
    });
    seedRecords.forEach(function (seedRecord) {
      const id = String(seedRecord.id);
      if (keptIds[id]) return;
      const copy = JSON.parse(JSON.stringify(seedRecord));
      copy.isDummy = true;
      data[tableKey].push(copy);
      keptIds[id] = true;
    });
  });
  const removedStudents = {};
  (removedIds.students || []).forEach(function (id) { removedStudents[id] = true; });
  (data.batches || []).forEach(function (batch) {
    if (batch && Array.isArray(batch.studentIds)) {
      batch.studentIds = batch.studentIds.filter(function (id) { return !removedStudents[String(id)]; });
    }
  });
  (data.offlineTests || []).forEach(function (test) {
    if (!test || !test.marks || typeof test.marks !== 'object') return;
    Object.keys(removedStudents).forEach(function (id) { delete test.marks[id]; });
  });
  return removedIds;
}

function apiCreateDummyDataAndSheets() {
  try {
    PropertiesService.getScriptProperties().setProperty('DUMMY_DATA_WIPED', 'false');
    PropertiesService.getScriptProperties().setProperty('STUDENT_SEED_DATA_DISABLED', 'false');
    try {
      PropertiesService.getScriptProperties().deleteProperty('DB_tomb_rolls');
      PropertiesService.getScriptProperties().deleteProperty('DB_tomb_linkUrls');
    } catch (e) {}

    // 1. Get seed data baseline
    const seed = getDefaultSeedData();
    let data = dbLoadAll();
    if (!data) data = apiGetInitialData() || seed;
    if (!data.settings) data.settings = {};
    data.settings.dummyDataWiped = false;
    data.settings.showDummyData = true;
    data.settings.studentSeedDataDisabled = false;

    // 2. Add missing seed demo records to all tables (preserving genuine client records)
    ['students', 'batches', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks', 'notifications'].forEach(function(tbl) {
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
    const excessDummyIds = enforceSixDummySeedRecordsPerTable_(data, seed);
    // 3. Save directly to Cloud Database
    dbSaveAll(data);

    // 4. Mirror directly to Google Sheets
    const ss = getDbSpreadsheet();
    if (!ss) return { success: false, error: 'The database is unavailable.' };
    syncReadableSheets(ss, data);

    // 5. Upsert dummy rows to Supabase without replacing existing client records.
    syncDummySeedRecordsToSupabase_(data, excessDummyIds);

    const recordCounts = {};
    const shortTabs = [];
    getRequiredSheetTabNames_().forEach(function (name) {
      if (name === 'DB_JSON' || name === 'External_Links_Hub' || name === 'Settings_Config') return;
      const sheet = ss.getSheetByName(name);
      const count = Math.max(0, sheet ? sheet.getLastRow() - 1 : 0);
      recordCounts[name] = count;
      if (count < 6) shortTabs.push(name + ' (' + count + ')');
    });
    if (shortTabs.length) {
      return {
        success: false,
        error: 'Some demo-data tabs have fewer than 6 records: ' + shortTabs.join(', '),
        recordCounts: recordCounts
      };
    }
    return {
      success: true,
      sheetCount: getRequiredSheetTabNames_().length,
      recordCounts: recordCounts,
      studentSeedDataDisabled: data.settings.studentSeedDataDisabled === true || data.settings.studentSeedDataDisabled === 'true',
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
    PropertiesService.getScriptProperties().setProperty('DUMMY_DATA_WIPED', 'true');
    PropertiesService.getScriptProperties().setProperty('STUDENT_SEED_DATA_DISABLED', 'true');
    let data = dbLoadAll();
    if (!data) data = apiGetInitialData();
    if (!data) return { success: false, error: 'Database is unavailable.' };

    if (!data.settings) data.settings = {};
    data.settings.showDummyData = false;
    data.settings.dummyDataWiped = true;
    data.settings.studentSeedDataDisabled = true;

    const dummySupabaseIds = {
      batches: [],
      students: [],
      materials: [],
      offline_tests: [],
      teachers: [],
      gallery: [],
      feedbacks: []
    };
    const supabaseTableKeys = {
      batches: 'batches',
      students: 'students',
      materials: 'materials',
      offlineTests: 'offline_tests',
      teachers: 'teachers',
      gallery: 'gallery',
      feedbacks: 'feedbacks'
    };
    Object.keys(supabaseTableKeys).forEach(function (dataKey) {
      (data[dataKey] || []).forEach(function (record) {
        if (!record || !isDummyRecord_(record)) return;
        const tableKey = supabaseTableKeys[dataKey];
        [record.id, record.roll].forEach(function (id) {
          id = String(id || '').trim();
          if (id && dummySupabaseIds[tableKey].indexOf(id) < 0) {
            dummySupabaseIds[tableKey].push(id);
          }
        });
      });
    });

    // Track dummy student IDs to clean foreign keys
    const dummyStudentIds = {};
    (data.students || []).forEach(function(s) {
      if (s && isDummyRecord_(s)) dummyStudentIds[String(s.id)] = true;
    });
    const dummyMaterialIds = {};
    (data.materials || []).forEach(function (material) {
      if (material && isDummyRecord_(material)) dummyMaterialIds[String(material.id)] = true;
    });
    const dummyNotificationIds = [];
    data.notifications = (data.notifications || []).filter(function (notification) {
      if (!notification) return false;
      const notificationId = String(notification.id || '');
      const studentId = String(notification.targetStudentId || notification.studentId || '');
      const materialId = String(notification.materialId || '');
      const isDummyNotification = notification.isDummy === true ||
        !!dummyStudentIds[studentId] ||
        !!dummyMaterialIds[materialId] ||
        Object.keys(dummyStudentIds).some(function (id) {
          return notificationId.indexOf('notif_fee_' + id + '_') === 0 ||
            notificationId.indexOf('monthly_fee_' + id + '_') === 0;
        }) ||
        Object.keys(dummyMaterialIds).some(function (id) {
          return notificationId.indexOf('notif_mat_' + id) === 0;
        });
      if (isDummyNotification) {
        if (notificationId) dummyNotificationIds.push(notificationId);
        return false;
      }
      return true;
    });

    const clearedCounts = {};

    // 1. Filter out dummy records from data tables
    // Note: externalLinks is intentionally excluded and NEVER filtered!
    ['students', 'batches', 'materials', 'offlineTests', 'teachers', 'gallery', 'feedbacks'].forEach(function(tbl) {
      const initialCount = (data[tbl] || []).length;
      data[tbl] = (data[tbl] || []).filter(function(r) { return !isDummyRecord_(r); });
      clearedCounts[tbl] = initialCount - data[tbl].length;
    });

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

    // 6. Delete dummy records from Supabase tables and fail explicitly if it cannot complete.
    const supabaseClearResult = clearDummyDataFromSupabase_(data, dummySupabaseIds, dummyNotificationIds);

    return {
      success: true,
      clearedCounts: clearedCounts,
      supabaseCleared: supabaseClearResult.success,
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

function apiClearStudentTable(developerEmail, developerPassword, confirmationText) {
  let serverCleared = false;
  let studentTableClearedAt = '';
  try {
    const verification = verifyDeveloperCredentials_(developerEmail, developerPassword);
    if (!verification.success) {
      return {
        success: false,
        error: verification.notConfigured
          ? 'Developer credentials are not configured on the server.'
          : 'Developer email or password is incorrect.'
      };
    }
    if (String(confirmationText || '').trim() !== 'CLEAR STUDENTS') {
      return { success: false, error: 'Type CLEAR STUDENTS to confirm this operation.' };
    }

    PropertiesService.getScriptProperties().setProperty('STUDENT_SEED_DATA_DISABLED', 'true');
    let data = dbLoadAll();
    if (!data) data = apiGetInitialData();
    if (!data) return { success: false, error: 'Database is unavailable.' };
    if (!data.settings || typeof data.settings !== 'object') data.settings = {};

    const removedIds = {};
    (data.students || []).forEach(function (student) {
      if (!student) return;
      [student.id, student.roll].forEach(function (id) {
        if (id) removedIds[String(id)] = true;
      });
    });
    const removedCount = (data.students || []).length;
    data.students = [];
    data.settings.studentSeedDataDisabled = true;
    studentTableClearedAt = new Date().toISOString();
    data.settings.studentTableClearedAt = studentTableClearedAt;

    (data.batches || []).forEach(function (batch) {
      if (Array.isArray(batch.studentIds)) {
        batch.studentIds = batch.studentIds.filter(function (id) { return !removedIds[String(id)]; });
      }
    });
    (data.offlineTests || []).forEach(function (test) {
      if (!test || !test.marks || typeof test.marks !== 'object') return;
      Object.keys(removedIds).forEach(function (id) { delete test.marks[id]; });
    });
    data.notifications = (data.notifications || []).filter(function (notification) {
      if (!notification) return false;
      const targetId = String(notification.targetStudentId || notification.studentId || '');
      const targetRoll = String(notification.targetRoll || '');
      return !removedIds[targetId] && !removedIds[targetRoll];
    });

    const saveResult = apiSyncAllData(data);
    if (!saveResult || !saveResult.success) {
      throw new Error((saveResult && saveResult.error) || 'The cleared student roster could not be saved.');
    }
    serverCleared = true;

    const spreadsheet = getDbSpreadsheet();
    if (!spreadsheet) throw new Error('The student roster sheet is unavailable.');
    let studentsSheet = spreadsheet.getSheetByName('Students_Master');
    if (!studentsSheet) studentsSheet = spreadsheet.insertSheet('Students_Master');
    const studentHeaders = ['Roll No', 'Student Name', 'Login Password', 'Access Status', 'Parent Name', 'Contact Phone', 'Total Fee (INR)', 'Paid Fee (INR)', 'Pending Dues (INR)', 'Fee Due Date', 'Last Reminder Sent', 'Admission Date', 'Monthly Fee (INR)'];
    studentsSheet.clear();
    studentsSheet.getRange(1, 1, 1, studentHeaders.length).setValues([studentHeaders]);
    studentsSheet.getRange(1, 1, 1, studentHeaders.length).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    formatAndTrimSheet(studentsSheet, studentHeaders.length, 1);

    let settingsSheet = spreadsheet.getSheetByName('Settings_Config');
    if (!settingsSheet) {
      settingsSheet = spreadsheet.insertSheet('Settings_Config');
      settingsSheet.getRange(1, 1, 1, 3).setValues([['Setting Parameter', 'Configured Value', 'Description']]);
    }
    const settingRows = settingsSheet.getLastRow() > 1
      ? settingsSheet.getRange(2, 1, settingsSheet.getLastRow() - 1, 1).getDisplayValues()
      : [];
    [
      ['Student Seed Data Disabled', 'Yes', 'Do not restore demo student rows after the student table is cleared'],
      ['Student Table Cleared At', data.settings.studentTableClearedAt, 'Reject stale student rows from before the developer clear action']
    ].forEach(function (setting) {
      const rowIndex = settingRows.findIndex(function (row) {
        return String(row[0] || '').trim() === setting[0];
      });
      if (rowIndex >= 0) {
        settingsSheet.getRange(rowIndex + 2, 2).setValue(setting[1]);
      } else {
        settingsSheet.appendRow([setting[0], setting[1], setting[2]]);
      }
    });
    const snapshotSheet = spreadsheet.getSheetByName('DB_JSON');
    if (snapshotSheet) snapshotSheet.getRange(1, 1).setValue(JSON.stringify(data));

    const settings = data.settings;
    const normalizedUrl = (settings.supabaseUrl || 'https://srjqsofkjizwskqnzyfn.supabase.co').replace(/\/+$/, '');
    const supabaseKey = settings.supabaseKey || 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS';
    const base = normalizedUrl + (/\/rest\/v1$/i.test(normalizedUrl) ? '' : '/rest/v1');
    const headers = {
      apikey: supabaseKey,
      Authorization: 'Bearer ' + supabaseKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    };
    const tableResults = [];
    const tableFailures = [];
    [
      { name: 'students', column: 'id' },
      { name: 'students_master', column: 'roll_no' }
    ].forEach(function (table) {
      try {
        const response = UrlFetchApp.fetch(
          base + '/' + table.name + '?' + table.column + '=not.is.null',
          { method: 'delete', headers: headers, muteHttpExceptions: true }
        );
        const status = response.getResponseCode();
        const body = response.getContentText();
        if (status >= 200 && status < 300) {
          let deletedRows = null;
          if (body) {
            try {
              const rows = JSON.parse(body);
              if (Array.isArray(rows)) deletedRows = rows.length;
            } catch (parseError) {
              throw new Error(table.name + ' deletion count could not be verified.');
            }
          }
          tableResults.push({ name: table.name, deletedRows: deletedRows });
        } else if (!(/PGRST205|42P01|does not exist|not found/i.test(body)) || status !== 404) {
          tableFailures.push(table.name + ': HTTP ' + status + (body ? ' ' + body : ''));
        }
      } catch (requestError) {
        tableFailures.push(table.name + ': ' + requestError.toString());
      }
    });
    if (!tableResults.length || tableFailures.length) {
      throw new Error('Supabase student-table cleanup was incomplete: ' +
        (tableFailures.length ? tableFailures.join('; ') : 'No student table was available.'));
    }

    const settingsResponse = UrlFetchApp.fetch(base + '/settings_config?on_conflict=setting_parameter', {
      method: 'post',
      headers: Object.assign({}, headers, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
      payload: JSON.stringify([{
        setting_parameter: 'Student Seed Data Disabled',
        configured_value: 'Yes',
        description: 'Do not restore demo student rows after the student table is cleared'
      }, {
        setting_parameter: 'Student Table Cleared At',
        configured_value: data.settings.studentTableClearedAt,
        description: 'Reject stale student rows from before the developer clear action'
      }]),
      muteHttpExceptions: true
    });
    if (settingsResponse.getResponseCode() >= 300) {
      throw new Error('Could not persist the student-seed lock in Supabase: ' + settingsResponse.getContentText());
    }

    const snapshotResponse = UrlFetchApp.fetch(base + '/db_json?snapshot_key=eq.main', {
      method: 'patch',
      headers: Object.assign({}, headers, { Prefer: 'return=minimal' }),
      payload: JSON.stringify({ payload: data, updated_at: new Date().toISOString() }),
      muteHttpExceptions: true
    });
    if (snapshotResponse.getResponseCode() >= 300) {
      throw new Error('Could not persist the cleared student snapshot in Supabase: ' + snapshotResponse.getContentText());
    }

    try {
      PropertiesService.getScriptProperties().deleteProperty('DB_tomb_rolls');
    } catch (tombstoneError) {
      Logger.log('Student roster tombstone cleanup notice: ' + tombstoneError.toString());
    }
    return {
      success: true,
      clearedRows: removedCount,
      supabaseTables: tableResults,
      studentSeedDataDisabled: true,
      studentTableClearedAt: studentTableClearedAt
    };
  } catch (err) {
    Logger.log('apiClearStudentTable error: ' + err.toString());
    return {
      success: false,
      serverCleared: serverCleared,
      studentSeedDataDisabled: serverCleared,
      studentTableClearedAt: studentTableClearedAt,
      error: err.message || String(err)
    };
  }
}

function apiClearAllSupabaseData(developerEmail, developerPassword, confirmationText) {
  try {
    const verification = verifyDeveloperCredentials_(developerEmail, developerPassword);
    if (!verification.success) {
      return {
        success: false,
        error: verification.notConfigured
          ? 'Developer credentials are not configured on the server.'
          : 'Developer email or password is incorrect.'
      };
    }
    if (String(confirmationText || '').trim() !== 'CLEAR ALL') {
      return { success: false, error: 'Type CLEAR ALL to confirm this operation.' };
    }

    PropertiesService.getScriptProperties().setProperty('DUMMY_DATA_WIPED', 'true');
    PropertiesService.getScriptProperties().setProperty('STUDENT_SEED_DATA_DISABLED', 'true');
    const data = dbLoadAll() || {};
    const settings = data.settings || {};
    const supabaseUrl = settings.supabaseUrl || 'https://srjqsofkjizwskqnzyfn.supabase.co';
    const supabaseKey = settings.supabaseKey || 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS';
    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: 'Supabase URL or API key is missing.' };
    }

    const normalizedUrl = supabaseUrl.replace(/\/+$/, '');
    const base = normalizedUrl + (/\/rest\/v1$/i.test(normalizedUrl) ? '/' : '/rest/v1/');
    const headers = {
      apikey: supabaseKey,
      Authorization: 'Bearer ' + supabaseKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    };
    const tables = [
      { name: 'batches', column: 'id' },
      { name: 'batches_roster', column: 'batch_id' },
      { name: 'students', column: 'id' },
      { name: 'students_master', column: 'roll_no' },
      { name: 'teachers', column: 'id' },
      { name: 'teachers_roster', column: 'teacher_id' },
      { name: 'materials', column: 'id' },
      { name: 'materials_repository', column: 'material_id' },
      { name: 'offline_tests', column: 'id' },
      { name: 'offline_test_marks', column: 'test_id' },
      { name: 'gallery', column: 'id' },
      { name: 'external_links', column: 'id' },
      { name: 'feedbacks', column: 'id' },
      { name: 'notifications', column: 'id' },
      { name: 'db_json', column: 'snapshot_key' }
    ];
    const clearedTables = [];
    const failures = [];

    tables.forEach(function (table) {
      try {
        const response = UrlFetchApp.fetch(
          base + table.name + '?' + table.column + '=not.is.null',
          {
            method: 'delete',
            headers: headers,
            muteHttpExceptions: true
          }
        );
        const status = response.getResponseCode();
        if (status < 200 || status >= 300) {
          const body = response.getContentText();
          if (status === 404 && /PGRST205|42P01|does not exist|not found/i.test(body)) {
            return;
          }
          failures.push(table.name + ': HTTP ' + status + (body ? ' ' + body : ''));
          return;
        }

        let deletedRows = null;
        const body = response.getContentText();
        if (body) {
          try {
            const deleted = JSON.parse(body);
            if (Array.isArray(deleted)) deletedRows = deleted.length;
          } catch (parseError) {
            failures.push(table.name + ': could not verify deleted row count.');
            return;
          }
        }
        clearedTables.push({ name: table.name, deletedRows: deletedRows });
      } catch (requestError) {
        failures.push(table.name + ': ' + requestError.toString());
      }
    });

    // Keep operational settings so the developer can continue using the app,
    // but clear every application-data collection in the other configured stores.
    const emptyData = Object.assign({}, data, {
      batches: [],
      students: [],
      teachers: [],
      materials: [],
      offlineTests: [],
      gallery: [],
      externalLinks: [],
      feedbacks: [],
      notifications: [],
      settings: Object.assign({}, settings, {
        showDummyData: false,
        dummyDataWiped: true,
        studentSeedDataDisabled: true,
        studentTableClearedAt: new Date().toISOString()
      })
    });
    let cloudDatabaseCleared = true;
    DB_TABLES.forEach(function (tableName) {
      try {
        if (!dbSetTable(tableName, emptyData[tableName] !== undefined ? emptyData[tableName] : [])) {
          cloudDatabaseCleared = false;
          failures.push('Apps Script Cloud Database.' + tableName + ': clear failed');
        }
      } catch (dbError) {
        cloudDatabaseCleared = false;
        failures.push('Apps Script Cloud Database.' + tableName + ': ' + dbError.toString());
      }
    });

    let spreadsheetCleared = false;
    try {
      const spreadsheet = getDbSpreadsheet();
      if (!spreadsheet) throw new Error('Could not open the configured Google Sheets database.');
      syncReadableSheets(spreadsheet, emptyData);
      const attendanceSheet = spreadsheet.getSheetByName(ATTENDANCE_SHEET_NAME);
      if (attendanceSheet && attendanceSheet.getLastRow() > 1) {
        attendanceSheet.getRange(2, 1, attendanceSheet.getLastRow() - 1, attendanceSheet.getLastColumn()).clearContent();
      }
      const snapshotSheet = spreadsheet.getSheetByName('DB_JSON');
      if (snapshotSheet) snapshotSheet.getRange(1, 1).setValue(JSON.stringify(emptyData));
      getRequiredSheetTabNames_().forEach(function (sheetName) {
        if (sheetName === 'DB_JSON' || sheetName === 'Settings_Config') return;
        const sheet = spreadsheet.getSheetByName(sheetName);
        if (!sheet || sheet.getLastRow() > 1) {
          throw new Error('Google Sheets clear could not be verified for tab: ' + sheetName);
        }
      });
      spreadsheetCleared = true;
    } catch (sheetError) {
      failures.push('Google Sheets: ' + sheetError.toString());
    }

    try {
      const settingsRows = [
        ['Show Dummy / Demo Data', 'Off', 'Seed demo students/batches/tests visibility'],
        ['Dummy Data Wiped', 'Yes', 'Permanent clearance status before client handover'],
        ['Student Seed Data Disabled', 'Yes', 'Do not restore demo student rows after the student table is cleared'],
        ['Student Table Cleared At', emptyData.settings.studentTableClearedAt, 'Reject stale student rows from before the developer clear action']
      ].map(function (row) {
        return { setting_parameter: row[0], configured_value: row[1], description: row[2] };
      });
      const settingsResponse = UrlFetchApp.fetch(base + 'settings_config?on_conflict=setting_parameter', {
        method: 'post',
        headers: Object.assign({}, headers, {
          Prefer: 'resolution=merge-duplicates,return=minimal'
        }),
        payload: JSON.stringify(settingsRows),
        muteHttpExceptions: true
      });
      if (settingsResponse.getResponseCode() < 200 || settingsResponse.getResponseCode() >= 300) {
        failures.push('Supabase settings_config: HTTP ' + settingsResponse.getResponseCode() +
          (settingsResponse.getContentText() ? ' ' + settingsResponse.getContentText() : ''));
      }
    } catch (settingsError) {
      failures.push('Supabase settings_config: ' + settingsError.toString());
    }

    try {
      const snapshotResponse = UrlFetchApp.fetch(base + 'db_json?on_conflict=snapshot_key', {
        method: 'post',
        headers: Object.assign({}, headers, {
          Prefer: 'resolution=merge-duplicates,return=minimal'
        }),
        payload: JSON.stringify([{
          snapshot_key: 'main',
          payload: emptyData,
          updated_at: new Date().toISOString()
        }]),
        muteHttpExceptions: true
      });
      if (snapshotResponse.getResponseCode() < 200 || snapshotResponse.getResponseCode() >= 300) {
        failures.push('Supabase db_json snapshot: HTTP ' + snapshotResponse.getResponseCode());
      }
    } catch (snapshotError) {
      failures.push('Supabase db_json snapshot: ' + snapshotError.toString());
    }

    if (failures.length) {
      return {
        success: false,
        error: 'Clear was incomplete: ' + failures.join('; '),
        clearedTables: clearedTables,
        cloudDatabaseCleared: cloudDatabaseCleared,
        spreadsheetCleared: spreadsheetCleared,
        appData: emptyData
      };
    }
    return {
      success: true,
      clearedTables: clearedTables,
      cloudDatabaseCleared: cloudDatabaseCleared,
      spreadsheetCleared: spreadsheetCleared,
      appData: emptyData
    };
  } catch (err) {
    Logger.log('apiClearAllSupabaseData error: ' + err.toString());
    return { success: false, error: err.message || String(err) };
  }
}

function clearDummyDataFromSupabase_(data, removedIds, dummyNotificationIds) {
  const settings = (data && data.settings) || {};
  const supabaseUrl = settings.supabaseUrl || 'https://srjqsofkjizwskqnzyfn.supabase.co';
  const supabaseKey = settings.supabaseKey || 'sb_publishable_vxonFVKPpyJjY5O-Y9mS6g_bhSYCcsS';
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or API key is missing; dummy records were not cleared from Supabase.');
  }

  const base = supabaseUrl.replace(/\/+$/, '') + '/rest/v1/';
  const headers = {
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey,
    'Content-Type': 'application/json'
  };

  const dummyTableIds = {
    batches: ['b1','b2','b3','b4','b5','b6','b7','b8','b9','b10'],
    students: [
      's1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11',
      'DC-101','DC-102','DC-201','DC-202','DC-301','DC-302'
    ],
    materials: ['m1','m2','m3','m4','m5','m6','m7','m8','m9','m10'],
    offline_tests: ['t1','t2','t3','t4','t5','t6','t7','t8','t9','t10'],
    teachers: ['tr1','tr2','tr3','tr4','tr5','tr6','tr7','tr8','tr9','tr10'],
    gallery: ['g1','g2','g3','g4','g5','g6','g7','g8','g9','g10'],
    feedbacks: ['f1','f2','f3','f4','f5','f6','f7','f8','f9','f10']
  };
  const tableAliases = {
    batches: ['batches', 'batches_roster'],
    students: ['students', 'students_master'],
    materials: ['materials', 'materials_repository'],
    offline_tests: ['offline_tests', 'offline_test_marks'],
    teachers: ['teachers', 'teachers_roster'],
    gallery: ['gallery', 'gallery_banners'],
    feedbacks: ['feedbacks', 'feedback_responses']
  };
  const idColumns = {
    batches: ['id', 'batch_id'],
    students: ['id', 'roll_no'],
    materials: ['id', 'material_id'],
    offline_tests: ['id', 'test_id'],
    teachers: ['id', 'teacher_id'],
    gallery: ['id', 'banner_id'],
    feedbacks: ['id', 'row_id']
  };
  const failures = [];

  // Delete dummy rows from Supabase (external_links and settings_config are NEVER deleted)
  Object.keys(dummyTableIds).forEach(function(tbl) {
    const ids = dummyTableIds[tbl].concat((removedIds && removedIds[tbl]) || []);
    const uniqueIds = ids.filter(function (id, index) {
      return id && ids.indexOf(id) === index;
    });
    if (!uniqueIds.length) return;

    let tableAvailable = false;
    let lastFailure = '';
    (tableAliases[tbl] || [tbl]).forEach(function (tableName) {
      let aliasAvailable = false;
      let missingTable = false;
      (idColumns[tbl] || ['id']).forEach(function (column) {
        const filter = uniqueIds.map(function (id) {
          return encodeURIComponent(String(id));
        }).join(',');
        const response = UrlFetchApp.fetch(
          base + tableName + '?' + column + '=in.(' + filter + ')',
          {
            method: 'delete',
            headers: Object.assign({}, headers, { Prefer: 'return=minimal' }),
            muteHttpExceptions: true
          }
        );
        const status = response.getResponseCode();
        if (status >= 200 && status < 300) {
          tableAvailable = true;
          aliasAvailable = true;
        } else {
          const errorText = response.getContentText() || ('HTTP ' + status);
          if (status === 404 && /PGRST205|42P01|does not exist|not found/i.test(errorText)) {
            missingTable = true;
          } else {
            lastFailure = errorText;
          }
        }
      });
      if (!aliasAvailable && !missingTable && lastFailure) {
        failures.push(tableName + ': ' + lastFailure);
      }
    });
    if (!tableAvailable) failures.push(tbl + ': ' + (lastFailure || 'No configured table was found.'));
  });

  // Delete only notifications that reference removed demo students/materials.
  const notificationIds = (dummyNotificationIds || []).filter(function (id, index, ids) {
    return id && ids.indexOf(id) === index;
  });
  if (notificationIds.length) {
    const filter = notificationIds.map(function (id) {
      return encodeURIComponent(String(id));
    }).join(',');
    const response = UrlFetchApp.fetch(base + 'notifications?id=in.(' + filter + ')', {
      method: 'delete',
      headers: Object.assign({}, headers, { Prefer: 'return=minimal' }),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() >= 300) {
      failures.push('notifications: ' + (response.getContentText() || response.getResponseCode()));
    }
  }

  // Update settings_config in Supabase
  [
    { parameter: 'Show Dummy / Demo Data', value: 'Off' },
    { parameter: 'Dummy Data Wiped', value: 'Yes' },
    { parameter: 'Student Seed Data Disabled', value: 'Yes' }
  ].forEach(function (setting) {
    const response = UrlFetchApp.fetch(
      base + 'settings_config?setting_parameter=eq.' + encodeURIComponent(setting.parameter),
      {
        method: 'patch',
        headers: headers,
        payload: JSON.stringify({ configured_value: setting.value }),
        muteHttpExceptions: true
      }
    );
    if (response.getResponseCode() >= 300) {
      failures.push('settings_config (' + setting.parameter + '): ' +
        (response.getContentText() || response.getResponseCode()));
    }
  });

  // Update snapshot db_json
  const snapshotResponse = UrlFetchApp.fetch(base + 'db_json?snapshot_key=eq.main', {
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
  if (snapshotResponse.getResponseCode() >= 300) {
    failures.push('db_json snapshot: ' + (snapshotResponse.getContentText() || snapshotResponse.getResponseCode()));
  }
  if (failures.length) {
    throw new Error('Supabase dummy-data cleanup failed: ' + failures.join('; '));
  }
  return { success: true };
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
