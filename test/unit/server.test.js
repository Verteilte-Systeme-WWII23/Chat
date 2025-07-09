import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import request from 'supertest';
import { handleConnection } from '../../src/server/handlers/wsHandler.js';
import { config } from '../../src/server/config/env.js';


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
    
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    
    
    vi.clearAllMocks();
    
    
    vi.resetModules();
  });
  
  afterEach(() => {
    
    process.env.NODE_ENV = originalEnv;
    
    
    if (server && server.close) {
      server.close();
    }
  });
  
  test('sollte den Express-Server korrekt initialisieren', async () => {
    
    const serverModule = await import('../../src/server/server.js');
    server = serverModule.default;
    
    
    expect(server).toBeDefined();
    expect(server.listening).toBe(false);
  });
  
  test('sollte WebSocketServer mit HTTP-Server verbinden', async () => {
    
    await import('../../src/server/server.js');
    
    
    expect(WebSocketServer).toHaveBeenCalledWith(expect.objectContaining({ 
      server: expect.any(Object) 
    }));
  });
  
  test('sollte WebSocket-Verbindungen behandeln', async () => {
    
    await import('../../src/server/server.js');
    
    
    const mockWss = WebSocketServer.mock.results[0].value;
    const mockCallback = mockWss.on.mock.calls.find(call => call[0] === 'connection')[1];
    
    
    const ws = new WebSocket();
    const req = { headers: {}, connection: { remoteAddress: '127.0.0.1' } };
    
    
    mockCallback(ws, req);
    
    
    expect(handleConnection).toHaveBeenCalledWith(ws, req);
  });
  
  test('sollte Admin-Routen einrichten', async () => {
    
    const serverModule = await import('../../src/server/server.js');
    server = serverModule.default;
    app = server._events.request;
    
    
    server.listen(config.port);
    
    
    const response = await request(app).get('/admin/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Admin-Route funktioniert' });
  });
  
  test('sollte statische Dateien bereitstellen', async () => {
    
    const mockStatic = vi.spyOn(express, 'static');
    
    
    await import('../../src/server/server.js');
    
    
    expect(mockStatic).toHaveBeenCalled();
    expect(mockStatic.mock.calls[0][0]).toContain('client');
  });
});