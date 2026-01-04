function createReaderSheetsFromTemplate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const template = ss.getSheetByName('Reader Template');
  const listSheet = ss.getSheetByName('Readers'); // this is where the reader names are
  const queryCell = 'A1';

  if (!template || !listSheet) {
    throw new Error('Required sheet missing');
  }

  // 1. Create sheets from template
  const names = listSheet
    .getRange('A2:A')
    .getValues()
    .flat()
    .filter(String);

  const createdSheets = [];

  names.forEach(name => {
    if (!ss.getSheetByName(name)) {
      const newSheet = template.copyTo(ss);
      newSheet.setName(name);
      createdSheets.push(name);
      newSheet.activate();
      ss.moveActiveSheet(2);
    }
  });
    SpreadsheetApp.getUi().alert("Sheets Created! Go to Submissions Main to assign submissions to readers");
  }
