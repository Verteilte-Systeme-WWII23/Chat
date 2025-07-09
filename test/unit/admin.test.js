import { describe, test, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import adminRoutes from '../../src/server/routes/admin.js';
import { getAllUsers, getBannedIps, banIp, unBanIp } from '../../src/server/managers/userManager.js';
import { adminAuth } from '../../src/server/middleware/auth.js';
import { validateIP } from '../../src/server/middleware/validation.js';


vi.mock('../../src/server/managers/userManager.js', () => ({
  getAllUsers: vi.fn(),
  getBannedIps: vi.fn(),
  banIp: vi.fn(),
  unBanIp: vi.fn()
}));

vi.mock('../../src/server/middleware/auth.js', () => ({
  adminAuth: vi.fn((req, res, next) => next())
}));

vi.mock('../../src/server/middleware/validation.js', () => ({
  validateIP: vi.fn((req, res, next) => next())
}));

describe('Admin Routes Tests', () => {
  let app;
  
  beforeEach(() => {

    app = express();
    app.use(express.json());
    app.use('/admin', adminRoutes);
    

    vi.clearAllMocks();
    

    getAllUsers.mockReturnValue(new Map([
      ['user1', { name: 'Benutzer 1', ip: '192.168.1.1' }],
      ['user2', { name: 'Benutzer 2', ip: '192.168.1.2' }],
      ['user3', { name: 'Benutzer 3', ip: '192.168.1.3' }]
    ]));
    
    getBannedIps.mockReturnValue(new Set(['192.168.1.1']));
  });
  
  test('sollte alle Benutzer zurückgeben', async () => {
    const response = await request(app)
      .post('/admin/users')
      .send({ password: 'test-password' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body).toContainEqual({
      id: 'user1',
      name: 'Benutzer 1',
      ip: '192.168.1.1'
    });
    expect(getAllUsers).toHaveBeenCalled();
  });
  
  test('sollte gesperrte IPs zurückgeben', async () => {
    const response = await request(app)
      .post('/admin/banned-ips')
      .send({ password: 'test-password' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].ip).toBe('192.168.1.1');
    expect(getBannedIps).toHaveBeenCalled();
  });
  
  test('sollte eine IP sperren', async () => {
    const response = await request(app)
      .post('/admin/ban/ip')
      .send({ password: 'test-password', ip: '192.168.1.2' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('192.168.1.2');
    expect(banIp).toHaveBeenCalledWith('192.168.1.2');
    expect(validateIP).toHaveBeenCalled();
  });
  
  test('sollte eine IP entsperren', async () => {
    const response = await request(app)
      .post('/admin/unban/ip')
      .send({ password: 'test-password', ip: '192.168.1.1' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('192.168.1.1');
    expect(unBanIp).toHaveBeenCalledWith('192.168.1.1');
    expect(validateIP).toHaveBeenCalled();
  });
  
  test('sollte Fehler beim Laden der Benutzer behandeln', async () => {

    getAllUsers.mockImplementation(() => {
      throw new Error('Datenbankfehler');
    });
    
    const response = await request(app)
      .post('/admin/users')
      .send({ password: 'test-password' });
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Fehler beim Laden der Benutzer');
  });
  
  test('sollte Fehler beim Laden gesperrter IPs behandeln', async () => {

    getBannedIps.mockImplementation(() => {
      throw new Error('Datenbankfehler');
    });
    
    const response = await request(app)
      .post('/admin/banned-ips')
      .send({ password: 'test-password' });
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Fehler beim Laden der gesperrten IPs');
  });
  
  test('sollte Fehler beim Sperren einer IP behandeln', async () => {

    banIp.mockImplementation(() => {
      throw new Error('Sperrfehler');
    });
    
    const response = await request(app)
      .post('/admin/ban/ip')
      .send({ password: 'test-password', ip: '192.168.1.2' });
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Fehler beim Sperren der IP');
  });
  
  test('sollte Fehler beim Entsperren einer IP behandeln', async () => {

    unBanIp.mockImplementation(() => {
      throw new Error('Entsperrfehler');
    });
    
    const response = await request(app)
      .post('/admin/unban/ip')
      .send({ password: 'test-password', ip: '192.168.1.1' });
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Fehler beim Entsperren der IP');
  });
  
  test('sollte die adminAuth-Middleware verwenden', async () => {
    await request(app)
      .post('/admin/users')
      .send({ password: 'test-password' });
    
    expect(adminAuth).toHaveBeenCalled();
  });
  
  test('sollte mit leerer Benutzerliste umgehen können', async () => {

    getAllUsers.mockReturnValue(new Map());
    
    const response = await request(app)
      .post('/admin/users')
      .send({ password: 'test-password' });
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
  
  test('sollte mit null-Benutzern in der Liste umgehen können', async () => {

    getAllUsers.mockReturnValue(new Map([
      ['user1', null],
      ['user2', { name: 'Benutzer 2', ip: '192.168.1.2' }]
    ]));
    
    const response = await request(app)
      .post('/admin/users')
      .send({ password: 'test-password' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Benutzer 2');
  });
});