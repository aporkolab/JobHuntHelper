/**
 * @fileoverview Shared test data for the Applications sheet.
 */

const HEADERS = [
  'Company Name', 'Position', 'Application Form', 'Language', 'Application Time',
  'Warning Message Column', 'Number of Interested Messages', 'Name of the Contact Person', 'Contact E-mail Address',
];

const YELLOW = '#fbbc04';
const RED = '#ea4335';
const GREEN = '#00ff00';
const WHITE = '#ffffff';

/**
 * Builds a sheet row in HEADERS order.
 * @param {object} overrides Values keyed by header name.
 * @returns {any[]} The row.
 */
function row(overrides = {}) {
  const defaults = {
    'Company Name': 'Acme',
    'Position': 'Engineer',
    'Application Form': 'E-mail',
    'Language': 'English',
    'Application Time': new Date(2023, 9, 2),
    'Warning Message Column': '',
    'Number of Interested Messages': 0,
    'Name of the Contact Person': 'Jane Doe',
    'Contact E-mail Address': 'jane@acme.example',
  };
  const values = { ...defaults, ...overrides };
  return HEADERS.map(header => values[header]);
}

/**
 * Builds the background colors of a row.
 * @param {{warning?: string, interested?: string}} colors Colors of the two status cells.
 * @returns {string[]} The backgrounds.
 */
function backgroundsRow({ warning = WHITE, interested = WHITE } = {}) {
  return HEADERS.map(header => {
    if (header === 'Warning Message Column') return warning;
    if (header === 'Number of Interested Messages') return interested;
    return WHITE;
  });
}

module.exports = { HEADERS, YELLOW, RED, GREEN, WHITE, row, backgroundsRow };
