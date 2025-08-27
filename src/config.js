/**
 * @fileoverview Configuration for the Job Hunt Helper script.
 *
 * This file centralizes all settings, making it easier to manage and update the script's behavior.
 * Using header names instead of column letters makes the script more robust against changes in the
 * spreadsheet layout.
 */

const CONFIG = {
  // The name of the sheet the script should operate on.
  sheetName: 'Applications', // A more descriptive name for the sheet.

  // Names of the columns the script interacts with.
  // These should match the header row in your spreadsheet exactly.
  headers: {
    companyName: 'Company Name',
    position: 'Position',
    applicationForm: 'Application Form',
    language: 'Language',
    applicationTime: 'Application Time',
    warningMessage: 'Warning Message Column',
    interestedMessages: 'Number of Interested Messages',
    contactName: 'Name of the Contact Person',
    contactEmail: 'Contact E-mail Address',
  },

  // General behavior settings
  reminderDaysAfter: 8, // Days to wait before sending a follow-up reminder.

  // UI/Style settings
  colors: {
    followUpNeeded: '#fbbc04',   // Yellow - action is needed from the user.
    followUpSent: '#ea4335',     // Red - a follow-up has been sent.
    responseReceived: '#00ff00', // Green - a response has been received.
  },

  // User-specific settings.
  // In the future, these will be managed via a UI and stored in PropertiesService.
  user: {
    // The ID of the calendar to create events in. 'primary' is the user's default calendar.
    calendarId: 'primary',
    // These will be replaced with user's actual data in email drafts.
    name: '[YOUR NAME]',
    phone: '[YOUR PHONE NUMBER]',
  },

  // Report generation settings
  reports: {
    sheetName: 'Reports',
    charts: {
      applicationStatus: {
        title: 'Application Status Overview',
      },
      applicationsByLanguage: {
        title: 'Applications by Language',
      }
    }
  }
};
