/**
 * @fileoverview Pure logic that decides whether an application needs a follow-up.
 */

/* exported toApplication_, daysBetween_, isFollowUpDue_ */
/* global toDate_, toText_ */

const MS_PER_DAY_ = 24 * 60 * 60 * 1000;

/**
 * Builds a structured application object from a sheet row.
 * @param {any[]} row The row values.
 * @param {Object<string, number>} indices The column indices from getColumnIndices_().
 * @param {number} rowNumber The 1-based sheet row number.
 * @returns {object} The application.
 */
function toApplication_(row, indices, rowNumber) {
  const application = { rowNumber };
  Object.keys(CONFIG.headers).forEach(key => {
    application[key] = row[indices[key]];
  });
  return application;
}

/**
 * Counts the calendar days between two dates, ignoring the time of day.
 * Rounding (instead of flooring) keeps the result correct across DST changes, where a day is 23 or 25 hours long.
 * @param {Date} from The earlier date.
 * @param {Date} to The later date.
 * @returns {number} The number of days from `from` to `to`.
 */
function daysBetween_(from, to) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - start) / MS_PER_DAY_);
}

/**
 * Decides whether a follow-up should be created for an application.
 * @param {object} application The application built by toApplication_().
 * @param {string[]} rowBackgrounds The background colors of the application's row.
 * @param {Object<string, number>} indices The column indices from getColumnIndices_().
 * @param {Date} today The current date.
 * @param {number} reminderDays Days to wait after the application before following up.
 * @returns {boolean} True if a follow-up is due.
 */
function isFollowUpDue_(application, rowBackgrounds, indices, today, reminderDays) {
  const appDate = toDate_(application.applicationTime);
  if (!appDate) {
    return false;
  }

  const warningCellBg = toText_(rowBackgrounds[indices.warningMessage]).toLowerCase();
  const interestedCellBg = toText_(rowBackgrounds[indices.interestedMessages]).toLowerCase();

  const isEmailApplication = toText_(application.applicationForm).toLowerCase().includes('e-mail');
  const needsFollowUp = warningCellBg === CONFIG.colors.followUpNeeded;
  const followUpSent = interestedCellBg === CONFIG.colors.followUpSent;

  return isEmailApplication && needsFollowUp && !followUpSent && daysBetween_(appDate, today) >= reminderDays;
}
