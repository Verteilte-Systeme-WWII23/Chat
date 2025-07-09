import {
  setUserName,
  getUser,
} from "../managers/userManager.js";
import {
  addMessageToChat,
  getChat,
  getUserChats,
  createEmptyChatForUser,
  joinChatById,
} from "../managers/chatManager.js";
import { getAIResponse } from "../managers/ai.js";

export class WS {
  constructor(ws, userId) {
    this.ws = ws;
    this.userId = userId;
  }

  send(data) {
    if (this.ws.readyState === 1) { // WebSocket.OPEN
      this.ws.send(JSON.stringify(data));
    }
  }

  sendError(message) {
    this.send({ type: "error", message });
  }

  broadcastToChat(chatId, data, excludeUserId = null) {
    const chat = getChat(chatId, 0);
    if (!chat) return false;

    chat.participants.forEach(participant => {
      if (excludeUserId && participant.id === excludeUserId) return;
      
      const user = getUser(participant.id);
      if (user?.ws?.readyState === 1) {
        user.ws.send(JSON.stringify(data));
      }
    });
    return true;
  }

  validateChatAccess(chatId) {
    const chat = getChat(chatId, 0);
    if (!chat) {
      this.sendError("Chat existiert nicht.");
      return null;
    }
    
    if (!chat.participants.some(p => p.id === this.userId)) {
      this.sendError("Du bist kein Teilnehmer dieses Chats.");
      return null;
    }
    
    return chat;
  }

  // Command Handlers
  async setName({ name }) {
    if (!name?.trim()) {
      this.sendError("Name darf nicht leer sein.");
      return;
    }
    setUserName(this.userId, name.trim());
    this.send({ type: "nameSet", name: name.trim() });
  }

  async messageTo({ chatId, text }) {
    if (!text?.trim()) {
      this.sendError("Nachricht darf nicht leer sein.");
      return;
    }

    const chat = this.validateChatAccess(chatId);
    if (!chat) return;
    
    const message = addMessageToChat(chatId, this.userId, text.trim());
    const messageData = {
      type: "message",
      chatId,
      messageId: message.id,
      from: message.from,
      text: message.text,
      timestamp: message.timestamp,
    };

    this.broadcastToChat(chatId, messageData);
    await this.handleAIResponse(chatId, text.trim());
  }

  async handleAIResponse(chatId, text) {
    const chat = getChat(chatId, 0);
    if (!chat?.participants.some(p => p.id === "AI")) return;

    try {
      const response = await getAIResponse(text);
      const aiMessage = addMessageToChat(chatId, "AI", response);
      
      this.broadcastToChat(chatId, {
        type: "message",
        chatId,
        messageId: aiMessage.id,
        from: aiMessage.from,
        text: aiMessage.text,
        timestamp: aiMessage.timestamp,
      });
    } catch (error) {
      console.error("AI Response Error:", error);
    }
  }

  async getChat({ chatId }) {
    const chat = this.validateChatAccess(chatId);
    if (!chat) return;
    
    this.send({
      type: "chat",
      chatId,
      participants: chat.participants,
      messages: chat.messages,
      createdAt: chat.createdAt,
    });
  }

  async getUserChats() {
    const userChats = getUserChats(this.userId);
    this.send({
      type: "userChats",
      chats: userChats,
    });
  }

  async createEmptyChat() {
    const chatId = createEmptyChatForUser(this.userId);
    this.send({
      type: "emptyChatCreated",
      chatId,
      participants: [{ name: getUser(this.userId).name, id: this.userId }],
    });
  }

  async joinChatById({ chatId }) {
    if (!chatId) {
      this.sendError("Chat-ID fehlt.");
      return;
    }

    const success = joinChatById(chatId, this.userId);
    if (!success) {
      this.sendError("Chat mit dieser ID existiert nicht.");
      return;
    }

    const chat = getChat(chatId, 0);
    this.send({
      type: "joinedChat",
      chatId,
      participants: chat.participants,
      createdAt: chat.createdAt,
    });

    // this is necessary to refresh the ui of other participants 
    this.broadcastToChat(chatId, {
      type: "participantJoined",
      chatId,
      participant: { name: getUser(this.userId).name, id: this.userId }
    }, this.userId);
  }
}