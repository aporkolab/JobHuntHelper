/**
 * @fileoverview A module for interacting with Google Services like Calendar and Gmail.
 */

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
 */
function createCalendarFollowUpEvent(application) {
  const calendar = CalendarApp.getCalendarById(CONFIG.user.calendarId);
  if (!calendar) {
    throw new Error(`Could not find Google Calendar with ID: ${CONFIG.user.calendarId}. Please check the calendar ID in the configuration.`);
  }

  const eventName = `Follow-up for ${application.companyName}`;
  const reminderDate = new Date(application.applicationTime);
  reminderDate.setDate(reminderDate.getDate() + CONFIG.reminderDaysAfter);
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
 * Creates a draft follow-up email in the user's Gmail.
 * @param {object} application The application data for the current row.
 */
function createFollowUpEmailDraft(application) {
  const { contactEmail, contactName, position, applicationTime, language } = application;

  if (!contactEmail) {
    Logger.log(`Skipping email draft for ${application.companyName} because no contact email is provided.`);
    return;
  }

  const formattedDate = Utilities.formatDate(new Date(applicationTime), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  let subject, message;

  if (language && language.toLowerCase().startsWith('hu')) {
    subject = `Érdeklődés a(z) ${position || 'megpályázott'} pozíció kapcsán`;
    message = `Kedves ${contactName || 'Hölgyem/Uram'}!\n\n` +
      `Szeretnék érdeklődni a(z) ${formattedDate} napon elküldött, ` +
      `"${position || 'megpályázott'}" pozícióra vonatkozó jelentkezésem állapotáról.\n\n` +
      `Amennyiben további információra van szükségük, állok rendelkezésre.\n\n` +
      `Köszönettel,\n` +
      `${CONFIG.user.name}\n` +
      `${CONFIG.user.phone}`;
  } else { // Default to English
    subject = `Following up on my application for the ${position || 'position'}`;
    message = `Dear ${contactName || 'Hiring Manager'},\n\n` +
      `I hope you are well. I am writing to follow up on my application for the ` +
      `"${position || 'position'}" role, which I submitted on ${formattedDate}.\n\n` +
      `I am very interested in this opportunity and would appreciate an update on the status of my application.\n\n` +
      `Thank you for your time and consideration.\n\n` +
      `Best regards,\n` +
      `${CONFIG.user.name}\n` +
      `${CONFIG.user.phone}`;
  }

  // Check if a similar draft already exists
  const existingDrafts = GmailApp.getDrafts();
  const draftExists = existingDrafts.some(draft => {
    try {
      const draftMessage = draft.getMessage();
      return draftMessage.getTo() === contactEmail && draftMessage.getSubject() === subject;
    } catch (e) {
      // Some messages might not be accessible and throw an error.
      return false;
    }
  });

  if (!draftExists) {
    GmailApp.createDraft(contactEmail, subject, message);
    Logger.log(`Email draft created for ${contactEmail}`);
  } else {
    Logger.log(`A draft for ${contactEmail} with a similar subject already exists. Skipping creation.`);
  }
}
