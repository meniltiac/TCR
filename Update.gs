/**
 * Syncs data from 'Queries' to 'Yes List'.
 * Both sheets now expect: Column A = Title, Column B = Author.
 */
function copyQueriesToYesList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const queriesSheet = ss.getSheetByName('Queries');
  const yesListSheet = ss.getSheetByName('Yes List');

  if (!queriesSheet || !yesListSheet) {
    throw new Error('One or both sheets not found.');
  }

  // Column Index Constants
  const TITLE_COL = 0;  // Column A
  const AUTHOR_COL = 1; // Column B

  // null = update all columns except Title
  const UPDATE_COLS = null;

  const queriesData = queriesSheet.getDataRange().getValues();
  const yesListData = yesListSheet.getDataRange().getValues();

  // 1. Build Queries map: lowercase title → full row array
  const queriesMap = new Map();
  for (const row of queriesData) {
    const title = row[TITLE_COL];
    if (title && title !== '') {
      queriesMap.set(String(title).toLowerCase(), row);
    }
  }

  // 2. Build Yes List map (SKIP ROW 1): lowercase title → row index
  const yesListMap = new Map();
  for (let i = 1; i < yesListData.length; i++) {
    const title = yesListData[i][TITLE_COL];
    if (title && title !== '') {
      yesListMap.set(String(title).toLowerCase(), i);
    }
  }

  const titlesSeen = new Set();

  // 3. Add or Update Rows
  for (const [titleKey, queryRow] of queriesMap.entries()) {
    if (yesListMap.has(titleKey)) {
      // --- UPDATE EXISTING ROW ---
      const yesRowIndex = yesListMap.get(titleKey);
      const yesRow = yesListData[yesRowIndex];
      let changed = false;

      // Determine which columns to sync (Default: skip Title at index 0)
      const colsToUpdate =
        UPDATE_COLS ??
        queryRow.map((_, i) => i).filter(i => i !== TITLE_COL);

      for (const col of colsToUpdate) {
        // If the Queries data (including Author in Col B) differs from Yes List, update it
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
      // --- APPEND NEW ROW ---
      // This will now include Author because it appends the entire queryRow
      yesListSheet.appendRow(queryRow);
    }

    titlesSeen.add(titleKey);
  }

  // 4. Delete rows from 'Yes List' if they no longer exist in 'Queries'
  // (Process bottom-to-top to maintain correct indexing)
  for (let i = yesListData.length - 1; i >= 1; i--) {
    const title = yesListData[i][TITLE_COL];
    if (title !== '' && !titlesSeen.has(String(title).toLowerCase())) {
      yesListSheet.deleteRow(i + 1);
    }
  }
}
