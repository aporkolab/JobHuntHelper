const { createGasMocks, loadGas } = require('./helpers/gas');

describe('settings', () => {
  describe('getUserSettings', () => {
    it('returns empty values and the default reminder days when nothing is stored', () => {
      const gas = loadGas();
      expect({ ...gas.getUserSettings() }).toEqual({ name: '', phone: '', reminderDays: 8 });
    });

    it('returns stored values with reminder days as a number', () => {
      const gas = loadGas(createGasMocks({
        properties: { userName: 'Ádám', userPhone: '+36 1 234 5678', reminderDays: '5' },
      }));
      expect({ ...gas.getUserSettings() }).toEqual({ name: 'Ádám', phone: '+36 1 234 5678', reminderDays: 5 });
    });

    it('falls back to the default when the stored reminder days are invalid', () => {
      const gas = loadGas(createGasMocks({ properties: { reminderDays: 'abc' } }));
      expect(gas.getUserSettings().reminderDays).toBe(8);
    });
  });

  describe('saveUserSettings', () => {
    it('stores trimmed values and returns the saved settings', () => {
      const mocks = createGasMocks();
      const gas = loadGas(mocks);

      const saved = gas.saveUserSettings({ name: '  Ádám ', phone: ' 123 ', reminderDays: '10' });

      expect(mocks.__.store).toEqual({ userName: 'Ádám', userPhone: '123', reminderDays: '10' });
      expect({ ...saved }).toEqual({ name: 'Ádám', phone: '123', reminderDays: 10 });
    });

    it.each(['0', '31', '2.5', '', 'abc', undefined])('rejects reminder days %p', value => {
      const mocks = createGasMocks();
      const gas = loadGas(mocks);
      expect(() => gas.saveUserSettings({ name: 'A', phone: 'B', reminderDays: value }))
        .toThrow('Reminder days must be a whole number between 1 and 30.');
      expect(mocks.__.userProperties.setProperties).not.toHaveBeenCalled();
    });

    it('rejects a missing payload', () => {
      expect(() => loadGas().saveUserSettings(undefined)).toThrow('No settings were provided.');
    });
  });

  describe('getEffectiveSettings_', () => {
    it('falls back to CONFIG values for missing name and phone', () => {
      const gas = loadGas();
      expect({ ...gas.getEffectiveSettings_() }).toEqual({
        name: '[YOUR NAME]',
        phone: '[YOUR PHONE NUMBER]',
        reminderDays: 8,
      });
    });

    it('prefers the saved settings', () => {
      const gas = loadGas(createGasMocks({
        properties: { userName: 'Ádám', userPhone: '123', reminderDays: '3' },
      }));
      expect({ ...gas.getEffectiveSettings_() }).toEqual({ name: 'Ádám', phone: '123', reminderDays: 3 });
    });
  });
});
