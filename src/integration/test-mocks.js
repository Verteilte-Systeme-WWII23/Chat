import { vi } from 'vitest'; // vi nur in Testdateien importieren

export function setupApiMocks() {
  // Mock für dotenv
  vi.mock('dotenv', () => ({
    default: { config: vi.fn() },
    config: vi.fn()
  }));

  // Mock für Externe AI-API
  vi.mock('@google/genai', () => {
    return {
      GoogleGenAI: class MockGoogleGenAI {
        constructor() {}
        models = {
          generateContent: async () => ({
            text: 'Mocked AI response'
          })
        }
      }
    };
  });
}