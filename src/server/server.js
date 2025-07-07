import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { handleConnection } from "./handlers/wsHandler.js";
import adminRoutes from "./routes/admin.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { config } from "./config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket-Verbindungen
wss.on("connection", (ws, req) => handleConnection(ws, req));

// Routes
app.use("/admin", adminRoutes);

// Error handling
app.use(errorHandler);

// Statische Dateien
app.use(express.static(path.join(__dirname, "../client")));

// Server starten (nur wenn nicht im Test-Modus)
if (config.nodeEnv !== 'test') {
  server.listen(config.port, () => {
    console.log(`Server läuft auf Port ${config.port}`);
  });
}

export default server;