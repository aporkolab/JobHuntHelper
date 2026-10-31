/**
 * @fileoverview Main script file containing the entry-point functions.
 * This file orchestrates the script's primary operations by calling functions
 * from the other modules.
 */

/* exported onOpen, setupTriggers, checkApplications, generateReports */
/* global createCustomMenu, getColumnIndices_, getApplicationData, createCalendarFollowUpEvent,
   createFollowUpEmailDraft, getSheet_, getEffectiveSettings_, toApplication_, isFollowUpDue_,
   notifyUser_, toDate_, toText_ */


// Simple trigger that runs when the spreadsheet is opened.
function onOpen() {
  createCustomMenu();
}

/**
 * Sets up the time-based triggers for automatically checking applications.
 * It deletes any existing triggers to prevent duplicates before creating new ones.
 */
function setupTriggers() {
  // Delete existing triggers to avoid duplicates
  const existingTriggers = ScriptApp.getProjectTriggers();
  existingTriggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkApplications') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create a trigger to run every day between 8 and 9 AM.
  ScriptApp.newTrigger('checkApplications')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  notifyUser_('Triggers have been set up successfully. ' +
    'The script will automatically check your applications every morning.');
}

/**
 * The core function that checks all job applications and determines if a follow-up is needed.
 * Runs both from the menu/sidebar and from the daily time-driven trigger (where no UI is available).
 * @returns {string} A summary of the check.
 */
function checkApplications() {
  const settings = getEffectiveSettings_();
  const indices = getColumnIndices_();
  const { data, backgrounds } = getApplicationData();
  const sheet = getSheet_();
  const today = new Date();
  const errors = [];
  let processed = 0;

  data.forEach((row, rowIndex) => {
    const application = toApplication_(row, indices, rowIndex + 2);

    // --- Validation ---
    if (!toDate_(application.applicationTime) || !toText_(application.companyName)) {
      Logger.log(`Skipping row ${application.rowNumber} due to missing or invalid Application Time or Company Name.`);
      return;
    }

    if (!isFollowUpDue_(application, backgrounds[rowIndex], indices, today, settings.reminderDays)) {
      return;
    }

    // --- Action ---
    Logger.log(`Action needed for ${application.companyName} (Row ${application.rowNumber}).`);
    try {
      createCalendarFollowUpEvent(application, settings);
      createFollowUpEmailDraft(application, settings);
      // Mark that a follow-up has been processed by changing the background color
      sheet.getRange(application.rowNumber, indices.interestedMessages + 1).setBackground(CONFIG.colors.followUpSent);
      processed++;
    } catch (e) {
      Logger.log(`Error processing application for ${application.companyName}: ${e.message}`);
      errors.push(`'${application.companyName}': ${e.message}`);
    }
  });

  let summary = `Application check complete. Follow-ups created: ${processed}.`;
  if (errors.length > 0) {
    summary += `\nErrors (${errors.length}):\n${errors.join('\n')}`;
  }
  notifyUser_(summary);
  return summary;
}

/**
 * Generates a report sheet with charts summarizing application data.
 * @returns {string} A summary message.
 */
function generateReports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let reportSheet = ss.getSheetByName(CONFIG.reports.sheetName);

  if (reportSheet) {
    // Start from a clean sheet so that stale data from a previous run does not linger.
    reportSheet.getCharts().forEach(chart => reportSheet.removeChart(chart));
    reportSheet.clear();
  } else {
    reportSheet = ss.insertSheet(CONFIG.reports.sheetName);
  }

  const appSheet = getSheet_();
  const lastRow = appSheet.getLastRow();
  if (lastRow < 2) {
    const message = 'No application data to report.';
    reportSheet.appendRow([message]);
    return message;
  }

  // --- Chart 1: Applications by Language ---
  const indices = getColumnIndices_();
  const langData = appSheet.getRange(2, indices.language + 1, lastRow - 1, 1).getValues();
  const langCounts = countByLanguage_(langData);

  const langChartData = [['Language', 'Count'], ...Object.entries(langCounts)];
  const langChartRange = reportSheet.getRange(2, 2, langChartData.length, 2);
  langChartRange.setValues(langChartData);

  const pieChart = reportSheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(langChartRange)
    .setPosition(2, 5, 0, 0)
    .setOption('title', CONFIG.reports.charts.applicationsByLanguage.title)
    .build();

  reportSheet.insertChart(pieChart);

  ss.setActiveSheet(reportSheet);
  const message = 'Reports have been generated successfully.';
  notifyUser_(message);
  return message;
}

/**
 * Counts applications per language.
 * @param {any[][]} langData Single-column values of the Language column.
 * @returns {Object<string, number>} Count per language; empty cells are counted as 'Not Specified'.
 */
function countByLanguage_(langData) {
  return langData.reduce((acc, [lang]) => {
    const key = toText_(lang) || 'Not Specified';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
