const SHEET_NAME = 'Attendance';

function doPost(e) {
  let request;
  try {
    request = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid JSON' })).setMimeType(ContentService.MimeType.JSON);
  }

  const action = request.action;
  const data = request.data;
  let result;

  try {
    switch (action) {
      case 'getLastDate':
        result = getLastDate();
        break;
      case 'checkAttendance':
        result = checkAttendance(data); // data = date string
        break;
      case 'saveAttendance':
        result = saveAttendance(data); // data = attendance object
        break;
      case 'getSubjectStats':
        result = getSubjectStats();
        break;
      default:
        throw new Error('Action not found');
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ['Date', 'Day Name'];
    for (let i = 1; i <= 6; i++) {
      headers.push(`Subject${i}`, `Status${i}`, `Remark${i}`);
    }
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getLastDate() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;
  const lastDate = sheet.getRange(lastRow, 1).getValue();
  return Utilities.formatDate(new Date(lastDate), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function checkAttendance(dateStr) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (rowDate === dateStr) {
      const periods = [];
      for (let j = 0; j < 6; j++) {
        const colStart = 2 + (j * 3); // C, F, I, L, O, R
        if (data[i][colStart]) {
          periods.push({
            subject: data[i][colStart],
            status: data[i][colStart + 1],
            remark: data[i][colStart + 2]
          });
        }
      }
      return { found: true, periods };
    }
  }
  return { found: false };
}

function saveAttendance(payload) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const dateStr = payload.date;
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (rowDate === dateStr) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = [new Date(dateStr), payload.dayName];
  for (let i = 0; i < 6; i++) {
    const p = payload.periods[i];
    if (p) {
      rowData.push(p.subject, p.status, p.remark || '');
    } else {
      rowData.push('', '', '');
    }
  }

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return true;
}

function getSubjectStats() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const statsMap = {};

  for (let i = 1; i < data.length; i++) {
    for (let j = 0; j < 6; j++) {
      const colStart = 2 + (j * 3);
      const subject = data[i][colStart];
      const status = data[i][colStart + 1];

      if (!subject || status === 'NC') continue;

      if (!statsMap[subject]) {
        statsMap[subject] = { subject, total: 0, present: 0, absent: 0, massBunk: 0 };
      }

      statsMap[subject].total++;
      if (status === 'P') statsMap[subject].present++;
      else if (status === 'A') statsMap[subject].absent++;
      else if (status === 'MB') statsMap[subject].massBunk++;
    }
  }

  const statsArray = Object.values(statsMap).map(s => {
    const percentage = s.total > 0 ? (s.present / s.total) * 100 : 0;
    return {
      ...s,
      percentage: parseFloat(percentage.toFixed(2))
    };
  });

  return statsArray;
}
