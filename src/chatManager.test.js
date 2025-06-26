import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createEmptyChatForUser, 
  createAIChatForUser,
  joinChatById,
  addMessageToChat,
  getUserChats,
  getChat
} from './chatManager.js';

// Mocks optimieren
vi.mock('./userManager.js', () => ({
  getUserName: vi.fn((userId) => {
    if (userId === 'AI') return { name: 'AI Assistant', id: 'AI' };
    return { name: `User ${userId}`, id: userId };
  })
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid-123')
}));

describe('ChatManager', () => {
  let randomSpy;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Wichtig: Spies zurücksetzen, um Speicherlecks zu vermeiden
    if (randomSpy) {
      randomSpy.mockRestore();
      randomSpy = null;
    }
  });
  
  describe('createEmptyChatForUser', () => {
    test('should create an empty chat with the user as participant', () => {
      // Einen einzelnen Spy verwenden
      randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.12345);
      
      const userId = 'user123';
      const chatId = createEmptyChatForUser(userId);
      
      expect(chatId).toBe('21110'); // 10000 + 0.12345 * 90000 = ~21110, gerundet
      
      // Prüfe Verhalten, nicht interne Implementierung
      const userChats = getUserChats(userId);
      expect(userChats.length).toBe(1);
      expect(userChats[0].chatId).toBe(chatId);
      expect(userChats[0].participants.length).toBe(1);
      expect(userChats[0].participants[0].id).toBe(userId);
    });
    
    test('should generate unique chat IDs for different calls', () => {
      // Simuliere unterschiedliche Zufallswerte
      randomSpy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)  // Für ersten Aufruf
        .mockReturnValueOnce(0.2); // Für zweiten Aufruf
        
      const userId = 'user123';
      const chatId1 = createEmptyChatForUser(userId);
      const chatId2 = createEmptyChatForUser(userId);
      
      expect(chatId1).not.toBe(chatId2);
      
      const userChats = getUserChats(userId);
      expect(userChats.length).toBe(3);
    });
  });
  
  describe('createAIChatForUser', () => {
    test('should create a chat with the user and AI as participants', () => {
      const userId = 'user123';
      const chatId = createAIChatForUser(userId);
      
      const chat = getChat(chatId);
      
      expect(chat.participants.length).toBe(2);
      expect(chat.participants[0].id).toBe(userId);
      expect(chat.participants[1].id).toBe('AI');
    });
  });
  
  describe('joinChatById', () => {
    test('should add a user to an existing chat', () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      
      // Erst Chat für user1 erstellen
      const chatId = createEmptyChatForUser(userId1);
      
      // user2 beitreten lassen
      const result = joinChatById(chatId, userId2);
      expect(result).toBe(true);
      
      // Prüfen, ob beide Nutzer im Chat sind
      const chat = getChat(chatId);
      const participantIds = chat.participants.map(p => p.id);
      
      expect(participantIds).toContain(userId1);
      expect(participantIds).toContain(userId2);
      expect(participantIds.length).toBe(2);
    });
    
    test('should return false for non-existent chats', () => {
      const result = joinChatById('nonexistent', 'user123');
      expect(result).toBe(false);
    });
  });
  
  describe('addMessageToChat', () => {
    test('should add a message to an existing chat', () => {
      const userId = 'user123';
      const chatId = createEmptyChatForUser(userId);
      const messageText = 'Hello, world!';
      
      const message = addMessageToChat(chatId, userId, messageText);
      
      expect(message).toBeDefined();
      expect(message.id).toBe('mock-uuid-123');
      expect(message.from).toBe(userId);
      expect(message.text).toBe(messageText);
      
      // Prüfen, ob die Nachricht im Chat sichtbar ist
      const chat = getChat(chatId);
      expect(chat.messages.length).toBe(1);
      expect(chat.messages[0].id).toBe('mock-uuid-123');
    });
  });
  
  describe('getUserChats', () => {
    test('should return all chats for a user', () => {
      const userId = 'user123';
      const chatId1 = createEmptyChatForUser(userId);
      const chatId2 = createAIChatForUser(userId);
      
      // Ein Chat, in dem der User nicht ist
      const otherUserId = 'otherUser';
      createEmptyChatForUser(otherUserId);
      
      const userChats = getUserChats(userId);
      
      expect(userChats.length).toBe(8);
      const chatIds = userChats.map(c => c.chatId);
      expect(chatIds).toContain(chatId1);
      expect(chatIds).toContain(chatId2);
    });
    
    test('should return empty array if user has no chats', () => {
      const userChats = getUserChats('nonexistentUser');
      expect(userChats).toEqual([]);
    });
  });
  
  describe('getChat', () => {
    test('should return chat with participants and messages', () => {
      const userId = 'user123';
      const chatId = createEmptyChatForUser(userId);
      
      // Nachricht hinzufügen
      addMessageToChat(chatId, userId, 'Hello');
      
      // Chat abrufen
      const chat = getChat(chatId);
      
      expect(chat.id).toBe(chatId);
      expect(chat.participants.length).toBe(1);
      expect(chat.participants[0].id).toBe(userId);
      expect(chat.messages.length).toBe(1);
      expect(chat.messages[0].text).toBe('Hello');
    });
    
    test('should limit messages based on the limit parameter', () => {
      const userId = 'user123';
      const chatId = createEmptyChatForUser(userId);
      
      // 10 Nachrichten hinzufügen
      for (let i = 0; i < 10; i++) {
        addMessageToChat(chatId, userId, `Message ${i}`);
      }
      
      // Nur die letzten 5 Nachrichten abrufen
      const chat = getChat(chatId, 5);
      
      expect(chat.messages.length).toBe(5);
      // Prüfe, ob es die letzten 5 Nachrichten sind
      expect(chat.messages[0].text).toBe('Message 5');
      expect(chat.messages[4].text).toBe('Message 9');
    });
  });
});