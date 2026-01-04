/**
 * Processes submissions by reader, preserving hyperlinks and handling missing sheets.
 * Updated for 2026.
 */
function assignNewSubmissions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = ss.getSheetByName("Submissions Main");
  const ui = SpreadsheetApp.getUi();
  
  if (!mainSheet) {
    throw new Error("Sheet 'Submissions Main' not found.");
  }

  // Retrieve Reader names (Column D) and Rich Text titles (Column A)
  // Starting from row 2 to skip headers
  const lastRowMain = mainSheet.getLastRow();
  if (lastRowMain < 2) return; // Exit if no data

  const readerData = mainSheet.getRange(2, 4, lastRowMain - 1, 1).getValues();
  const titleRichTexts = mainSheet.getRange(2, 1, lastRowMain - 1, 1).getRichTextValues();
  
  const assignments = {};

  // Group data into an object by reader
  readerData.forEach((row, index) => {
    const reader = row[0];
    const titleRT = titleRichTexts[index][0];
    
    if (reader && titleRT && titleRT.getText()) {
      if (!assignments[reader]) assignments[reader] = [];
      assignments[reader].push(titleRT);
    }
  });

  // Iterate over assigned readers
  for (const reader in assignments) {
    try {
      const readerSheet = ss.getSheetByName(reader);
      
      // Update: Throws specific error if reader tab is missing
      if (!readerSheet) {
        throw new Error("I'm sorry, a reader named '" + reader + "' doesn't exist. Please add them to the Readers tab, run the Add New Reader Sheets command, and try this again.");
      }

      const lastRowReader = readerSheet.getLastRow();
      const existingRTs = lastRowReader > 0 ? readerSheet.getRange(1, 1, lastRowReader, 1).getRichTextValues().flat() : [];
      
      // Strip spaces from existing titles for accurate comparison
      const existingTextOnlyTrimmed = existingRTs.map(rt => rt.getText().trim());

      assignments[reader].forEach(newTitleRT => {
        const titleTextTrimmed = newTitleRT.getText().trim();
        const titleLink = newTitleRT.getLinkUrl();
        const existingIndex = existingTextOnlyTrimmed.indexOf(titleTextTrimmed);

        if (existingIndex === -1) {
          // Case: New title—Insert with original Rich Text (link preserved)
          const nextRow = readerSheet.getLastRow() + 1;
          readerSheet.getRange(nextRow, 1).setRichTextValue(newTitleRT);
          
          // Updated: Set dropdown value to "Unread" (Capitalized)
          readerSheet.getRange(nextRow, 2).setValue("Unread");
          
          // Update local arrays to prevent internal duplicates during the same run
          existingTextOnlyTrimmed.push(titleTextTrimmed);
          existingRTs.push(newTitleRT);
        } else if (titleLink) {
          // Case: Title exists—Add link if the existing entry is missing one
          const existingRT = existingRTs[existingIndex];
          if (!existingRT.getLinkUrl()) {
            readerSheet.getRange(existingIndex + 1, 1).setRichTextValue(newTitleRT);
          }
        }
      });

    } catch (err) {
      // Alert the specific missing reader error but continue the loop
      ui.alert(err.message);
      Logger.log("Skipping Reader: " + reader + " | Error: " + err.message);
      continue; 
    }
  }
}

