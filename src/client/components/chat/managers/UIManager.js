export class UIManager {
  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;
  }

  showLoginScreen() {
    this.getElement("login-screen").style.display = "block";
    this.getElement("main-container").style.display = "none";
  }

  showMainContainer() {
    this.getElement("login-screen").style.display = "none";
    this.getElement("main-container").style.display = "flex";
  }

  updateUserName(name) {
    this.getElement("user-name").textContent = name || "Mein Name";
  }

  clearInput(inputId) {
    this.getElement(inputId).value = "";
  }

  getInputValue(inputId) {
    return this.getElement(inputId).value.trim();
  }

  setInputValue(inputId, value) {
    this.getElement(inputId).value = value;
  }

  getElement(id) {
    return this.shadowRoot.getElementById(id);
  }

  scrollToBottom() {
    const chatMessages = this.getElement("chat-messages");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}