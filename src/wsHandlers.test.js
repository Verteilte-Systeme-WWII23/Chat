import { describe, test, expect, beforeEach, vi } from 'vitest';
import { handleConnection } from './wsHandlers.js';

// Vitest bietet bessere ESM-Unterstützung für Mocks
vi.mock('./userManager.js', () => ({
  addUser: vi.fn(),
  isBanned: vi.fn(),
  removeUser: vi.fn(),
  setUserName: vi.fn(),
  getUser: vi.fn(),
  getAllUsers: vi.fn()
}));

vi.mock('./chatManager.js', () => ({
  addMessageToChat: vi.fn(),
  getChat: vi.fn(),
  getUserChats: vi.fn(),
  createEmptyChatForUser: vi.fn(),
  joinChatById: vi.fn(),
  createAIChatForUser: vi.fn()
}));

vi.mock('./ai.js', () => ({
  getAIResponse: vi.fn()
}));

// Importiere die gemockten Module
import * as userManager from './userManager.js';
import * as chatManager from './chatManager.js';
import * as ai from './ai.js';

describe('handleConnection', () => {
  let ws;
  let req;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock WebSocket
    ws = {
      send: vi.fn(),
      close: vi.fn(),
      on: vi.fn((event, callback) => {
        if (event === 'message') {
          ws.messageCallback = callback;
        }
      }),
      OPEN: 1,
      readyState: 1
    };
    
    // Mock Request
    req = {
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1'
      }
    };
  });

  test('should handle banned IP', async () => {
    userManager.isBanned.mockReturnValue(true);
    
    handleConnection(ws, req);
    
    expect(userManager.isBanned).toHaveBeenCalledWith('127.0.0.1');
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ 
      type: "banned", 
      reason: "Du wurdest gesperrt." 
    }));
    expect(ws.close).toHaveBeenCalled();
  });

  test('should handle initial connection', async () => {
    userManager.isBanned.mockReturnValue(false);
    userManager.addUser.mockReturnValue('user123');
    userManager.getUser.mockReturnValue({ name: 'Anonymous', ws });
    
    handleConnection(ws, req);
    
    await ws.messageCallback(JSON.stringify({}));
    
    expect(userManager.addUser).toHaveBeenCalledWith(ws, '127.0.0.1');
    expect(chatManager.createAIChatForUser).toHaveBeenCalledWith('user123');
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ 
        type: "welcome", 
        userId: 'user123', 
        name: 'Anonymous'
    }));
  });

  test('should handle reconnection', async () => {
    userManager.isBanned.mockReturnValue(false);
    userManager.getUser.mockReturnValue({ name: 'TestUser' });
    
    handleConnection(ws, req);
    
    await ws.messageCallback(JSON.stringify({
        type: 'reconnect',
        userId: 'user123'
    }));
    
    expect(userManager.getUser).toHaveBeenCalledWith('user123');
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ 
        type: "welcome", 
        userId: 'user123', 
        name: 'TestUser'
    }));
  });

  test('should handle setting username', async () => {
    userManager.isBanned.mockReturnValue(false);
    userManager.addUser.mockReturnValue('user123');
    
    handleConnection(ws, req);
    
    await ws.messageCallback(JSON.stringify({}));
    await ws.messageCallback(JSON.stringify({
        type: 'setName',
        name: 'NewName'
    }));
    
    expect(userManager.setUserName).toHaveBeenCalledWith('user123', 'NewName');
  });

  test('should handle sending a message to a chat', async () => {
    userManager.isBanned.mockReturnValue(false);
    userManager.addUser.mockReturnValue('user123');
    
    const mockChat = {
        participants: [{ id: 'user123' }, { id: 'user456' }],
        messages: []
    };
    
    chatManager.getChat.mockReturnValue(mockChat);
    
    const mockMessage = {
        id: 'msg123',
        from: 'user123',
        text: 'Hello',
        timestamp: Date.now()
    };
    
    chatManager.addMessageToChat.mockReturnValue(mockMessage);
    userManager.getUser.mockImplementation((id) => {
        if (id === 'user123') return { ws, name: 'User1' };
        if (id === 'user456') return { ws: { ...ws, readyState: 1 }, name: 'User2' };
        return null;
    });
    
    handleConnection(ws, req);
    
    await ws.messageCallback(JSON.stringify({}));
    await ws.messageCallback(JSON.stringify({
        type: 'messageTo',
        chatId: 'chat123',
        text: 'Hello'
    }));
    
    expect(chatManager.getChat).toHaveBeenCalledWith('chat123', 0);
    expect(chatManager.addMessageToChat).toHaveBeenCalledWith('chat123', 'user123', 'Hello');
    expect(ws.send).toHaveBeenCalled();
  });

  test('should handle AI responses', async () => {
    userManager.isBanned.mockReturnValue(false);
    userManager.addUser.mockReturnValue('user123');
    
    const mockChat = {
        participants: [{ id: 'user123' }, { id: 'AI' }],
        messages: []
    };
    
    chatManager.getChat.mockReturnValue(mockChat);
    
    const mockMessage = {
        id: 'msg123',
        from: 'user123',
        text: 'Hello AI',
        timestamp: Date.now()
    };
    
    const mockAIMessage = {
        id: 'msg124',
        from: 'AI',
        text: 'Hello human',
        timestamp: Date.now()
    };
    
    chatManager.addMessageToChat.mockReturnValueOnce(mockMessage).mockReturnValueOnce(mockAIMessage);
    ai.getAIResponse.mockResolvedValue('Hello human');
    
    userManager.getUser.mockImplementation((id) => {
        if (id === 'user123') return { ws, name: 'User1' };
        return null;
    });
    
    handleConnection(ws, req);
    
    await ws.messageCallback(JSON.stringify({}));
    await ws.messageCallback(JSON.stringify({
        type: 'messageTo',
        chatId: 'chat123',
        text: 'Hello AI'
    }));
    
    expect(ai.getAIResponse).toHaveBeenCalledWith('Hello AI');
    expect(chatManager.addMessageToChat).toHaveBeenCalledWith('chat123', 'AI', 'Hello human');
  });

  test('should handle getting chat info', async () => {
    userManager.isBanned.mockReturnValue(false);
    userManager.addUser.mockReturnValue('user123');
    
    const mockChat = {
        participants: [{ id: 'user123' }],
        messages: [],
        createdAt: Date.now()
    };
    
    chatManager.getChat.mockReturnValue(mockChat);
    
    handleConnection(ws, req);
    
    await ws.messageCallback(JSON.stringify({}));
    await ws.messageCallback(JSON.stringify({
        type: 'getChat',
        chatId: 'chat123'
    }));
    
    expect(chatManager.getChat).toHaveBeenCalledWith('chat123');
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('chat'));
  });

  test('should handle getting user chats', async () => {
    userManager.isBanned.mockReturnValue(false);
    userManager.addUser.mockReturnValue('user123');
    
    const mockUserChats = [
        { id: 'chat123', name: 'Chat 1' },
        { id: 'chat456', name: 'Chat 2' }
    ];
    
    chatManager.getUserChats.mockReturnValue(mockUserChats);
    
    handleConnection(ws, req);
    
    await ws.messageCallback(JSON.stringify({}));
    await ws.messageCallback(JSON.stringify({
        type: 'getUserChats'
    }));
    
    expect(chatManager.getUserChats).toHaveBeenCalledWith('user123');
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'userChats',
        chats: mockUserChats
    }));
  });

  test('should handle creating empty chat', async () => {
    userManager.isBanned.mockReturnValue(false);
    userManager.addUser.mockReturnValue('user123');
    chatManager.createEmptyChatForUser.mockReturnValue('chat123');
    
    handleConnection(ws, req);
    
    await ws.messageCallback(JSON.stringify({}));
    await ws.messageCallback(JSON.stringify({
        type: 'createEmptyChat'
    }));
    
    expect(chatManager.createEmptyChatForUser).toHaveBeenCalledWith('user123');
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'emptyChatCreated',
        chatId: 'chat123',
        participants: ['user123']
    }));
  });

  test('should handle joining a chat successfully', async () => {
    userManager.isBanned.mockReturnValue(false);
    userManager.addUser.mockReturnValue('user123');
    chatManager.joinChatById.mockReturnValue(true);
    
    const mockChat = {
        participants: [{ id: 'user123' }, { id: 'user456' }],
        createdAt: Date.now()
    };
    
    chatManager.getChat.mockReturnValue(mockChat);
    userManager.getUser.mockImplementation((id) => {
        if (id === 'user123') return { ws, name: 'User1' };
        if (id === 'user456') return { ws: { ...ws, readyState: 1 }, name: 'User2' };
        return null;
    });
    
    handleConnection(ws, req);
    
    await ws.messageCallback(JSON.stringify({}));
    await ws.messageCallback(JSON.stringify({
        type: 'joinChatById',
        chatId: 'chat123'
    }));
    
    expect(chatManager.joinChatById).toHaveBeenCalledWith('chat123', 'user123');
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining('joinedChat'));
  });

  test('should handle joining a non-existent chat', async () => {
    userManager.isBanned.mockReturnValue(false);
    userManager.addUser.mockReturnValue('user123');
    chatManager.joinChatById.mockReturnValue(false);
    
    handleConnection(ws, req);
    
    await ws.messageCallback(JSON.stringify({}));
    await ws.messageCallback(JSON.stringify({
        type: 'joinChatById',
        chatId: 'nonexistent'
    }));
    
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'error',
        message: 'Chat mit dieser ID existiert nicht.'
    }));
  });

  test('should handle invalid JSON messages', async () => {
    console.error = vi.fn();
    userManager.isBanned.mockReturnValue(false);
    
    handleConnection(ws, req);
    await ws.messageCallback('invalid json');
    
    expect(console.error).toHaveBeenCalled();
  });
});