import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { handleConnection } from "./wsHandlers.js";
import { getChats, getMessages } from "./chatManager.js";
import { getAllUsers, banIp, banUser } from "./userManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => handleConnection(ws, req));



// Debug-Endpoints
app.get("/api/chats", (req, res) => {
  const chatList = Array.from(getChats().entries()).map(([id, chat]) => ({
    ...chat,
    messageCount: getMessages(id).length,
  }));
  res.json(chatList);
});
app.get("/api/messages/:chatId", (req, res) => {
  res.json(getMessages(req.params.chatId));
});



// Admin-API: Alle User anzeigen
app.get("/admin/users", (req, res) => {
  const users = [];
  for (const [id, user] of getAllUsers().entries()) {
    if (user)
      users.push({ id, name: user.name, ip: user.ip });
  }
  res.json(users);
});

// Admin-API: IP sperren
app.post("/admin/ban/ip", express.json(), (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "IP fehlt" });
  banIp(ip);
  res.json({ success: true });
});

// Admin-API: User sperren
app.post("/admin/ban/user", express.json(), (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "UserId fehlt" });
  banUser(userId);
  res.json({ success: true });
});



app.use(express.static(path.join(__dirname, "public")));

server.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});