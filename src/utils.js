/**
 * @fileoverview Utility functions for the project.
 */

/**
 * Includes the content of another HTML file.
 * This is used to bundle CSS and client-side JS into the main sidebar HTML file.
 * @param {string} filename The name of the file to include (e.g., 'stylesheet').
 * @returns {string} The content of the file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
