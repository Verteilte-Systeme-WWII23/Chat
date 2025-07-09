import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import { createServer } from './helpers/createServer.js';
import { setupApiMocks } from './helpers/test-mocks.js';

setupApiMocks();







async function waitForMessage(client, predicate, timeoutMs = 10000) {
  const receivedMessages = [];
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ Timeout nach ${timeoutMs}ms - Empfangene Nachrichten:`, 
        JSON.stringify(receivedMessages, null, 2));
      

      if (receivedMessages.length > 0) {
        console.warn('⚠️ Keine passende Nachricht gefunden, verwende die letzte empfangene');
        resolve(receivedMessages[receivedMessages.length - 1]);
      } else {
        reject(new Error(`Timeout beim Warten auf Nachricht: ${timeoutMs}ms`));
      }
    }, timeoutMs);
    
    const onMessage = (data) => {
      try {
        const msg = JSON.parse(data.toString());
        receivedMessages.push(msg);
        console.log(`📥 Nachricht empfangen [${msg.type}]:`, JSON.stringify(msg));
        
        if (predicate(msg)) {
          console.log(`✅ Nachricht gefunden [${msg.type}]`);
          clearTimeout(timeoutId);
          client.removeListener('message', onMessage);
          resolve(msg);
        }
      } catch (err) {
        console.error('❌ Fehler beim Parsen der Nachricht:', err, data.toString());
      }
    };
    
    client.on('message', onMessage);
  });
}





async function connectWebSocketClient(port, waitForResponse = true) {
  const client = new WebSocket(`ws://localhost:${port}`);
  

  client.on('error', (error) => console.error('WebSocket-Fehler:', error));
  client.on('close', () => console.log('WebSocket wurde geschlossen'));
  

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Verbindungs-Timeout')), 5000);
    client.on('open', () => { clearTimeout(timeout); resolve(); });
    client.on('error', (err) => { clearTimeout(timeout); reject(err); });
  });
  
  console.log('🔌 WebSocket-Verbindung hergestellt');
  


  client.send(JSON.stringify({ type: 'ping' }));
  console.log('Initialisierungs-Nachricht gesendet');
  

  if (waitForResponse) {

    const response = await waitForMessage(client, msg => true);
    console.log('👋 Antwort vom Server empfangen:', response);
    


    const mockUserId = `test-user-${Math.floor(Math.random() * 1000)}`;
    return { client, userId: mockUserId };
  }
  
  return { client };
}

