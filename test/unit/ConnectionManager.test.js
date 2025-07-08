import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ConnectionManager } from '../../src/server/websocket/ConnectionManager.js';
import { addUser, getUser } from '../../src/server/managers/userManager.js';
import { createAIChatForUser } from '../../src/server/managers/chatManager.js';

// Mocks für die abhängigen Module
vi.mock('../../src/server/managers/userManager.js', () => ({
  addUser: vi.fn(),
  getUser: vi.fn()
}));

vi.mock('../../src/server/managers/chatManager.js', () => ({
  createAIChatForUser: vi.fn()
}));

describe('ConnectionManager Tests', () => {
  let mockWs;
  let mockReq;

  beforeEach(() => {
    // WebSocket-Mock
    mockWs = {
      send: vi.fn()
    };

    // Request-Mock mit verschiedenen IP-Quellen
    mockReq = {
      headers: {
        'x-forwarded-for': '192.168.1.1,10.0.0.1',
        'x-real-ip': '192.168.2.2'
      },
      socket: {
        remoteAddress: '192.168.3.3'
      },
      connection: {
        remoteAddress: '192.168.4.4'
      }
    };

    // Mock-Reset
    vi.clearAllMocks();
  });

  describe('getClientIP', () => {
    test('sollte x-forwarded-for mit höchster Priorität verwenden', () => {
      const ip = ConnectionManager.getClientIP(mockReq);
      expect(ip).toBe('192.168.1.1');
    });

    test('sollte x-real-ip verwenden, wenn x-forwarded-for fehlt', () => {
      delete mockReq.headers['x-forwarded-for'];
      const ip = ConnectionManager.getClientIP(mockReq);
      expect(ip).toBe('192.168.2.2');
    });

    test('sollte socket.remoteAddress verwenden, wenn Header fehlen', () => {
      delete mockReq.headers['x-forwarded-for'];
      delete mockReq.headers['x-real-ip'];
      const ip = ConnectionManager.getClientIP(mockReq);
      expect(ip).toBe('192.168.3.3');
    });

    test('sollte connection.remoteAddress verwenden, wenn andere Quellen fehlen', () => {
      delete mockReq.headers['x-forwarded-for'];
      delete mockReq.headers['x-real-ip'];
      delete mockReq.socket.remoteAddress;
      const ip = ConnectionManager.getClientIP(mockReq);
      expect(ip).toBe('192.168.4.4');
    });

    test('sollte "unknown" zurückgeben, wenn keine IP-Quelle verfügbar ist', () => {
      const emptyReq = {
        headers: {},
        socket: {},
        connection: {}
      };
      const ip = ConnectionManager.getClientIP(emptyReq);
      expect(ip).toBe('unknown');
    });
  });

  describe('handleReconnect', () => {
    test('sollte Benutzer erfolgreich wiederherstellen', () => {
      const userId = 'user-123';
      const userData = {
        name: 'TestUser',
        ws: null
      };
      
      // Mock-Konfiguration
      getUser.mockImplementation((id) => id === userId ? userData : null);
      
      // Test durchführen
      const result = ConnectionManager.handleReconnect(mockWs, { userId });
      
      // Erwartungen überprüfen
      expect(result).toBe(userId);
      expect(userData.ws).toBe(mockWs);
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('welcome'));
      expect(getUser).toHaveBeenCalledWith(userId);
    });

    test('sollte null zurückgeben, wenn userId fehlt', () => {
      const result = ConnectionManager.handleReconnect(mockWs, {});
      expect(result).toBeNull();
      expect(mockWs.send).not.toHaveBeenCalled();
    });

    test('sollte null zurückgeben, wenn Benutzer nicht existiert', () => {
      getUser.mockReturnValue(null);
      const result = ConnectionManager.handleReconnect(mockWs, { userId: 'nonexistent' });
      expect(result).toBeNull();
      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });

  describe('initializeNewUser', () => {
    test('sollte neuen Benutzer erfolgreich initialisieren', () => {
      const userId = 'new-user-456';
      const userData = {
        name: 'NewUser',
        ws: mockWs
      };
      
      // Mock-Konfiguration
      addUser.mockReturnValue(userId);
      getUser.mockImplementation((id) => id === userId ? userData : null);
      
      // Test durchführen
      const result = ConnectionManager.initializeNewUser(mockWs, '192.168.1.1');
      
      // Erwartungen überprüfen
      expect(result).toBe(userId);
      expect(addUser).toHaveBeenCalledWith(mockWs, '192.168.1.1');
      expect(createAIChatForUser).toHaveBeenCalledWith(userId);
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('welcome'));
    });
  });

  describe('executeCommand', () => {
    test('sollte Befehl erfolgreich ausführen', async () => {
      // Mock-Handler und Commands
      const mockHandler = {
        testCommand: vi.fn(),
        sendError: vi.fn()
      };
      
      const mockCommands = new Map([
        ['testCommand', 'testCommand']
      ]);
      
      // Test-Daten
      const data = { param1: 'value1' };
      
      // Test durchführen
      await ConnectionManager.executeCommand(mockHandler, 'testCommand', data, mockCommands);
      
      // Erwartungen überprüfen
      expect(mockHandler.testCommand).toHaveBeenCalledWith(data);
      expect(mockHandler.sendError).not.toHaveBeenCalled();
    });

    test('sollte Fehler senden, wenn Befehl nicht existiert', async () => {
      // Mock-Handler und Commands
      const mockHandler = {
        testCommand: vi.fn(),
        sendError: vi.fn()
      };
      
      const mockCommands = new Map([
        ['testCommand', 'testCommand']
      ]);
      
      // Test-Daten
      const data = { param1: 'value1' };
      
      // Test durchführen
      await ConnectionManager.executeCommand(mockHandler, 'unknownCommand', data, mockCommands);
      
      // Erwartungen überprüfen
      expect(mockHandler.testCommand).not.toHaveBeenCalled();
      expect(mockHandler.sendError).toHaveBeenCalledWith(expect.stringContaining('Unbekannter Command'));
    });

    test('sollte Fehler senden, wenn Befehlsmethode nicht existiert', async () => {
      // Mock-Handler und Commands mit ungültigem Methodennamen
      const mockHandler = {
        existingMethod: vi.fn(),
        sendError: vi.fn()
      };
      
      const mockCommands = new Map([
        ['validCommand', 'nonExistentMethod']
      ]);
      
      // Test durchführen
      await ConnectionManager.executeCommand(mockHandler, 'validCommand', {}, mockCommands);
      
      // Erwartungen überprüfen
      expect(mockHandler.existingMethod).not.toHaveBeenCalled();
      expect(mockHandler.sendError).toHaveBeenCalledWith(expect.stringContaining('Unbekannter Command'));
    });
  });
});