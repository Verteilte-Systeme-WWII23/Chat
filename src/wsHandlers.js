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
  findOrCreateChat,
  addMessageToChat,
  getChatHistory,
  getUserChats,
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
        ws.send(JSON.stringify({ type: "welcome", userId, name: getUser(userId)?.name }));
        findOrCreateChat([userId, "AI"]);
        return;
      }

      // Name setzen
      if (data.type === "setName") {
        setUserName(userId, data.name);
        return;
      }

      // Nachricht senden
      if (data.type === "messageTo") {
        const participantIds = Array.isArray(data.to) ? data.to : [data.to];
        if (!participantIds.includes(userId)) participantIds.push(userId);
        if (!participantIds.every(hasUser)) return;

        const chatId = findOrCreateChat(participantIds);
        const message = addMessageToChat(chatId, userId, data.text);

        for (const pid of participantIds) {
          const user = getUser(pid);
          if (user && user.ws.readyState === ws.OPEN) {
            user.ws.send(
              JSON.stringify({
                type: "message",
                chatId,
                messageId: message.id,
                from: userId,
                text: data.text,
                timestamp: message.timestamp,
              })
            );
          }
        }

        if (participantIds.includes("AI")) {
          const response = await getAIResponse(data.text);
          const aiMessage = addMessageToChat(chatId, "AI", response);
          for (const pid of participantIds) {
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
        if (Array.isArray(data.participants)) {
          const participantIds = [...data.participants];
          if (!participantIds.includes(userId)) participantIds.push(userId);
          const chatId = findOrCreateChat(participantIds);
          const history = getChatHistory(chatId);
          const names = {};
          for (const pid of participantIds) {
            const user = getUser(pid);
            if (user) names[pid] = user.name;
          }
          ws.send(
            JSON.stringify({
              type: "chatHistory",
              chatId,
              participants: participantIds,
              messages: history,
              names, // <--- Namen mitgeben
            })
          );
        }
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
    } catch (e) {
      console.error("Ungültige Nachricht:", msg, e);
    }
  });

  // Optional: User beim Disconnect entfernen
  // ws.on("close", () => {
  //   removeUser(userId);
  // });
}