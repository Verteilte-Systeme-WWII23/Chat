import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
// Korrigiere den Import
import { createServer } from '../createServer.js';
import { setupApiMocks } from './test-mocks.js';

setupApiMocks();

describe('WebSocket Integration', () => {
  let server;
  let port;
  let client1;
  let client2;
  
  // Test-Server und -Clients erstellen
  beforeAll(async () => {
    port = 3100 + Math.floor(Math.random() * 900);
    server = await createServer();
    await new Promise(resolve => server.listen(port, resolve));
    
    // WebSocket-Clients erstellen
    client1 = new WebSocket(`ws://localhost:${port}`);
    client2 = new WebSocket(`ws://localhost:${port}`);
    
    // Warten bis Verbindungen bereit sind
    await Promise.all([
      new Promise(resolve => client1.on('open', resolve)),
      new Promise(resolve => client2.on('open', resolve))
    ]);
  });
  
  afterAll(() => {
    if (client1) client1.close();
    if (client2) client2.close();
    if (server) server.close();
  });
  
  test('should allow users to exchange messages', async () => {
    let userId1, userId2, chatId;
    
    // Nachrichtenempfang für Client 1
    const messages1 = [];
    client1.on('message', data => {
      const msg = JSON.parse(data);
      messages1.push(msg);
      if (msg.type === 'welcome') userId1 = msg.userId;
    });
    
    // Nachrichtenempfang für Client 2
    const messages2 = [];
    client2.on('message', data => {
      const msg = JSON.parse(data);
      messages2.push(msg);
      if (msg.type === 'welcome') userId2 = msg.userId;
    });
    
    // Warten auf Welcome-Nachrichten
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Namen setzen
    client1.send(JSON.stringify({ type: 'setName', name: 'TestUser1' }));
    client2.send(JSON.stringify({ type: 'setName', name: 'TestUser2' }));
    
    // Chat erstellen mit Client 1
    client1.send(JSON.stringify({ type: 'createEmptyChat' }));
    
    // Warten auf Chat-Erstellung
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Chat-ID finden
    const emptyChatMsg = messages1.find(m => m.type === 'emptyChatCreated');
    chatId = emptyChatMsg.chatId;
    
    // Client 2 tritt Chat bei
    client2.send(JSON.stringify({ type: 'joinChatById', chatId }));
    
    // Warten auf Beitritt
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Nachricht senden
    client1.send(JSON.stringify({ 
      type: 'messageTo', 
      chatId, 
      text: 'Hello from Client 1' 
    }));
    
    // Warten auf Nachrichtenübertragung
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Prüfen, ob Client 2 die Nachricht erhalten hat
    const messageReceived = messages2.some(m => 
      m.type === 'message' && 
      m.text === 'Hello from Client 1' && 
      m.from === userId1
    );
    
    expect(messageReceived).toBe(true);
  });
});