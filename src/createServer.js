import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { handleConnection } from "./wsHandlers.js";
import { getAllUsers, getBannedIps, banIp, unBanIp } from "./userManager.js";

// Funktion, um einen Server zu erstellen ohne ihn zu starten
export async function createServer() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => handleConnection(ws, req));

  // Admin-Routen einrichten
  app.use("/admin", express.json());
  
  app.post("/admin/users", (req, res) => {
    const { password } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Falsches Passwort" });
    }
    
    const users = [];
    for (const [id, user] of getAllUsers().entries()) {
      if (user) users.push({ id, name: user.name, ip: user.ip });
    }
    res.json(users);
  });
  
  app.post("/admin/banned-ips", (req, res) => {
    const { password } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Falsches Passwort" });
    }
    
    const bannedUserIps = [];
    const users = getAllUsers();
    const bannedIps = Array.from(getBannedIps());
    users.forEach((user, id) => {
      if (user && bannedIps.includes(user.ip)) {
        bannedUserIps.push({ id, name: user.name, ip: user.ip });
      }
    });
    res.json(bannedUserIps);
  });
  
  app.post("/admin/ban/ip", (req, res) => {
    const { password, ip } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Falsches Passwort" });
    }
    if (!ip) return res.status(400).json({ error: "IP fehlt" });
    
    banIp(ip);
    res.json({ success: true });
  });
  
  app.post("/admin/unban/ip", (req, res) => {
    const { password, ip } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Falsches Passwort" });
    }
    if (!ip) return res.status(400).json({ error: "IP fehlt" });
    
    unBanIp(ip);
    res.json({ success: true });
  });
  
  // Statische Dateien
  app.use(express.static(path.join(__dirname, "public")));
  
  return server;
}