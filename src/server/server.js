import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { handleConnection } from "./handlers/wsHandler.js";
import adminRoutes from "./routes/admin.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { config } from "./config/env.js";

// __dirname Setup für ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App und HTTP-Server
const app = express();
const server = http.createServer(app);

// WebSocket Setup
const wss = new WebSocketServer({ server });
wss.on("connection", (ws, req) => handleConnection(ws, req));

// CORS - alles erlauben (dev-friendly)
app.use(cors({ origin: "*", credentials: true }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// JSON Parsing
app.use(express.json());

// Statische Dateien z. B. client/components/chat/mein-chat.js
app.use(express.static(path.join(__dirname, "../client")));

// API Routes
app.use("/admin", adminRoutes);

// HTML Pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/landing/landing.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/admin/admin.html"));
});

// Error Handling Middleware
app.use(errorHandler);

// Server starten, es sei denn, wir sind im Testmodus oder das Modul wird importiert
if (config.nodeEnv !== 'test') {
  server.listen(config.port, () => {
    console.log(`✅ Server läuft auf Port ${config.port}`);
  });
}

export default server;
