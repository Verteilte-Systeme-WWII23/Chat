import { describe, test, expect } from 'vitest';
import { addUser } from '../userManager.js';
import { 
  createEmptyChatForUser, 
  addMessageToChat, 
  getChat,
  joinChatById  // Diese Funktion wurde nicht importiert
} from '../chatManager.js';
import { setupApiMocks } from './test-mocks.js';
setupApiMocks();
describe('Chat System Integration', () => {
  test('should correctly create and manage chats between multiple users', () => {
    // Benutzer direkt erstellen (ohne WebSocket-Mocks)
    const mockWs1 = { send: () => {}, close: () => {} };
    const mockWs2 = { send: () => {}, close: () => {} };
    
    const userId1 = addUser(mockWs1, '127.0.0.1');
    const userId2 = addUser(mockWs2, '127.0.0.2');
    
    // Chat erstellen
    const chatId = createEmptyChatForUser(userId1);
    
    // Chat beitreten
    const success = joinChatById(chatId, userId2);
    expect(success).toBe(true);
    
    // Nachrichten hinzufügen
    const message1 = addMessageToChat(chatId, userId1, 'Hello from User 1');
    const message2 = addMessageToChat(chatId, userId2, 'Hello from User 2');
    
    // Chat abrufen und prüfen
    const chat = getChat(chatId);
    
    expect(chat.participants.length).toBe(2);
    expect(chat.participants.some(p => p.id === userId1)).toBe(true);
    expect(chat.participants.some(p => p.id === userId2)).toBe(true);
    
    expect(chat.messages.length).toBe(2);
    expect(chat.messages[0].from).toBe(userId1);
    expect(chat.messages[0].text).toBe('Hello from User 1');
    expect(chat.messages[1].from).toBe(userId2);
    expect(chat.messages[1].text).toBe('Hello from User 2');
  });
});