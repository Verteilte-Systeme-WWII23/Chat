import { describe, test, expect, vi, beforeEach } from 'vitest';
import { WS } from '../../src/server/websocket/WS.js';
import {
  setUserName,
  getUser
} from '../../src/server/managers/userManager.js';
import {
  addMessageToChat,
  getChat,
  getUserChats,
  createEmptyChatForUser,
  joinChatById
} from '../../src/server/managers/chatManager.js';
import { getAIResponse } from '../../src/server/managers/ai.js';

// Mocks für alle externen Abhängigkeiten
vi.mock('../../src/server/managers/userManager.js', () => ({
  setUserName: vi.fn(),
  getUser: vi.fn()
}));

vi.mock('../../src/server/managers/chatManager.js', () => ({
  addMessageToChat: vi.fn(),
  getChat: vi.fn(),
  getUserChats: vi.fn(),
  createEmptyChatForUser: vi.fn(),
  joinChatById: vi.fn()
}));

vi.mock('../../src/server/managers/ai.js', () => ({
  getAIResponse: vi.fn()
}));

describe('WS Klasse Tests', () => {
  let ws;
  let userId;
  let mockWebSocket;

  beforeEach(() => {
    // WebSocket-Mock erstellen
    mockWebSocket = {
      readyState: 1, // OPEN
      send: vi.fn()
    };

    userId = 'user-123';
    ws = new WS(mockWebSocket, userId);

    // Alle Mocks zurücksetzen
    vi.clearAllMocks();

    // Standard-Rückgabewerte für Mocks festlegen
    getUser.mockImplementation((id) => {
      if (id === 'user-123') {
        return { name: 'TestUser', ws: mockWebSocket };
      } else if (id === 'user-456') {
        return { name: 'OtherUser', ws: mockWebSocket };
      } else if (id === 'AI') {
        return { name: 'AI Assistant', ws: null };
      }
      return null;
    });

    getChat.mockImplementation((chatId) => {
      if (chatId === 'chat-123') {
        return {
          id: 'chat-123',
          participants: [
            { id: 'user-123', name: 'TestUser' },
            { id: 'user-456', name: 'OtherUser' }
          ],
          messages: [
            { id: 'msg-1', from: 'user-123', text: 'Hallo', timestamp: Date.now() }
          ],
          createdAt: Date.now()
        };
      } else if (chatId === 'chat-456') {
        return {
          id: 'chat-456',
          participants: [
            { id: 'user-456', name: 'OtherUser' }
          ],
          messages: [],
          createdAt: Date.now()
        };
      } else if (chatId === 'ai-chat') {
        return {
          id: 'ai-chat',
          participants: [
            { id: 'user-123', name: 'TestUser' },
            { id: 'AI', name: 'AI Assistant' }
          ],
          messages: [],
          createdAt: Date.now()
        };
      }
      return null;
    });
  });

  describe('Basisfunktionen', () => {
    test('sollte Daten korrekt senden', () => {
      const data = { type: 'test', message: 'Hallo Welt' };
      ws.send(data);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(data));
    });

    test('sollte keine Daten senden, wenn WebSocket nicht geöffnet ist', () => {
      mockWebSocket.readyState = 3; // CLOSED
      
      const data = { type: 'test', message: 'Hallo Welt' };
      ws.send(data);
      
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    test('sollte Fehlermeldungen korrekt senden', () => {
      ws.sendError('Test Fehler');
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'error', message: 'Test Fehler' })
      );
    });

    test('sollte Nachrichten an alle Chat-Teilnehmer senden', () => {
      const data = { type: 'broadcast', message: 'Broadcast Nachricht' };
      const result = ws.broadcastToChat('chat-123', data);
      
      expect(result).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledTimes(2); // Beide Teilnehmer
    });

    test('sollte angegebene Benutzer bei Broadcast ausschließen', () => {
      const data = { type: 'broadcast', message: 'Broadcast Nachricht' };
      const result = ws.broadcastToChat('chat-123', data, 'user-123');
      
      expect(result).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledTimes(1); // Nur ein Teilnehmer
    });

    test('sollte false zurückgeben, wenn Chat nicht existiert', () => {
      const data = { type: 'broadcast', message: 'Broadcast Nachricht' };
      const result = ws.broadcastToChat('nonexistent-chat', data);
      
      expect(result).toBe(false);
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    test('sollte Chat-Zugriff validieren und Chat zurückgeben', () => {
      const chat = ws.validateChatAccess('chat-123');
      
      expect(chat).not.toBeNull();
      expect(chat.id).toBe('chat-123');
    });

    test('sollte null zurückgeben, wenn Chat nicht existiert', () => {
      const chat = ws.validateChatAccess('nonexistent-chat');
      
      expect(chat).toBeNull();
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('existiert nicht')
      );
    });

    test('sollte null zurückgeben, wenn Benutzer kein Teilnehmer ist', () => {
      const chat = ws.validateChatAccess('chat-456');
      
      expect(chat).toBeNull();
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('kein Teilnehmer')
      );
    });
  });

  describe('Command Handlers', () => {
    test('sollte Namen korrekt setzen', async () => {
      await ws.setName({ name: 'NewName' });
      
      expect(setUserName).toHaveBeenCalledWith('user-123', 'NewName');
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('nameSet')
      );
    });

    test('sollte Fehler senden, wenn Name leer ist', async () => {
      await ws.setName({ name: '  ' });
      
      expect(setUserName).not.toHaveBeenCalled();
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('leer sein')
      );
    });

    test('sollte Nachricht korrekt senden', async () => {
      addMessageToChat.mockReturnValue({
        id: 'new-msg',
        from: 'user-123',
        text: 'Test Nachricht',
        timestamp: Date.now()
      });
      
      await ws.messageTo({ chatId: 'chat-123', text: 'Test Nachricht' });
      
      expect(addMessageToChat).toHaveBeenCalledWith('chat-123', 'user-123', 'Test Nachricht');
      expect(mockWebSocket.send).toHaveBeenCalledTimes(2); // Broadcast an beide Teilnehmer
    });

    test('sollte Fehler senden, wenn Nachricht leer ist', async () => {
      await ws.messageTo({ chatId: 'chat-123', text: '  ' });
      
      expect(addMessageToChat).not.toHaveBeenCalled();
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('leer sein')
      );
    });

    test('sollte AI-Antwort anfordern, wenn AI Teilnehmer ist', async () => {
      addMessageToChat.mockReturnValueOnce({
        id: 'user-msg',
        from: 'user-123',
        text: 'Hallo AI',
        timestamp: Date.now()
      }).mockReturnValueOnce({
        id: 'ai-msg',
        from: 'AI',
        text: 'Hallo Mensch',
        timestamp: Date.now()
      });
      
      getAIResponse.mockResolvedValue('Hallo Mensch');
      
      await ws.messageTo({ chatId: 'ai-chat', text: 'Hallo AI' });
      
      expect(getAIResponse).toHaveBeenCalledWith('Hallo AI');
      expect(addMessageToChat).toHaveBeenCalledTimes(2); // Benutzernachricht und AI-Antwort
      
      // Korrigierte Erwartung: 2 statt 4 Aufrufe
      expect(mockWebSocket.send).toHaveBeenCalledTimes(2); // Nur der menschliche Teilnehmer erhält beide Nachrichten
    });

    test('sollte Fehler bei AI-Antwort behandeln', async () => {
      addMessageToChat.mockReturnValue({
        id: 'user-msg',
        from: 'user-123',
        text: 'Hallo AI',
        timestamp: Date.now()
      });
      
      getAIResponse.mockRejectedValue(new Error('AI-Fehler'));
      
      // Spionieren auf console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await ws.messageTo({ chatId: 'ai-chat', text: 'Hallo AI' });
      
      expect(getAIResponse).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('AI Response Error:', expect.any(Error));
      
      // Spionage aufheben
      consoleSpy.mockRestore();
    });

    test('sollte Chat-Details korrekt abrufen', async () => {
      await ws.getChat({ chatId: 'chat-123' });
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('chat')
      );
      
      const sendData = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sendData.chatId).toBe('chat-123');
      expect(sendData.participants).toHaveLength(2);
      expect(sendData.messages).toHaveLength(1);
    });

    test('sollte Benutzer-Chats korrekt abrufen', async () => {
      getUserChats.mockReturnValue([
        { id: 'chat-123', name: 'Chat 1' },
        { id: 'ai-chat', name: 'AI Chat' }
      ]);
      
      await ws.getUserChats();
      
      expect(getUserChats).toHaveBeenCalledWith('user-123');
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('userChats')
      );
      
      const sendData = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sendData.chats).toHaveLength(2);
    });

    test('sollte leeren Chat korrekt erstellen', async () => {
      createEmptyChatForUser.mockReturnValue('new-chat-id');
      
      await ws.createEmptyChat();
      
      expect(createEmptyChatForUser).toHaveBeenCalledWith('user-123');
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('emptyChatCreated')
      );
      
      const sendData = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sendData.chatId).toBe('new-chat-id');
    });

    test('sollte erfolgreich einem Chat beitreten', async () => {
      joinChatById.mockReturnValue(true);
      
      await ws.joinChatById({ chatId: 'chat-456' });
      
      expect(joinChatById).toHaveBeenCalledWith('chat-456', 'user-123');
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('joinedChat')
      );
    });

    test('sollte Fehler senden, wenn Chat-ID fehlt', async () => {
      await ws.joinChatById({});
      
      expect(joinChatById).not.toHaveBeenCalled();
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Chat-ID fehlt')
      );
    });

    test('sollte Fehler senden, wenn Chat nicht existiert', async () => {
      joinChatById.mockReturnValue(false);
      
      await ws.joinChatById({ chatId: 'nonexistent-chat' });
      
      expect(joinChatById).toHaveBeenCalledWith('nonexistent-chat', 'user-123');
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('existiert nicht')
      );
    });
  });
});