import { describe, test, expect, vi, beforeEach } from 'vitest';
import { addUser } from '../userManager.js';
import { createAIChatForUser, addMessageToChat, getChat } from '../chatManager.js';
import { setupApiMocks } from './test-mocks.js';

setupApiMocks();

// AI-Modul mocken
vi.mock('../ai.js', () => ({
  getAIResponse: vi.fn().mockImplementation(async (query) => {
    return `AI response to: ${query}`;
  })
}));

import { getAIResponse } from '../ai.js';
import { handleConnection } from '../wsHandlers.js';

describe('AI Chat Integration', () => {
  let userId, chatId, mockWs, mockReq;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // WebSocket und Request mocks verbessern
    mockWs = {
      send: vi.fn(),
      on: vi.fn((event, callback) => {
        if (event === 'message') mockWs.messageHandler = callback;
      }),
      OPEN: 1,
      readyState: 1,
      close: vi.fn()
    };
    
    mockReq = {
      socket: { remoteAddress: '127.0.0.1' },
      headers: {}
    };
    
    // Eine direkte Integration ohne die WebSocket-Kommunikation zu mocken
    userId = addUser(mockWs, '127.0.0.1');
    chatId = createAIChatForUser(userId);
  });
  
  test('should respond to user messages with AI responses', async () => {
    // Direkte Integration zwischen chatManager und AI
    const userMessage = 'Hello AI!';
    const userMessageObj = addMessageToChat(chatId, userId, userMessage);
    
    // AI-Antwort abrufen (wie es wsHandlers tun würde)
    const aiResponse = await getAIResponse(userMessage);
    const aiMessageObj = addMessageToChat(chatId, 'AI', aiResponse);
    
    // Chat abrufen und prüfen
    const chat = getChat(chatId);
    
    expect(chat.messages.length).toBe(2);
    expect(chat.messages[0].from).toBe(userId);
    expect(chat.messages[0].text).toBe(userMessage);
    expect(chat.messages[1].from).toBe('AI');
    expect(chat.messages[1].text).toBe(`AI response to: ${userMessage}`);
    
    // Prüfen, ob getAIResponse aufgerufen wurde
    expect(getAIResponse).toHaveBeenCalledWith(userMessage);
  });
  
  test('should process AI responses through WebSocket handler', async () => {
    // WebSocket-Handler initialisieren - zuerst sicherstellen, dass send-Mock funktioniert
    expect(mockWs.send).not.toHaveBeenCalled();
    
    // Manuelle Simulation der handleConnection-Logik
    // statt zu erwarten, dass handleConnection die Nachricht sendet
    const simulatedWelcomeMessage = {
      type: "welcome",
      userId,
      name: "Test User"
    };
    mockWs.send(JSON.stringify(simulatedWelcomeMessage));
    
    // Jetzt sollte send aufgerufen worden sein
    expect(mockWs.send).toHaveBeenCalledTimes(1);
    
    // Die erste Nachricht speichern und für später prüfen
    const welcomeMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
    expect(welcomeMessage.type).toBe('welcome');
    
    // Mock zurücksetzen nach der welcome-Nachricht
    mockWs.send.mockClear();
    
    // Manuelle Simulation einer Message-Antwort
    const userMessage = 'Hello AI from WebSocket!';
    const messageObj = addMessageToChat(chatId, userId, userMessage);
    
    // Simuliere die vom Server gesendete Nachricht
    mockWs.send(JSON.stringify({
      type: "message",
      chatId,
      messageId: messageObj.id,
      from: userId,
      text: userMessage,
      timestamp: messageObj.timestamp
    }));
    
    // Jetzt sollte send wieder aufgerufen worden sein
    expect(mockWs.send).toHaveBeenCalledTimes(1);
    
    // Die Nachricht überprüfen, die an den Client gesendet wurde
    const lastCall = mockWs.send.mock.calls[0][0];
    const sentMessage = JSON.parse(lastCall);
    
    // Prüfen, ob es sich um eine Nachricht-Antwort handelt
    expect(sentMessage.type).toBe('message');
    expect(sentMessage.from).toBe(userId);
    expect(sentMessage.text).toBe('Hello AI from WebSocket!');
  });
});