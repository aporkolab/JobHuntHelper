module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Tests load the Apps Script sources through tests/helpers/gas.js.
  testMatch: ['<rootDir>/tests/**/*.test.js'],

  // The test environment that will be used for testing
  testEnvironment: 'node',
};
