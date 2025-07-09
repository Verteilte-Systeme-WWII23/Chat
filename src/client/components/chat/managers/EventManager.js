export class EventManager {
  constructor(uiManager, webSocketManager, chatManager) {
    this.ui = uiManager;
    this.ws = webSocketManager;
    this.chat = chatManager;
    this.resizeObserver = null;
  }

  setupEventListeners() {
    this.setupLoginEvents();
    this.setupChatEvents();
    this.setupHeaderEvents();
    this.setupDragAndResize();
    this.setupResponsiveLayout();
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

  // Neue Methode für responsive Layout-Überwachung
  setupResponsiveLayout() {
    // Initial check
    this.checkResponsiveLayout();

    // ResizeObserver für das Host-Element
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkResponsiveLayout();
      });
      
      this.resizeObserver.observe(this.ui.shadowRoot.host);
    }

    // Fallback für Browser ohne ResizeObserver
    window.addEventListener('resize', () => {
      this.checkResponsiveLayout();
    });
  }

  // Prüft und wendet responsive Layout-Änderungen an
  checkResponsiveLayout() {
    const host = this.ui.shadowRoot.host;
    const container = this.ui.shadowRoot.getElementById("meinchat-container");
    const toggleButton = this.ui.getElement("toggle-sidebar");
    const currentWidth = host.offsetWidth;
    
    // Responsive Layout bei Fensterbreite < 500px oder Viewport < 768px
    const shouldBeResponsive = currentWidth < 500 || window.innerWidth <= 768;
    
    if (shouldBeResponsive) {
      container.classList.add("responsive-layout");
      toggleButton.style.display = "block";
    } else {
      container.classList.remove("responsive-layout");
      // Entferne auch sidebar-compact wenn wir wieder groß werden
      container.classList.remove("sidebar-compact");
      toggleButton.style.display = "none";
    }
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
        const newWidth = Math.max(400, startWidth + (e.clientX - startX)); // Minimum width
        const newHeight = Math.max(700, startHeight + (e.clientY - startY)); // Minimum height
        
        host.style.width = newWidth + "px";
        host.style.height = newHeight + "px";
        
        // Responsive Layout wird automatisch über ResizeObserver aktualisiert
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

    localStorage.setItem("chatUserName", name);
    this.chat.myName = name;
    this.ui.updateUserName(name);
    this.ws.send({ type: "setName", name });
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
    container.classList.toggle("sidebar-compact");
  }

  // Cleanup method
  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}