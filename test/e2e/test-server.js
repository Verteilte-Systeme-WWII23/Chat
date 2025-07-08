import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { handleConnection } from '../../src/server/handlers/wsHandler.js';
import adminRoutes from '../../src/server/routes/admin.js';
import { errorHandler } from '../../src/server/middleware/errorHandler.js';

// Express-App erstellen
const app = express();
app.use(express.json());

// Admin-Routen einbinden
app.use('/admin', adminRoutes);

// Absoluten Pfad zum Projektverzeichnis ermitteln
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientPath = path.resolve(__dirname, '../../src/client');
const testPath = __dirname;

// Statische Dateien bereitstellen
app.use(express.static(clientPath));
app.use(express.static(testPath));

// Root-Route auf test.html umleiten
app.get('/', (req, res) => {
  res.sendFile(path.join(testPath, './test.html'));
});

// Fehlerbehandlung
app.use(errorHandler);

// HTTP-Server erstellen
const server = http.createServer(app);

// WebSocket-Server einrichten
const wss = new WebSocketServer({ server });

// WebSocket-Verbindungen behandeln
wss.on('connection', (ws, req) => {
  console.log('WebSocket-Verbindung hergestellt');
  handleConnection(ws, req);
});

// Server starten
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Cypress E2E Test-Server läuft auf Port ${PORT}`);
  console.log(`Testseite verfügbar unter: http://localhost:${PORT}`);
  console.log(`WebSocket-Server bereit auf: ws://localhost:${PORT}`);
});

// Sauberes Beenden
process.on('SIGINT', () => {
  console.log('Beende E2E-Test-Server...');
  server.close();
  process.exit(0);
});