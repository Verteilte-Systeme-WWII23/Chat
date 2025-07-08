import { describe, test, expect, vi, beforeEach } from 'vitest';
import { validateIP } from '../../src/server/middleware/validation.js';

describe('Validation Middleware Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Request-Mock
    mockReq = {
      body: {}
    };

    // Response-Mock
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Next-Funktion als Spy
    mockNext = vi.fn();
  });

  test('sollte next() aufrufen für gültige IPv4-Adresse', () => {
    // Arrange
    mockReq.body = { ip: '192.168.1.1' };
    
    // Act
    validateIP(mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  test('sollte next() aufrufen für gültige IPv4-Adresse mit Maximalwerten', () => {
    // Arrange
    mockReq.body = { ip: '255.255.255.255' };
    
    // Act
    validateIP(mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('sollte 400 zurückgeben, wenn keine IP-Adresse angegeben ist', () => {
    // Arrange
    mockReq.body = {}; // Leerer Body
    
    // Act
    validateIP(mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "IP-Adresse ist erforderlich" });
  });

  test('sollte 400 zurückgeben für ungültige IP-Adresse', () => {
    // Arrange
    mockReq.body = { ip: 'invalid-ip' };
    
    // Act
    validateIP(mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Ungültige IP-Adresse" });
  });

  test('sollte 400 zurückgeben für IP-Adresse mit zu hohem Oktett', () => {
    // Arrange
    mockReq.body = { ip: '192.168.1.256' }; // 256 ist zu hoch für ein Oktett
    
    // Act
    validateIP(mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Ungültige IP-Adresse" });
  });

  test('sollte 400 zurückgeben für IP-Adresse mit zu vielen Oktetten', () => {
    // Arrange
    mockReq.body = { ip: '192.168.1.1.5' }; // 5 Oktette
    
    // Act
    validateIP(mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Ungültige IP-Adresse" });
  });

  test('sollte 400 zurückgeben für IP-Adresse mit zu wenigen Oktetten', () => {
    // Arrange
    mockReq.body = { ip: '192.168.1' }; // 3 Oktette
    
    // Act
    validateIP(mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Ungültige IP-Adresse" });
  });

  test('sollte 400 zurückgeben wenn IP null ist', () => {
    // Arrange
    mockReq.body = { ip: null };
    
    // Act
    validateIP(mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "IP-Adresse ist erforderlich" });
  });

  test('sollte 400 zurückgeben wenn IP undefined ist', () => {
    // Arrange
    mockReq.body = { ip: undefined };
    
    // Act
    validateIP(mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "IP-Adresse ist erforderlich" });
  });
});