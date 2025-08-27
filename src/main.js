/**
 * @fileoverview Main script file containing the entry-point functions.
 * This file orchestrates the script's primary operations by calling functions
 * from the other modules.
 */

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

  SpreadsheetApp.getUi().alert('Triggers have been set up successfully. The script will automatically check your applications every morning.');
}

/**
 * The core function that checks all job applications and determines if a follow-up is needed.
 */
function checkApplications() {
  const indices = getColumnIndices_();
  const { data, backgrounds } = getApplicationData();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  data.forEach((row, rowIndex) => {
    // Construct a structured object for the current application
    const application = {
      companyName: row[indices.companyName],
      position: row[indices.position],
      applicationForm: row[indices.applicationForm],
      language: row[indices.language],
      applicationTime: row[indices.applicationTime],
      warningMessage: row[indices.warningMessage],
      interestedMessages: row[indices.interestedMessages],
      contactName: row[indices.contactName],
      contactEmail: row[indices.contactEmail],
      rowNumber: rowIndex + 2 // For logging/debugging
    };

    // --- Validation ---
    if (!application.applicationTime || !application.companyName) {
      Logger.log(`Skipping row ${application.rowNumber} due to missing Application Time or Company Name.`);
      return;
    }

    // --- Condition Checks ---
    const appDate = new Date(application.applicationTime);
    appDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - appDate) / (1000 * 3600 * 24));

    const warningCellBg = backgrounds[rowIndex][indices.warningMessage];
    const interestedCellBg = backgrounds[rowIndex][indices.interestedMessages];

    const needsFollowUp = warningCellBg === CONFIG.colors.followUpNeeded;
    const isEmailApplication = application.applicationForm && application.applicationForm.toLowerCase().includes('e-mail');
    const followUpSent = interestedCellBg === CONFIG.colors.followUpSent;
    const responseReceived = warningCellBg === CONFIG.colors.responseReceived;

    // --- Action ---
    if (isEmailApplication && needsFollowUp && !followUpSent && !responseReceived && daysDiff >= CONFIG.reminderDaysAfter) {
      Logger.log(`Action needed for ${application.companyName} (Row ${application.rowNumber}).`);
      try {
        createCalendarFollowUpEvent(application);
        createFollowUpEmailDraft(application);
        // Mark that a follow-up has been processed by changing the background color
        const sheet = getSheet_();
        sheet.getRange(rowIndex + 2, indices.interestedMessages + 1).setBackground(CONFIG.colors.followUpSent);
      } catch (e) {
        Logger.log(`Error processing application for ${application.companyName}: ${e.message}`);
        SpreadsheetApp.getUi().alert(`An error occurred while processing '${application.companyName}': ${e.message}`);
      }
    }
  });

  SpreadsheetApp.getUi().alert('Application check complete.');
}

/**
 * Generates a report sheet with charts summarizing application data.
 */
function generateReports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let reportSheet = ss.getSheetByName(CONFIG.reports.sheetName);

  if (reportSheet) {
    // Clear existing charts if the sheet exists
    const charts = reportSheet.getCharts();
    charts.forEach(chart => reportSheet.removeChart(chart));
  } else {
    reportSheet = ss.insertSheet(CONFIG.reports.sheetName);
  }

  const appSheet = getSheet_();
  const lastRow = appSheet.getLastRow();
  if (lastRow < 2) {
    reportSheet.appendRow(['No application data to report.']);
    return;
  }

  // --- Chart 1: Applications by Language ---
  const indices = getColumnIndices_();
  const langData = appSheet.getRange(2, indices.language + 1, lastRow - 1, 1).getValues();
  const langCounts = langData.reduce((acc, [lang]) => {
    lang = lang || 'Not Specified';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

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

  SpreadsheetApp.setActiveSheet(reportSheet);
  SpreadsheetApp.getUi().alert('Reports have been generated successfully.');
}

/**
 * Saves user-specific settings to PropertiesService.
 * @param {object} settings The settings object to save.
 */
function saveUserSettings(settings) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperties({
    'userName': settings.name,
    'userPhone': settings.phone,
    'reminderDays': settings.reminderDays,
  });
}

/**
 * Retrieves user-specific settings from PropertiesService.
 * @returns {object} The user's settings.
 */
function getUserSettings() {
  const userProperties = PropertiesService.getUserProperties();
  return {
    name: userProperties.getProperty('userName'),
    phone: userProperties.getProperty('userPhone'),
    reminderDays: userProperties.getProperty('reminderDays'),
  };
}
