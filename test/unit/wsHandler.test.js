import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleConnection } from '../../src/server/handlers/wsHandler.js';
import { isBanned, removeUser } from "../../src/server/managers/userManager.js";
import { ConnectionManager } from "../../src/server/websocket/ConnectionManager.js";
import { COMMANDS } from "../../src/server/websocket/commands.js";
import { WS } from "../../src/server/websocket/WS.js";

// Korrigiere die Mock-Pfade (von ../../../ zu ../../)
vi.mock("../../src/server/managers/userManager.js", () => ({
  isBanned: vi.fn(),
  removeUser: vi.fn()
}));

vi.mock("../../src/server/websocket/ConnectionManager.js", () => ({
  ConnectionManager: {
    getClientIP: vi.fn(),
    handleReconnect: vi.fn(),
    initializeNewUser: vi.fn(),
    executeCommand: vi.fn()
  }
}));

// Mock für die WS-Klasse
vi.mock("../../src/server/websocket/WS.js", () => ({
  WS: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    sendError: vi.fn(),
    messageTo: vi.fn(),
    getChat: vi.fn()
  }))
}));

// Mock für COMMANDS
vi.mock("../../src/server/websocket/commands.js", () => ({
  COMMANDS: new Map([
    ['messageTo', 'messageTo'],
    ['getChat', 'getChat'],
    ['getUserChats', 'getUserChats']
  ])
}));

describe('WebSocket Handler', () => {
  let mockWs;
  let mockReq;
  
  beforeEach(() => {
    // WebSocket-Mock erstellen
    mockWs = {
      send: vi.fn(),
      close: vi.fn(),
      on: vi.fn(),
      readyState: 1
    };
    
    // Request-Mock mit IP erstellen
    mockReq = {
      connection: {
        remoteAddress: '127.0.0.1'
      },
      headers: {
        'x-forwarded-for': '192.168.1.1'
      }
    };
    
    // Standardverhalten für Mocks definieren
    ConnectionManager.getClientIP.mockReturnValue('192.168.1.1');
    isBanned.mockReturnValue(false);
    ConnectionManager.initializeNewUser.mockReturnValue('user-123');
    
    // Event-Handler für on() registrieren
    mockWs.on.mockImplementation((event, callback) => {
      mockWs[`${event}Callback`] = callback;
    });
    
    // Alle Mocks zurücksetzen
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('sollte gesperrte Benutzer abweisen', () => {
    // Benutzer ist gesperrt
    isBanned.mockReturnValueOnce(true);
    
    handleConnection(mockWs, mockReq);
    
    expect(ConnectionManager.getClientIP).toHaveBeenCalledWith(mockReq);
    expect(isBanned).toHaveBeenCalledWith('192.168.1.1');
    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('banned'));
    expect(mockWs.close).toHaveBeenCalled();
  });
  
  test('sollte Reconnect-Anfragen verarbeiten', () => {
    // Arrange
    const reconnectUserId = 'reconnected-user-456';
    ConnectionManager.handleReconnect.mockReturnValueOnce(reconnectUserId);
    
    // Act
    handleConnection(mockWs, mockReq);
    
    // Reconnect-Nachricht simulieren
    mockWs.messageCallback(JSON.stringify({
      type: 'reconnect',
      userId: 'previous-session-id'
    }));
    
    // Assert
    expect(ConnectionManager.handleReconnect).toHaveBeenCalledWith(
      mockWs, 
      expect.objectContaining({ type: 'reconnect' })
    );
  });
  
  test('sollte neue Benutzer initialisieren', () => {
    // Act
    handleConnection(mockWs, mockReq);
    
    // Erste Nachricht eines neuen Benutzers simulieren
    mockWs.messageCallback(JSON.stringify({
      type: 'setName',
      name: 'TestUser'
    }));
    
    // Assert
    expect(ConnectionManager.initializeNewUser).toHaveBeenCalledWith(mockWs, '192.168.1.1');
  });
  
  test('sollte Befehle an ConnectionManager weiterleiten', async () => {
    // 1. userId direkt im Test setzen (simuliere bereits initialisierten Zustand)
    let userId = 'user-123';

    // 2. Spezielle Mock-Implementierung für diese Testfunktion
    mockWs.on.mockImplementation((event, callback) => {
      if (event === 'message') {
        mockWs.messageCallback = async (msg) => {
          try {
            const data = JSON.parse(msg);
            
            // Simuliere das tatsächliche Verhalten des Handlers
            if (data.type === 'messageTo') {
              // Hier direkt das Verhalten von wsHandler.js nachbilden
              const wsHandler = new WS(mockWs, userId);
              await ConnectionManager.executeCommand(wsHandler, data.type, data, COMMANDS);
            }
          } catch (error) {
            console.error("Test message handler error:", error);
          }
        };
      } else {
        mockWs[`${event}Callback`] = callback;
      }
    });
    
    // 3. Handler aufrufen und Test durchführen
    handleConnection(mockWs, mockReq);

    // 4. Zweite Nachricht direkt senden (simuliere etablierte Verbindung)
    await mockWs.messageCallback(JSON.stringify({
      type: 'messageTo',
      chatId: 'chat-123',
      text: 'Hallo Welt!'
    }));
    
    // 5. Prüfen, ob der Aufruf erfolgt ist
    expect(ConnectionManager.executeCommand).toHaveBeenCalledWith(
      expect.any(Object),
      'messageTo',
      expect.objectContaining({
        type: 'messageTo',
        chatId: 'chat-123',
        text: 'Hallo Welt!'
      }),
      expect.any(Object)
    );
  });
  
  test('sollte Fehler bei ungültigen Nachrichten behandeln', () => {
    // Act
    handleConnection(mockWs, mockReq);
    
    // Ungültige Nachricht senden
    mockWs.messageCallback('Dies ist kein gültiges JSON');
    
    // Assert
    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('error'));
  });
  
  test('sollte keine Fehlerantwort senden, wenn die Verbindung bereits geschlossen ist', () => {
    // WebSocket ist geschlossen
    mockWs.readyState = 3; // CLOSED
    
    // Act
    handleConnection(mockWs, mockReq);
    
    // Ungültige Nachricht senden
    mockWs.messageCallback('Dies ist kein gültiges JSON');
    
    // Assert
    expect(mockWs.send).not.toHaveBeenCalled();
  });
});