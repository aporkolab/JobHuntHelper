/**
 * @fileoverview User settings stored in PropertiesService and managed from the Control Panel sidebar.
 */

/* exported getUserSettings, saveUserSettings, getEffectiveSettings_ */
/* global toText_ */

const SETTINGS_KEYS_ = Object.freeze({
  name: 'userName',
  phone: 'userPhone',
  reminderDays: 'reminderDays',
});

/**
 * Parses and validates the reminder days value.
 * @param {*} value The raw value (usually a string from the sidebar form).
 * @returns {number|null} The number of days, or null if it is not a whole number within the allowed range.
 */
function parseReminderDays_(value) {
  if (value === null || value === undefined || toText_(value) === '') {
    return null;
  }
  const days = Number(value);
  const { min, max } = CONFIG.reminderDaysLimits;
  return Number.isInteger(days) && days >= min && days <= max ? days : null;
}

/**
 * Retrieves the settings the user saved in the Control Panel.
 * @returns {{name: string, phone: string, reminderDays: number}} The stored settings;
 *     reminderDays falls back to the configured default.
 */
function getUserSettings() {
  const userProperties = PropertiesService.getUserProperties();
  const reminderDays = parseReminderDays_(userProperties.getProperty(SETTINGS_KEYS_.reminderDays));
  return {
    name: toText_(userProperties.getProperty(SETTINGS_KEYS_.name)),
    phone: toText_(userProperties.getProperty(SETTINGS_KEYS_.phone)),
    reminderDays: reminderDays === null ? CONFIG.reminderDaysAfter : reminderDays,
  };
}

/**
 * Validates and saves user-specific settings to PropertiesService.
 * @param {{name: string, phone: string, reminderDays: (string|number)}} settings The settings to save.
 * @returns {{name: string, phone: string, reminderDays: number}} The settings as stored.
 */
function saveUserSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    throw new Error('No settings were provided.');
  }
  const reminderDays = parseReminderDays_(settings.reminderDays);
  if (reminderDays === null) {
    const { min, max } = CONFIG.reminderDaysLimits;
    throw new Error(`Reminder days must be a whole number between ${min} and ${max}.`);
  }

  PropertiesService.getUserProperties().setProperties({
    [SETTINGS_KEYS_.name]: toText_(settings.name),
    [SETTINGS_KEYS_.phone]: toText_(settings.phone),
    [SETTINGS_KEYS_.reminderDays]: String(reminderDays),
  });
  return getUserSettings();
}

/**
 * Returns the settings the script should actually use: the user's saved values,
 * falling back to the defaults in CONFIG.
 * @returns {{name: string, phone: string, reminderDays: number}} The effective settings.
 */
function getEffectiveSettings_() {
  const stored = getUserSettings();
  return {
    name: stored.name || CONFIG.user.name,
    phone: stored.phone || CONFIG.user.phone,
    reminderDays: stored.reminderDays,
  };
}
