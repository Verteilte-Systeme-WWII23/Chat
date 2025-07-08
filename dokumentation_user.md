
# Chat Tool - Deployment Guide

A modern, real-time web-based chat application with AI integration, built with Node.js, Express, WebSockets, and Docker.

## Features

- 🚀 Real-time messaging with WebSockets
- 🤖 AI chat integration
- 👥 Multi-user group chats
- 🎨 Drag & drop chat interface
- 🛡️ Admin panel with user management
- 🐳 Docker containerization
- ⚡ CI/CD pipeline with GitHub Actions

---

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** >= 20.10.0 (for containerized deployment)
- **Git** for version control

---

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd chat-tool
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Mode
```bash
# Start development server with hot reload
npm run dev

# Server runs on http://localhost:3000
```

### 4. Production Build
```bash
# Build frontend assets
npm run build

# Start production server
npm start
```

---

## Docker Deployment

### Build Docker Image
```bash
# Build image locally
docker build -t chat-tool .

# Run container
docker run -p 3000:3000 chat-tool
```

### Environment Variables
```bash
# Optional configuration
PORT=3000                    # Server port (default: 3000)
NODE_ENV=production         # Environment mode
AI_ENABLED=true            # Enable AI chat features
```

### Docker Compose
```yaml
version: '3.8'
services:
  chat-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

---

## CI/CD Pipeline

### Automated Deployment

The project includes automated CI/CD with GitHub Actions:

1. **Push to main branch** → Triggers automated build
2. **Create release tag** → Triggers production deployment
3. **Monitor deployment** via GitHub Actions logs

### Manual Commands
```bash
# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

---

## Deployment Environments

### Development
```bash
npm run dev
# Hot reload enabled
# Debug logging active
```

### Production
```bash
docker run -p 3000:3000 chat-tool
# Optimized build
# Container deployment
```

---

## Monitoring

### Application Logs
```bash
# Development
npm run dev  # Console output with detailed logs

# Production
docker logs <container-id>  # Container logs
```

### Health Checks
- **HTTP**: `GET /` returns 200 OK
- **WebSocket**: Connection test available

---

## Security Setup

### Production Configuration
- **IP Banning**: Built-in user management
- **HTTPS**: Configure reverse proxy (nginx/Apache)
- **Firewall**: Restrict access to port 3000

### Recommended Environment Variables
```bash
NODE_ENV=production
PORT=3000
AI_ENABLED=true
```

---

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
PORT=3001 npm start
```

**WebSocket connection failed:**
```bash
# Check firewall settings
# Verify WebSocket proxy configuration
```

**Build failures:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Docker build issues:**
```bash
# Clean Docker cache
docker system prune -a
docker build --no-cache -t chat-tool .
```

---

## Access Points

- **Main Application**: `http://localhost:3000`
- **Admin Panel**: `http://localhost:3000/admin.html`
- **WebSocket**: `ws://localhost:3000`

---

**Ready to deploy?** Run `npm install && npm run dev` and visit `http://localhost:3000`