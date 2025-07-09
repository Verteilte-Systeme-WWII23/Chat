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


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const server = http.createServer(app);


const wss = new WebSocketServer({ server });
wss.on("connection", (ws, req) => handleConnection(ws, req));

// CORS 
app.use(cors({ origin: "*", credentials: true }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});


app.use(express.json());


app.use(express.static(path.join(__dirname, "../client")));


app.use("/admin", adminRoutes);


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/landing/landing.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/admin/admin.html"));
});



app.get("/demo", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/demo/index.html"));
});

app.get("/demo/portfolio", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/demo/portfolio/portfolio.html"));
});

app.get("/demo/ecommerce", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/demo/e-commerce/shop.html"));
});

app.get("/demo/education", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/demo/education/learning.html"));
});




// Error Handling Middleware
app.use(errorHandler);

// Start server if not in testing mode 
if (config.nodeEnv !== 'test') {
  server.listen(config.port, () => {
    console.log(`✅ Server läuft auf Port ${config.port}`);
  });
}

export default server;
