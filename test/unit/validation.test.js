import { describe, test, expect, vi, beforeEach } from 'vitest';
import { validateIP } from '../../src/server/middleware/validation.js';

describe('Validation Middleware Tests', () => {
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

  test('sollte next() aufrufen für gültige IPv4-Adresse', () => {
    
    mockReq.body = { ip: '192.168.1.1' };
    
    
    validateIP(mockReq, mockRes, mockNext);
    
    
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  test('sollte next() aufrufen für gültige IPv4-Adresse mit Maximalwerten', () => {
    
    mockReq.body = { ip: '255.255.255.255' };
    
    
    validateIP(mockReq, mockRes, mockNext);
    
    
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('sollte 400 zurückgeben, wenn keine IP-Adresse angegeben ist', () => {
    
    mockReq.body = {};
    
    
    validateIP(mockReq, mockRes, mockNext);
    
    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "IP-Adresse ist erforderlich" });
  });

  test('sollte 400 zurückgeben für ungültige IP-Adresse', () => {
    
    mockReq.body = { ip: 'invalid-ip' };
    
    
    validateIP(mockReq, mockRes, mockNext);
    
    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Ungültige IP-Adresse" });
  });

  test('sollte 400 zurückgeben für IP-Adresse mit zu hohem Oktett', () => {
    
    mockReq.body = { ip: '192.168.1.256' };
    
    
    validateIP(mockReq, mockRes, mockNext);
    
    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Ungültige IP-Adresse" });
  });

  test('sollte 400 zurückgeben für IP-Adresse mit zu vielen Oktetten', () => {
    
    mockReq.body = { ip: '192.168.1.1.5' };
    
    
    validateIP(mockReq, mockRes, mockNext);
    
    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Ungültige IP-Adresse" });
  });

  test('sollte 400 zurückgeben für IP-Adresse mit zu wenigen Oktetten', () => {
    
    mockReq.body = { ip: '192.168.1' };
    
    
    validateIP(mockReq, mockRes, mockNext);
    
    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Ungültige IP-Adresse" });
  });

  test('sollte 400 zurückgeben wenn IP null ist', () => {
    
    mockReq.body = { ip: null };
    
    
    validateIP(mockReq, mockRes, mockNext);
    
    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "IP-Adresse ist erforderlich" });
  });

  test('sollte 400 zurückgeben wenn IP undefined ist', () => {
    
    mockReq.body = { ip: undefined };
    
    
    validateIP(mockReq, mockRes, mockNext);
    
    
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "IP-Adresse ist erforderlich" });
  });
});