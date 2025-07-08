export class WebSocketManager {
  constructor(onMessage, serverUrl) {
    this.socket = null;
    this.onMessage = onMessage;
    this.serverUrl = serverUrl;
    this.myId = localStorage.getItem("chatUserId") || "";
  }

  connect() {
    this.socket = new WebSocket(`ws://${this.serverUrl}`);

    this.socket.onopen = () => {
      if (this.myId) {
        this.send({ type: "reconnect", userId: this.myId });
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}