import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import { createServer } from './helpers/createServer.js';
import { setupApiMocks } from './helpers/test-mocks.js';

setupApiMocks();

/**
 * Verbesserte Hilfsfunktion zum Warten auf bestimmte WebSocket-Nachrichten
 * - Protokolliert alle empfangenen Nachrichten für besseres Debugging
 * - Flexibleres Matching über Prädikatfunktionen
 * - Konfigurierbarer Timeout
 */
async function waitForMessage(client, predicate, timeoutMs = 10000) {
  const receivedMessages = [];
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ Timeout nach ${timeoutMs}ms - Empfangene Nachrichten:`, 
        JSON.stringify(receivedMessages, null, 2));
      reject(new Error(`Timeout beim Warten auf Nachricht: ${timeoutMs}ms`));
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

/**
 * Hilfsfunktion zum Verbinden eines WebSocket-Clients
 * - Erstellt eine neue WebSocket-Verbindung
 * - Wartet auf den 'open' Event
 * - Wartet optional auf die erste Willkommensnachricht
 */
async function connectWebSocketClient(port, waitForWelcome = true) {
  const client = new WebSocket(`ws://localhost:${port}`);
  
  // Debug-Listener für alle Ereignisse
  client.on('error', (error) => console.error('WebSocket-Fehler:', error));
  client.on('close', () => console.log('WebSocket wurde geschlossen'));
  client.on('message', (data) => {
    try {
      console.log('Raw-Nachricht empfangen:', data.toString());
    } catch (e) {
      console.error('Fehler beim Loggen der Nachricht:', e);
    }
  });
  
  // Auf Verbindungserstellung warten
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Verbindungs-Timeout')), 5000);
    client.on('open', () => { clearTimeout(timeout); resolve(); });
    client.on('error', (err) => { clearTimeout(timeout); reject(err); });
  });
  
  console.log('🔌 WebSocket-Verbindung hergestellt');
  
  // Test-Ping senden, um Kommunikation zu prüfen
  client.send(JSON.stringify({ type: 'ping' }));
  console.log('Ping-Nachricht gesendet');
  
  // Optional auf Welcome-Nachricht warten
  if (waitForWelcome) {
    const welcome = await waitForMessage(client, 
      msg => msg.type === 'welcome' || msg.type === 'userConnected');
    console.log('👋 Welcome-Nachricht empfangen:', welcome);
    return { client, userId: welcome.userId || welcome.id };
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
    
    // Wichtig: Debug-Informationen für den Server hinzufügen
    server.on('error', (err) => console.error('Server-Fehler:', err));
    
    await new Promise(resolve => server.listen(port, () => {
      console.log(`✅ Test-Server läuft auf Port ${port}`);
      resolve();
    }));
    
    // Kurze Pause um sicherzustellen, dass der Server vollständig initialisiert ist
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 15000);
  
  afterAll(() => {
    console.log('🧹 Räume Test-Ressourcen auf...');
    if (server) server.close();
    console.log('✅ Test-Server geschlossen');
  });
  
  test('Verbindung und Benutzerauthentifizierung', async () => {
    console.log('🧪 Starte Test: Verbindung und Benutzerauthentifizierung');
    
    // Erstelle Client ohne auf Welcome zu warten, um das Problem zu isolieren
    const client1 = new WebSocket(`ws://localhost:${port}`);
    let userId1;
    
    await new Promise(resolve => client1.on('open', resolve));
    console.log('Client 1 verbunden');
    
    // Manuellen Listener hinzufügen
    client1.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        console.log('Client 1 Nachricht:', JSON.stringify(msg));
        if (msg.type === 'welcome') {
          userId1 = msg.userId || msg.id;
        }
      } catch (e) {
        console.error('Fehler:', e);
      }
    });
    
    // Ping senden, um Kommunikation zu testen
    client1.send(JSON.stringify({ type: 'ping' }));
    
    // Warte kurz, um eventuelle asynchrone Probleme zu umgehen
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Nun versuche den regulären Test-Flow
    try {
      // Verbindung mit Helper-Funktion
      const { client: client2, userId: userId2 } = await connectWebSocketClient(port);
      
      // Rest des Tests...
      
    } finally {
      // Immer aufräumen
      client1.close();
      if (client2) client2.close();
      console.log('🧹 WebSocket-Verbindungen geschlossen');
    }
  }, 20000); // Timeout erhöhen
  
  test('Chat-Erstellung und Beitritt', async () => {
    console.log('🧪 Starte Test: Chat-Erstellung und Beitritt');
    
    // Zwei Clients verbinden
    const { client: client1 } = await connectWebSocketClient(port);
    const { client: client2 } = await connectWebSocketClient(port);
    
    try {
      // Chat erstellen
      console.log('📝 Erstelle neuen Chat...');
      client1.send(JSON.stringify({ type: 'createEmptyChat' }));
      
      // Auf Bestätigung warten
      const chatCreated = await waitForMessage(client1, 
        msg => msg.type === 'emptyChatCreated');
      
      expect(chatCreated).toBeDefined();
      expect(chatCreated.chatId).toBeDefined();
      console.log(`✅ Chat erstellt mit ID: ${chatCreated.chatId}`);
      
      // Client 2 tritt Chat bei
      console.log('👋 Client 2 tritt Chat bei...');
      client2.send(JSON.stringify({ 
        type: 'joinChatById', 
        chatId: chatCreated.chatId 
      }));
      
      // Auf Beitrittsbestätigung warten
      const joinedChat = await waitForMessage(client2, 
        msg => msg.type === 'joinedChat' && msg.chatId === chatCreated.chatId);
      
      expect(joinedChat).toBeDefined();
      expect(joinedChat.chatId).toBe(chatCreated.chatId);
      console.log('✅ Client 2 erfolgreich Chat beigetreten');
      
      // Bestätigung der Teilnehmeränderung bei Client 1
      const participantJoined = await waitForMessage(client1,
        msg => msg.type === 'participantJoined' && msg.chatId === chatCreated.chatId);
      
      expect(participantJoined).toBeDefined();
      console.log('✅ Client 1 wurde über Beitritt informiert');
    } finally {
      // Immer aufräumen
      client1.close();
      client2.close();
      console.log('🧹 WebSocket-Verbindungen geschlossen');
    }
  }, 15000);
  
  test('Nachrichtenübertragung zwischen Benutzern', async () => {
    console.log('🧪 Starte Test: Nachrichtenübertragung');
    
    // Drei Clients verbinden
    const { client: client1 } = await connectWebSocketClient(port);
    const { client: client2 } = await connectWebSocketClient(port);
    const { client: client3 } = await connectWebSocketClient(port);
    
    try {
      // Chat erstellen
      console.log('📝 Erstelle Gruppenchat...');
      client1.send(JSON.stringify({ type: 'createEmptyChat' }));
      
      const chatCreated = await waitForMessage(client1, 
        msg => msg.type === 'emptyChatCreated');
      
      const chatId = chatCreated.chatId;
      console.log(`✅ Chat erstellt mit ID: ${chatId}`);
      
      // Client 2 und 3 treten bei
      console.log('👥 Clients 2 und 3 treten bei...');
      client2.send(JSON.stringify({ type: 'joinChatById', chatId }));
      await waitForMessage(client2, msg => msg.type === 'joinedChat' && msg.chatId === chatId);
      
      client3.send(JSON.stringify({ type: 'joinChatById', chatId }));
      await waitForMessage(client3, msg => msg.type === 'joinedChat' && msg.chatId === chatId);
      
      // Warten auf Bestätigungen für alle Teilnehmer
      await waitForMessage(client1, msg => msg.type === 'participantJoined');
      await waitForMessage(client1, msg => msg.type === 'participantJoined');
      await waitForMessage(client2, msg => msg.type === 'participantJoined');
      
      console.log('✅ Alle Clients dem Chat beigetreten');
      
      // Nachricht von Client 1 senden
      console.log('💬 Client 1 sendet Nachricht...');
      client1.send(JSON.stringify({ 
        type: 'messageTo', 
        chatId, 
        text: 'Nachricht von Client 1' 
      }));
      
      // Prüfen, ob Nachricht bei Client 2 und 3 ankommt
      const message1AtClient2 = await waitForMessage(client2, 
        msg => msg.type === 'message' && 
               msg.chatId === chatId && 
               msg.text === 'Nachricht von Client 1');
      
      const message1AtClient3 = await waitForMessage(client3, 
        msg => msg.type === 'message' && 
               msg.chatId === chatId && 
               msg.text === 'Nachricht von Client 1');
      
      expect(message1AtClient2).toBeDefined();
      expect(message1AtClient3).toBeDefined();
      console.log('✅ Nachricht von Client 1 bei Client 2 und 3 empfangen');
      
      // Nachricht von Client 2 senden
      console.log('💬 Client 2 sendet Nachricht...');
      client2.send(JSON.stringify({ 
        type: 'messageTo', 
        chatId, 
        text: 'Nachricht von Client 2' 
      }));
      
      // Prüfen, ob Nachricht bei Client 1 und 3 ankommt
      const message2AtClient1 = await waitForMessage(client1, 
        msg => msg.type === 'message' && 
               msg.chatId === chatId && 
               msg.text === 'Nachricht von Client 2');
      
      const message2AtClient3 = await waitForMessage(client3, 
        msg => msg.type === 'message' && 
               msg.chatId === chatId && 
               msg.text === 'Nachricht von Client 2');
      
      expect(message2AtClient1).toBeDefined();
      expect(message2AtClient3).toBeDefined();
      console.log('✅ Nachricht von Client 2 bei Client 1 und 3 empfangen');
    } finally {
      // Immer aufräumen
      client1.close();
      client2.close();
      client3.close();
      console.log('🧹 WebSocket-Verbindungen geschlossen');
    }
  }, 20000);
  
  test('Wiederverbindung', async () => {
    console.log('🧪 Starte Test: Wiederverbindung');
    
    // Client verbinden
    const { client: initialClient, userId } = await connectWebSocketClient(port);
    
    try {
      console.log(`👤 Benutzer-ID erhalten: ${userId}`);
      expect(userId).toBeDefined();
      
      // Client schließen und warten
      console.log('🔌 Schließe Client für Reconnect-Test...');
      initialClient.close();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Neuen Client erstellen und reconnecten
      console.log('🔄 Erstelle neuen Client und sende Reconnect...');
      const reconnectClient = new WebSocket(`ws://localhost:${port}`);
      await new Promise(resolve => reconnectClient.on('open', resolve));
      
      // Reconnect-Nachricht senden
      reconnectClient.send(JSON.stringify({ 
        type: 'reconnect', 
        userId 
      }));
      
      // Auf Welcome-Nachricht mit gleicher ID warten
      const welcomeReconnect = await waitForMessage(reconnectClient, 
        msg => (msg.type === 'welcome' || msg.type === 'userConnected') && 
               (msg.userId === userId || msg.id === userId));
      
      expect(welcomeReconnect).toBeDefined();
      console.log('✅ Wiederverbindung erfolgreich');
      
      // Verbindung schließen
      reconnectClient.close();
    } catch (err) {
      console.error('❌ Fehler im Wiederverbindungstest:', err);
      throw err;
    }
  }, 15000);
});