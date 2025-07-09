
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
│ │ (Component)│  │    │ │  (Router)   │ │    │ │ (Optional)  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │        │        │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │    admin    │ │◄──►│ │ chatManager │ │◄──►│                 │
│ │    (Page)   │ │    │ │  (Logic)    │ │    │                 │
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
    WS->>UM: initializeNewUser(name, ip)
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
    
    Admin->>API: GET /admin/users
    API->>UM: getAllUsers()
    UM->>API: userList
    API->>Admin: JSON(users)
    
    Admin->>API: POST /admin/ban-ip
    API->>UM: banIP(ipAddress)
    UM->>API: success
    API->>Admin: 200 OK
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
        CM->>WS: messageStored(messageData)
        WS->>Sender: newMessage(aiMessage)
    end
```

### Benutzer-Authentifizierung und Session-Management

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant WS as wsHandlers
    participant CM as ConnectionManager
    participant UM as userManager
    participant ChatM as chatManager
    
    Note over UI,ChatM: Initial Connection
    UI->>WS: {type: "connection"}
    WS->>CM: getClientIP(req)
    CM->>UM: addUser(ws, ip)
    UM->>CM: userId
    CM->>ChatM: createAIChatForUser(userId)
    CM->>UI: {type: "welcome", userId, name: null}
    
    Note over UI,ChatM: Set Username
    UI->>WS: {type: "setName", name: "username"}
    WS->>CM: executeCommand(handler, "setName", data)
    CM->>UM: setUserName(userId, name)
    UM->>CM: success/error
    CM->>UI: confirmation/error
    
    Note over UI,ChatM: Reconnection Flow
    UI->>WS: {type: "reconnect", userId}
    WS->>CM: handleReconnect(ws, data)
    CM->>UM: getUser(userId)
    alt User Exists
        UM->>CM: user object
        CM->>UM: updateUserWS(userId, ws)
        CM->>UI: {type: "welcome", userId, name}
    else User Not Found
        CM->>UI: null (fallback to new user)
    end
```


## Deployment-Architektur

### CI/CD-Pipeline-Flow

![alt text](image.png)
---