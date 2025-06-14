import {
  addUser,
  isBanned,
  removeUser,
  setUserName,
  getUser,
} from "./userManager.js";
import {
  addMessageToChat,
  getChat,
  getUserChats,
  createEmptyChatForUser,
  joinChatById,
  createAIChatForUser,
} from "./chatManager.js";
import { getAIResponse } from "./ai.js";

export function handleConnection(ws, req) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  if (isBanned(ip)) {
    ws.send(JSON.stringify({ type: "banned", reason: "Du wurdest gesperrt." }));
    ws.close();
    return;
  }
  let userId = null;

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "reconnect" && data.userId && getUser(data.userId)) {
        userId = data.userId;
        getUser(userId).ws = ws;
        ws.send(JSON.stringify({ type: "welcome", userId, name: getUser(userId)?.name }));
        return;
      }

      if (!userId) {
        userId = addUser(ws, ip);
        createAIChatForUser(userId);
        ws.send(JSON.stringify({ type: "welcome", userId, name: getUser(userId)?.name }));
        return;
      }

      if (data.type === "setName") {
        setUserName(userId, data.name);
        return;
      }

      if (data.type === "messageTo") {
        const { chatId, text } = data;
        const chat = getChat(chatId, 0);
        if (!chat) {
          ws.send(JSON.stringify({ type: "error", message: "Chat existiert nicht." }));
          return;
        }
        if (!chat.participants.some(p => p.id === userId)) {
          ws.send(JSON.stringify({ type: "error", message: "Du bist kein Teilnehmer dieses Chats." }));
          return;
        }
        const message = addMessageToChat(chatId, userId, text);

        for (const participant of chat.participants) {
          const user = getUser(participant.id);
          if (user && user.ws.readyState === ws.OPEN) {
            user.ws.send(
              JSON.stringify({
                type: "message",
                chatId,
                messageId: message.id,
                from: message.from,
                text,
                timestamp: message.timestamp,
              })
            );
          }
        }

        if (chat.participants.some(p => p.id === "AI")) {
          const response = await getAIResponse(text);
          const aiMessage = addMessageToChat(chatId, "AI", response);
          for (const participant of chat.participants) {
            const user = getUser(participant.id);
            if (user && user.ws.readyState === ws.OPEN) {
              user.ws.send(
                JSON.stringify({
                  type: "message",
                  chatId,
                  messageId: aiMessage.id,
                  from: aiMessage.from,
                  text: aiMessage.text,
                  timestamp: aiMessage.timestamp,
                })
              );
            }
          }
        }
        return;
      }

      if (data.type === "getChat") {
        const { chatId } = data;
        const chat = getChat(chatId);
        if (!chat) {
          ws.send(JSON.stringify({ type: "error", message: "Chat existiert nicht." }));
          return;
        }
        if (!chat.participants.some(p => p.id === userId)) {
          ws.send(JSON.stringify({ type: "error", message: "Du bist kein Teilnehmer dieses Chats." }));
          return;
        }
        ws.send(
          JSON.stringify({
            type: "chat",
            chatId,
            participants: chat.participants,
            messages: chat.messages,
            createdAt: chat.createdAt,
          })
        );
        return;
      }

      if (data.type === "getUserChats") {
        const userChats = getUserChats(userId);
        ws.send(
          JSON.stringify({
            type: "userChats",
            chats: userChats,
          })
        );
        return;
      }

      if (data.type === "createEmptyChat") {
        const chatId = createEmptyChatForUser(userId);
        ws.send(JSON.stringify({
          type: "emptyChatCreated",
          chatId,
          participants: [userId],
        }));
        return;
      }

      if (data.type === "joinChatById") {
        const { chatId } = data;
        const success = joinChatById(chatId, userId);
        const chat = getChat(chatId, 0);
        if (success) {
          ws.send(JSON.stringify({
            type: "joinedChat",
            chatId,
            participants: chat.participants,
            createdAt: chat.createdAt,
          }));

          for (const participant of chat.participants) {
            if (participant.id === userId) continue;
            const user = getUser(participant.id);
            if (user && user.ws.readyState === ws.OPEN) {
              user.ws.send(
                JSON.stringify({
                  type: "participantJoined",
                  chatId
                })
              );
            }
          }
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

}