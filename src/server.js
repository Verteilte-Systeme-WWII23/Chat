const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = new Map(); // userId => { ws, name }
const chats = new Map(); // chatId => { id, participants: [name1, name2], createdAt }
const messages = new Map(); // chatId => [{id, from, text, timestamp}, ...]

// Hilfsfunktion: Chat zwischen zwei Personen finden oder erstellen
function findOrCreateChat(user1, user2) {
  // Ensure consistent participant order
  const participantsSorted = [user1, user2].sort();
  const p1 = participantsSorted[0];
  const p2 = participantsSorted[1];

  // Suche nach existierendem Chat zwischen den beiden
  for (const [chatId, chat] of chats.entries()) {
    // Check if participants match exactly and in the sorted order
    if (
      chat.participants[0] === p1 &&
      chat.participants[1] === p2 &&
      chat.participants.length === 2
    ) {
      return chatId;
    }
  }

  // Erstelle neuen Chat
  const chatId = uuidv4();
  chats.set(chatId, {
    id: chatId,
    participants: participantsSorted, // Store sorted participants
    createdAt: new Date().toISOString(),
  });
  messages.set(chatId, []); // Leere Nachrichtenliste für neuen Chat

  console.log(`Neuer Chat erstellt: ${chatId} zwischen ${p1} und ${p2}`);
  return chatId;
}

// Hilfsfunktion: Nachricht zu Chat hinzufügen
function addMessageToChat(chatId, from, text) {
  const messageId = uuidv4();
  const message = {
    id: messageId,
    from: from,
    text: text,
    timestamp: new Date().toISOString(),
  };

  if (!messages.has(chatId)) {
    messages.set(chatId, []);
  }

  messages.get(chatId).push(message);
  return message;
}

// Hilfsfunktion: Chat-Verlauf abrufen
function getChatHistory(chatId, limit = 50) {
  const chatMessages = messages.get(chatId) || [];
  return chatMessages.slice(-limit); // Letzte X Nachrichten
}

wss.on("connection", (ws) => {
  const userId = uuidv4();
  users.set(userId, { ws, name: `Gast_${userId.slice(0, 4)}` });
  console.log(`Neuer Client verbunden: ${userId}`);

  ws.send(JSON.stringify({ type: "welcome", userId }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "setName") {
        const user = users.get(userId);
        if (user) user.name = data.name;
        console.log(`User ${userId} hat sich in "${data.name}" umbenannt`);
      }

      if (data.type === "messageTo") {
        const sender = users.get(userId);
        const recipient = [...users.values()].find((u) => u.name === data.to);
        const chatId = findOrCreateChat(sender.name, data.to);

        // Nachricht speichern
        const message = addMessageToChat(chatId, sender.name, data.text);
        if (recipient && recipient.ws.readyState === WebSocket.OPEN && sender) {
          // Chat finden oder erstellen

          // Nachricht an Empfänger senden
          recipient.ws.send(
            JSON.stringify({
              type: "message",
              chatId: chatId,
              messageId: message.id,
              from: sender.name,
              text: data.text,
              timestamp: message.timestamp,
            })
          );

          // Bestätigung an Sender
          sender.ws.send(
            JSON.stringify({
              type: "messageSent",
              chatId: chatId,
              messageId: message.id,
              to: data.to,
              text: data.text,
              timestamp: message.timestamp,
            })
          );

          console.log(
            `Nachricht in Chat ${chatId} gespeichert: ${sender.name} -> ${data.to}`
          );
        }
      }

      // Neuer Nachrichtentyp: Chat-Verlauf abrufen
      if (data.type === "getChatHistory") {
        const sender = users.get(userId);
        if (sender && data.withUser) {
          const chatId = findOrCreateChat(sender.name, data.withUser);
          const history = getChatHistory(chatId);

          sender.ws.send(
            JSON.stringify({
              type: "chatHistory",
              chatId: chatId,
              withUser: data.withUser,
              messages: history,
            })
          );
        }
      }

      // Neuer Nachrichtentyp: Alle Chats eines Users abrufen
      if (data.type === "getMyChats") {
        const sender = users.get(userId);
        if (sender) {
          const userChats = [];

          for (const [chatId, chat] of chats.entries()) {
            if (chat.participants.includes(sender.name)) {
              const chatMessages = messages.get(chatId) || [];
              const lastMessage = chatMessages[chatMessages.length - 1];

              userChats.push({
                chatId: chatId,
                participants: chat.participants,
                createdAt: chat.createdAt,
                messageCount: chatMessages.length,
                lastMessage: lastMessage || null,
              });
            }
          }

          sender.ws.send(
            JSON.stringify({
              type: "myChats",
              chats: userChats,
            })
          );
        }
      }
    } catch (e) {
      console.error("Ungültige Nachricht:", msg);
    }
  });

  ws.on("close", () => {
    users.delete(userId);
    console.log(`Verbindung getrennt: ${userId}`);
  });
});

// Debug-Endpoints (optional)
app.get("/api/chats", (req, res) => {
  const chatList = Array.from(chats.entries()).map(([id, chat]) => ({
    ...chat,
    messageCount: (messages.get(id) || []).length,
  }));
  res.json(chatList);
});

app.get("/api/messages/:chatId", (req, res) => {
  const chatMessages = messages.get(req.params.chatId) || [];
  res.json(chatMessages);
});

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

server.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
  console.log("Chat-Speicherung aktiviert");
});
