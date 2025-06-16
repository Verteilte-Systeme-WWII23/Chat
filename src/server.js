import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { handleConnection } from "./wsHandlers.js";
import { getAllUsers, getBannedIps, banIp, unBanIp } from "./userManager.js";
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => handleConnection(ws, req));

function adminRoute(handler) {
  return (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: "Falsches Passwort" });
      return;
    }
    handler(req, res);
  };
}

app.use("/admin", express.json());

app.post("/admin/users", adminRoute((req, res) => {
  const users = [];
  for (const [id, user] of getAllUsers().entries()) {
    if (user)
      users.push({ id, name: user.name, ip: user.ip });
  }
  res.json(users);
}));

app.post("/admin/banned-ips", adminRoute((req, res) => {
  const bannedUserIps = []
  const users = getAllUsers();
  const bannedIps = Array.from(getBannedIps());
  users.forEach((user, id) => {
    if (user && bannedIps.includes(user.ip)) {
      bannedUserIps.push({ id, name: user.name, ip: user.ip });
    }
  });
  res.json(bannedUserIps);
}));

app.post("/admin/ban/ip", adminRoute((req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "IP fehlt" });
  banIp(ip);
  res.json({ success: true });
}));

app.post("/admin/unban/ip", adminRoute((req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "IP fehlt" });
  unBanIp(ip);
  res.json({ success: true });
}));

app.use(express.static(path.join(__dirname, "public")));

server.listen(3000, () => {
  console.log(`Server läuft auf http://localhost:3000`);
});