import {
  addUser,
  isBanned,
  removeUser,
  setUserName,
  getUser,
  hasUser,
  getAllUsers,
} from "./userManager.js";
import {
  addMessageToChat,
  getChatHistory,
  getUserChats,
  createEmptyChatForUser,
  joinChatById,
  getChats,
  createAIChatForUser,
} from "./chatManager.js";
import { getAIResponse } from "./ai.js";

export function handleConnection(ws, req) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  if (isBanned(ip)) {
    ws.close();
    return;
  }
  let userId = null;

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      // Reconnect: userId kommt vom Client
      if (data.type === "reconnect" && data.userId && getUser(data.userId)) {
        userId = data.userId;
        getUser(userId).ws = ws;
        ws.send(JSON.stringify({ type: "welcome", userId, name: getUser(userId)?.name }));
        return;
      }

      // Erstverbindung: userId noch nicht gesetzt
      if (!userId) {
        userId = addUser(ws, ip); // ip wird nur als Zusatzinfo gespeichert
        // AI-Chat nach Login automatisch anlegen (nur wenn noch nicht vorhanden)
        const userChats = getUserChats(userId);
        const hasAIChat = userChats.some(
          chat => chat.participants.includes("AI")
        );
        if (!hasAIChat) {
          const aiChatId = createAIChatForUser(userId);
          ws.send(JSON.stringify({
            type: "aiChatCreated",
            chatId: aiChatId,
            participants: [userId, "AI"],
          }));
        }
        ws.send(JSON.stringify({ type: "welcome", userId, name: getUser(userId)?.name }));
        return;
      }

      // Name setzen
      if (data.type === "setName") {
        setUserName(userId, data.name);
        return;
      }

      // Nachricht senden
      if (data.type === "messageTo") {
        const { chatId, text } = data;
        const chat = getChats().get(chatId);
        if (!chat) {
          ws.send(JSON.stringify({ type: "error", message: "Chat existiert nicht." }));
          return;
        }
        if (!chat.participants.includes(userId)) {
          ws.send(JSON.stringify({ type: "error", message: "Du bist kein Teilnehmer dieses Chats." }));
          return;
        }
        const message = addMessageToChat(chatId, userId, text);

        for (const pid of chat.participants) {
          const user = getUser(pid);
          if (user && user.ws.readyState === ws.OPEN) {
            user.ws.send(
              JSON.stringify({
                type: "message",
                chatId,
                messageId: message.id,
                from: userId,
                text,
                timestamp: message.timestamp,
              })
            );
          }
        }
        // AI-Logik ggf. anpassen, falls AI Teilnehmer ist
        if (chat.participants.includes("AI")) {
          const response = await getAIResponse(text);
          const aiMessage = addMessageToChat(chatId, "AI", response);
          for (const pid of chat.participants) {
            const user = getUser(pid);
            if (user && user.ws.readyState === ws.OPEN) {
              user.ws.send(
                JSON.stringify({
                  type: "message",
                  chatId,
                  messageId: aiMessage.id,
                  from: "AI",
                  text: aiMessage.text,
                  timestamp: aiMessage.timestamp,
                })
              );
            }
          }
        }
        return;
      }

      // Chat-Historie laden
      if (data.type === "getChatHistory") {
        const { chatId } = data;
        const chat = getChats().get(chatId);
        if (!chat) {
          ws.send(JSON.stringify({ type: "error", message: "Chat existiert nicht." }));
          return;
        }
        if (!chat.participants.includes(userId)) {
          ws.send(JSON.stringify({ type: "error", message: "Du bist kein Teilnehmer dieses Chats." }));
          return;
        }
        const history = getChatHistory(chatId);
        const names = {};
        for (const pid of chat.participants) {
          const user = getUser(pid);
          if (user) names[pid] = user.name;
        }
        ws.send(
          JSON.stringify({
            type: "chatHistory",
            chatId,
            participants: chat.participants,
            messages: history,
            names,
          })
        );
        return;
      }

      // Chat-Historie nach Namen laden
      if (data.type === "getChatHistoryByNames") {
        const allUsers = Array.from(getAllUsers().entries());
        const participantIds = [];
        for (const name of data.names) {
          const found = allUsers.find(([id, user]) => user && user.name === name);
          if (found) {
            participantIds.push(found[0]);
          } else {
            ws.send(JSON.stringify({ type: "error", message: `User "${name}" nicht gefunden.` }));
            return;
          }
        }
        // Eigene userId immer hinzufügen, falls nicht dabei
        if (!participantIds.includes(userId)) participantIds.push(userId);

        const chatId = findOrCreateChat(participantIds);
        const history = getChatHistory(chatId);
        ws.send(
          JSON.stringify({
            type: "chatHistory",
            chatId,
            participants: participantIds,
            messages: history,
          })
        );
        return;
      }

      // Eigene Chats laden
      if (data.type === "getMyChats") {
        const userChats = getUserChats(userId);
        ws.send(
          JSON.stringify({
            type: "myChats",
            chats: userChats,
          })
        );
        return;
      }

      // Leeren Chat anlegen (nur für sich selbst)
      if (data.type === "createEmptyChat") {
        const chatId = createEmptyChatForUser(userId);
        ws.send(JSON.stringify({
          type: "emptyChatCreated",
          chatId,
          participants: [userId],
        }));
        return;
      }

      // Chat per 5-stelliger ID beitreten
      if (data.type === "joinChatById") {
        const { chatId } = data;
        const success = joinChatById(chatId, userId);
        if (success) {
          ws.send(JSON.stringify({
            type: "joinedChat",
            chatId,
            participants: getChatParticipants(chatId),
          }));
        } else {
          ws.send(JSON.stringify({
            type: "error",
            message: "Chat mit dieser ID existiert nicht.",
          }));
        }
        return;
      }
    } catch (e) {
      console.error("Ungültige Nachricht:", msg, e);
    }
  });

  // Optional: User beim Disconnect entfernen
  // ws.on("close", () => {
  //   removeUser(userId);
  // });
}

// Hilfsfunktion für Teilnehmerliste
function getChatParticipants(chatId) {
  const chat = getChats().get(chatId);
  return chat ? chat.participants : [];
}