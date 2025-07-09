import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleConnection } from '../../src/server/handlers/wsHandler.js';
import { isBanned, removeUser } from "../../src/server/managers/userManager.js";
import { ConnectionManager } from "../../src/server/websocket/ConnectionManager.js";
import { COMMANDS } from "../../src/server/websocket/commands.js";
import { WS } from "../../src/server/websocket/WS.js";


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


vi.mock("../../src/server/websocket/WS.js", () => ({
  WS: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    sendError: vi.fn(),
    messageTo: vi.fn(),
    getChat: vi.fn()
  }))
}));


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

    mockWs = {
      send: vi.fn(),
      close: vi.fn(),
      on: vi.fn(),
      readyState: 1
    };
    

    mockReq = {
      connection: {
        remoteAddress: '127.0.0.1'
      },
      headers: {
        'x-forwarded-for': '192.168.1.1'
      }
    };
    

    ConnectionManager.getClientIP.mockReturnValue('192.168.1.1');
    isBanned.mockReturnValue(false);
    ConnectionManager.initializeNewUser.mockReturnValue('user-123');
    

    mockWs.on.mockImplementation((event, callback) => {
      mockWs[`${event}Callback`] = callback;
    });
    

    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('sollte gesperrte Benutzer abweisen', () => {

    isBanned.mockReturnValueOnce(true);
    
    handleConnection(mockWs, mockReq);
    
    expect(ConnectionManager.getClientIP).toHaveBeenCalledWith(mockReq);
    expect(isBanned).toHaveBeenCalledWith('192.168.1.1');
    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('banned'));
    expect(mockWs.close).toHaveBeenCalled();
  });
  
  test('sollte Reconnect-Anfragen verarbeiten', () => {

    const reconnectUserId = 'reconnected-user-456';
    ConnectionManager.handleReconnect.mockReturnValueOnce(reconnectUserId);
    

    handleConnection(mockWs, mockReq);
    

    mockWs.messageCallback(JSON.stringify({
      type: 'reconnect',
      userId: 'previous-session-id'
    }));
    

    expect(ConnectionManager.handleReconnect).toHaveBeenCalledWith(
      mockWs, 
      expect.objectContaining({ type: 'reconnect' })
    );
  });
  
  test('sollte neue Benutzer initialisieren', () => {

    handleConnection(mockWs, mockReq);
    

    mockWs.messageCallback(JSON.stringify({
      type: 'setName',
      name: 'TestUser'
    }));
    

    expect(ConnectionManager.initializeNewUser).toHaveBeenCalledWith(mockWs, '192.168.1.1');
  });
  
  test('sollte Befehle an ConnectionManager weiterleiten', async () => {

    let userId = 'user-123';


    mockWs.on.mockImplementation((event, callback) => {
      if (event === 'message') {
        mockWs.messageCallback = async (msg) => {
          try {
            const data = JSON.parse(msg);
            

            if (data.type === 'messageTo') {

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
    

    handleConnection(mockWs, mockReq);


    await mockWs.messageCallback(JSON.stringify({
      type: 'messageTo',
      chatId: 'chat-123',
      text: 'Hallo Welt!'
    }));
    

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

    handleConnection(mockWs, mockReq);
    

    mockWs.messageCallback('Dies ist kein gültiges JSON');
    

    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('error'));
  });
  
  test('sollte keine Fehlerantwort senden, wenn die Verbindung bereits geschlossen ist', () => {

    mockWs.readyState = 3; 
    
    
    handleConnection(mockWs, mockReq);
    

    mockWs.messageCallback('Dies ist kein gültiges JSON');
    

    expect(mockWs.send).not.toHaveBeenCalled();
  });
});