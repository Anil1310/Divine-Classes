/**
 * Hard-coded Google Sheets tab schema, sheet API sync, and formatting helpers.
 * Demo record definitions remain in Seeds.js.
 */

/** Hard-coded spreadsheet API tab list used by the creator and sync routines. */
function getRequiredSheetTabNames_() {
  return [
    'DB_JSON',
    'Students_Master',
    'Teachers_Roster',
    'Batches_Roster',
    'Offline_Test_Marks',
    'Feedback_Responses',
    'Materials_Repository',
    'Gallery_Banners',
    'External_Links_Hub',
    'Settings_Config',
    ATTENDANCE_SHEET_NAME
  ];
}

/** Add a spreadsheet menu for explicit demo-data creation. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Divine Classes')
    .addItem('Create Dummy Data', 'menuCreateDummyDataAndSheets')
    .addToUi();
}

/** Runs from the Divine Classes spreadsheet menu. */
function menuCreateDummyDataAndSheets() {
  const ui = SpreadsheetApp.getUi();
  const result = apiCreateDummyDataAndSheets();
  if (!result || !result.success) {
    ui.alert('Dummy data was not fully created',
      (result && result.error) || 'An unexpected error occurred.', ui.ButtonSet.OK);
    return;
  }

  ui.alert('Dummy data created',
    'Demo records were added and ' + result.sheetCount + ' tabs were rebuilt.',
    ui.ButtonSet.OK);
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
  // Keep diagnostics safe even when a caller accidentally passes no sheet.
  // Previously the catch handler called sheet.getName(), masking the original
  // problem with "Cannot read properties of undefined (reading 'getName')".
  const sheetName = sheet && typeof sheet.getName === 'function'
    ? sheet.getName()
    : '<missing sheet>';
  if (!sheet) {
    Logger.log('Formatting error on ' + sheetName + ': sheet argument is undefined.');
    return;
  }
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
    Logger.log('Formatting error on ' + sheetName + ': ' + err.toString());
  }
}

/**
 * Generates human-friendly Google Sheets tab views for the client
 * Includes Login Passwords and Access Status (Active vs Blocked) columns,
 * freezes the first header row on each tab, and deletes blank columns automatically.
 */
