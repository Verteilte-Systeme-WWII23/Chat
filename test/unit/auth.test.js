import { describe, test, expect, vi, beforeEach } from 'vitest';
import { adminAuth } from '../../src/server/middleware/auth.js';
import { config } from '../../src/server/config/env.js';

// Mock für config
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
    // Request-Mock mit leeren body
    mockReq = {
      body: {}
    };

    // Response-Mock mit Spy-Funktionen
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Next-Funktion als Spy
    mockNext = vi.fn();
  });

  test('sollte next() aufrufen bei korrektem Passwort', () => {
    // Arrange
    mockReq.body = { password: 'test-admin-pw' };

    // Act
    adminAuth(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('sollte 401 zurückgeben bei falschem Passwort', () => {
    // Arrange
    mockReq.body = { password: 'wrong-password' };

    // Act
    adminAuth(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Falsches Passwort' });
  });

  test('sollte 401 zurückgeben bei fehlendem Passwort', () => {
    // Arrange
    mockReq.body = {}; // Kein Passwort

    // Act
    adminAuth(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Falsches Passwort' });
  });

  test('sollte 400 zurückgeben bei ungültiger Request', () => {
    // Arrange - einen Fall simulieren, bei dem ein Fehler geworfen wird
    mockReq = null; // Dies wird einen Fehler verursachen

    // Act
    adminAuth(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Ungültige Request' });
  });

  test('sollte mit req.query funktionieren, wenn req.body nicht vorhanden ist', () => {
    // Arrange
    mockReq = {
      body: undefined,
      query: { password: 'test-admin-pw' }
    };

    // Act
    adminAuth(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('sollte 401 zurückgeben, wenn weder body noch query vorhanden sind', () => {
    // Arrange
    mockReq = {}; // Weder body noch query

    // Act
    adminAuth(mockReq, mockRes, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});