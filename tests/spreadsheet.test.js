const { createGasMocks, createSheet, loadGas } = require('./helpers/gas');
const { HEADERS, row } = require('./fixtures');

describe('spreadsheet', () => {
  describe('getSheet_', () => {
    it('returns the existing Applications sheet', () => {
      const sheet = createSheet({ values: [HEADERS] });
      const gas = loadGas(createGasMocks({ sheets: { Applications: sheet } }));
      expect(gas.getSheet_()).toBe(sheet);
    });

    it('creates the sheet with the header row when it is missing', () => {
      const mocks = createGasMocks();
      const sheet = loadGas(mocks).getSheet_();
      expect(mocks.__.spreadsheet.insertSheet).toHaveBeenCalledWith('Applications');
      expect(sheet.values).toEqual([HEADERS]);
      expect(mocks.__.ui.alert).toHaveBeenCalledWith(expect.stringContaining('has been created for you'));
    });
  });

  describe('getColumnIndices_', () => {
    it('maps headers to 0-based indices regardless of column order and surrounding spaces', () => {
      const shuffled = [...HEADERS].reverse().map(header => ` ${header} `);
      const gas = loadGas(createGasMocks({ sheets: { Applications: createSheet({ values: [shuffled] }) } }));
      const indices = gas.getColumnIndices_();
      expect(indices.companyName).toBe(HEADERS.length - 1);
      expect(indices.contactEmail).toBe(0);
    });

    it('lists the missing header names', () => {
      const headers = HEADERS.filter(header => header !== 'Language' && header !== 'Position');
      const gas = loadGas(createGasMocks({ sheets: { Applications: createSheet({ values: [headers] }) } }));
      expect(() => gas.getColumnIndices_())
        .toThrow('The following required columns are missing from the sheet: Position, Language');
    });

    it('reports missing headers instead of crashing on an empty sheet', () => {
      const gas = loadGas(createGasMocks({ sheets: { Applications: createSheet() } }));
      expect(() => gas.getColumnIndices_()).toThrow('The following required columns are missing');
    });
  });

  describe('getApplicationData', () => {
    it('returns empty arrays when there are no data rows', () => {
      const gas = loadGas(createGasMocks({ sheets: { Applications: createSheet({ values: [HEADERS] }) } }));
      expect(JSON.parse(JSON.stringify(gas.getApplicationData()))).toEqual({ data: [], backgrounds: [] });
    });

    it('returns values and backgrounds without the header row', () => {
      const sheet = createSheet({ values: [HEADERS, row(), row({ 'Company Name': 'Initech' })] });
      const gas = loadGas(createGasMocks({ sheets: { Applications: sheet } }));
      const { data, backgrounds } = gas.getApplicationData();
      expect(data.map(r => r[0])).toEqual(['Acme', 'Initech']);
      expect(backgrounds).toHaveLength(2);
    });
  });
});
