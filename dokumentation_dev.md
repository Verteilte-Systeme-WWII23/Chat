
# Chat Tool – Entwicklerdokumentation

## Übersicht

Diese Dokumentation beschreibt die Architektur, Kommunikationsmuster und Sequenzabläufe der Chat-Anwendung. Sie richtet sich an Entwickler, die das System verstehen, erweitern oder debuggen möchten.

---

## Systemarchitektur

### High-Level Architektur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ mein-chat.js│ │◄──►│ │ wsHandlers  │ │    │ │ AI Service  │ │
│ │  (UI/UX)    │ │    │ │  (Router)   │ │    │ │ (Optional)  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │        │        │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │ admin.js    │ │◄──►│ │ chatManager │ │◄──►│                 │
│ │ (Admin UI)  │ │    │ │  (Logic)    │ │    │                 │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
│                 │    │        │        │    │                 │
│                 │    │ ┌─────────────┐ │    │                 │
│                 │    │ │ userManager │ │    │                 │
│                 │    │ │ (Sessions)  │ │    │                 │
│                 │    │ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Komponentenübersicht

| Komponente | Verantwortlichkeit | Kommunikation |
|------------|-------------------|---------------|
| **mein-chat.js** | UI-Rendering, Event-Handling, WebSocket-Client | WebSocket zu wsHandlers |
| **admin.js** | Admin-Interface, Benutzerverwaltung | REST-API zu Express |
| **wsHandlers.js** | WebSocket-Message-Router | WebSocket ↔ Manager-Module |
| **chatManager.js** | Chat-Logik, Nachrichten-Verwaltung | In-Memory Storage |
| **userManager.js** | Benutzer-Sessions, IP-Banning | In-Memory Storage |
| **ai.js** | KI-Integration für Chatbots | HTTP zu externen APIs |

---

## Kommunikationsmuster

### 1. WebSocket-Kommunikation (Frontend ↔ Backend)

```mermaid
sequenceDiagram
    participant UI as mein-chat.js
    participant WS as wsHandlers.js
    participant CM as chatManager.js
    participant UM as userManager.js
    
    UI->>WS: connect()
    WS->>UM: registerUser(name, ip)
    UM->>WS: userId
    WS->>UI: welcome(userId)
    
    UI->>WS: sendMessage(chatId, message)
    WS->>CM: addMessage(chatId, userId, message)
    CM->>WS: messageAdded(messageData)
    WS->>UI: broadcast(newMessage)
```

### 2. REST-API-Kommunikation (Admin ↔ Backend)

```mermaid
sequenceDiagram
    participant Admin as admin.js
    participant API as Express Router
    participant UM as userManager.js
    
    Admin->>API: GET /api/users
    API->>UM: getAllUsers()
    UM->>API: userList
    API->>Admin: JSON(users)
    
    Admin->>API: POST /api/ban-ip
    API->>UM: banIP(ipAddress)
    UM->>API: success
    API->>Admin: 200 OK
```

### 3. Interne Modul-Kommunikation

```mermaid
graph TD
    A[wsHandlers.js] --> B[chatManager.js]
    A --> C[userManager.js]
    B --> D[ai.js]
    B --> C
    
    A --> E[WebSocket Clients]
    F[Express Routes] --> C
    F --> G[Static Files]
```

---

## Sequenzdiagramme

### Chat-Erstellung und Beitritt

```mermaid
sequenceDiagram
    participant U1 as User 1 (Creator)
    participant U2 as User 2 (Joiner)
    participant WS as wsHandlers
    participant CM as chatManager
    participant UM as userManager
    
    Note over U1,UM: Chat-Erstellung
    U1->>WS: createChat()
    WS->>UM: validateUser(userId)
    UM->>WS: valid
    WS->>CM: createNewChat(userId)
    CM->>WS: chatId(12345)
    WS->>U1: chatCreated(12345)
    
    Note over U2,UM: Chat-Beitritt
    U2->>WS: joinChat(12345)
    WS->>CM: addParticipant(12345, userId2)
    CM->>WS: participantAdded
    WS->>U1: newParticipant(user2)
    WS->>U2: joinedChat(12345)
```

### Nachrichtenübertragung

```mermaid
sequenceDiagram
    participant Sender as Sender UI
    participant Receiver as Receiver UI
    participant WS as wsHandlers
    participant CM as chatManager
    participant AI as ai.js
    
    Sender->>WS: sendMessage(chatId, "Hello")
    WS->>CM: addMessage(chatId, userId, "Hello")
    CM->>WS: messageStored(messageData)
    WS->>Receiver: newMessage(messageData)
    WS->>Sender: messageSent(confirmation)
    
    alt AI Chat detected
        CM->>AI: generateResponse("Hello")
        AI->>CM: "Hi there! How can I help?"
        CM->>WS: aiResponse(messageData)
        WS->>Sender: newMessage(aiMessage)
    end
```

