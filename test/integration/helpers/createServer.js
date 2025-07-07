import { vi } from 'vitest';
import { WebSocketServer } from 'ws';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleConnection } from '../../../src/server/handlers/wsHandler.js';
import adminRoutes from '../../../src/server/routes/admin.js';
import { errorHandler } from '../../../src/server/middleware/errorHandler.js';

/**
 * Erstellt einen Testserver mit allen nötigen Komponenten
 */
export async function createServer() {
  // Express-App erstellen
  const app = express();
  
  // JSON-Parser für Request-Bodies
  app.use(express.json());
  
  // Admin-Routen einbinden
  app.use('/admin', adminRoutes);
  
  // Absoluten Pfad zum src/client Verzeichnis ermitteln
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientPath = path.resolve(__dirname, '../../../src/client');
  
  // Statische Dateien bereitstellen
  app.use(express.static(clientPath));
  
  // Root-Route für Tests
  app.get('/', (req, res) => {
    res.status(200).send('Test Server Running');
  });
  
  // Fehlerbehandlung
  app.use(errorHandler);
  
  // HTTP-Server erstellen
  const server = http.createServer(app);
  
  // WebSocket-Server einrichten
  const wss = new WebSocketServer({ server });
  
  // WebSocket-Verbindungen behandeln
  wss.on('connection', (ws, req) => handleConnection(ws, req));
  
  return server;
}