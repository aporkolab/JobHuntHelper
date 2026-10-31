/**
 * @fileoverview A module for all interactions with the Google Spreadsheet.
 * This abstracts away the direct calls to SpreadsheetApp, making the main logic
 * cleaner and easier to test.
 */

/* exported getSheet_, getColumnIndices_, getApplicationData */
/* global notifyUser_, toText_ */

/**
 * A cache for column indices to avoid re-reading the header row repeatedly.
 * @type {Object<string, number> | null}
 */
let columnIndices = null;

/**
 * Gets the active sheet based on the name specified in CONFIG.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The active spreadsheet.
 */
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheetName);
  if (!sheet) {
    // If the sheet doesn't exist, create it with a header row.
    const newSheet = ss.insertSheet(CONFIG.sheetName);
    const headers = Object.values(CONFIG.headers);
    newSheet.appendRow(headers);
    notifyUser_(`Sheet "${CONFIG.sheetName}" was not found and has been created for you. ` +
      'Please populate it with your data.');
    return newSheet;
  }
  return sheet;
}

/**
 * Reads the header row of the sheet and maps column names to their indices (0-based).
 * This is the key to making the script robust against column reordering.
 * @returns {Object<string, number>} A map of header names to column indices.
 */
function getColumnIndices_() {
  if (columnIndices) {
    return columnIndices;
  }

  const sheet = getSheet_();
  // An empty sheet reports 0 columns, but getRange needs at least one.
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const indices = {};

  // Create a reverse map from the CONFIG headers { 'Company Name': 'companyName' }
  const headerNameToKey = Object.keys(CONFIG.headers).reduce((acc, key) => {
    acc[CONFIG.headers[key]] = key;
    return acc;
  }, {});

  headerRow.forEach((header, index) => {
    const key = headerNameToKey[toText_(header)];
    if (key) {
      indices[key] = index;
    }
  });

  // Validate that all required headers were found
  const missingHeaders = Object.keys(CONFIG.headers).filter(key => indices[key] === undefined);
  if (missingHeaders.length > 0) {
    throw new Error(`The following required columns are missing from the sheet: ${missingHeaders.map(key => CONFIG.headers[key]).join(', ')}`);
  }

  columnIndices = indices;
  return columnIndices;
}

/**
 * Gets all application data from the sheet, skipping the header row.
 * @returns {{data: any[][], backgrounds: string[][]}} The values and background colors of the data range.
 */
function getApplicationData() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { data: [], backgrounds: [] }; // No data to process
  }
  const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  return {
    data: dataRange.getValues(),
    backgrounds: dataRange.getBackgrounds(),
  };
}
