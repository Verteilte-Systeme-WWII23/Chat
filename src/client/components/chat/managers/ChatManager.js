export class ChatManager {
  constructor(uiManager, webSocketManager) {
    this.ui = uiManager;
    this.ws = webSocketManager;
    this.currentChatId = null;
    this.currentParticipants = [];
    this.myChats = [];
  }

  displayChatList() {
    const chatList = this.ui.getElement("chat-list");
    chatList.innerHTML = "";
    
    this.myChats.forEach((chat) => {
      const chatItem = this.createChatListItem(chat);
      chatList.appendChild(chatItem);
    });
  }

  createChatListItem(chat) {
    const chatId = chat.chatId || chat.id;
    const chatItem = document.createElement("div");
    chatItem.className = "chat-item";
    chatItem.onclick = () => this.openChat(chat);

    let participants = this.flattenParticipants(chat.participants);
    const participantNames = this.getParticipantNames(participants);
    const lastMessageInfo = this.getLastMessageInfo(chat, participants);
    const isUnread = chat.lastMessage && chat.lastMessage.from !== this.myId;

    chatItem.innerHTML = `
      <h4 style="${isUnread ? "font-weight: bold;" : ""}">
        ${participantNames ? participantNames : "Chat"}<br>
        <span style="font-size:0.85em;color:#888;">ID: ${chatId}</span>
      </h4>
      <p style="${isUnread ? "font-weight: bold; color: #333;" : ""}">
        ${lastMessageInfo}
      </p>
    `;

    if (this.currentChatId === chatId) {
      chatItem.classList.add("active");
    }

    return chatItem;
  }

  flattenParticipants(participants) {
    if (Array.isArray(participants) && participants[0]?.participant) {
      return participants.map(p => p.participant);
    }
    return participants;
  }

  getParticipantNames(participants) {
    if (!Array.isArray(participants)) return "";
    
    return participants
      .filter(p => p.id !== this.myId)
      .map(p => (p.name || p.id))
      .join(", ");
  }

  getLastMessageInfo(chat, participants) {
    if (!chat.lastMessage) return "Noch keine Nachrichten";

    const isMyMessage = chat.lastMessage.from === this.myId;
    const fromName = isMyMessage ? "Du" : this.getUserName(chat.lastMessage.from, participants);
    const time = new Date(chat.lastMessage.timestamp).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${fromName}: ${chat.lastMessage.text} ${time ? "• " + time : ""}`;
  }

  getUserName(userId, participants) {
    if (userId === this.myId) return this.myName;

    if (Array.isArray(participants)) {
      const found = participants.find(p => p.id === userId);
      if (found && found.name) return found.name;
    }
    return userId;
  }

  displayMessage(from, text, timestamp, isSent) {
    const chatMessages = this.ui.getElement("chat-messages");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isSent ? "sent" : "received"}`;

    const timeStr = new Date(timestamp).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const fromName = isSent ? "" : `<b>${this.getUserName(from, this.currentParticipants)}:</b> `;

    messageDiv.innerHTML = `
      <div>${fromName}${text}</div>
      <div class="timestamp">${timeStr}</div>
    `;

    chatMessages.appendChild(messageDiv);
    this.ui.scrollToBottom();
  }

  displayChatHistory(messages) {
    const chatMessages = this.ui.getElement("chat-messages");
    chatMessages.innerHTML = "";

    if (messages.length === 0) {
      this.showEmptyMessage();
    } else {
      messages.forEach((message) => {
        this.displayMessage(
          message.from,
          message.text,
          message.timestamp,
          message.from === this.myId
        );
      });
    }

    this.ui.scrollToBottom();
  }

  showEmptyMessage() {
    const chatMessages = this.ui.getElement("chat-messages");
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "Noch keine Nachrichten. Schreibe etwas, um die Unterhaltung zu beginnen!";
    chatMessages.appendChild(emptyMessage);
  }

  updateChatHeader(participants) {
    participants = this.flattenParticipants(participants);
    const names = this.getParticipantNames(participants);

    this.ui.getElement("chat-header").innerHTML = `
      <h3>
        <span>Chat-ID: ${this.currentChatId}</span>
        <span style="margin-left:20px;font-weight:normal;font-size:1em;color:#555;">
          ${names ? "Teilnehmer: " + names : ""}
        </span>
      </h3>
    `;
  }

  openChat(chat) {
    const chatId = chat.chatId || chat.id;
    const participants = this.flattenParticipants(chat.participants);
    
    this.currentChatId = chatId;
    this.currentParticipants = participants;

    this.ws.send({ type: "getChat", chatId });
    this.updateActiveChat(chatId);
    this.ui.getElement("message-input-area").style.display = "flex";
  }

  updateActiveChat(chatId) {
    this.ui.shadowRoot.querySelectorAll(".chat-item").forEach((item, idx) => {
      const chat = this.myChats[idx];
      const currentChatId = chat ? (chat.chatId || chat.id) : null;
      
      if (currentChatId === chatId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
}