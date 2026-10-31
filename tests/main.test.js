const { createGasMocks, createSheet, loadGas } = require('./helpers/gas');
const { HEADERS, YELLOW, RED, row, backgroundsRow } = require('./fixtures');

const INTERESTED_COLUMN = HEADERS.indexOf('Number of Interested Messages') + 1;

function setup({ rows, backgrounds, hasUi = true, properties = {} }) {
  const sheet = createSheet({
    values: [HEADERS, ...rows],
    backgrounds: [backgroundsRow(), ...backgrounds],
  });
  const mocks = createGasMocks({ sheets: { Applications: sheet }, hasUi, properties });
  return { sheet, mocks, gas: loadGas(mocks) };
}

describe('main', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2023, 9, 10, 9) });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkApplications', () => {
    it('creates an event and a draft for due applications and marks them as sent', () => {
      const { sheet, mocks, gas } = setup({
        rows: [row(), row({ 'Company Name': 'Initech' })],
        backgrounds: [backgroundsRow({ warning: YELLOW }), backgroundsRow()],
      });

      const summary = gas.checkApplications();

      expect(mocks.__.calendar.createEvent).toHaveBeenCalledTimes(1);
      expect(mocks.GmailApp.createDraft).toHaveBeenCalledTimes(1);
      expect(sheet.setBackgroundCalls).toEqual([{ row: 2, column: INTERESTED_COLUMN, color: RED }]);
      expect(summary).toBe('Application check complete. Follow-ups created: 1.');
      expect(mocks.__.ui.alert).toHaveBeenCalledWith(summary);
    });

    it('uses the reminder days saved in the settings', () => {
      const { mocks, gas } = setup({
        rows: [row()],
        backgrounds: [backgroundsRow({ warning: YELLOW })],
        properties: { reminderDays: '9' },
      });
      gas.checkApplications();
      expect(mocks.GmailApp.createDraft).not.toHaveBeenCalled();
    });

    it('signs the draft with the saved name', () => {
      const { mocks, gas } = setup({
        rows: [row()],
        backgrounds: [backgroundsRow({ warning: YELLOW })],
        properties: { userName: 'Ádám', userPhone: '123' },
      });
      gas.checkApplications();
      expect(mocks.GmailApp.createDraft.mock.calls[0][2]).toContain('Ádám\n123');
    });

    it('skips rows without company name or with an invalid date', () => {
      const { mocks, gas } = setup({
        rows: [row({ 'Company Name': ' ' }), row({ 'Application Time': 'tomorrow-ish' })],
        backgrounds: [backgroundsRow({ warning: YELLOW }), backgroundsRow({ warning: YELLOW })],
      });
      expect(gas.checkApplications()).toBe('Application check complete. Follow-ups created: 0.');
      expect(mocks.__.calendar.createEvent).not.toHaveBeenCalled();
    });

    it('works from a time-driven trigger where there is no UI', () => {
      const { mocks, gas } = setup({
        rows: [row()],
        backgrounds: [backgroundsRow({ warning: YELLOW })],
        hasUi: false,
      });
      expect(gas.checkApplications()).toBe('Application check complete. Follow-ups created: 1.');
      expect(mocks.GmailApp.createDraft).toHaveBeenCalledTimes(1);
    });

    it('continues after an error and reports all errors once', () => {
      const { sheet, mocks, gas } = setup({
        rows: [row({ 'Company Name': 'Broken' }), row()],
        backgrounds: [backgroundsRow({ warning: YELLOW }), backgroundsRow({ warning: YELLOW })],
      });
      mocks.__.calendar.createEvent.mockImplementationOnce(() => {
        throw new Error('Quota exceeded');
      });

      const summary = gas.checkApplications();

      expect(summary).toBe("Application check complete. Follow-ups created: 1.\nErrors (1):\n'Broken': Quota exceeded");
      expect(sheet.setBackgroundCalls).toEqual([{ row: 3, column: INTERESTED_COLUMN, color: RED }]);
      expect(mocks.__.ui.alert).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateReports', () => {
    it('writes the language counts and inserts a pie chart', () => {
      const { mocks, gas } = setup({
        rows: [row(), row({ Language: 'hu' }), row({ Language: '' })],
        backgrounds: [backgroundsRow(), backgroundsRow(), backgroundsRow()],
      });

      expect(gas.generateReports()).toBe('Reports have been generated successfully.');

      const report = mocks.__.sheets.Reports;
      expect(report.values.slice(1).map(r => r.slice(1, 3))).toEqual([
        ['Language', 'Count'], ['English', 1], ['hu', 1], ['Not Specified', 1],
      ]);
      expect(report.charts).toHaveLength(1);
      expect(report.charts[0].options.title).toBe('Applications by Language');
      expect(mocks.__.spreadsheet.setActiveSheet).toHaveBeenCalledWith(report);
    });

    it('replaces the previous report instead of leaving stale data behind', () => {
      const { mocks, gas } = setup({
        rows: [row(), row({ Language: 'hu' }), row({ Language: 'de' })],
        backgrounds: [backgroundsRow(), backgroundsRow(), backgroundsRow()],
      });
      gas.generateReports();
      mocks.__.sheets.Applications.values.splice(2); // Keep only one application.

      gas.generateReports();

      const report = mocks.__.sheets.Reports;
      expect(report.clear).toHaveBeenCalled();
      expect(report.values.filter(r => r && r.length)).toEqual([[undefined, 'Language', 'Count'], [undefined, 'English', 1]]);
      expect(report.charts).toHaveLength(1);
    });

    it('notes when there is no data', () => {
      const { mocks, gas } = setup({ rows: [], backgrounds: [] });
      expect(gas.generateReports()).toBe('No application data to report.');
      expect(mocks.__.sheets.Reports.values).toEqual([['No application data to report.']]);
    });
  });

  describe('setupTriggers', () => {
    it('replaces the existing checkApplications trigger with a daily one', () => {
      const mocks = createGasMocks();
      const oldTrigger = { getHandlerFunction: () => 'checkApplications' };
      const otherTrigger = { getHandlerFunction: () => 'somethingElse' };
      mocks.ScriptApp.getProjectTriggers.mockReturnValue([oldTrigger, otherTrigger]);

      loadGas(mocks).setupTriggers();

      expect(mocks.ScriptApp.deleteTrigger).toHaveBeenCalledTimes(1);
      expect(mocks.ScriptApp.deleteTrigger).toHaveBeenCalledWith(oldTrigger);
      expect(mocks.ScriptApp.newTrigger).toHaveBeenCalledWith('checkApplications');
      expect(mocks.__.triggerBuilder.everyDays).toHaveBeenCalledWith(1);
      expect(mocks.__.triggerBuilder.atHour).toHaveBeenCalledWith(8);
      expect(mocks.__.triggerBuilder.create).toHaveBeenCalled();
    });
  });
});
