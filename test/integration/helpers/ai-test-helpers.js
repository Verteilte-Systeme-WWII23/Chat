import { addUser } from '../../../src/server/managers/userManager.js';
import { createAIChatForUser, addMessageToChat } from '../../../src/server/managers/chatManager.js';
import { getAIResponse } from '../../../src/server/managers/ai.js';

/**
 * Erstellt einen AI-Chat und fügt eine Konversation hinzu
 */
export async function createAIConversation(messages = ['Hello AI']) {
  // Mock für WebSocket
  const mockWs = { send: vi.fn(), readyState: 1 };
  
  // Benutzer und Chat erstellen
  const userId = addUser(mockWs, '127.0.0.1');
  const chatId = createAIChatForUser(userId);
  
  // Nachrichten hinzufügen
  const conversation = [];
  
  for (const msg of messages) {
    // Benutzernachricht
    const userMsg = addMessageToChat(chatId, userId, msg);
    conversation.push(userMsg);
    
    // AI-Antwort
    const aiResponse = await getAIResponse(msg);
    const aiMsg = addMessageToChat(chatId, 'AI', aiResponse);
    conversation.push(aiMsg);
  }
  
  return { userId, chatId, conversation };
}