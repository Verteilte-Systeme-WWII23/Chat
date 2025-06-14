import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { handleConnection } from "./wsHandlers.js";
import { getAllUsers, banIp } from "./userManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => handleConnection(ws, req));

app.get("/admin/users", (req, res) => {
  const users = [];
  for (const [id, user] of getAllUsers().entries()) {
    if (user)
      users.push({ id, name: user.name, ip: user.ip });
  }
  res.json(users);
});


app.post("/admin/ban/ip", express.json(), (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "IP fehlt" });
  banIp(ip);
  res.json({ success: true });
});


app.post("/admin/ban/user", express.json(), (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "UserId fehlt" });
  banUser(userId);
  res.json({ success: true });
});

app.use(express.static(path.join(__dirname, "public")));



server.listen(3000, () => {
  console.log(`Server läuft auf http://localhost:3000`);
});