export class EventManager {
  constructor(uiManager, webSocketManager, chatManager) {
    this.ui = uiManager;
    this.ws = webSocketManager;
    this.chat = chatManager;
  }

  setupEventListeners() {
    this.setupLoginEvents();
    this.setupChatEvents();
    this.setupHeaderEvents();
    this.setupDragAndResize();
  }

  setupLoginEvents() {
    this.ui.getElement("login-btn").onclick = () => this.handleLogin();
    this.ui.getElement("name-input").onkeypress = (e) => {
      if (e.key === "Enter") this.handleLogin();
    };
  }

  setupChatEvents() {
    this.ui.getElement("send-btn").onclick = () => this.handleSendMessage();
    this.ui.getElement("message-input").onkeypress = (e) => {
      if (e.key === "Enter") this.handleSendMessage();
    };
    this.ui.getElement("new-empty-chat-btn").onclick = () => this.handleCreateEmptyChat();
    this.ui.getElement("join-chat-btn").onclick = () => this.handleJoinChat();
  }

  setupHeaderEvents() {
    this.ui.getElement("close-btn").onclick = () => this.handleCloseChat();
    this.ui.getElement("admin-btn").onclick = () => this.handleOpenAdmin();
    this.ui.getElement("toggle-sidebar").onclick = () => this.handleToggleSidebar();
  }

  setupDragAndResize() {
    this.setupDragFunctionality();
    this.setupResizeFunctionality();
  }

  setupDragFunctionality() {
    const header = this.ui.getElement("header-bar");
    let offsetX, offsetY, isDragging = false;
    
    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      const rect = this.ui.shadowRoot.host.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.body.style.userSelect = "none";
    });

    window.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const host = this.ui.shadowRoot.host;
        host.style.left = (e.clientX - offsetX) + "px";
        host.style.top = (e.clientY - offsetY) + "px";
        host.style.right = "auto";
        host.style.bottom = "auto";
        host.style.position = "fixed";
      }
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
      document.body.style.userSelect = "";
    });
  }

  setupResizeFunctionality() {
    const handle = this.ui.getElement("resize-handle");
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      const host = this.ui.shadowRoot.host;
      startWidth = host.offsetWidth;
      startHeight = host.offsetHeight;
      document.body.style.userSelect = "none";
    });

    window.addEventListener("mousemove", (e) => {
      if (isResizing) {
        const host = this.ui.shadowRoot.host;
        const newWidth = Math.max(400, startWidth + (e.clientX - startX)); // Match min-width in CSS
        const newHeight = Math.max(640, startHeight + (e.clientY - startY)); // Match min-height in CSS
        host.style.width = newWidth + "px";
        host.style.height = newHeight + "px";
        
        // Apply responsive layout based on component width
        const container = this.ui.shadowRoot.getElementById("meinchat-container");
        if (newWidth < 500) {
          container.classList.add("responsive-layout");
        } else {
          container.classList.remove("responsive-layout");
        }
      }
    });

    window.addEventListener("mouseup", () => {
      isResizing = false;
      document.body.style.userSelect = "";
    });
  }

  handleLogin() {
    const name = this.ui.getInputValue("name-input");
    if (!name) return alert("Bitte gib einen Namen ein");

    // Save the name in localStorage
    localStorage.setItem("chatUserName", name);
    
    // Update the chat and UI
    this.chat.myName = name;
    this.ui.updateUserName(name);
    
    // Send the name to the server
    this.ws.send({ type: "setName", name });
    
    // Show main container
    this.ui.showMainContainer();
    this.ws.send({ type: "getUserChats" });
  }

  handleSendMessage() {
    const text = this.ui.getInputValue("message-input");
    if (!text || !this.chat.currentChatId) return;

    this.ws.send({
      type: "messageTo",
      chatId: this.chat.currentChatId,
      text,
    });
    this.ui.clearInput("message-input");
  }

  handleCreateEmptyChat() {
    this.ws.send({ type: "createEmptyChat" });
  }

  handleJoinChat() {
    const chatId = this.ui.getInputValue("join-chat-id-input");
    if (!chatId) return alert("Bitte gib eine Chat-ID ein");
    this.ws.send({ type: "joinChatById", chatId });
  }

  handleCloseChat() {
    this.ui.shadowRoot.host.style.display = "none";
  }

  handleOpenAdmin() {
    window.open('/admin.html', '_blank');
  }

  handleToggleSidebar() {
    const container = this.ui.shadowRoot.getElementById("meinchat-container");
    const sidebar = this.ui.shadowRoot.getElementById("sidebar");
    const chatArea = this.ui.shadowRoot.getElementById("chat-area");
    
    // Toggle kompakte Sidebar
    container.classList.toggle("sidebar-compact");
    
    // Bessere Transition-Logik
    if (container.classList.contains("sidebar-compact")) {
      // Sidebar verstecken, Chat-Area maximieren
      sidebar.style.transition = "all 0.3s ease";
      chatArea.style.transition = "all 0.3s ease";
    } else {
      // Sidebar wieder anzeigen
      sidebar.style.transition = "all 0.3s ease";
      chatArea.style.transition = "all 0.3s ease";
    }
  }
}