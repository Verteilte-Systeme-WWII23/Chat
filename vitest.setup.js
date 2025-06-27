import { vi } from 'vitest';

// Umgebungsvariablen für Tests vor dem Import der Module setzen
process.env.NODE_ENV = 'test';
process.env.ADMIN_PASSWORD = 'test_password';

// Verhindere, dass dotenv die Umgebungsvariablen überschreibt
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn()
  },
  config: vi.fn()
}));

// Globale Mocks für Tests
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