class MeinChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.socket = null;
    this.myName = "";
    this.myId = "";
    this.currentChatId = null;
    this.currentParticipants = [];
    this.myChats = [];
    this.isOpen = true;
    this.startX = 0;
    this.startY = 0;
    this.startWidth = 350;
    this.startHeight = 500;
  }

  connectedCallback() {
    this.loadStyles();
    this.render();
    this.initSocket();
    this.addEventListeners();
    this.makeResizable();
  }

  async loadStyles() {
    try {
      const response = await fetch('chat-styles.css');
      if (!response.ok) throw new Error('CSS nicht gefunden');
      const css = await response.text();
      const style = document.createElement('style');
      style.textContent = css;
      this.shadowRoot.appendChild(style);
    } catch (e) {
      console.warn('Konnte Styles nicht laden, lade Fallback-Styles...', e);
      // Lade Fallback-Styles
      const fallbackLink = document.createElement('link');
      fallbackLink.rel = 'stylesheet';
      fallbackLink.href = 'chat-fallback-styles.css';
      this.shadowRoot.appendChild(fallbackLink);
    }
  }

  render() {
    // HTML-Struktur mit semantischen Tags
    const container = document.createElement('div');
    container.className = 'container';
    container.id = 'meinchat-container';
    
    // Header-Bereich
    const header = document.createElement('header');
    header.id = 'header-bar';
    header.innerHTML = `
      <span>💬 Chat</span>
      <button id="close-btn" title="Schließen">×</button>
    `;
    
    // Login-Bereich
    const loginScreen = document.createElement('section');
    loginScreen.id = 'login-screen';
    loginScreen.innerHTML = `
      <h2>Willkommen zum Chat</h2>
      <input id="name-input" placeholder="Dein Name" />
      <button id="login-btn">Anmelden</button>
    `;
    
    // Hauptbereich
    const mainContainer = document.createElement('section');
    mainContainer.id = 'main-container';
    
    // User-Name
    const userName = document.createElement('div');
    userName.id = 'user-name';
    
    // Chat-Controls
    const chatControls = document.createElement('div');
    chatControls.className = 'chat-controls';
    chatControls.innerHTML = `
      <input id="new-chat-input" placeholder="User-IDs (Komma getrennt)" />
      <button id="new-chat-btn">Neu</button>
    `;
    
    // Chat-Liste
    const chatList = document.createElement('div');
    chatList.id = 'chat-list';
    
    // Chat-Header
    const chatHeader = document.createElement('div');
    chatHeader.id = 'chat-header';
    
    // Chat-Nachrichten
    const chatMessages = document.createElement('div');
    chatMessages.id = 'chat-messages';
    
    // Nachrichten-Eingabe
    const messageInputArea = document.createElement('div');
    messageInputArea.id = 'message-input-area';
    messageInputArea.innerHTML = `
      <input id="message-input" placeholder="Nachricht..." />
      <button id="send-btn"></button>
    `;
    
    // Resize-Handle
    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'resize-handle';
    
    // Struktur zusammenbauen
    mainContainer.appendChild(userName);
    mainContainer.appendChild(chatControls);
    mainContainer.appendChild(chatList);
    mainContainer.appendChild(chatHeader);
    mainContainer.appendChild(chatMessages);
    mainContainer.appendChild(messageInputArea);
    
    container.appendChild(header);
    container.appendChild(loginScreen);
    container.appendChild(mainContainer);
    container.appendChild(resizeHandle);
    
    this.shadowRoot.appendChild(container);
    
    // Anzeige steuern
    if (!this.isOpen) this.style.display = "none";
    else this.style.display = "block";
  }

  // Rest des Codes bleibt unverändert
  addEventListeners() {
    this.shadowRoot.getElementById("login-btn").onclick = () => this.login();
    this.shadowRoot.getElementById("send-btn").onclick = () => this.sendMessage();
    this.shadowRoot.getElementById("message-input").onkeypress = (e) => {
      if (e.key === "Enter") this.sendMessage();
    };
    this.shadowRoot.getElementById("new-chat-btn").onclick = () => this.startNewChat();
    this.shadowRoot.getElementById("close-btn").onclick = () => this.closeChat();

    // Drag & Drop für Floating
    const header = this.shadowRoot.getElementById("header-bar");
    let offsetX, offsetY, isDragging = false;
    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - this.getBoundingClientRect().left;
      offsetY = e.clientY - this.getBoundingClientRect().top;
      document.body.style.userSelect = "none";
    });
    window.addEventListener("mousemove", (e) => {
      if (isDragging) {
        this.style.left = (e.clientX - offsetX) + "px";
        this.style.top = (e.clientY - offsetY) + "px";
        this.style.right = "auto";
        this.style.bottom = "auto";
        this.style.position = "fixed";
      }
    });
    window.addEventListener("mouseup", () => {
      isDragging = false;
      document.body.style.userSelect = "";
    });
  }

  makeResizable() {
    const handle = this.shadowRoot.getElementById("resize-handle");
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = this.offsetWidth;
      startHeight = this.offsetHeight;
      document.body.style.userSelect = "none";
    });
    window.addEventListener("mousemove", (e) => {
      if (isResizing) {
        const newWidth = Math.max(250, startWidth + (e.clientX - startX));
        const newHeight = Math.max(320, startHeight + (e.clientY - startY));
        this.style.width = newWidth + "px";
        this.style.height = newHeight + "px";
      }
    });
    window.addEventListener("mouseup", () => {
      isResizing = false;
      document.body.style.userSelect = "";
    });
  }

  closeChat() {
    this.isOpen = false;
    this.style.display = "none";
  }

  initSocket() {
    this.socket = new WebSocket(`ws://${location.host}`);
    this.socket.onopen = () => {
      // Verbunden
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "welcome") {
        this.myId = data.userId;
      }

      if (data.type === "message") {
        if (data.chatId === this.currentChatId) {
          this.displayMessage(
            data.from,
            data.text,
            data.timestamp,
            data.from === this.myId
          );
        }
        this.loadMyChats();
      }

      if (data.type === "messageSent") {
        this.loadMyChats();
      }

      if (data.type === "myChats") {
        this.myChats = data.chats;
        this.displayChatList();
      }

      if (data.type === "chatHistory") {
        this.currentChatId = data.chatId;
        this.currentParticipants = data.participants;
        this.displayChatHistory(data.messages);
        this.updateChatHeader(data.participants);
      }
    };
  }

  login() {
    const name = this.shadowRoot.getElementById("name-input").value.trim();
    if (!name) return alert("Bitte gib einen Namen ein");

    this.myName = name;
    this.shadowRoot.getElementById("user-name").textContent = this.myName;

    this.socket.send(JSON.stringify({ type: "setName", name }));

    this.shadowRoot.getElementById("login-screen").style.display = "none";
    this.shadowRoot.getElementById("main-container").style.display = "flex";

    this.loadMyChats();
  }

  loadMyChats() {
    this.socket.send(JSON.stringify({ type: "getMyChats" }));
  }

  displayChatList() {
    const chatList = this.shadowRoot.getElementById("chat-list");
    chatList.innerHTML = "";
    this.myChats.forEach((chat) => {
      const otherNames = chat.participants
        .filter((id) => id !== this.myId)
        .map((id) => this.getUserName(id, chat.participants))
        .join(", ");
      const chatItem = document.createElement("div");
      chatItem.className = "chat-item";
      chatItem.onclick = () => this.openChat(chat);

      const lastMessageText = chat.lastMessage
        ? (chat.lastMessage.from === this.myId
            ? "Du: "
            : this.getUserName(chat.lastMessage.from, chat.participants) +
              ": ") + chat.lastMessage.text
        : "Noch keine Nachrichten";

      const lastMessageTime = chat.lastMessage
        ? new Date(chat.lastMessage.timestamp).toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      const isUnread = chat.lastMessage && chat.lastMessage.from !== this.myId;

      chatItem.innerHTML = `
        <h4 style="${isUnread ? "font-weight: bold;" : ""}">${otherNames}</h4>
        <p style="${
          isUnread ? "font-weight: bold; color: #333;" : ""
        }">${lastMessageText} ${
        lastMessageTime ? "• " + lastMessageTime : ""
      }</p>
      `;

      if (this.currentChatId === chat.chatId) {
        chatItem.classList.add("active");
      }

      chatList.appendChild(chatItem);
    });
  }

  getUserName(userId, participants) {
    if (userId === this.myId) return this.myName;
    if (userId === "AI") return "KI-Assistent";
    for (const chat of this.myChats) {
      for (const pid of chat.participants) {
        if (pid === userId && chat.names && chat.names[pid]) {
          return chat.names[pid];
        }
      }
    }
    return userId;
  }

  startNewChat() {
    const userIdsRaw = this.shadowRoot.getElementById("new-chat-input").value.trim();
    if (!userIdsRaw)
      return alert("Bitte gib mindestens eine User-ID ein (Komma getrennt für Gruppen)");
    const userIds = userIdsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!userIds.length) return alert("Ungültige Eingabe");
    if (!userIds.includes(this.myId)) userIds.push(this.myId);

    this.shadowRoot.getElementById("new-chat-input").value = "";
    this.openChat({ participants: userIds });
  }

  openChat(chat) {
    if (!chat.participants.includes(this.myId)) {
      chat.participants.push(this.myId);
    }
    this.currentChatId = chat.chatId || null;
    this.currentParticipants = chat.participants;

    this.socket.send(
      JSON.stringify({
        type: "getChatHistory",
        participants: chat.participants,
      })
    );

    this.shadowRoot.querySelectorAll(".chat-item").forEach((item) => {
      item.classList.remove("active");
      if (
        item.textContent.includes(
          chat.participants.filter((id) => id !== this.myId).join(", ")
        )
      ) {
        item.classList.add("active");
      }
    });
    
    // Eingabefeld immer anzeigen, auch wenn keine Nachrichten da sind
    this.shadowRoot.getElementById("message-input-area").style.display = "flex";
  }

  displayChatHistory(messages) {
    const chatMessages = this.shadowRoot.getElementById("chat-messages");
    chatMessages.innerHTML = "";
    
    if (messages.length === 0) {
      // Leere Nachricht anzeigen, wenn keine Nachrichten vorhanden sind
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "empty-message";
      emptyMessage.textContent = "Noch keine Nachrichten. Schreibe etwas, um die Unterhaltung zu beginnen!";
      chatMessages.appendChild(emptyMessage);
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
    
    this.scrollToBottom();
  }

  displayMessage(from, text, timestamp, isSent) {
    const chatMessages = this.shadowRoot.getElementById("chat-messages");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isSent ? "sent" : "received"}`;

    const timeStr = new Date(timestamp).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageDiv.innerHTML = `
      <div>${
        isSent ? "" : `<b>${this.getUserName(from, this.currentParticipants)}:</b> `
      }${text}</div>
      <div class="timestamp">${timeStr}</div>
    `;

    chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
  }

  updateChatHeader(participants) {
    const otherNames = participants
      .filter((id) => id !== this.myId)
      .map((id) => this.getUserName(id, participants))
      .join(", ");
    this.shadowRoot.getElementById("chat-header").innerHTML = `<h3>Chat mit ${otherNames}</h3>`;
  }

  sendMessage() {
    const messageInput = this.shadowRoot.getElementById("message-input");
    const text = messageInput.value.trim();

    if (!text || !this.currentParticipants.length) return;

    this.socket.send(
      JSON.stringify({
        type: "messageTo",
        to: this.currentParticipants,
        text,
      })
    );

    messageInput.value = "";
  }

  scrollToBottom() {
    const chatMessages = this.shadowRoot.getElementById("chat-messages");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

customElements.define("mein-chat", MeinChat);