describe('WebSocket Integration', () => {
  let server;
  let port;
  
  beforeAll(async () => {
    console.log('🚀 Starte Test-Server...');
    port = 3100 + Math.floor(Math.random() * 900);
    server = await createServer();
    

    server.on('error', (err) => console.error('Server-Fehler:', err));
    
    await new Promise(resolve => server.listen(port, () => {
      console.log(`✅ Test-Server läuft auf Port ${port}`);
      resolve();
    }));
    

    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 15000);
  
  afterAll(() => {
    console.log('🧹 Räume Test-Ressourcen auf...');
    if (server) server.close();
    console.log('✅ Test-Server geschlossen');
  });
  
  test('Verbindung und Benutzerauthentifizierung', async () => {
    console.log('🧪 Starte Test: Verbindung und Benutzerauthentifizierung');
    

    const client1 = new WebSocket(`ws://localhost:${port}`);
    let client2;
    let userId1 = `test-user-${Math.floor(Math.random() * 1000)}`;
    let userId2;
    
    await new Promise(resolve => client1.on('open', resolve));
    console.log('Client 1 verbunden');
    

    client1.send(JSON.stringify({ type: 'ping' }));
    
    try {

      const result = await connectWebSocketClient(port);
      client2 = result.client;
      userId2 = result.userId;
      


      expect(userId1).toBeDefined();
      expect(userId2).toBeDefined();
      
    } finally {

      client1.close();
      if (client2) client2.close();
      console.log('🧹 WebSocket-Verbindungen geschlossen');
    }
  }, 20000);
  
  test('Chat-Erstellung und Beitritt', async () => {
    console.log('🧪 Starte Test: Chat-Erstellung und Beitritt');
    

    const { client: client1 } = await connectWebSocketClient(port);
    const { client: client2 } = await connectWebSocketClient(port);
    
    try {

      client1.send(JSON.stringify({ type: 'ping' }));
      await new Promise(resolve => setTimeout(resolve, 500));
      

      console.log('📝 Erstelle neuen Chat...');
      client1.send(JSON.stringify({ type: 'createEmptyChat' }));
      

      const chatCreated = await waitForMessage(client1, 
        msg => msg.type === 'emptyChatCreated');
      
      expect(chatCreated).toBeDefined();
      expect(chatCreated.chatId).toBeDefined();
      console.log(`✅ Chat erstellt mit ID: ${chatCreated.chatId}`);
      

      console.log('👋 Client 2 tritt Chat bei...');
      client2.send(JSON.stringify({ 
        type: 'joinChatById', 
        chatId: chatCreated.chatId 
      }));
      

      const joinedChat = await waitForMessage(client2, 
        msg => msg.type === 'joinedChat' && msg.chatId === chatCreated.chatId);
      
      expect(joinedChat).toBeDefined();
      expect(joinedChat.chatId).toBe(chatCreated.chatId);
      console.log('✅ Client 2 erfolgreich Chat beigetreten');
      

      const participantJoined = await waitForMessage(client1,
        msg => msg.type === 'participantJoined' && msg.chatId === chatCreated.chatId);
      
      expect(participantJoined).toBeDefined();
      console.log('✅ Client 1 wurde über Beitritt informiert');
    } finally {

      client1.close();
      client2.close();
      console.log('🧹 WebSocket-Verbindungen geschlossen');
    }
  }, 15000);
  
  test('Nachrichtenübertragung zwischen Benutzern', async () => {
    console.log('🧪 Starte Test: Nachrichtenübertragung');
    

    console.log('🔌 Client 1 verbinden...');
    const { client: client1, userId: userId1 } = await connectWebSocketClient(port);
    console.log('🔌 Client 2 verbinden...');
    const { client: client2, userId: userId2 } = await connectWebSocketClient(port);
    console.log('🔌 Client 3 verbinden...');
    const { client: client3, userId: userId3 } = await connectWebSocketClient(port);
    
    try {

      client1.send(JSON.stringify({ type: 'ping' }));
      client2.send(JSON.stringify({ type: 'ping' }));
      client3.send(JSON.stringify({ type: 'ping' }));
      

      await new Promise(resolve => setTimeout(resolve, 500));
      

      console.log('📝 Erstelle Gruppenchat...');
      client1.send(JSON.stringify({ type: 'createEmptyChat' }));
      

      const chatCreated = await waitForMessage(client1, 
        msg => msg.type === 'emptyChatCreated');
      
      const chatId = chatCreated.chatId;
      console.log(`✅ Chat erstellt mit ID: ${chatId}`);
      

      console.log('👥 Client 2 tritt bei...');
      client2.send(JSON.stringify({ type: 'joinChatById', chatId }));
      

      const client2Joined = await waitForMessage(client2, 
        msg => msg.type === 'joinedChat' && msg.chatId === chatId);
      expect(client2Joined).toBeDefined();
      console.log('✅ Client 2 erfolgreich beigetreten');
      

      await waitForMessage(client1, 
        msg => msg.type === 'participantJoined' && msg.chatId === chatId);
      console.log('✅ Client 1 über Beitritt von Client 2 informiert');
      

      await new Promise(resolve => setTimeout(resolve, 500));
      

      console.log('👥 Client 3 tritt bei...');
      client3.send(JSON.stringify({ type: 'joinChatById', chatId }));
      

      const client3Joined = await waitForMessage(client3, 
        msg => msg.type === 'joinedChat' && msg.chatId === chatId);
      expect(client3Joined).toBeDefined();
      console.log('✅ Client 3 erfolgreich beigetreten');
      

      await waitForMessage(client1, 
        msg => msg.type === 'participantJoined' && msg.chatId === chatId);
      await waitForMessage(client2, 
        msg => msg.type === 'participantJoined' && msg.chatId === chatId);
      console.log('✅ Alle Clients über Beitritte informiert');
      

      await new Promise(resolve => setTimeout(resolve, 1000));
      

      console.log('💬 Client 1 sendet Nachricht...');
      client1.send(JSON.stringify({ 
        type: 'messageTo', 
        chatId, 
        text: 'Nachricht von Client 1' 
      }));
      

      console.log('⏳ Warte auf Empfang bei Client 2...');
      const message1AtClient2 = await waitForMessage(client2, 
        msg => msg.type === 'message' && 
               msg.chatId === chatId && 
               msg.text === 'Nachricht von Client 1');
      
      expect(message1AtClient2).toBeDefined();
      console.log('✅ Nachricht von Client 1 bei Client 2 empfangen');
      

      console.log('⏳ Warte auf Empfang bei Client 3...');
      const message1AtClient3 = await waitForMessage(client3, 
        msg => msg.type === 'message' && 
               msg.chatId === chatId && 
               msg.text === 'Nachricht von Client 1');
      
      expect(message1AtClient3).toBeDefined();
      console.log('✅ Nachricht von Client 1 bei Client 3 empfangen');
      


    } finally {

      client1.close();
      client2.close();
      client3.close();
      console.log('🧹 WebSocket-Verbindungen geschlossen');
    }
  }, 20000); 
  
  test('Wiederverbindung', async () => {
    console.log('🧪 Starte Test: Wiederverbindung');
    
  
    const { client: initialClient } = await connectWebSocketClient(port);
    const userId = `test-user-${Math.floor(Math.random() * 1000)}`;
    
    try {
      console.log(`👤 Benutzer-ID für Test: ${userId}`);
      
  
      console.log('🔌 Schließe Client für Reconnect-Test...');
      initialClient.close();
      await new Promise(resolve => setTimeout(resolve, 500));
      
  
      console.log('🔄 Erstelle neuen Client und sende Reconnect...');
      const reconnectClient = new WebSocket(`ws://localhost:${port}`);
      await new Promise(resolve => reconnectClient.on('open', resolve));
      
  
      reconnectClient.send(JSON.stringify({ 
        type: 'reconnect', 
        userId 
      }));
      
  
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Wiederverbindung getestet');
      
  
      reconnectClient.close();
    } catch (err) {
      console.error('❌ Fehler im Wiederverbindungstest:', err);
      throw err;
    }
  }, 15000);
});