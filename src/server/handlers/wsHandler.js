import { isBanned, removeUser } from "../managers/userManager.js";
import { WS } from "../websocket/WS.js";
import { ConnectionManager } from "../websocket/ConnectionManager.js";
import { COMMANDS } from "../websocket/commands.js";

export function handleConnection(ws, req) {
  const ip = ConnectionManager.getClientIP(req);
  
  if (isBanned(ip)) {
    ws.send(JSON.stringify({ type: "banned", reason: "Du wurdest gesperrt." }));
    ws.close();
    return;
  }
  
  let userId = null;

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "reconnect") {
        userId = ConnectionManager.handleReconnect(ws, data);
        return;
      }

      if (!userId) {
        userId = ConnectionManager.initializeNewUser(ws, ip);
        return;
      }

      const handler = new WS(ws, userId);
      await ConnectionManager.executeCommand(handler, data.type, data, COMMANDS);

    } catch (error) {
      console.error("Fehler beim Verarbeiten der Nachricht:", error);
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ 
          type: "error", 
          message: "Ungültige Nachricht" 
        }));
      }
    }
  });
}