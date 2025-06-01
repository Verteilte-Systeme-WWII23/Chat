import { v4 as uuidv4 } from "uuid";

const chats = new Map();
const messages = new Map();

export function findOrCreateChat(participantIds) {
  const participantsSorted = [...participantIds].sort();
  for (const [chatId, chat] of chats.entries()) {
    if (
      chat.participants.length === participantsSorted.length &&
      chat.participants.every((id, idx) => id === participantsSorted[idx])
    ) {
      return chatId;
    }
  }
  const chatId = uuidv4();
  chats.set(chatId, {
    id: chatId,
    participants: participantsSorted,
    createdAt: new Date().toISOString(),
  });
  messages.set(chatId, []);
  return chatId;
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