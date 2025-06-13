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
      console.warn('Styles konnten nicht geladen werden.', e);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'container';
    container.id = 'meinchat-container';

    const header = document.createElement('header');
    header.id = 'header-bar';
    header.innerHTML = `
      <span>💬 Chat</span>
      <button id="close-btn" title="Schließen">×</button>
    `;

    const loginScreen = document.createElement('section');
    loginScreen.id = 'login-screen';
    loginScreen.innerHTML = `
      <h2>Willkommen zum Chat</h2>
      <input id="name-input" placeholder="Dein Name" />
      <button id="login-btn">Anmelden</button>
    `;

    const mainContainer = document.createElement('section');
    mainContainer.id = 'main-container';

    const userName = document.createElement('div');
    userName.id = 'user-name';

    const chatControls = document.createElement('div');
    chatControls.className = 'chat-controls';
    chatControls.innerHTML = `
      <button id="new-empty-chat-btn">Neuer Chat</button>
      <input id="join-chat-id-input" placeholder="Chat-ID" />
      <button id="join-chat-btn">Beitreten</button>
    `;

    const chatList = document.createElement('div');
    chatList.id = 'chat-list';

    const chatHeader = document.createElement('div');
    chatHeader.id = 'chat-header';

    const chatMessages = document.createElement('div');
    chatMessages.id = 'chat-messages';

    const messageInputArea = document.createElement('div');
    messageInputArea.id = 'message-input-area';
    messageInputArea.innerHTML = `
      <input id="message-input" placeholder="Nachricht..." />
      <button id="send-btn"></button>
    `;

    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'resize-handle';

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
    

    if (!this.isOpen) this.style.display = "none";
    else this.style.display = "block";
  }

  addEventListeners() {
    this.shadowRoot.getElementById("login-btn").onclick = () => this.login();
    this.shadowRoot.getElementById("send-btn").onclick = () => this.sendMessage();
    this.shadowRoot.getElementById("message-input").onkeypress = (e) => {
      if (e.key === "Enter") this.sendMessage();
    };
    this.shadowRoot.getElementById("new-empty-chat-btn").onclick = () => this.createEmptyChat();
    this.shadowRoot.getElementById("join-chat-btn").onclick = () => this.joinChatById();
    this.shadowRoot.getElementById("close-btn").onclick = () => this.closeChat();

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
    this.myId = localStorage.getItem("chatUserId") || "";
    this.socket = new WebSocket(`ws://${location.host}`);

    this.socket.onopen = () => {
      if (this.myId) {
        this.socket.send(JSON.stringify({ type: "reconnect", userId: this.myId }));
      }
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "welcome") {
        this.myId = data.userId;
        this.myName = data.name || "";
        localStorage.setItem("chatUserId", this.myId);

        this.shadowRoot.getElementById("user-name").textContent = this.myName || "Mein Name";

        if (!this.myName || this.myName.startsWith("Gast_")) {
          this.shadowRoot.getElementById("login-screen").style.display = "block";
          this.shadowRoot.getElementById("main-container").style.display = "none";
        } else {
          this.shadowRoot.getElementById("login-screen").style.display = "none";
          this.shadowRoot.getElementById("main-container").style.display = "flex";
          this.loadMyChats();
        }
      }

      if (data.type === "emptyChatCreated" || data.type === "joinedChat") {
        this.openChat({ id: data.chatId, participants: data.participants });
        this.loadMyChats();
        alert(`Chat-ID: ${data.chatId}`);
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
        console.log("Meine Chats:", data.chats);
        this.myChats = data.chats;
        this.displayChatList();
      }

      if (data.type === "chatHistory") {
        this.currentChatId = data.chatId;
        this.currentParticipants = data.participants;

        if (data.names) {
          let chat = this.myChats.find(c => c.id === data.chatId || c.chatId === data.chatId);
          if (!chat) {
            chat = { id: data.chatId, participants: data.participants, names: data.names };
            this.myChats.push(chat);
          } else {
            chat.names = { ...chat.names, ...data.names };
          }
        }

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
      const chatId = chat.chatId || chat.id; // Fallback falls Backend noch "id" liefert
      const chatItem = document.createElement("div");
      chatItem.className = "chat-item";
      chatItem.onclick = () => this.openChat(chat);

      const lastMessageText = chat.lastMessage
        ? (chat.lastMessage.from === this.myId
            ? "Du: "
            : ((chat.names && chat.names[chat.lastMessage.from]) ? chat.names[chat.lastMessage.from] : chat.lastMessage.from) + ": ") + chat.lastMessage.text
        : "Noch keine Nachrichten";

      const lastMessageTime = chat.lastMessage
        ? new Date(chat.lastMessage.timestamp).toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      const isUnread = chat.lastMessage && chat.lastMessage.from !== this.myId;

      chatItem.innerHTML = `
        <h4 style="${isUnread ? "font-weight: bold;" : ""}">Chat-ID: ${chatId}</h4>
        <p style="${isUnread ? "font-weight: bold; color: #333;" : ""}">
          ${lastMessageText} ${lastMessageTime ? "• " + lastMessageTime : ""}
        </p>
      `;

      if (this.currentChatId === chatId) {
        chatItem.classList.add("active");
      }

      chatList.appendChild(chatItem);
    });
  }

  getUserName(userId, participants) {
    if (userId === this.myId) return this.myName;
    if (userId === "AI") return "KI-Assistent";
    let chat = this.myChats.find(c => c.id === this.currentChatId || c.chatId === this.currentChatId);
    if (chat && chat.names && chat.names[userId]) return chat.names[userId];
    for (const c of this.myChats) {
      if (c.names && c.names[userId]) return c.names[userId];
    }
    return userId;
  }

  startNewChat() {
    const namesRaw = this.shadowRoot.getElementById("new-chat-input").value.trim();
    if (!namesRaw)
      return alert("Bitte gib mindestens einen Namen ein (Komma getrennt für Gruppen)");
    const names = namesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!names.length) return alert("Ungültige Eingabe");
    if (!names.includes(this.myName)) names.push(this.myName);

    this.shadowRoot.getElementById("new-chat-input").value = "";

    this.socket.send(
      JSON.stringify({
        type: "getChatHistoryByNames",
        names: names,
      })
    );
  }

  createEmptyChat() {
    this.socket.send(JSON.stringify({ type: "createEmptyChat" }));
  }

  joinChatById() {
    const chatId = this.shadowRoot.getElementById("join-chat-id-input").value.trim();
    if (!chatId) return alert("Bitte gib eine Chat-ID ein");
    this.socket.send(JSON.stringify({ type: "joinChatById", chatId }));
  }

  openChat(chat) {
    const chatId = chat.chatId || chat.id;
    this.currentChatId = chatId;
    this.currentParticipants = chat.participants;

    this.socket.send(
      JSON.stringify({
        type: "getChatHistory",
        chatId: chatId,
      })
    );

    this.shadowRoot.querySelectorAll(".chat-item").forEach((item, idx) => {
      const c = this.myChats[idx];
      const cId = c ? (c.chatId || c.id) : null;
      if (cId === chatId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    this.shadowRoot.getElementById("message-input-area").style.display = "flex";
  }

  displayChatHistory(messages) {
    const chatMessages = this.shadowRoot.getElementById("chat-messages");
    chatMessages.innerHTML = "";

    if (messages.length === 0) {
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
    this.shadowRoot.getElementById("chat-header").innerHTML =
      `<h3>Chat-ID: ${this.currentChatId}</h3>`;
  }

  sendMessage() {
    const messageInput = this.shadowRoot.getElementById("message-input");
    const text = messageInput.value.trim();

    if (!text || !this.currentChatId) return;

    this.socket.send(
      JSON.stringify({
        type: "messageTo",
        chatId: this.currentChatId,
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