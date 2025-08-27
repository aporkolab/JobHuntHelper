/**
 * @fileoverview A module for all interactions with the Google Spreadsheet.
 * This abstracts away the direct calls to SpreadsheetApp, making the main logic
 * cleaner and easier to test.
 */

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
    SpreadsheetApp.getUi().alert(`Sheet "${CONFIG.sheetName}" was not found and has been created for you. Please populate it with your data.`);
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
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const indices = {};

  // Create a reverse map from the CONFIG headers { 'Company Name': 'companyName' }
  const headerNameToKey = Object.keys(CONFIG.headers).reduce((acc, key) => {
    acc[CONFIG.headers[key]] = key;
    return acc;
  }, {});

  headerRow.forEach((header, index) => {
    const key = headerNameToKey[header];
    if (key) {
      indices[key] = index;
    }
  });

  // Validate that all required headers were found
  const missingHeaders = Object.keys(CONFIG.headers).filter(key => indices[key] === undefined);
  if (missingHeaders.length > 0) {
    throw new Error(`The following required columns are missing from the sheet: ${missingHeaders.join(', ')}`);
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

/**
 * Updates the background color of a specific row.
 * @param {number} rowIndex The 1-based index of the row to update.
 * @param {string} color The hex code for the new background color.
 */
function setRowBackground(rowIndex, color) {
  const sheet = getSheet_();
  // rowIndex is 0-based from getApplicationData, but sheet rows are 1-based, and we skip the header.
  const sheetRow = rowIndex + 2;
  sheet.getRange(sheetRow, 1, 1, sheet.getLastColumn()).setBackground(color);
}
