import { vi } from 'vitest';

// Envs for testing
process.env.NODE_ENV = 'test';
process.env.ADMIN_PASSWORD = 'test_password';
process.env.GEMINI_API_KEY = 'test-api-key';


vi.mock('dotenv', () => ({
  default: {
    config: vi.fn()
  },
  config: vi.fn()
}));

// Global mocks
global.TextEncoder = class TextEncoder {
  encode(text) {
    return Buffer.from(text);
  }
};

global.TextDecoder = class TextDecoder {
  decode(buffer) {
    return Buffer.from(buffer).toString();
  }
};