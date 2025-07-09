import { describe, test, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../../src/server/middleware/errorHandler.js';
import { config } from '../../src/server/config/env.js';

vi.mock('../../src/server/config/env.js', () => ({
  config: {
    nodeEnv: 'development' 
  }
}));

describe('Error Handler Middleware Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockError;
  let originalConsoleError;

  beforeEach(() => {

    mockReq = {
      path: '/some/path'
    };


    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };


    mockNext = vi.fn();


    mockError = new Error('Test Error Message');


    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {

    console.error = originalConsoleError;
  });

  test('sollte JSON-Fehler für Admin-Anfragen zurückgeben', () => {

    mockReq.path = '/admin/users';
    

    errorHandler(mockError, mockReq, mockRes, mockNext);
    

    expect(console.error).toHaveBeenCalledWith('Server Error:', mockError);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      error: 'Test Error Message'
    });
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  test('sollte JSON-Fehler für API-Anfragen zurückgeben', () => {
    
    mockReq.path = '/api/data';
    
    
    errorHandler(mockError, mockReq, mockRes, mockNext);
    
    
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ 
      error: 'Test Error Message' 
    });
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  test('sollte HTML-Fehler für normale Anfragen zurückgeben', () => {
    
    mockReq.path = '/normal/path';
    
    
    errorHandler(mockError, mockReq, mockRes, mockNext);
    
    
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('Test Error Message'));
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  test('sollte generische Fehlermeldung in Produktionsumgebung zurückgeben', () => {
    
    mockReq.path = '/admin/users';
    
    vi.spyOn(config, 'nodeEnv', 'get').mockReturnValue('production');
    
    
    errorHandler(mockError, mockReq, mockRes, mockNext);
    
    
    expect(mockRes.json).toHaveBeenCalledWith({ 
      error: 'Internal Server Error'
    });
  });

  test('sollte generische HTML-Fehlermeldung in Produktionsumgebung zurückgeben', () => {
    
    mockReq.path = '/normal/path';
    
    vi.spyOn(config, 'nodeEnv', 'get').mockReturnValue('production');
    
    
    errorHandler(mockError, mockReq, mockRes, mockNext);
    
    
    expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'));
    expect(mockRes.send).not.toHaveBeenCalledWith(expect.stringContaining('Test Error Message'));
  });

  test('sollte console.error mit dem Fehler aufrufen', () => {
    
    mockReq.path = '/some/path';
    
    
    errorHandler(mockError, mockReq, mockRes, mockNext);
    
    
    expect(console.error).toHaveBeenCalledWith('Server Error:', mockError);
  });

  test('sollte mit komplexen Fehler-Objekten umgehen können', () => {
    
    const complexError = { 
      name: 'ComplexError',
      message: 'Complex Error Message',
      code: 'ERR_COMPLEX',
      stack: 'Error stack trace'
    };
    mockReq.path = '/api/data';
    
    
    vi.spyOn(config, 'nodeEnv', 'get').mockReturnValue('development');
    
    
    errorHandler(complexError, mockReq, mockRes, mockNext);
    
    
    expect(mockRes.json).toHaveBeenCalledWith({ 
      error: 'Complex Error Message' 
    });
  });
});