### Benutzer-Authentifizierung und Session-Management

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant WS as wsHandlers
    participant UM as userManager
    participant CM as chatManager
    
    UI->>WS: login(username)
    WS->>UM: checkUserExists(username)
    UM->>WS: userExists/newUser
    
    alt New User
        WS->>UM: createUser(username, ip)
        UM->>WS: userId
    else Existing User
        WS->>UM: getUserId(username)
        UM->>WS: userId
    end
    
    WS->>CM: getUserChats(userId)
    CM->>WS: chatList
    WS->>UI: loginSuccess(userId, chatList)
```

---

## Datenstrukturen

### Chat-Datenmodell

```javascript
// In chatManager.js
const chatStructure = {
  chatId: "12345",
  participants: ["user1", "user2"],
  messages: [
    {
      id: "msg1",
      sender: "user1",
      content: "Hello World",
      timestamp: "2024-01-01T10:00:00Z",
      type: "text" // text, system, ai
    }
  ],
  isAiChat: false,
  createdAt: "2024-01-01T09:00:00Z"
}
```

### Benutzer-Datenmodell

```javascript
// In userManager.js
const userStructure = {
  userId: "user123",
  username: "JohnDoe",
  ipAddress: "192.168.1.1",
  joinedAt: "2024-01-01T09:00:00Z",
  isBanned: false,
  activeChats: ["12345", "67890"]
}
```

### WebSocket-Nachrichtenformat

```javascript
// Client → Server
const clientMessage = {
  type: "sendMessage", // createChat, joinChat, sendMessage
  payload: {
    chatId: "12345",
    content: "Hello",
    // ... weitere Daten
  }
}

// Server → Client
const serverMessage = {
  type: "newMessage", // chatCreated, userJoined, messageSent
  payload: {
    chatId: "12345",
    message: {
      sender: "user1",
      content: "Hello",
      timestamp: "2024-01-01T10:00:00Z"
    }
  }
}
```

---

## Event-Flow-Diagramme

### Frontend-Event-Handling

```mermaid
graph TD
    A[User Input] --> B{Event Type}
    B -->|Login| C[validateInput]
    B -->|Send Message| D[sendMessage]
    B -->|Create Chat| E[createChat]
    B -->|Join Chat| F[joinChat]
    
    C --> G[WebSocket.send]
    D --> G
    E --> G
    F --> G
    
    G --> H[Server Response]
    H --> I[updateUI]
    I --> J[renderChatList]
    I --> K[renderMessages]
    I --> L[showNotification]
```

### Backend-Message-Routing

```mermaid
graph TD
    A[WebSocket Message] --> B[wsHandlers.js]
    B --> C{Message Type}
    
    C -->|login| D[userManager.handleLogin]
    C -->|createChat| E[chatManager.createChat]
    C -->|joinChat| F[chatManager.joinChat]
    C -->|sendMessage| G[chatManager.addMessage]
    
    D --> H[broadcastToUser]
    E --> I[broadcastToChat]
    F --> I
    G --> J[broadcastToAllParticipants]
    
    J --> K[ai.js]
    K --> L[generateAIResponse]
    L --> I
```

---

## Testing-Strategien

### Unit-Test-Struktur

```javascript
// Beispiel: chatManager.test.js
describe('ChatManager', () => {
  describe('createChat', () => {
    it('should create chat with unique ID', () => {
      // Test Implementation
    });
    
    it('should add creator as participant', () => {
      // Test Implementation
    });
  });
});
```

### Integration-Test-Flow

```mermaid
graph TD
    A[Start Test Server] --> B[Create WebSocket Connection]
    B --> C[Simulate User Login]
    C --> D[Test Chat Creation]
    D --> E[Test Message Sending]
    E --> F[Verify AI Response]
    F --> G[Test Admin Functions]
    G --> H[Cleanup Test Data]
```
---

## Deployment-Architektur

### Container-Orchestrierung

```yaml
# docker-compose.yml Beispiel
version: '3.8'
services:
  chat-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### CI/CD-Pipeline-Flow

```mermaid
graph TD
    A[Git Push] --> B[GitHub Actions Trigger]
    B --> C[Install Dependencies]
    C --> D[Run Unit Tests]
    D --> E[Run Integration Tests]
    E --> F[Build Docker Image]
    F --> G[Push to Registry]
    G --> H[Deploy to Production]
    H --> I[Health Check]
    I --> J[Rollback if Failed]
```
---