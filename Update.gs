/**
 * Scans all reader sheets for "Yes/Maybe", preserves links,
 * and syncs them to the "Yes List" without deleting existing data.
 * Updated to force-sync changes in Columns C and D.
 */
function syncReaderDecisionsToYesList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const readersSheet = ss.getSheetByName('Readers');
  const yesListSheet = ss.getSheetByName('Yes List');

  if (!readersSheet || !yesListSheet) {
    throw new Error("Ensure 'Readers' and 'Yes List' sheets exist.");
  }

  // 1. Get the list of Reader names from Column A (skip header)
  const readerNames = readersSheet.getRange(2, 1, readersSheet.getLastRow() - 1, 1).getValues().flat();

  // 2. Map existing data in "Yes List" to prevent duplicates and handle updates
  // We store the full row data to check for changes without re-calling the sheet
  const yesListData = yesListSheet.getDataRange().getValues();
  const yesListMap = new Map();
  for (let i = 1; i < yesListData.length; i++) {
    const title = String(yesListData[i][0]).toLowerCase().trim();
    if (title) {
      yesListMap.set(title, {
        rowIndex: i + 1,
        statusC: String(yesListData[i][2]),
        dataD: String(yesListData[i][3])
      });
    }
  }

  // 3. Iterate through each Reader's sheet
  readerNames.forEach(readerName => {
    const sheet = ss.getSheetByName(readerName);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    const richTextValues = sheet.getDataRange().getRichTextValues();

    for (let i = 1; i < data.length; i++) {
      const titleText = String(data[i][0]).trim();
      const titleKey = titleText.toLowerCase();
      const currentReaderStatus = String(data[i][2]); // Column C
      const currentReaderDataD = String(data[i][3]);  // Column D

      // Only process "Yes" or "Maybe (second read)"
      if (currentReaderStatus === "Yes" || currentReaderStatus === "Maybe (second read)") {
        const titleRichText = richTextValues[i][0];

        if (yesListMap.has(titleKey)) {
          // --- UPDATE CASE: Check if C or D have changed ---
          const existingEntry = yesListMap.get(titleKey);

          const hasStatusChanged = currentReaderStatus !== existingEntry.statusC;
          const hasDataDChanged = currentReaderDataD !== existingEntry.dataD;

          if (hasStatusChanged || hasDataDChanged) {
            const targetRowIndex = existingEntry.rowIndex;

            // Apply updates
            if (hasStatusChanged) yesListSheet.getRange(targetRowIndex, 3).setValue(currentReaderStatus);
            if (hasDataDChanged) yesListSheet.getRange(targetRowIndex, 4).setValue(currentReaderDataD);

            // Update local map so if another reader has the same title, it doesn't trigger again
            existingEntry.statusC = currentReaderStatus;
            existingEntry.dataD = currentReaderDataD;
          }

          // Optional: Re-apply link if it was missing in the Yes List
          const existingTitleRT = yesListSheet.getRange(existingEntry.rowIndex, 1).getRichTextValue();
          if (!existingTitleRT.getLinkUrl() && titleRichText.getLinkUrl()) {
             yesListSheet.getRange(existingEntry.rowIndex, 1).setRichTextValue(titleRichText);
          }

        } else {
          // --- NEW ENTRY CASE ---
          const nextRow = yesListSheet.getLastRow() + 1;
          yesListSheet.getRange(nextRow, 1, 1, data[i].length).setValues([data[i]]);
          yesListSheet.getRange(nextRow, 1).setRichTextValue(titleRichText);

          // Add to map to prevent duplicates within the same run
          yesListMap.set(titleKey, {
            rowIndex: nextRow,
            statusC: currentReaderStatus,
            dataD: currentReaderDataD
          });
        }
      }
    }
  });
  SpreadsheetApp.getUi().alert("Yes List Updated!");
}
