const { loadGas } = require('./helpers/gas');
const { HEADERS, YELLOW, RED, GREEN, row, backgroundsRow } = require('./fixtures');

describe('followup', () => {
  const gas = loadGas();
  const indices = Object.fromEntries(Object.keys(gas.CONFIG.headers)
    .map(key => [key, HEADERS.indexOf(gas.CONFIG.headers[key])]));

  describe('toApplication_', () => {
    it('maps a row to an application object', () => {
      const application = gas.toApplication_(row({ 'Company Name': 'Initech' }), indices, 5);
      expect(application.companyName).toBe('Initech');
      expect(application.contactEmail).toBe('jane@acme.example');
      expect(application.rowNumber).toBe(5);
    });
  });

  describe('daysBetween_', () => {
    it('ignores the time of day', () => {
      expect(gas.daysBetween_(new Date(2023, 9, 1, 23, 0), new Date(2023, 9, 2, 1, 0))).toBe(1);
    });

    describe('across a DST change', () => {
      const originalTz = process.env.TZ;
      beforeAll(() => {
        process.env.TZ = 'Europe/Budapest';
      });
      afterAll(() => {
        process.env.TZ = originalTz;
      });

      it('counts calendar days, not 24-hour periods', () => {
        // Clocks moved forward on 2023-03-26 in Budapest, so this span is 8 days minus one hour.
        expect(gas.daysBetween_(new Date(2023, 2, 20), new Date(2023, 2, 28))).toBe(8);
      });
    });
  });

  describe('isFollowUpDue_', () => {
    const today = new Date(2023, 9, 10); // 8 days after the default application time
    const due = (rowOverrides, colors, reminderDays = 8) =>
      gas.isFollowUpDue_(gas.toApplication_(row(rowOverrides), indices, 2), backgroundsRow(colors),
        indices, today, reminderDays);

    it('is due for an e-mail application marked yellow after the reminder period', () => {
      expect(due({}, { warning: YELLOW })).toBe(true);
    });

    it('accepts upper-case background colors', () => {
      expect(due({}, { warning: YELLOW.toUpperCase() })).toBe(true);
    });

    it('is not due before the reminder period has passed', () => {
      expect(due({}, { warning: YELLOW }, 9)).toBe(false);
    });

    it('is not due when the warning cell is not yellow', () => {
      expect(due({}, {})).toBe(false);
      expect(due({}, { warning: GREEN })).toBe(false);
    });

    it('is not due when a follow-up was already sent', () => {
      expect(due({}, { warning: YELLOW, interested: RED })).toBe(false);
    });

    it('is not due for non e-mail applications', () => {
      expect(due({ 'Application Form': 'Online form' }, { warning: YELLOW })).toBe(false);
    });

    it('does not fail on a non-text application form', () => {
      expect(due({ 'Application Form': 12 }, { warning: YELLOW })).toBe(false);
    });

    it('is not due for an invalid application time', () => {
      expect(due({ 'Application Time': 'soon' }, { warning: YELLOW })).toBe(false);
    });
  });
});
