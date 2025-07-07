import { vi } from 'vitest'; // vi nur in Testdateien importieren

export function setupApiMocks() {
  // Konsistente Mocks für alle Tests
  vi.mock('../../src/server/middleware/validation.js', () => ({
    validateIP: vi.fn((req, res, next) => {
      if (!req.body.ip) {
        return res.status(400).json({ error: 'IP fehlt' });
      }
      if (req.body.ip === 'invalid-ip') {
        return res.status(400).json({ error: 'Ungültige IP-Adresse' });
      }
      next();
    })
  }), { virtual: true });
  
  // UUID Mock für vorhersehbare IDs
  vi.mock('uuid', () => ({
    v4: vi.fn(() => `mock-${Math.floor(Math.random() * 10000)}`)
  }));
  
  // Environment-Variablen-Mock
  process.env.ADMIN_PASSWORD = 'admin123';
  
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

  vi.mock('../../src/server/config/env.js', () => ({
    config: {
      port: 3000,
      nodeEnv: 'test',
      adminPassword: 'admin123'
    }
  }), { virtual: true });

  return {
    cleanupMocks: () => {
      vi.restoreAllMocks();
    }
  };
}