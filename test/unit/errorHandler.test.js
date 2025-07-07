import { describe, test, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../../src/server/middleware/errorHandler.js';
import { config } from '../../src/server/config/env.js';

// Mock für config
vi.mock('../../src/server/config/env.js', () => ({
  config: {
    nodeEnv: 'development' // Standardwert für Tests
  }
}));

describe('Error Handler Middleware Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockError;
  let originalConsoleError;

  beforeEach(() => {
    // Request-Mock
    mockReq = {
      path: '/some/path'
    };

    // Response-Mock
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };

    // Next-Funktion als Spy
    mockNext = vi.fn();

    // Standard-Fehlerobjekt
    mockError = new Error('Test Error Message');

    // Konsole-Fehlerausgabe unterdrücken, um Tests übersichtlich zu halten
    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    // Konsole-Fehlerausgabe wiederherstellen
    console.error = originalConsoleError;
  });

  test('sollte JSON-Fehler für Admin-Anfragen zurückgeben', () => {
    // Arrange
    mockReq.path = '/admin/users';
    
    // Act
    errorHandler(mockError, mockReq, mockRes, mockNext);
    
    // Assert
    expect(console.error).toHaveBeenCalledWith('Server Error:', mockError);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      error: 'Test Error Message'  // In Development wird die tatsächliche Fehlermeldung zurückgegeben
    });
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  test('sollte JSON-Fehler für API-Anfragen zurückgeben', () => {
    // Arrange
    mockReq.path = '/api/data';
    
    // Act
    errorHandler(mockError, mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      error: 'Test Error Message' 
    });
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  test('sollte HTML-Fehler für normale Anfragen zurückgeben', () => {
    // Arrange
    mockReq.path = '/normal/path';
    
    // Act
    errorHandler(mockError, mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('Test Error Message'));
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  test('sollte generische Fehlermeldung in Produktionsumgebung zurückgeben', () => {
    // Arrange
    mockReq.path = '/admin/users';
    // Produktionsumgebung simulieren
    vi.spyOn(config, 'nodeEnv', 'get').mockReturnValue('production');
    
    // Act
    errorHandler(mockError, mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockRes.json).toHaveBeenCalledWith({ 
      error: 'Internal Server Error' // In Production wird die generische Meldung zurückgegeben
    });
  });

  test('sollte generische HTML-Fehlermeldung in Produktionsumgebung zurückgeben', () => {
    // Arrange
    mockReq.path = '/normal/path';
    // Produktionsumgebung simulieren
    vi.spyOn(config, 'nodeEnv', 'get').mockReturnValue('production');
    
    // Act
    errorHandler(mockError, mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'));
    expect(mockRes.send).not.toHaveBeenCalledWith(expect.stringContaining('Test Error Message'));
  });

  test('sollte console.error mit dem Fehler aufrufen', () => {
    // Arrange
    mockReq.path = '/some/path';
    
    // Act
    errorHandler(mockError, mockReq, mockRes, mockNext);
    
    // Assert
    expect(console.error).toHaveBeenCalledWith('Server Error:', mockError);
  });

  test('sollte mit komplexen Fehler-Objekten umgehen können', () => {
    // Arrange
    const complexError = { 
      name: 'ComplexError',
      message: 'Complex Error Message',
      code: 'ERR_COMPLEX',
      stack: 'Error stack trace'
    };
    mockReq.path = '/api/data';
    
    // Explizit die Umgebung auf 'development' setzen
    vi.spyOn(config, 'nodeEnv', 'get').mockReturnValue('development');
    
    // Act
    errorHandler(complexError, mockReq, mockRes, mockNext);
    
    // Assert
    expect(mockRes.json).toHaveBeenCalledWith({ 
      error: 'Complex Error Message' 
    });
  });
});