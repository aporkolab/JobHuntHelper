/**
 * @fileoverview Mocks for Google Apps Script global objects.
 * This file is used by Jest to simulate the Apps Script environment during tests.
 */

const mockCache = {
  get: jest.fn(),
  put: jest.fn(),
};

const mockProperties = {
  getProperty: jest.fn(),
  setProperty: jest.fn(),
  setProperties: jest.fn(),
  getProperties: jest.fn(() => ({})),
  deleteProperty: jest.fn(),
};

global.Logger = {
  log: jest.fn(console.log),
};

global.SpreadsheetApp = {
  getActiveSpreadsheet: jest.fn(() => ({
    getSheetByName: jest.fn(() => ({
      appendRow: jest.fn(),
      getRange: jest.fn(() => ({
        getValues: jest.fn(() => [[]]),
        getBackgrounds: jest.fn(() => [[]]),
        setBackground: jest.fn(),
        setValues: jest.fn(),
      })),
      getLastRow: jest.fn(() => 1),
      getLastColumn: jest.fn(() => 1),
      insertSheet: jest.fn(),
      removeChart: jest.fn(),
      newChart: jest.fn(() => ({
        setChartType: jest.fn().mockReturnThis(),
        addRange: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setOption: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnThis(),
      })),
      insertChart: jest.fn(),
    })),
    setActiveSheet: jest.fn(),
  })),
  getUi: jest.fn(() => ({
    createMenu: jest.fn(() => ({
      addItem: jest.fn().mockReturnThis(),
      addSeparator: jest.fn().mockReturnThis(),
      addToUi: jest.fn(),
    })),
    alert: jest.fn(),
    showSidebar: jest.fn(),
  })),
};

global.GmailApp = {
  createDraft: jest.fn(),
  getDrafts: jest.fn(() => []),
};

global.CalendarApp = {
  getCalendarById: jest.fn(() => ({
    createEvent: jest.fn(),
    getEventsForDay: jest.fn(() => []),
  })),
};

global.PropertiesService = {
  getUserProperties: jest.fn(() => mockProperties),
  getScriptProperties: jest.fn(() => mockProperties),
  getDocumentProperties: jest.fn(() => mockProperties),
};

global.HtmlService = {
  createTemplateFromFile: jest.fn(() => ({
    evaluate: jest.fn(() => ({
        setTitle: jest.fn().mockReturnThis(),
        setWidth: jest.fn().mockReturnThis(),
    })),
  })),
  createHtmlOutputFromFile: jest.fn(() => ({
    getContent: jest.fn(),
  })),
};

global.Session = {
  getScriptTimeZone: jest.fn(() => 'America/New_York'),
};

global.Utilities = {
  formatDate: jest.fn((date, tz, format) => {
    // Simple formatter for testing purposes
    const d = new Date(date);
    return `${d.getFullYear()}-0${d.getMonth()+1}-${d.getDate()}`;
  }),
};

global.Charts = {
  ChartType: {
    PIE: 'PIE',
  },
};

global.ScriptApp = {
    getProjectTriggers: jest.fn(() => []),
    newTrigger: jest.fn(() => ({
        timeBased: jest.fn().mockReturnThis(),
        everyDays: jest.fn().mockReturnThis(),
        atHour: jest.fn().mockReturnThis(),
        create: jest.fn(),
    })),
    deleteTrigger: jest.fn(),
}
