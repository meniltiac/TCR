function createReaderSheetsFromTemplate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const template = ss.getSheetByName('Reader Template');
  const listSheet = ss.getSheetByName('Readers'); // this is where the reader names are
  const querySheet = ss.getSheetByName('Queries'); // this is where the query for 'Yes List' lives
  const queryCell = 'A1';

  if (!template || !listSheet || !querySheet) {
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

  // 2. Collect ALL target sheets (existing + new)
  const sheetNames = ss.getSheets()
    .map(s => s.getName())
    .filter(n =>
      n !== 'Reader Template' &&
      n !== 'Queries' &&
      n !== 'Readers' &&
      n !== 'Instructions' &&
      n !== 'Yes List' &&
      n !== 'Submissions Main' &&
      n !== listSheet.getName()
    );

  // 3. Build the array literal
  const ranges = sheetNames
    .map(n => `'${n}'!A2:Z`)
    .join(';');

  // 4. Build the QUERY formula
  const formula =
    `=QUERY({${ranges}}, ` +
    `"select * where Col2 contains 'Yes' or Col2 contains 'Maybe (second read)'", 0)`;

  // 5. Write formula to master sheet
  querySheet.getRange(queryCell).setFormula(formula);
}
