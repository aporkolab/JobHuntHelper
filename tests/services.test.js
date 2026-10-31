const { createGasMocks, loadGas } = require('./helpers/gas');

const settings = { name: 'Ádám', phone: '123', reminderDays: 8 };

function application(overrides = {}) {
  return {
    companyName: 'Acme',
    position: 'Engineer',
    applicationTime: new Date(2023, 9, 2),
    language: 'English',
    contactName: 'Jane Doe',
    contactEmail: 'jane@acme.example',
    ...overrides,
  };
}

describe('services', () => {
  describe('getNextWorkday_', () => {
    const gas = loadGas();

    it('returns the next day at 8 AM if it is a weekday', () => {
      const result = gas.getNextWorkday_(new Date(2023, 9, 10, 10)); // Tuesday
      expect(result.getDay()).toBe(3);
      expect(result.getDate()).toBe(11);
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(0);
    });

    it('skips to Monday if the next day is a Saturday', () => {
      const result = gas.getNextWorkday_(new Date(2023, 9, 13, 10)); // Friday
      expect(result.getDay()).toBe(1);
      expect(result.getDate()).toBe(16);
    });

    it('skips to Monday if the next day is a Sunday', () => {
      const result = gas.getNextWorkday_(new Date(2023, 9, 14, 10)); // Saturday
      expect(result.getDay()).toBe(1);
      expect(result.getDate()).toBe(16);
    });
  });

  describe('buildFollowUpEmail_', () => {
    const gas = loadGas();

    it('builds an English email with the signature from the settings', () => {
      const { subject, body } = gas.buildFollowUpEmail_(application(), settings);
      expect(subject).toBe('Following up on my application for the Engineer');
      expect(body).toContain('Dear Jane Doe,');
      expect(body).toContain('which I submitted on 2023-10-02');
      expect(body.endsWith('Best regards,\nÁdám\n123')).toBe(true);
    });

    it.each(['hu', 'HU', 'Hungarian', 'magyar'])('builds a Hungarian email for language %p', language => {
      const { subject, body } = gas.buildFollowUpEmail_(application({ language }), settings);
      expect(subject).toBe('Érdeklődés a(z) Engineer pozíció kapcsán');
      expect(body).toContain('Kedves Jane Doe!');
      expect(body).toContain('2023-10-02 napon');
    });

    it('uses generic wording when contact and position are missing', () => {
      const { subject, body } = gas.buildFollowUpEmail_(
        application({ contactName: '', position: '' }), settings);
      expect(subject).toBe('Following up on my application for the position');
      expect(body).toContain('Dear Hiring Manager,');
    });
  });

  describe('createCalendarFollowUpEvent', () => {
    it('creates a 30-minute event on the next workday after the reminder period', () => {
      const mocks = createGasMocks();
      loadGas(mocks).createCalendarFollowUpEvent(application(), { ...settings, reminderDays: 5 });

      // 2023-10-02 + 5 days = Saturday 10-07, the next workday is Monday 10-09.
      const [title, start, end, options] = mocks.__.calendar.createEvent.mock.calls[0];
      expect(title).toBe('Follow-up for Acme');
      expect(start.getTime()).toBe(new Date(2023, 9, 9, 8).getTime());
      expect(end - start).toBe(30 * 60 * 1000);
      expect(options.description).toContain('Engineer');
    });

    it('uses the saved reminder days when no settings are passed', () => {
      const mocks = createGasMocks({ properties: { reminderDays: '1' } });
      loadGas(mocks).createCalendarFollowUpEvent(application());
      const start = mocks.__.calendar.createEvent.mock.calls[0][1];
      expect(start.getTime()).toBe(new Date(2023, 9, 4, 8).getTime());
    });

    it('does not create a duplicate event', () => {
      const mocks = createGasMocks();
      mocks.__.calendar.getEventsForDay.mockReturnValue([{}]);
      loadGas(mocks).createCalendarFollowUpEvent(application(), settings);
      expect(mocks.__.calendar.createEvent).not.toHaveBeenCalled();
    });

    it('throws when the calendar does not exist', () => {
      const mocks = createGasMocks();
      mocks.CalendarApp.getCalendarById.mockReturnValue(null);
      expect(() => loadGas(mocks).createCalendarFollowUpEvent(application(), settings))
        .toThrow('Could not find Google Calendar with ID: primary.');
    });

    it('throws for an invalid application time', () => {
      expect(() => loadGas().createCalendarFollowUpEvent(application({ applicationTime: 'x' }), settings))
        .toThrow('Invalid Application Time for Acme.');
    });
  });

  describe('createFollowUpEmailDraft', () => {
    it('creates a draft', () => {
      const mocks = createGasMocks();
      loadGas(mocks).createFollowUpEmailDraft(application(), settings);
      expect(mocks.GmailApp.createDraft).toHaveBeenCalledWith('jane@acme.example',
        'Following up on my application for the Engineer', expect.stringContaining('Ádám'));
    });

    it('skips applications without a contact email', () => {
      const mocks = createGasMocks();
      loadGas(mocks).createFollowUpEmailDraft(application({ contactEmail: '  ' }), settings);
      expect(mocks.GmailApp.getDrafts).not.toHaveBeenCalled();
      expect(mocks.GmailApp.createDraft).not.toHaveBeenCalled();
    });

    it('does not create a duplicate draft and tolerates unreadable drafts', () => {
      const mocks = createGasMocks();
      mocks.GmailApp.getDrafts.mockReturnValue([
        { getMessage: () => { throw new Error('deleted'); } },
        { getMessage: () => ({
          getTo: () => 'jane@acme.example',
          getSubject: () => 'Following up on my application for the Engineer',
        }) },
      ]);
      loadGas(mocks).createFollowUpEmailDraft(application(), settings);
      expect(mocks.GmailApp.createDraft).not.toHaveBeenCalled();
    });

    it('throws for an invalid application time', () => {
      expect(() => loadGas().createFollowUpEmailDraft(application({ applicationTime: null }), settings))
        .toThrow('Invalid Application Time for Acme.');
    });
  });
});
