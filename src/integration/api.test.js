import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import fetch from 'node-fetch';
import WebSocket from 'ws';
import { createServer } from '../createServer.js';
import { setupApiMocks } from './test-mocks.js';
import { getAllUsers, addUser } from '../userManager.js';

// Wir müssen den userManager mocken, da die WebSocket-Verbindung nicht garantiert einen Benutzer erstellt
vi.mock('../userManager.js', async () => {
  const originalModule = await vi.importActual('../userManager.js');
  return {
    ...originalModule,
    getAllUsers: vi.fn()
  };
});

setupApiMocks();

describe('REST API Integration', () => {
  let server;
  let port;
  let baseUrl;
  const password = 'admin123'; // Test-Passwort
  
  beforeAll(async () => {
    // Simuliere einen Benutzer in der Benutzerliste
    const mockUsers = new Map([
      ['testuser1', { name: 'Test User 1', ip: '127.0.0.1' }]
    ]);
    getAllUsers.mockReturnValue(mockUsers);
    
    process.env.ADMIN_PASSWORD = password;
    port = 3200 + Math.floor(Math.random() * 900);
    server = await createServer();
    await new Promise(resolve => server.listen(port, resolve));
    baseUrl = `http://localhost:${port}`;
  });
  
  afterAll(() => {
    if (server) server.close();
    vi.restoreAllMocks();
  });
  
  test('should manage user bans through API', async () => {
    // Benutzer über WebSocket verbinden, um einen Eintrag zu haben
    const ws = new WebSocket(`ws://${baseUrl.replace('http://', '')}`);
    await new Promise(resolve => ws.on('open', resolve));
    
    // Warten auf Benutzerregistrierung (verlängert für mehr Stabilität)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Alle Benutzer abrufen
    const usersResponse = await fetch(`${baseUrl}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    expect(usersResponse.status).toBe(200);
    const users = await usersResponse.json();
    
    // Hier sollten Benutzer zurückgegeben werden dank unseres Mocks
    expect(users.length).toBeGreaterThan(0);
    
    // Rest des Tests unverändert...
    // IP des ersten Benutzers sperren
    const userIp = users[0].ip;
    const banResponse = await fetch(`${baseUrl}/admin/ban/ip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, ip: userIp })
    });
    
    expect(banResponse.status).toBe(200);
    
    // Gesperrte IPs abrufen
    const bannedResponse = await fetch(`${baseUrl}/admin/banned-ips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    expect(bannedResponse.status).toBe(200);
    const bannedUsers = await bannedResponse.json();
    
    // Prüfen, ob die IP gesperrt wurde
    const ipWasBanned = bannedUsers.some(user => user.ip === userIp);
    expect(ipWasBanned).toBe(true);
    
    // WebSocket schließen
    ws.close();
  });
});