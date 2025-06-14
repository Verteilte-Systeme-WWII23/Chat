import { v4 as uuidv4 } from "uuid";
import { getUserName } from "./userManager.js";

const chats = new Map();
const messages = new Map();

function generateNumericChatId() {
  let id;
  do {
    id = Math.floor(10000 + Math.random() * 90000).toString();
  } while (chats.has(id));
  return id;
}

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

export function getUserChats(userId) {
  const userChats = [];
  for (const [chatId, chat] of chats.entries()) {
    if (chat.participants.includes(userId)) {
      const participants = getChatParticipants(chatId);
      const lastMessages = getChatHistory(chatId, 1);
      userChats.push({
        chatId,
        participants: participants,
        createdAt: chat.createdAt,
        lastMessage: lastMessages.length > 0 ? lastMessages[0] : null,
      });
    }
  }
  return userChats;
}

export function getChat(chatId, limit = 50) {
  const participants = getChatParticipants(chatId);
  const chatMessages = getChatHistory(chatId, limit);
  return {
    id: chatId,
    participants,
    messages: chatMessages,
  };
}

function getChatParticipants(chatId) {
  const chat = chats.get(chatId);
  const participantIds = chat ? chat.participants : [];
  const participants = [];
  for (const participantId of participantIds) {
    const { name, id } = getUserName(participantId);
    participants.push({ name, id });
  }
  return participants;
}

function getChatHistory(chatId, limit = 50) {
  const chatMessages = messages.get(chatId) || [];
  return chatMessages.slice(-limit);
}