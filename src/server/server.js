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

// API Routes
app.use("/admin", adminRoutes);

// HTML-Seiten Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/landing/landing.html"));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/admin/admin.html"));
});

// Alle statischen Client-Dateien (components, styles, etc.)
app.use(express.static(path.join(__dirname, "../client")));

// Error handling
app.use(errorHandler);







// Server starten (nur wenn nicht im Test-Modus)
if (config.nodeEnv !== 'test') {
  server.listen(config.port, () => {
    console.log(`Server läuft auf Port ${config.port}`);
  });
}

export default server;