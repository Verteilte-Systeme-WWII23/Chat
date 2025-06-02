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
  // Bann prüfen
  if (isBanned(ip)) {
    ws.close();
    return;
  }
  const userId = addUser(ws, ip);
  ws.send(JSON.stringify({ type: "welcome", userId, name: getUser(userId)?.name }));
  findOrCreateChat([userId, "AI"]);

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "setName") {
        setUserName(userId, data.name);
      }

      if (data.type === "messageTo") {
        const participantIds = Array.isArray(data.to) ? data.to : [data.to];
        if (!participantIds.includes(userId)) participantIds.push(userId);

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
      }

      if (data.type === "getChatHistory") {
        if (Array.isArray(data.participants)) {
          const participantIds = [...data.participants];
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
        }
      }

      if (data.type === "getMyChats") {
        const userChats = getUserChats(userId);
        ws.send(
          JSON.stringify({
            type: "myChats",
            chats: userChats,
          })
        );
      }
    } catch (e) {
      console.error("Ungültige Nachricht:", msg);
    }
  });

  ws.on("close", () => {
    removeUser(userId);
  });
}