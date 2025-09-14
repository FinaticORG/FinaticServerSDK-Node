/**
 * Test setup file
 */

// Mock console methods to reduce noise in tests
const originalConsole = console;

beforeAll(() => {
  // Suppress console.log in tests unless explicitly enabled
  if (!process.env['ENABLE_CONSOLE_LOGS']) {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore original console
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables
process.env['NODE_ENV'] = 'test';
process.env['FINATIC_API_URL'] = 'https://api.finatic.com';
process.env['FINATIC_API_KEY'] = 'test-api-key';

// Mock Date.now for consistent testing
const mockDate = new Date('2024-01-01T12:00:00Z');
global.Date.now = jest.fn(() => mockDate.getTime());
