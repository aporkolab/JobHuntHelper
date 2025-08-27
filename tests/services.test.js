// The function under test, copied from src/services.js
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

describe('getNextWorkday_', () => {
  it('should return the next day if it is a weekday', () => {
    // A Tuesday
    const date = new Date('2023-10-10T10:00:00Z');
    const result = getNextWorkday_(date);
    // Should be Wednesday Oct 11, at 8 AM
    expect(result.getUTCDay()).toBe(3); // Wednesday
    expect(result.getUTCDate()).toBe(11);
    expect(result.getUTCHours()).toBe(8);
  });

  it('should skip to Monday if the next day is a Saturday', () => {
    // A Friday
    const date = new Date('2023-10-13T10:00:00Z');
    const result = getNextWorkday_(date);
    // Should be Monday Oct 16, at 8 AM
    expect(result.getUTCDay()).toBe(1); // Monday
    expect(result.getUTCDate()).toBe(16);
    expect(result.getUTCHours()).toBe(8);
  });

  it('should skip to Monday if the next day is a Sunday', () => {
    // A Saturday
    const date = new Date('2023-10-14T10:00:00Z');
    const result = getNextWorkday_(date);
    // Should be Monday Oct 16, at 8 AM
    expect(result.getUTCDay()).toBe(1); // Monday
    expect(result.getUTCDate()).toBe(16);
    expect(result.getUTCHours()).toBe(8);
  });
});
