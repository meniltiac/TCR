function addTCRMenu() {
  SpreadsheetApp.getUi()
    .createMenu('Coachella Review')
    .addItem('Add New Reader Sheets', 'createReaderSheetsFromTemplate')
    .addItem('Assign New Submissions', 'assignNewSubmissions')
    .addItem('Update Yes List', 'copyQueriesToYesList')
    .addToUi();
}
