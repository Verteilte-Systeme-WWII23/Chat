import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import fetch from 'node-fetch';
import WebSocket from 'ws';

// Mock für dotenv und Umgebungsvariablen
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn()
  },
  config: vi.fn()
}));

// Setze ADMIN_PASSWORD direkt im Code
vi.stubEnv('ADMIN_PASSWORD', 'test_password');

// Mocks für abhängige Module
vi.mock('./wsHandlers.js', () => ({
  handleConnection: vi.fn()
}));

vi.mock('./userManager.js', () => ({
  getAllUsers: vi.fn(),
  getBannedIps: vi.fn(),
  banIp: vi.fn(),
  unBanIp: vi.fn()
}));

// Importiere den Server erst nach den Mocks
import server from './server.js';
import { handleConnection } from './wsHandlers.js';
import { getAllUsers, getBannedIps, banIp, unBanIp } from './userManager.js';

let port;
let baseUrl;
let serverInstance;

describe('Server', () => {
  beforeAll(async () => {
    // Konfigurierten Port auf einen zufälligen Testport setzen
    port = 3001 + Math.floor(Math.random() * 1000);
    baseUrl = `http://localhost:${port}`;
    
    // Mock-Daten vorbereiten
    getAllUsers.mockReturnValue(new Map([
      ['user1', { name: 'Test User 1', ip: '192.168.1.1' }],
      ['user2', { name: 'Test User 2', ip: '192.168.1.2' }]
    ]));
    
    getBannedIps.mockReturnValue(new Set(['192.168.1.1']));
    
    // Server auf Testport starten
    await new Promise(resolve => {
      serverInstance = server.listen(port, () => {
        console.log(`Test server running on port ${port}`);
        resolve();
      });
    });
  });
  
  afterAll(() => {
    // Server nach Tests herunterfahren
    if (serverInstance) {
      serverInstance.close();
    }
    
    // Umgebungsvariablen zurücksetzen
    vi.unstubAllEnvs();
  });
  
  beforeEach(() => {
    // Mocks für jeden Test zurücksetzen
    vi.clearAllMocks();
  });
  
  test('should serve static files', async () => {
    const response = await fetch(`${baseUrl}/`);
    expect(response.status).toBe(200);
  });
  
  test('should reject admin requests with wrong password', async () => {
    const response = await fetch(`${baseUrl}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong_password' })
    });
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Falsches Passwort');
  });
  
  test('should return users list with correct password', async () => {
    const response = await fetch(`${baseUrl}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test_password' })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Test User 1');
  });
  
  test('should return banned IPs with correct password', async () => {
    const response = await fetch(`${baseUrl}/admin/banned-ips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test_password' })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].ip).toBe('192.168.1.1');
  });
  
  test('should ban an IP with correct password', async () => {
    const response = await fetch(`${baseUrl}/admin/ban/ip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test_password', ip: '192.168.1.3' })
    });
    
    expect(response.status).toBe(200);
    expect(banIp).toHaveBeenCalledWith('192.168.1.3');
  });
  
  test('should unban an IP with correct password', async () => {
    const response = await fetch(`${baseUrl}/admin/unban/ip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test_password', ip: '192.168.1.1' })
    });
    
    expect(response.status).toBe(200);
    expect(unBanIp).toHaveBeenCalledWith('192.168.1.1');
  });
  
  test('should handle WebSocket connections', async () => {
    // WebSocket-Verbindung simulieren
    const ws = new WebSocket(`ws://localhost:${port}`);
    
    // Warten bis die Verbindung hergestellt ist
    await new Promise(resolve => {
      ws.on('open', resolve);
    });
    
    // Überprüfen, ob handleConnection aufgerufen wurde
    expect(handleConnection).toHaveBeenCalled();
    
    // Verbindung schließen
    ws.close();
  });
});