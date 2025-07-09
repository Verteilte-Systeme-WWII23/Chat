import { describe, test, expect, beforeEach } from 'vitest';
import { addUser, removeUser } from '../../src/server/managers/userManager.js';
import { 
  createEmptyChatForUser, 
  createAIChatForUser,
  addMessageToChat, 
  getChat,
  getUserChats,
  joinChatById
} from '../../src/server/managers/chatManager.js';
import { setupApiMocks } from './helpers/test-mocks.js';

setupApiMocks();

describe('Chat System Integration', () => {
  let userId1, userId2, userId3;
  let mockWs1, mockWs2, mockWs3;
  
  beforeEach(() => {
    
    mockWs1 = { send: vi.fn(), close: vi.fn() };
    mockWs2 = { send: vi.fn(), close: vi.fn() };
    mockWs3 = { send: vi.fn(), close: vi.fn() };
    
    
    userId1 = addUser(mockWs1, '127.0.0.1');
    userId2 = addUser(mockWs2, '127.0.0.2');
    userId3 = addUser(mockWs3, '127.0.0.3');
  });
  
  test('sollte private Chats zwischen Benutzern verwalten können', () => {
    
    const chatId = createEmptyChatForUser(userId1);
    
    
    const success = joinChatById(chatId, userId2);
    expect(success).toBe(true);
    
    
    const message1 = addMessageToChat(chatId, userId1, 'Hello from User 1');
    const message2 = addMessageToChat(chatId, userId2, 'Hello from User 2');
    
    
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
  
  test('sollte Gruppenchats mit mehreren Teilnehmern unterstützen', () => {
    
    const chatId = createEmptyChatForUser(userId1);
    
    
    joinChatById(chatId, userId2);
    joinChatById(chatId, userId3);
    
    
    addMessageToChat(chatId, userId1, 'Message from User 1');
    addMessageToChat(chatId, userId2, 'Message from User 2');
    addMessageToChat(chatId, userId3, 'Message from User 3');
    
    
    const chat = getChat(chatId);
    
    
    expect(chat.participants.length).toBe(3);
    expect(chat.participants.some(p => p.id === userId1)).toBe(true);
    expect(chat.participants.some(p => p.id === userId2)).toBe(true);
    expect(chat.participants.some(p => p.id === userId3)).toBe(true);
    
    
    expect(chat.messages.length).toBe(3);
    expect(chat.messages[0].from).toBe(userId1);
    expect(chat.messages[1].from).toBe(userId2);
    expect(chat.messages[2].from).toBe(userId3);
  });
  
  test('sollte Benutzerchats korrekt auflisten', () => {
    
    const chat1 = createEmptyChatForUser(userId1); 
    const chat2 = createAIChatForUser(userId1);
    
    
    const chat3 = createEmptyChatForUser(userId2);
    joinChatById(chat3, userId1);
    
    
    const user1Chats = getUserChats(userId1);
    const user2Chats = getUserChats(userId2);
    
    
    expect(user1Chats.length).toBe(3);
    const chatIds1 = user1Chats.map(c => c.chatId);
    expect(chatIds1).toContain(chat1);
    expect(chatIds1).toContain(chat2);
    expect(chatIds1).toContain(chat3);
    
    
    expect(user2Chats.length).toBe(1);
    expect(user2Chats[0].chatId).toBe(chat3);
  });
  
  test('sollte Nachrichten in der richtigen Reihenfolge speichern', () => {
    
    const chatId = createEmptyChatForUser(userId1);
    joinChatById(chatId, userId2);
    
    
    for (let i = 0; i < 10; i++) {
    
      const fromUser = i % 2 === 0 ? userId1 : userId2;
      addMessageToChat(chatId, fromUser, `Message ${i}`);
    }
    
    
    const chat = getChat(chatId);
    
    expect(chat.messages.length).toBe(10);
    
    
    for (let i = 0; i < 10; i++) {
      expect(chat.messages[i].text).toBe(`Message ${i}`);
      expect(chat.messages[i].from).toBe(i % 2 === 0 ? userId1 : userId2);
    }
  });
  
  test('sollte mit gelöschten Benutzerkonten umgehen können', () => {
    
    const chatId = createEmptyChatForUser(userId1);
    joinChatById(chatId, userId2);
    
    addMessageToChat(chatId, userId1, 'Message before deletion');
    addMessageToChat(chatId, userId2, 'Another message');
    
    
    const chatBefore = getChat(chatId);
    expect(chatBefore.participants.length).toBe(2);
    
    
    removeUser(userId1);
    
    
    const chatAfter = getChat(chatId);
    
    
    expect(chatAfter.messages.length).toBe(2);
    expect(chatAfter.messages[0].text).toBe('Message before deletion');
    
    
    expect(chatAfter.participants.some(p => p.id === userId2)).toBe(true);
    
    
    addMessageToChat(chatId, userId2, 'Message after user deletion');
    const updatedChat = getChat(chatId);
    expect(updatedChat.messages.length).toBe(3);
  });
  
  test('sollte mit nicht existierenden Chats korrekt umgehen', () => {
    
    const chat = getChat('non-existent-chat-id');
    
    
    expect(chat).not.toBeNull();
    expect(chat.messages).toEqual([]);
    expect(chat.participants).toEqual([]);
    
    
    const joinResult = joinChatById('non-existent-chat-id', userId1);
    expect(joinResult).toBe(false);
    
    
    
    const message = addMessageToChat('non-existent-chat-id', userId1, 'Test message');
    expect(message).toBeDefined();
    expect(message.text).toBe('Test message');
    
    
    const chatAfterMessage = getChat('non-existent-chat-id');
    expect(chatAfterMessage.messages.length).toBe(1);
    expect(chatAfterMessage.messages[0].text).toBe('Test message');
  });
});