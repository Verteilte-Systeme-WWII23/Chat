import {
  addUser,
  getUser,
} from "../managers/userManager.js";
import { createAIChatForUser } from "../managers/chatManager.js";

export class ConnectionManager {
  static getClientIP(req) {
    return req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.headers["x-real-ip"] ||
      req.socket.remoteAddress ||
      req.connection.remoteAddress ||
      "unknown";
  }

  static handleReconnect(ws, data) {
    if (!data.userId || !getUser(data.userId)) return null;

    const userId = data.userId;
    getUser(userId).ws = ws;
    ws.send(JSON.stringify({
      type: "welcome",
      userId,
      name: getUser(userId)?.name
    }));
    return userId;
  }

  static initializeNewUser(ws, ip) {
    const userId = addUser(ws, ip);
    createAIChatForUser(userId);
    ws.send(JSON.stringify({
      type: "welcome",
      userId,
      name: getUser(userId)?.name
    }));
    return userId;
  }
  
  static async executeCommand(handler, type, data, validCommands) {
    if (!validCommands.has(type) || typeof handler[type] !== 'function') {
      handler.sendError(`Unbekannter Command: ${type}`);
      return;
    }

    await handler[type](data);
  }
}