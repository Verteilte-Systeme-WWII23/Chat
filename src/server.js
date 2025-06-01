import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { handleConnection } from "./wsHandlers.js";
import { getChats, getMessages } from "./chatManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", handleConnection);



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



app.use(express.static(path.join(__dirname, "public")));

server.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});