/**
 * @fileoverview Utility functions for the project.
 */

/* exported include, notifyUser_, toDate_, toText_ */

/**
 * Includes the content of another HTML file.
 * This is used to bundle CSS and client-side JS into the main sidebar HTML file.
 * @param {string} filename The project path of the file to include (e.g., 'html/stylesheet').
 * @returns {string} The content of the file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Logs a message and shows it as an alert when a UI is available.
 * Time-driven triggers run without a UI, where SpreadsheetApp.getUi() throws,
 * so in that context the message is only logged.
 * @param {string} message The message to show.
 */
function notifyUser_(message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch {
    // No UI in this execution context (e.g. a time-driven trigger).
  }
}

/**
 * Converts a cell value to a Date.
 * @param {*} value A Date, a date string or a timestamp.
 * @returns {Date|null} A new Date instance, or null if the value is empty or not a valid date.
 */
function toDate_(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Converts a cell value to a trimmed string.
 * @param {*} value Any cell value.
 * @returns {string} The trimmed string, or an empty string for null/undefined.
 */
function toText_(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}
