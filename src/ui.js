/**
 * @fileoverview A module for creating and managing the script's user interface,
 * including menus and sidebars.
 */

/**
 * Creates a custom menu in the spreadsheet UI when the document is opened.
 * This function is called by the onOpen simple trigger.
 */
function createCustomMenu() {
  SpreadsheetApp.getUi()
    .createMenu('Job Helper')
    .addItem('Open Control Panel', 'showSidebar')
    .addSeparator()
    .addItem('Manual Check for Follow-ups', 'checkApplications')
    .addItem('Manual Report Generation', 'generateReports')
    .addSeparator()
    .addItem('Setup Triggers', 'setupTriggers')
    .addToUi();
}

/**
 * Shows the main sidebar UI.
 */
function showSidebar() {
  const html = HtmlService.createTemplateFromFile('html/sidebar')
    .evaluate()
    .setTitle('Job Helper - Control Panel')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}
