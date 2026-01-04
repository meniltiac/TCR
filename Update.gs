function copyQueriesToYesList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const queriesSheet = ss.getSheetByName('Queries');
  const yesListSheet = ss.getSheetByName('Yes List');

  if (!queriesSheet || !yesListSheet) {
    throw new Error('One or both sheets not found.');
  }

  const TITLE_COL = 0; // Column A (0-based)

  // ⬇️ PARTIAL UPDATE CONFIG ⬇️
  // null = update all columns except Title
  // Example: [1,2] updates only columns B & C
  const UPDATE_COLS = null;

  const queriesData = queriesSheet.getDataRange().getValues();
  const yesListData = yesListSheet.getDataRange().getValues();

  // Build Queries map: lowercase title → row
  const queriesMap = new Map();
  for (const row of queriesData) {
    const title = row[TITLE_COL];
    if (title !== '') {
      queriesMap.set(String(title).toLowerCase(), row);
    }
  }

  // Build Yes List map (SKIP ROW 1): lowercase title → row index
  const yesListMap = new Map();
  for (let i = 1; i < yesListData.length; i++) {
    const title = yesListData[i][TITLE_COL];
    if (title !== '') {
      yesListMap.set(String(title).toLowerCase(), i);
    }
  }

  const titlesSeen = new Set();

  // Add / Update
  for (const [titleKey, queryRow] of queriesMap.entries()) {
    if (yesListMap.has(titleKey)) {
      const yesRowIndex = yesListMap.get(titleKey);
      const yesRow = yesListData[yesRowIndex];
      let changed = false;

      const colsToUpdate =
        UPDATE_COLS ??
        queryRow.map((_, i) => i).filter(i => i !== TITLE_COL);

      for (const col of colsToUpdate) {
        if (queryRow[col] !== yesRow[col]) {
          yesRow[col] = queryRow[col];
          changed = true;
        }
      }

      if (changed) {
        yesListSheet
          .getRange(yesRowIndex + 1, 1, 1, yesRow.length)
          .setValues([yesRow]);
      }
    } else {
      // Append new row (below protected row)
      yesListSheet.appendRow(queryRow);
    }

    titlesSeen.add(titleKey);
  }

  // Delete rows not in Queries (SKIP ROW 1, bottom → top)
  for (let i = yesListData.length - 1; i >= 1; i--) {
    const title = yesListData[i][TITLE_COL];
    if (title !== '' && !titlesSeen.has(String(title).toLowerCase())) {
      yesListSheet.deleteRow(i + 1);
    }
  }
}

