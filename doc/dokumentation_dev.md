# Chat Tool – Entwicklerdokumentation

# Übersicht & Zielsetzung

Diese Dokumentation richtet sich an Entwickler und erläutert die Architektur, Kommunikationsmuster und Sequenzabläufe der Chat-Anwendung. Sie dient dazu, das System verständlich zu machen, gezielt zu erweitern oder zu debuggen.  
**Ziel:** Es wird erklärt, wie die Komponenten miteinander kommunizieren, wie typische Abläufe und Sequenzen im Projekt aussehen und wie die technische Umsetzung strukturiert ist. Die Diagramme werden jeweils durch erläuternden Text ergänzt, um die Zusammenhänge und die Motivation hinter dem Design zu verdeutlichen.

---

## Systemarchitektur

Die folgende Dokumentation gibt einen schnellen Überblick über die beteiligten Komponenten, deren Zusammenspiel und die wichtigsten Abläufe.


### High-Level Architektur

Das nachfolgende Architekturdiagramm zeigt die wichtigsten Systembestandteile und deren Beziehungen. Die Anwendung ist in Frontend, Backend und optionale externe Dienste (z.B. KI-Service) unterteilt.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ mein-chat.js│ │◄──►│ │ wsHandlers  │ │    │ │ AI Service  │ │
│ │ (Component) │ │    │ │  (Router)   │ │    │ │ (Optional)  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │        │        │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │   admin     │ │◄──►│ │ chatManager │ │◄──►│                 │
│ │   (Page)    │ │    │ │  (Logic)    │ │    │                 │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
│                 │    │        │        │    │                 │
│                 │    │ ┌─────────────┐ │    │                 │
│                 │    │ │ userManager │ │    │                 │
│                 │    │ │   (Auth)    │ │    │                 │
│                 │    │ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Erläuterung:**  
Das Architekturdiagramm verdeutlicht die Aufteilung in Frontend, Backend und optionale externe Dienste.  
- Das **Frontend** besteht aus der Chat-Komponente (`mein-chat.js`) für die Nutzerinteraktion und einer optionalen Admin-Seite.
- Das **Backend** übernimmt die zentrale Logik:  
  - `wsHandlers` dient als WebSocket-Router für die Kommunikation mit Clients.  
  - `chatManager` verwaltet Chat-Räume und Nachrichten.  
  - `userManager` ist für Benutzerverwaltung und Authentifizierung zuständig.  
- Der **externe KI-Service** (z.B. Google Gemini) ermöglicht die Nutzung eines KI-gestützten Chats.

---

### Systemübersicht

| Komponente        | Verantwortlichkeit                        | Kommunikation                  |
|-------------------|-------------------------------------------|-------------------------------|
| **mein-chat.js**  | UI-Rendering, Event-Handling, WebSocket-Client | WebSocket zu wsHandlers        |
| **admin.js**      | Admin-Interface, Benutzerverwaltung       | REST-API zu Express            |
| **wsHandlers.js** | WebSocket-Message-Router                  | WebSocket ↔ Manager-Module     |
| **chatManager.js**| Chat-Logik, Nachrichten-Verwaltung        | In-Memory Storage              |
| **userManager.js**| Benutzer-Sessions, IP-Banning             | In-Memory Storage              |
| **ai.js**         | KI-Integration für Chatbots               | HTTP zu externen APIs          |

Diese Tabelle gibt einen Überblick über die wichtigsten Dateien und deren Aufgaben. Die Kommunikation erfolgt entweder über WebSockets (für Chat-Funktionalität) oder REST (für Admin-Funktionen).

---

## Kommunikationsmuster

Die folgenden Sequenzdiagramme zeigen die wichtigsten Kommunikationsabläufe zwischen den Komponenten. Sie helfen zu verstehen, wie Nachrichten, Benutzeraktionen und Admin-Operationen im System verarbeitet werden.  
**Hinweis:** Jedes Diagramm wird durch einen erklärenden Text begleitet, der die Abläufe und die Motivation hinter dem Design erläutert.

