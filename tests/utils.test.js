const { createGasMocks, loadGas } = require('./helpers/gas');

describe('utils', () => {
  describe('toDate_', () => {
    const gas = loadGas();

    it('returns null for empty values', () => {
      expect(gas.toDate_(null)).toBeNull();
      expect(gas.toDate_(undefined)).toBeNull();
      expect(gas.toDate_('')).toBeNull();
    });

    it('returns null for unparsable values', () => {
      expect(gas.toDate_('not a date')).toBeNull();
    });

    it('returns a copy of a Date', () => {
      const original = new Date(2023, 9, 10);
      const result = gas.toDate_(original);
      expect(result.getTime()).toBe(original.getTime());
      result.setDate(1);
      expect(original.getDate()).toBe(10);
    });

    it('parses date strings', () => {
      expect(gas.toDate_('2023-10-10T00:00:00Z').getTime()).toBe(Date.UTC(2023, 9, 10));
    });
  });

  describe('toText_', () => {
    const gas = loadGas();

    it('trims and stringifies values', () => {
      expect(gas.toText_('  hello ')).toBe('hello');
      expect(gas.toText_(42)).toBe('42');
      expect(gas.toText_(null)).toBe('');
      expect(gas.toText_(undefined)).toBe('');
    });
  });

  describe('notifyUser_', () => {
    it('logs and alerts when a UI is available', () => {
      const mocks = createGasMocks();
      loadGas(mocks).notifyUser_('Hello');
      expect(mocks.Logger.log).toHaveBeenCalledWith('Hello');
      expect(mocks.__.ui.alert).toHaveBeenCalledWith('Hello');
    });

    it('only logs when there is no UI (time-driven trigger)', () => {
      const mocks = createGasMocks({ hasUi: false });
      expect(() => loadGas(mocks).notifyUser_('Hello')).not.toThrow();
      expect(mocks.Logger.log).toHaveBeenCalledWith('Hello');
      expect(mocks.__.ui.alert).not.toHaveBeenCalled();
    });
  });

  describe('include', () => {
    it('returns the content of the given HTML file', () => {
      const mocks = createGasMocks();
      expect(loadGas(mocks).include('html/stylesheet')).toBe('<content of html/stylesheet>');
      expect(mocks.HtmlService.createHtmlOutputFromFile).toHaveBeenCalledWith('html/stylesheet');
    });
  });
});