function syncReadableSheets(ss, data) {
  try {
    // Recreate the complete tab set if any tab was deleted. The data tabs are
    // repopulated below from the full Cloud DB state; DB_JSON is a hidden
    // snapshot and Attendance_Register has its own header/seed helper.
    getRequiredSheetTabNames_().forEach(function(name) {
      if (!ss.getSheetByName(name)) ss.insertSheet(name);
    });
    const snapshotSheet = ss.getSheetByName('DB_JSON');
    snapshotSheet.getRange(1, 1).setValue(JSON.stringify(data || {}));
    formatAndTrimSheet(snapshotSheet, 1, 1, '#0f172a');
    if (!snapshotSheet.isSheetHidden()) snapshotSheet.hideSheet();

    // A. Sync Students Sheet with Passwords and Authorization Status
    {
      let stuSheet = ss.getSheetByName('Students_Master');
      if (!stuSheet) {
        stuSheet = ss.insertSheet('Students_Master');
      }
      stuSheet.clear();
      const headers = ['Roll No', 'Student Name', 'Login Password', 'Access Status', 'Parent Name', 'Contact Phone', 'Total Fee (INR)', 'Paid Fee (INR)', 'Pending Dues (INR)', 'Fee Due Date', 'Last Reminder Sent', 'Admission Date', 'Monthly Fee (INR)'];
      const rows = [headers];
      (data.students || []).forEach(function(s) {
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
          s.lastReminder || 'Never',
          s.admissionDate || '',
          s.monthlyFee || 0
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
    {
      let teachSheet = ss.getSheetByName('Teachers_Roster');
      if (!teachSheet) {
        teachSheet = ss.insertSheet('Teachers_Roster');
      }
      teachSheet.clear();
      const trHeaders = ['Teacher ID', 'Teacher Name', 'Subject', 'Login Email', 'Login Password', 'Access Status', 'Contact Phone', 'Qualification', 'Experience'];
      const trRows = [trHeaders];
      (data.teachers || []).forEach(function(tr) {
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
    {
      let batchSheet = ss.getSheetByName('Batches_Roster');
      if (!batchSheet) {
        batchSheet = ss.insertSheet('Batches_Roster');
      }
      batchSheet.clear();
      const bHeaders = ['Batch ID', 'Batch Name', 'Subjects', 'Schedule', 'Classroom / Hall', 'Lead Faculty', 'Student Count'];
      const bRows = [bHeaders];
      (data.batches || []).forEach(function(b) {
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
    {
      let testSheet = ss.getSheetByName('Offline_Test_Marks');
      if (!testSheet) {
        testSheet = ss.insertSheet('Offline_Test_Marks');
      }
      testSheet.clear();
      const tHeaders = ['Test ID', 'Test Title', 'Subject', 'Date', 'Max Marks', 'Student Name', 'Marks Obtained', 'Percentage', 'Teacher Remarks'];
      const tRows = [tHeaders];
      
      const studentMap = {};
      (data.students || []).forEach(function(s) { studentMap[s.id] = s.name + ' (' + s.roll + ')'; });

      (data.offlineTests || []).forEach(function(t) {
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

      testSheet.getRange(1, 1, tRows.length, tHeaders.length).setValues(tRows);
      testSheet.getRange(1, 1, 1, tHeaders.length).setFontWeight('bold').setBackground('#d97706').setFontColor('#ffffff');
      formatAndTrimSheet(testSheet, tHeaders.length, tRows.length);
    }

    // E. Sync Feedback Sheet
    {
      let fbSheet = ss.getSheetByName('Feedback_Responses');
      if (!fbSheet) {
        fbSheet = ss.insertSheet('Feedback_Responses');
      }
      fbSheet.clear();
      const fbHeaders = ['Author Name', 'Role (Parent/Student)', 'Batch', 'Category', 'Rating (Stars)', 'Date', 'Feedback Comment'];
      const fbRows = [fbHeaders];
      (data.feedbacks || []).forEach(function(f) {
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
    {
      let matSheet = ss.getSheetByName('Materials_Repository');
      if (!matSheet) {
        matSheet = ss.insertSheet('Materials_Repository');
      }
      matSheet.clear();
      const mHeaders = ['Material ID', 'Title', 'Batch Name', 'Category', 'Upload Date', 'Uploaded By', 'File Size', 'Downloads', 'Description', 'Download URL', 'Google Drive Link'];
      const mRows = [mHeaders];
      const batchMap = {};
      (data.batches || []).forEach(function(b) { batchMap[b.id] = b.name; });

      (data.materials || []).forEach(function(m) {
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
    {
      let galSheet = ss.getSheetByName('Gallery_Banners');
      if (!galSheet) {
        galSheet = ss.insertSheet('Gallery_Banners');
      }
      galSheet.clear();
      const gHeaders = ['Banner ID', 'Title', 'Category', 'Date', 'Caption', 'Badge / AIR Rank', 'Image URL'];
      const gRows = [gHeaders];
      (data.gallery || []).forEach(function(g) {
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
      // Settings_Config preserves live settings so user and developer toggles stay saved
      const sRows = [sHeaders].concat(getDefaultSettingsConfigRows_(data.settings || getDefaultSeedData().settings));

      setSheet.getRange(1, 1, sRows.length, sHeaders.length).setValues(sRows);
      setSheet.getRange(1, 1, 1, sHeaders.length).setFontWeight('bold').setBackground('#334155').setFontColor('#ffffff');
      formatAndTrimSheet(setSheet, sHeaders.length, sRows.length);
    }

    // Attendance is maintained in its own tab, outside the JSON seed tables.
    // If dummy data has been wiped, keep only genuine attendance records.
    const attendanceSheet = getAttendanceSheet_();
    if (data.settings && (data.settings.dummyDataWiped === true || data.settings.dummyDataWiped === 'true')) {
      try {
        const aLast = attendanceSheet.getLastRow();
        if (aLast > 1) {
          const aVals = attendanceSheet.getRange(2, 1, aLast - 1, ATTENDANCE_HEADERS.length).getValues();
          const keepRows = [];
          aVals.forEach(function(r) {
            if (String(r[4] || '') !== '[DEMO] Seed data') keepRows.push(r);
          });
          attendanceSheet.clear();
          const newA = [ATTENDANCE_HEADERS].concat(keepRows);
          attendanceSheet.getRange(1, 1, newA.length, ATTENDANCE_HEADERS.length).setValues(newA);
          attendanceSheet.getRange(1, 1, 1, ATTENDANCE_HEADERS.length).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
          formatAndTrimSheet(attendanceSheet, ATTENDANCE_HEADERS.length, newA.length, '#4f46e5');
        }
      } catch (ae) {}
    } else {
      ensureAttendanceDummySeeds_(attendanceSheet);
      formatAndTrimSheet(attendanceSheet, ATTENDANCE_HEADERS.length, attendanceSheet.getLastRow(), '#4f46e5');
    }
  } catch (err) {
    Logger.log('Error creating readable sheets: ' + err.toString());
  }
}
