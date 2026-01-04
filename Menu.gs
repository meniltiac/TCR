function addTCRMenu() {
  SpreadsheetApp.getUi()
    .createMenu('Coachella Review')
    .addItem('Add New Reader Sheets', 'createReaderSheetsFromTemplate')
    .addItem('Update Yes List', 'copyQueriesToYesList')
    .addItem('Assign New Submissions', 'assignNewSubmissions')
    .addToUi();
}


