/**
 * Syncs statuses from 'Yes List' and Reader sheets back to 'Submissions Main'.
 * Key: Title (Col A) + Author (Col B).
 * Updates Column F with data and Column E with "Decision Made".
 */
function syncDecisionsToMain() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = ss.getSheetByName('Submissions Main');
  const yesListSheet = ss.getSheetByName('Yes List');
  const readersListSheet = ss.getSheetByName('Readers');

  if (!mainSheet || !yesListSheet || !readersListSheet) {
    throw new Error("Missing one of the required sheets: Submissions Main, Yes List, or Readers.");
  }

  // 1. Map 'Submissions Main' (Title + Author -> Row Index)
  const mainData = mainSheet.getDataRange().getValues();
  const mainMap = new Map();
  for (let i = 1; i < mainData.length; i++) {
    const key = generateKey(mainData[i][0], mainData[i][1]);
    if (key) mainMap.set(key, i + 1); 
  }

  // --- PART A: SYNC FROM YES LIST ---
  const yesData = yesListSheet.getDataRange().getValues();
  for (let i = 1; i < yesData.length; i++) {
    const key = generateKey(yesData[i][0], yesData[i][1]);
    const valueF = yesData[i][5]; // Column F (index 5)

    if (mainMap.has(key) && valueF !== "") {
      const mainRow = mainMap.get(key);
      // Update Column F with the data
      mainSheet.getRange(mainRow, 6).setValue(valueF); 
      // Update Column E to "Decision Made"
      mainSheet.getRange(mainRow, 5).setValue("Decision Made");
    }
  }

  // --- PART B: SYNC "NO" FROM READER SHEETS ---
  const readerNames = readersListSheet.getRange(2, 1, readersListSheet.getLastRow() - 1, 1).getValues().flat();

  readerNames.forEach(name => {
    const readerSheet = ss.getSheetByName(name);
    if (!readerSheet) return;

    const readerData = readerSheet.getDataRange().getValues();
    for (let i = 1; i < readerData.length; i++) {
      const statusC = String(readerData[i][2]).trim(); // Column C
      const key = generateKey(readerData[i][0], readerData[i][1]);

      if (statusC.toLowerCase() === "no" && mainMap.has(key)) {
        const mainRow = mainMap.get(key);
        // Set Column F to "Reject"
        mainSheet.getRange(mainRow, 6).setValue("Reject");
        // Set Column E to "Decision Made"
        mainSheet.getRange(mainRow, 5).setValue("Decision Made");
      }
    }
  });

  SpreadsheetApp.getUi().alert("Main Sheet sync complete!");
}

/**
 * Helper function to create a unique identifier for each submission
 */
function generateKey(title, author) {
  if (!title || !author) return null;
  return (String(title).trim() + "|" + String(author).trim()).toLowerCase();
}
