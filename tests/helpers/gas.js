/**
 * @fileoverview Loads the Apps Script sources into an isolated V8 context, mimicking the
 * Apps Script runtime where all script files share one global scope.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC_DIR = path.join(__dirname, '..', '..', 'src');
// The clasp push order doubles as the load order, so tests and deployment agree on it.
const LOAD_ORDER = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', '.clasp.json.example'), 'utf8')).filePushOrder;

/**
 * Creates a fake sheet backed by in-memory values and backgrounds.
 * @param {{values?: any[][], backgrounds?: string[][]}} [options] Initial content, header row included.
 * @returns {object} The fake sheet.
 */
function createSheet({ values = [], backgrounds } = {}) {
  const sheet = {
    values: values.map(row => [...row]),
    backgrounds: (backgrounds || values.map(row => row.map(() => '#ffffff'))).map(row => [...row]),
    charts: [],
    setBackgroundCalls: [],
    getLastRow: jest.fn(() => sheet.values.length),
    getLastColumn: jest.fn(() => sheet.values.reduce((max, row) => Math.max(max, row.length), 0)),
    appendRow: jest.fn(row => {
      sheet.values.push([...row]);
      sheet.backgrounds.push(row.map(() => '#ffffff'));
    }),
    clear: jest.fn(() => {
      sheet.values = [];
      sheet.backgrounds = [];
    }),
    getRange: jest.fn((row, column, numRows = 1, numColumns = 1) => {
      if (numColumns < 1 || numRows < 1) {
        throw new Error('The number of rows and columns in the range must be at least 1.');
      }
      const slice = source => Array.from({ length: numRows }, (_, r) =>
        Array.from({ length: numColumns }, (_, c) => (source[row - 1 + r] || [])[column - 1 + c] ?? ''));
      return {
        getValues: () => slice(sheet.values),
        getBackgrounds: () => slice(sheet.backgrounds),
        setValues: jest.fn(newValues => {
          newValues.forEach((newRow, r) => newRow.forEach((value, c) => {
            sheet.values[row - 1 + r] = sheet.values[row - 1 + r] || [];
            sheet.values[row - 1 + r][column - 1 + c] = value;
          }));
        }),
        setBackground: jest.fn(color => {
          sheet.setBackgroundCalls.push({ row, column, color });
          sheet.backgrounds[row - 1] = sheet.backgrounds[row - 1] || [];
          sheet.backgrounds[row - 1][column - 1] = color;
        }),
      };
    }),
    getCharts: jest.fn(() => [...sheet.charts]),
    removeChart: jest.fn(chart => {
      sheet.charts = sheet.charts.filter(c => c !== chart);
    }),
    newChart: jest.fn(() => {
      const builder = {
        options: {},
        setChartType: jest.fn(() => builder),
        addRange: jest.fn(() => builder),
        setPosition: jest.fn(() => builder),
        setOption: jest.fn((key, value) => {
          builder.options[key] = value;
          return builder;
        }),
        build: jest.fn(() => ({ options: builder.options })),
      };
      return builder;
    }),
    insertChart: jest.fn(chart => sheet.charts.push(chart)),
  };
  return sheet;
}

/**
 * Creates mocks for the Apps Script services used by the project.
 * @param {{sheets?: Object<string, object>, hasUi?: boolean, properties?: Object<string, string>}} [options]
 * @returns {object} The mocked globals, plus helpers under `__`.
 */
function createGasMocks({ sheets = {}, hasUi = true, properties = {} } = {}) {
  const store = { ...properties };
  const ui = {
    alert: jest.fn(),
    showSidebar: jest.fn(),
    createMenu: jest.fn(() => {
      const menu = {
        addItem: jest.fn(() => menu),
        addSeparator: jest.fn(() => menu),
        addToUi: jest.fn(),
      };
      return menu;
    }),
  };
  const spreadsheet = {
    getSheetByName: jest.fn(name => sheets[name] || null),
    insertSheet: jest.fn(name => {
      sheets[name] = createSheet();
      return sheets[name];
    }),
    setActiveSheet: jest.fn(),
  };
  const calendar = {
    createEvent: jest.fn(),
    getEventsForDay: jest.fn(() => []),
  };
  const userProperties = {
    getProperty: jest.fn(key => (key in store ? store[key] : null)),
    setProperties: jest.fn(values => Object.assign(store, values)),
  };
  const triggerBuilder = {
    timeBased: jest.fn(() => triggerBuilder),
    everyDays: jest.fn(() => triggerBuilder),
    atHour: jest.fn(() => triggerBuilder),
    create: jest.fn(),
  };

  return {
    Logger: { log: jest.fn() },
    SpreadsheetApp: {
      getActiveSpreadsheet: jest.fn(() => spreadsheet),
      getUi: jest.fn(() => {
        if (!hasUi) {
          throw new Error('Cannot call SpreadsheetApp.getUi() from this context.');
        }
        return ui;
      }),
    },
    CalendarApp: { getCalendarById: jest.fn(() => calendar) },
    GmailApp: { getDrafts: jest.fn(() => []), createDraft: jest.fn() },
    PropertiesService: { getUserProperties: jest.fn(() => userProperties) },
    HtmlService: {
      createTemplateFromFile: jest.fn(() => {
        const output = { setTitle: jest.fn(() => output), setWidth: jest.fn(() => output) };
        return { evaluate: jest.fn(() => output) };
      }),
      createHtmlOutputFromFile: jest.fn(name => ({ getContent: () => `<content of ${name}>` })),
    },
    Session: { getScriptTimeZone: jest.fn(() => 'UTC') },
    Utilities: {
      // Formats in the process time zone, like the real one does in the script time zone.
      formatDate: jest.fn(date => [date.getFullYear(), date.getMonth() + 1, date.getDate()]
        .map((part, i) => String(part).padStart(i === 0 ? 4 : 2, '0')).join('-')),
    },
    Charts: { ChartType: { PIE: 'PIE' } },
    ScriptApp: {
      getProjectTriggers: jest.fn(() => []),
      deleteTrigger: jest.fn(),
      newTrigger: jest.fn(() => triggerBuilder),
    },
    __: { ui, spreadsheet, sheets, calendar, store, userProperties, triggerBuilder },
  };
}

/**
 * Loads every script file into a fresh context.
 * @param {object} [mocks] Globals created by createGasMocks().
 * @returns {object} The context; script functions are available as its properties.
 */
function loadGas(mocks = createGasMocks()) {
  // Share the test realm's Date so that Jest fake timers also control the script's clock.
  const context = vm.createContext({ Date, ...mocks });
  LOAD_ORDER.forEach(file => {
    const filename = path.join(SRC_DIR, '..', file);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  });
  return context;
}

module.exports = { createGasMocks, createSheet, loadGas };
