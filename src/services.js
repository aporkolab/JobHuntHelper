/**
 * @fileoverview A module for interacting with Google Services like Calendar and Gmail.
 */

/* exported createCalendarFollowUpEvent, createFollowUpEmailDraft, buildFollowUpEmail_ */
/* global getEffectiveSettings_, toDate_, toText_ */

/**
 * Finds the next workday from a given date, skipping weekends.
 * @param {Date} date The starting date.
 * @returns {Date} The next workday, set to 8:00 AM.
 */
function getNextWorkday_(date) {
  const nextWorkday = new Date(date);
  nextWorkday.setDate(nextWorkday.getDate() + 1); // Move to the next day

  const dayOfWeek = nextWorkday.getDay();
  if (dayOfWeek === 6) { // Saturday
    nextWorkday.setDate(nextWorkday.getDate() + 2); // Move to Monday
  } else if (dayOfWeek === 0) { // Sunday
    nextWorkday.setDate(nextWorkday.getDate() + 1); // Move to Monday
  }

  nextWorkday.setHours(8, 0, 0, 0); // Set time to 8:00 AM
  return nextWorkday;
}

/**
 * Creates a follow-up event in the user's Google Calendar.
 * @param {object} application The application data for the current row.
 * @param {{reminderDays: number}} [settings] The effective user settings.
 */
function createCalendarFollowUpEvent(application, settings = getEffectiveSettings_()) {
  const calendar = CalendarApp.getCalendarById(CONFIG.user.calendarId);
  if (!calendar) {
    throw new Error(`Could not find Google Calendar with ID: ${CONFIG.user.calendarId}. ` +
      'Please check the calendar ID in the configuration.');
  }

  const applicationDate = toDate_(application.applicationTime);
  if (!applicationDate) {
    throw new Error(`Invalid Application Time for ${application.companyName}.`);
  }

  const eventName = `Follow-up for ${application.companyName}`;
  const reminderDate = new Date(applicationDate);
  reminderDate.setDate(reminderDate.getDate() + settings.reminderDays);
  const nextWorkday = getNextWorkday_(reminderDate);

  // Check if a similar event already exists to avoid duplicates
  const existingEvents = calendar.getEventsForDay(nextWorkday, { search: eventName });
  if (existingEvents.length > 0) {
    Logger.log(`An event already exists for "${eventName}" on ${nextWorkday.toDateString()}. Skipping creation.`);
    return;
  }

  calendar.createEvent(
    eventName,
    nextWorkday,
    new Date(nextWorkday.getTime() + 30 * 60 * 1000), // 30-minute duration
    { description: `Check the application status for the ${application.position} position.` }
  );
  Logger.log(`Calendar event created: "${eventName}"`);
}

/**
 * Tells whether the application language is Hungarian ('hu', 'hun', 'Hungarian', 'magyar', ...).
 * @param {*} language The value of the Language column.
 * @returns {boolean} True for Hungarian.
 */
function isHungarian_(language) {
  const normalized = toText_(language).toLowerCase();
  return normalized.startsWith('hu') || normalized.startsWith('magyar');
}

/**
 * Builds the subject and body of the follow-up email in the application's language.
 * @param {object} application The application data for the current row.
 * @param {{name: string, phone: string}} settings The effective user settings.
 * @returns {{subject: string, body: string}} The email content.
 */
function buildFollowUpEmail_(application, settings) {
  const { contactName, position, applicationTime, language } = application;
  const formattedDate = Utilities.formatDate(toDate_(applicationTime), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const signature = `${settings.name}\n${settings.phone}`;

  if (isHungarian_(language)) {
    return {
      subject: `Érdeklődés a(z) ${position || 'megpályázott'} pozíció kapcsán`,
      body: `Kedves ${contactName || 'Hölgyem/Uram'}!\n\n` +
        `Szeretnék érdeklődni a(z) ${formattedDate} napon elküldött, ` +
        `"${position || 'megpályázott'}" pozícióra vonatkozó jelentkezésem állapotáról.\n\n` +
        'Amennyiben további információra van szükségük, állok rendelkezésre.\n\n' +
        'Köszönettel,\n' +
        signature,
    };
  }

  // Default to English
  return {
    subject: `Following up on my application for the ${position || 'position'}`,
    body: `Dear ${contactName || 'Hiring Manager'},\n\n` +
      'I hope you are well. I am writing to follow up on my application for the ' +
      `"${position || 'position'}" role, which I submitted on ${formattedDate}.\n\n` +
      'I am very interested in this opportunity and would appreciate an update on the status of my application.\n\n' +
      'Thank you for your time and consideration.\n\n' +
      'Best regards,\n' +
      signature,
  };
}

/**
 * Creates a draft follow-up email in the user's Gmail.
 * @param {object} application The application data for the current row.
 * @param {{name: string, phone: string}} [settings] The effective user settings.
 */
function createFollowUpEmailDraft(application, settings = getEffectiveSettings_()) {
  const contactEmail = toText_(application.contactEmail);
  if (!contactEmail) {
    Logger.log(`Skipping email draft for ${application.companyName} because no contact email is provided.`);
    return;
  }
  if (!toDate_(application.applicationTime)) {
    throw new Error(`Invalid Application Time for ${application.companyName}.`);
  }

  const { subject, body } = buildFollowUpEmail_(application, settings);

  // Check if a similar draft already exists
  const draftExists = GmailApp.getDrafts().some(draft => {
    try {
      const draftMessage = draft.getMessage();
      return draftMessage.getTo() === contactEmail && draftMessage.getSubject() === subject;
    } catch {
      return false;
    }
  });

  if (draftExists) {
    Logger.log(`A draft for ${contactEmail} with a similar subject already exists. Skipping creation.`);
    return;
  }
  GmailApp.createDraft(contactEmail, subject, body);
  Logger.log(`Email draft created for ${contactEmail}`);
}
