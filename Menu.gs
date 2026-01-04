function addTCRMenu() {
  SpreadsheetApp.getUi()
    .createMenu('Coachella Review')
    .addItem('Add New Reader Sheets', 'createReaderSheetsFromTemplate')
    .addItem('Assign Submissions', 'assignNewSubmissions')
    .addItem('Update Yes List', 'syncReaderDecisionsToYesList')
    .addItem('Update Submissions Main', 'syncDecisionsToMain')
    .addToUi();
}
