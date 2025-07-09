import { describe, test, expect, vi, beforeEach } from 'vitest';
import { adminAuth } from '../../src/server/middleware/auth.js';


vi.mock('../../src/server/config/env.js', () => ({
  config: {
    adminPassword: 'test-admin-pw'
  }
}));

describe('Auth Middleware Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {

    mockReq = {
      body: {}
    };


    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };


    mockNext = vi.fn();
  });

  test('sollte next() aufrufen bei korrektem Passwort', () => {

    mockReq.body = { password: 'test-admin-pw' };


    adminAuth(mockReq, mockRes, mockNext);


    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('sollte 401 zurückgeben bei falschem Passwort', () => {

    mockReq.body = { password: 'wrong-password' };


    adminAuth(mockReq, mockRes, mockNext);


    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Falsches Passwort' });
  });

  test('sollte 401 zurückgeben bei fehlendem Passwort', () => {

    mockReq.body = {};

    
    adminAuth(mockReq, mockRes, mockNext);

    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Falsches Passwort' });
  });

  test('sollte 400 zurückgeben bei ungültiger Request', () => {
    
    mockReq = null;

    
    adminAuth(mockReq, mockRes, mockNext);

    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Ungültige Request' });
  });

  test('sollte mit req.query funktionieren, wenn req.body nicht vorhanden ist', () => {
    
    mockReq = {
      body: undefined,
      query: { password: 'test-admin-pw' }
    };

    
    adminAuth(mockReq, mockRes, mockNext);

    
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('sollte 401 zurückgeben, wenn weder body noch query vorhanden sind', () => {
    
    mockReq = {};

    
    adminAuth(mockReq, mockRes, mockNext);

    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});