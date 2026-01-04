/**
 * Processes submissions by reader, preserving hyperlinks and handling missing sheets.
 * Updated for 2026: Now includes Author data in Column B.
 */
function assignNewSubmissions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = ss.getSheetByName("Submissions Main");
  const ui = SpreadsheetApp.getUi();

  if (!mainSheet) {
    throw new Error("Sheet 'Submissions Main' not found.");
  }

  const lastRowMain = mainSheet.getLastRow();
  if (lastRowMain < 2) return;

  // --- 1. GET DATA ---
  // Column A (1): Title (Rich Text), Column B (2): Author, Column D (4): Reader
  const titleRichTexts = mainSheet.getRange(2, 1, lastRowMain - 1, 1).getRichTextValues();
  const authorData = mainSheet.getRange(2, 2, lastRowMain - 1, 1).getValues();
  const readerData = mainSheet.getRange(2, 4, lastRowMain - 1, 1).getValues();

  const assignments = {};

  // --- 2. BUNDLE DATA ---
  readerData.forEach((row, index) => {
    const reader = row[0];
    const titleRT = titleRichTexts[index][0];
    const authorName = authorData[index][0];

    if (reader && titleRT && titleRT.getText()) {
      if (!assignments[reader]) assignments[reader] = [];
      // We store both the RichText Title and the Author string
      assignments[reader].push({ title: titleRT, author: authorName });
    }
  });

  for (const reader in assignments) {
    try {
      const readerSheet = ss.getSheetByName(reader);

      if (!readerSheet) {
        throw new Error("I'm sorry, a reader named '" + reader + "' doesn't exist. Please add them to the Readers tab, run the Add New Reader Sheets command, and try this again.");
      }

      const lastRowReader = readerSheet.getLastRow();
      const existingRTs = lastRowReader > 0 ? readerSheet.getRange(1, 1, lastRowReader, 1).getRichTextValues().flat() : [];
      const existingTextOnlyTrimmed = existingRTs.map(rt => rt.getText().trim());

      assignments[reader].forEach(item => {
        const newTitleRT = item.title;
        const newAuthor = item.author;
        const titleTextTrimmed = newTitleRT.getText().trim();
        const titleLink = newTitleRT.getLinkUrl();
        const existingIndex = existingTextOnlyTrimmed.indexOf(titleTextTrimmed);

        if (existingIndex === -1) {
          // --- 3. WRITE NEW DATA ---
          const nextRow = readerSheet.getLastRow() + 1;

          // Column A: Title
          readerSheet.getRange(nextRow, 1).setRichTextValue(newTitleRT);

          // Column B: Author (Added per request)
          readerSheet.getRange(nextRow, 2).setValue(newAuthor);

          // Column C: Status (Moved from B to C to accommodate author)
          readerSheet.getRange(nextRow, 3).setValue("Unread");

          existingTextOnlyTrimmed.push(titleTextTrimmed);
        } else if (titleLink) {
          const existingRT = existingRTs[existingIndex];
          if (!existingRT.getLinkUrl()) {
            readerSheet.getRange(existingIndex + 1, 1).setRichTextValue(newTitleRT);
          }
        }
      });

    } catch (err) {
      ui.alert(err.message);
      Logger.log("Skipping Reader: " + reader + " | Error: " + err.message);
      continue;
    }
  }
}
