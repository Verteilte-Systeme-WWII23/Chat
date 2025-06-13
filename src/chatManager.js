import { v4 as uuidv4 } from "uuid";

const chats = new Map();
const messages = new Map();

// Hilfsfunktion: 5-stellige zufällige Zahl als String
function generateNumericChatId() {
  let id;
  do {
    id = Math.floor(10000 + Math.random() * 90000).toString();
  } while (chats.has(id));
  return id;
}

// Leeren Chat für User anlegen
export function createEmptyChatForUser(userId) {
  const chatId = generateNumericChatId();
  chats.set(chatId, {
    id: chatId,
    participants: [userId],
    createdAt: new Date().toISOString(),
  });
  messages.set(chatId, []);
  return chatId;
}

// AI Chat für User anlegen
export function createAIChatForUser(userId) {
  const chatId = generateNumericChatId();
  chats.set(chatId, {
    id: chatId,
    participants: [userId, "AI"],
    createdAt: new Date().toISOString(),
  });
  messages.set(chatId, []);
  return chatId;
}

// User tritt Chat per ID bei
export function joinChatById(chatId, userId) {
  const chat = chats.get(chatId);
  if (!chat) return false;
  if (!chat.participants.includes(userId)) {
    chat.participants.push(userId);
  }
  return true;
}

export function addMessageToChat(chatId, fromUserId, text) {
  const messageId = uuidv4();
  const message = {
    id: messageId,
    from: fromUserId,
    text,
    timestamp: new Date().toISOString(),
  };
  if (!messages.has(chatId)) messages.set(chatId, []);
  messages.get(chatId).push(message);
  return message;
}

export function getChatHistory(chatId, limit = 50) {
  const chatMessages = messages.get(chatId) || [];
  return chatMessages.slice(-limit);
}

export function getUserChats(userId) {
  const userChats = [];
  for (const [chatId, chat] of chats.entries()) {
    if (chat.participants.includes(userId)) {
      const chatMessages = messages.get(chatId) || [];
      const lastMessage = chatMessages[chatMessages.length - 1];
      userChats.push({
        chatId,
        participants: chat.participants,
        createdAt: chat.createdAt,
        messageCount: chatMessages.length,
        lastMessage: lastMessage || null,
      });
    }
  }
  return userChats;
}

export function getChats() {
  return chats;
}

export function getMessages(chatId) {
  return messages.get(chatId) || [];
}

export function getChatParticipants(chatId) {
  const chat = chats.get(chatId);
  return chat ? chat.participants : [];
}