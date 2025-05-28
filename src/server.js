const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const { getAIResponse } = require("./ai"); // Angenommen, du hast eine AI-Service-Funktion

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = new Map();
users.set("AI", null); // userId => { ws, name }
const chats = new Map(); // chatId => { id, participants: [userid, userid], createdAt }
const messages = new Map(); // chatId => [{id, from, text, timestamp}, ...]

// Hilfsfunktion: Chat für beliebige Teilnehmer finden oder erstellen
function findOrCreateChat(participantIds) {
  // Teilnehmer sortieren für Konsistenz
  const participantsSorted = [...participantIds].sort();

  // Suche nach existierendem Chat mit exakt diesen Teilnehmern
  for (const [chatId, chat] of chats.entries()) {
    if (
      chat.participants.length === participantsSorted.length &&
      chat.participants.every((id, idx) => id === participantsSorted[idx])
    ) {
      return chatId;
    }
  }

  // Neuen Chat erstellen
  const chatId = uuidv4();
  chats.set(chatId, {
    id: chatId,
    participants: participantsSorted,
    createdAt: new Date().toISOString(),
  });
  messages.set(chatId, []);
  console.log(
    `Neuer Gruppenchat erstellt: ${chatId} mit ${participantsSorted.join(", ")}`
  );
  return chatId;
}

// Nachricht zu Chat hinzufügen
function addMessageToChat(chatId, fromUserId, text) {
  const messageId = uuidv4();
  const message = {
    id: messageId,
    from: fromUserId,
    text: text,
    timestamp: new Date().toISOString(),
  };

  if (!messages.has(chatId)) {
    messages.set(chatId, []);
  }

  messages.get(chatId).push(message);
  return message;
}

// Chat-Verlauf abrufen
function getChatHistory(chatId, limit = 50) {
  const chatMessages = messages.get(chatId) || [];
  return chatMessages.slice(-limit);
}

wss.on("connection", (ws) => {
  const userId = uuidv4();
  users.set(userId, { ws, name: `Gast_${userId.slice(0, 4)}` });
  console.log(`Neuer Client verbunden: ${userId}`);

  ws.send(JSON.stringify({ type: "welcome", userId }));

  findOrCreateChat([userId, "AI"]); // Erstelle Chat für den neuen User

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "setName") {
        const user = users.get(userId);
        if (user) user.name = data.name;
        console.log(`User ${userId} hat sich in "${data.name}" umbenannt`);
      }

      // Für Gruppen: data.to ist jetzt ein Array von User-IDs (inkl. Sender!)
      if (data.type === "messageTo") {
        const sender = users.get(userId);
        const participantIds = Array.isArray(data.to) ? data.to : [data.to];
        // Sender hinzufügen, falls nicht enthalten
        if (!participantIds.includes(userId)) participantIds.push(userId);

        // Prüfe, ob alle Empfänger existieren
        const allExist = participantIds.every((id) => users.has(id));
        if (!allExist) return;

        const chatId = findOrCreateChat(participantIds);

        // Nachricht speichern
        const message = addMessageToChat(chatId, userId, data.text);

        // Nachricht an alle Teilnehmer senden
        for (const pid of participantIds) {
          const user = users.get(pid);
          if (user && user.ws.readyState === WebSocket.OPEN) {
            user.ws.send(
              JSON.stringify({
                type: "message",
                chatId: chatId,
                messageId: message.id,
                from: userId,
                text: data.text,
                timestamp: message.timestamp,
              })
            );
          }
        }
        // Log-Ausgabe für Debuggin
        console.log(
          `Nachricht in Chat ${chatId} gespeichert: ${userId} -> [${participantIds.join(
            ", "
          )}]`
        );

        if(participantIds.includes("AI")) {
          // Simuliere AI-Antwort
          const response = await getAIResponse(data.text);
            const aiMessage = addMessageToChat(chatId, "AI", response);
            for (const pid of participantIds) {
              const user = users.get(pid);
              if (user && user.ws.readyState === WebSocket.OPEN) {
                user.ws.send(
                  JSON.stringify({
                    type: "message",
                    chatId: chatId,
                    messageId: aiMessage.id,
                    from: "AI",
                    text: aiMessage.text,
                    timestamp: aiMessage.timestamp,
                  })
                );
              }
            }// Verzögerung für AI-Antwort
        }



      }



      // Chat-Verlauf abrufen (data.participants ist ein Array von User-IDs)
      if (data.type === "getChatHistory") {
        const sender = users.get(userId);
        if (sender && Array.isArray(data.participants)) {
          // Sender hinzufügen, falls nicht enthalten
          const participantIds = [...data.participants];
          if (!participantIds.includes(userId)) participantIds.push(userId);

          const chatId = findOrCreateChat(participantIds);
          const history = getChatHistory(chatId);

          sender.ws.send(
            JSON.stringify({
              type: "chatHistory",
              chatId: chatId,
              participants: participantIds,
              messages: history,
            })
          );
        }
      }

      // Alle Chats eines Users abrufen bleibt unverändert
      if (data.type === "getMyChats") {
        const sender = users.get(userId);
        if (sender) {
          const userChats = [];

          for (const [chatId, chat] of chats.entries()) {
            if (chat.participants.includes(userId)) {
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
