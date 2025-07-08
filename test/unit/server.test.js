import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import express from 'express';
import request from 'supertest';
import { handleConnection } from '../../src/server/handlers/wsHandler.js';
import { config } from '../../src/server/config/env.js';

// Mocks für die Module
vi.mock('ws', () => {
  const mockOn = vi.fn();
  const mockWss = {
    on: mockOn
  };
  
  return {
    WebSocketServer: vi.fn(() => mockWss),
    WebSocket: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
      terminate: vi.fn()
    }))
  };
});

vi.mock('../../src/server/handlers/wsHandler.js', () => ({
  handleConnection: vi.fn()
}));

vi.mock('../../src/server/routes/admin.js', () => {
  const router = express.Router();
  router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Admin-Route funktioniert' });
  });
  return { default: router };
});

vi.mock('../../src/server/middleware/errorHandler.js', () => ({
  errorHandler: vi.fn((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  })
}));

vi.mock('../../src/server/config/env.js', () => ({
  config: {
    port: 3001,
    nodeEnv: 'test'
  }
}));

describe('Server-Tests', () => {
  let server;
  let app;
  let originalEnv;
  
  beforeEach(() => {
    // Environment-Variablen sichern
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    
    // WebSocketServer-Mock zurücksetzen
    vi.clearAllMocks();
    
    // Server neu importieren für jeden Test
    vi.resetModules();
  });
  
  afterEach(() => {
    // Environment-Variablen wiederherstellen
    process.env.NODE_ENV = originalEnv;
    
    // Server schließen, falls er läuft
    if (server && server.close) {
      server.close();
    }
  });
  
  test('sollte den Express-Server korrekt initialisieren', async () => {
    // Server importieren
    const serverModule = await import('../../src/server/server.js');
    server = serverModule.default;
    
    // Prüfen, ob der Server existiert
    expect(server).toBeDefined();
    expect(server.listening).toBe(false); // Nicht gestartet im Test-Modus
  });
  
  test('sollte WebSocketServer mit HTTP-Server verbinden', async () => {
    // Server importieren
    await import('../../src/server/server.js');
    
    // Prüfen, ob WebSocketServer korrekt initialisiert wurde
    expect(WebSocketServer).toHaveBeenCalledWith(expect.objectContaining({ 
      server: expect.any(Object) 
    }));
  });
  
  test('sollte WebSocket-Verbindungen behandeln', async () => {
    // Server importieren
    await import('../../src/server/server.js');
    
    // Connection-Event simulieren
    const mockWss = WebSocketServer.mock.results[0].value;
    const mockCallback = mockWss.on.mock.calls.find(call => call[0] === 'connection')[1];
    
    // WebSocket und Request-Mock erstellen
    const ws = new WebSocket();
    const req = { headers: {}, connection: { remoteAddress: '127.0.0.1' } };
    
    // Connection-Callback ausführen
    mockCallback(ws, req);
    
    // Prüfen, ob handleConnection aufgerufen wurde
    expect(handleConnection).toHaveBeenCalledWith(ws, req);
  });
  
  test('sollte Admin-Routen einrichten', async () => {
    // Server importieren
    const serverModule = await import('../../src/server/server.js');
    server = serverModule.default;
    app = server._events.request; // Zugriff auf die Express-App
    
    // Server starten
    server.listen(config.port);
    
    // Admin-Route testen
    const response = await request(app).get('/admin/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Admin-Route funktioniert' });
  });
  
  test('sollte statische Dateien bereitstellen', async () => {
    // Express.static mock
    const mockStatic = vi.spyOn(express, 'static');
    
    // Server importieren
    await import('../../src/server/server.js');
    
    // Prüfen, ob static aufgerufen wurde
    expect(mockStatic).toHaveBeenCalled();
    expect(mockStatic.mock.calls[0][0]).toContain('client');
  });
});