### 1. WebSocket-Kommunikation (Frontend ↔ Backend)

Dieses Diagramm beschreibt, wie ein Benutzer über die Chat-Komponente mit dem Backend kommuniziert. Die WebSocket-Verbindung ermöglicht Echtzeitübertragung von Nachrichten.

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

**Erläuterung:**  
- Nach dem Verbindungsaufbau wird ein neuer Benutzer initialisiert.
- Nachrichten werden über den `chatManager` verarbeitet und an alle Teilnehmer verteilt.
- Die Architektur ermöglicht eine klare Trennung zwischen Routing, Logik und Benutzerverwaltung.

---

### 2. REST-API-Kommunikation (Admin ↔ Backend)

Das folgende Diagramm zeigt, wie die Admin-Seite mit dem Backend interagiert, um Benutzer zu verwalten oder IPs zu sperren.

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

**Erläuterung:**  
- Die Admin-Oberfläche nutzt REST-Endpunkte, um Benutzerlisten abzurufen oder IP-Adressen zu sperren.
- Die Trennung von WebSocket- und REST-Kommunikation sorgt für eine klare Verantwortlichkeit im Backend.

---

## Sequenzdiagramme

Die folgenden Diagramme zeigen typische Abläufe im System, z.B. das Erstellen/Beitreten von Chats, die Nachrichtenübertragung und die Authentifizierung.  
**Jedes Diagramm wird durch einen erläuternden Text ergänzt, um die jeweiligen Abläufe und Designentscheidungen zu verdeutlichen.**

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

**Erläuterung:**  
- Ein Benutzer kann einen neuen Chat erstellen, der vom Backend verwaltet wird.
- Weitere Benutzer können dem Chat beitreten, wobei alle Teilnehmer informiert werden.

---

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

**Erläuterung:**  
- Nachrichten werden in Echtzeit an alle Teilnehmer verteilt.
- Bei KI-Chats wird nach dem Absenden automatisch eine Antwort vom KI-Service generiert und zurückgesendet.

---

### Benutzer-Authentifizierung

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

**Erläuterung:**  
- Die Authentifizierung erfolgt beim Verbindungsaufbau über die IP-Adresse.
- Benutzer können ihren Namen setzen und sich bei Verbindungsabbruch wieder anmelden.
- Das System erkennt, ob ein Benutzer bereits existiert, und stellt die Session ggf. wieder her.

---

## Deployment

### CI/CD-Pipeline-Flow

![alt text](image.png)

Das Deployment der Chat-Anwendung ist automatisiert und folgt dem in der Abbildung dargestellten CI/CD-Ansatz mittels GitHub-Actions.

1. **Automatisierte Tests:**  
   Bei jedem Push auf dem Main-Branch werden zuerst die Unit-Tests, dann die Integrationstests und anschließend die End-to-End-Tests (Cypress) ausgeführt. Dies stellt sicher, dass neue Änderungen keine bestehenden Funktionen brechen.

2. **Testabdeckung:**  
   Nach den Unit- und Integrationstests wird automatisch ein Coverage-Report erstellt und auf GitHub-Pages ([Link zum Coverage-Report](https://verteilte-systeme-wwii23.github.io/Chat/)) hochgeladen, um die Testabdeckung kontinuierlich zu überwachen.

3. **Containerisierung:**  
   Nach erfolgreichem Testlauf wird die Anwendung mit Docker gebaut. Das gebaute Docker-Image wird in ein Container-Registry (GitHub Container Registry) gepusht. Dadurch kann es einfach auf beliebigen Servern oder in der Cloud bereitgestellt werden.

4. **Bereitstellung:**  
   Das Image wird schließlich auf dem Zielserver (DHBW-Server) mittels eines Docker-Compose, bestehend aus dem Chat-App-Image und Watchtower bereitgestellt. Dabei wird ein Polling alle 60s für das neue Image durchgeführt.

---