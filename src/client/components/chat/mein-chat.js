import { WebSocketManager } from './managers/WebSocketManager.js';
import { UIManager } from './managers/UIManager.js';
import { ChatManager } from './managers/ChatManager.js';
import { EventManager } from './managers/EventManager.js';

export class MeinChat extends HTMLElement {
  static get observedAttributes() { return ['server-url']; }
  
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.myName = "";
    this.myId = "";
    this.isOpen = true;
    this.serverUrl = this.getAttribute("server-url");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if(name === "server-url" && oldValue !== newValue) {
      this.serverUrl = newValue;
      if (this.ws) {
        this.ws.disconnect();
      }
      this.initializeManagers();
    }
  }


  async connectedCallback() {
    await this.loadTemplate();
    await this.loadStyles();
    this.initializeManagers();
    this.setupEventListeners();
  }

  async loadTemplate() {
    try {
      const templateUrl = new URL('chat-template.html', import.meta.url);
      const response = await fetch(templateUrl);
      const html = await response.text();
      this.shadowRoot.innerHTML = html;
    } catch (error) {
      console.error('Failed to load template:', error);
      this.renderFallbackTemplate();
    }
  }

  renderFallbackTemplate() {
    // Fallback HTML falls das Laden fehlschlägt
    this.shadowRoot.innerHTML = `
      <div class="container">
        <div>Chat konnte nicht geladen werden</div>
      </div>
    `;
  }

  async loadStyles() {
    const cssUrl = new URL('styles/chat-styles.css', import.meta.url);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl.toString();
    this.shadowRoot.appendChild(link);
  }

  initializeManagers() {
    this.ui = new UIManager(this.shadowRoot);
    this.ws = new WebSocketManager((data) => this.handleWebSocketMessage(data),
    this.serverUrl);
    this.chat = new ChatManager(this.ui, this.ws);
    this.events = new EventManager(this.ui, this.ws, this.chat);
    this.ws.connect();
  }

  setupEventListeners() {
    this.events.setupEventListeners();
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case "welcome":
        this.handleWelcome(data);
        break;
      case "emptyChatCreated":
      case "joinedChat":
      case "participantJoined":
        this.handleChatCreated(data);
        break;
      case "message":
        this.handleMessage(data);
        break;
      case "userChats":
        this.handleUserChats(data);
        break;
      case "chat":
        this.handleChatData(data);
        break;
      case "banned":
        this.handleBanned(data);
        break;
      default:
        console.log('Unhandled message type:', data.type);
    }
  }

  handleWelcome(data) {
    this.myId = data.userId;
    this.myName = data.name || "";
    this.chat.myId = this.myId;
    this.chat.myName = this.myName;
    localStorage.setItem("chatUserId", this.myId);

    this.ui.updateUserName(this.myName);

    if (!this.myName || this.myName.toLowerCase().startsWith("default_")) {
      this.ui.showLoginScreen();
    } else {
      this.ui.showMainContainer();
      this.ws.send({ type: "getUserChats" });
    }
  }

  handleChatCreated(data) {
    const participants = this.chat.flattenParticipants(data.participants);
    this.chat.openChat({ id: data.chatId, participants });
    this.ws.send({ type: "getUserChats" });
    alert(`Chat-ID: ${data.chatId}`);
  }

  handleMessage(data) {
    const participants = this.chat.flattenParticipants(this.chat.currentParticipants);
    this.chat.currentParticipants = participants;
    
    if (data.chatId === this.chat.currentChatId) {
      this.chat.displayMessage(
        data.from,
        data.text,
        data.timestamp,
        data.from === this.myId
      );
    }
    this.ws.send({ type: "getUserChats" });
  }

  handleUserChats(data) {
    this.chat.myChats = data.chats;
    this.chat.displayChatList();
  }

  handleChatData(data) {
    const participants = this.chat.flattenParticipants(data.participants);
    this.chat.currentChatId = data.chatId;
    this.chat.currentParticipants = participants;
    this.chat.displayChatHistory(data.messages);
    this.chat.updateChatHeader(participants);
  }

  handleBanned(data) {
    alert(data.reason || "Du wurdest gesperrt.");
    this.ui.shadowRoot.host.style.display = "none";
  }

  disconnectedCallback() {
    if (this.ws) {
      this.ws.disconnect();
    }
  }
}

customElements.define("mein-chat", MeinChat);