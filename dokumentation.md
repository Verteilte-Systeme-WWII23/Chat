# Chat Tool – Ausführliche Dokumentation

## Übersicht

Dieses Projekt ist eine moderne, webbasierte Echtzeit-Chat-Anwendung, die für den Einsatz in verteilten Systemen konzipiert wurde. Sie unterstützt Einzel- und Gruppenchats, KI-Integration, Admin-Funktionen, speichert Nachrichten serverseitig im Speicher und erlaubt eine intuitive Nutzung über eine Drag-and-Drop-fähige Oberfläche im Browser.

---

## Dateistruktur

```
src/
├── chatManager.js
├── userManager.js
├── wsHandlers.js
├── ai.js
├── server.js
├── createServer.js
├── integration/
│   ├── ai-chat.test.js
│   ├── api.test.js
│   ├── chat-system.test.js
│   ├── websocket.test.js
│   └── setup.js
├── Dockerfile
├── .dockerignore
├── .github/
│   └── workflows/
│       ├── runTests.yml
│       └── build_and_push.yml
└── public/
    ├── index.html
    ├── mein-chat.js
    ├── chat-styles.css
    ├── admin.html
    ├── admin.js
    └── admin.css
```

Alle Dateien sind für den vollständigen Betrieb der Anwendung notwendig. Nachfolgend werden sie detailliert erklärt.

---

## 1. Frontend

### `src/public/index.html`

**Funktion:**  
Der Einstiegspunkt der Anwendung und die zentrale HTML-Datei.

**Wichtige Ausschnitte:**
- Bindet das Web Component `<mein-chat>` als Chat-Oberfläche ein.
- Ein "Chat öffnen"-Button zeigt die Chat-Komponente an.
- Enthält kleine Beschreibung und Footer.

**Zusammenspiel:**  
Lädt `mein-chat.js` und zeigt das Chat-Element erst nach Klick auf "Chat öffnen" an.

---

### `src/public/mein-chat.js`

**Funktion:**  
Implementiert das komplette Chat-UI als Custom Web Component (Shadow DOM). Steuert Darstellung, Interaktion und Kommunikation mit dem Backend via WebSocket.

**Kernaufgaben:**
- **UI Rendering:** Baut dynamisch alle UI-Elemente (Login, Sidebar, Chatliste, Nachrichtenbereich, Eingabefeld, Header, Resizing, Drag & Drop) auf.
- **Event Handling:** Reagiert auf Useraktionen (Login, Nachricht senden, Chat erstellen/beitreten, Admin-Seite öffnen, Fenster verschieben und skalieren).
- **WebSocket-Kommunikation:** Baut Verbindung zum Server auf, verarbeitet Server-Events (Chats, Messages, Teilnehmer, Sperren etc.).
- **State Management:** Speichert Userdaten, aktive Chats, Teilnehmerlisten und UI-Zustand.
- **Drag & Resize:** Das Chatfenster kann per Maus beliebig platziert und in der Größe verändert werden.

**Zusammenspiel:**  
Kommuniziert ausschließlich mit dem Server via WebSocket. Die UI wird nach jedem relevanten Event automatisch aktualisiert.

---

### `src/public/chat-styles.css`

**Funktion:**  
Definiert das Aussehen der gesamten Chat-Komponente.  
(Einige Beispiele: Farben, Abstände, Scroll-Verhalten, Button-Styles, Responsive Design.)

**Zusammenspiel:**  
Wird automatisch durch `mein-chat.js` in das Shadow DOM geladen, sodass das Styling nur auf die Chat-Komponente wirkt und nicht auf andere Elemente der Seite.

---

### `src/public/admin.html` & `src/public/admin.js` & `src/public/admin.css`

**Funktion:**  
Admin-Panel für Benutzerverwaltung mit Funktionen zum Sperren/Entsperren von IP-Adressen und Benutzern.

**Kernaufgaben:**
- Übersicht über alle aktiven Benutzer
- IP-Banning und -Entsperrung
- Benutzer-Management und Moderation

**Zusammenspiel:**  
Separate Admin-Oberfläche, die über REST-API mit dem Backend kommuniziert.

---

## 2. Backend

### `src/server.js`

**Funktion:**  
Haupteinstiegspunkt der Anwendung. Startet Express-Server und WebSocket-Server.

**Zusammenspiel:**  
Orchestriert alle Backend-Komponenten und stellt HTTP- und WebSocket-Endpunkte bereit.

---

### `src/createServer.js`

**Funktion:**  
Konfigurierbare Server-Erstellungsfunktion für verschiedene Umgebungen (Development, Testing, Production).

**Zusammenspiel:**  
Wird von `server.js` und Tests verwendet, um Server-Instanzen zu erstellen.

---

### `src/chatManager.js`

**Funktion:**  
Verwaltet alle Chats und Nachrichten im Speicher (In-Memory) und stellt Funktionen bereit, um Chats zu erstellen, Teilnehmer zu verwalten und Nachrichten zu speichern und abzurufen.

**Hauptkomponenten:**
- **Chat-ID-Generator:** Erstellt eindeutige (fünfstellige, numerische) Chat-IDs.
- **Chat-Erstellung:** Neue leere Chats und AI-Chats können angelegt werden.
- **Beitreten zu Chats:** Teilnehmer können per Chat-ID beitreten.
- **Nachrichtenverwaltung:** Nachrichten werden je Chat gespeichert, mit Zeitstempel versehen und können abgerufen werden.
- **Chat-Übersichten:** Liefert alle Chats eines bestimmten Users, inkl. letzter Nachricht und Teilnehmer.

**Zusammenspiel:**  
Wird vom WebSocket-Server verwendet, um Anfragen aus dem Frontend zu beantworten.

---

### `src/userManager.js`

**Funktion:**  
Verwaltet alle Benutzerinformationen, IP-Banning und Zuordnung von User-IDs zu Namen.

**Hauptkomponenten:**
- Benutzerregistrierung und -verwaltung
- IP-Adress-Sperrung und -Entsperrung
- Session-Management

**Zusammenspiel:**  
Wird von `chatManager.js` und `wsHandlers.js` genutzt, um Benutzer zu authentifizieren und zu verwalten.

---

### `src/wsHandlers.js`

**Funktion:**  
Behandelt alle eingehenden WebSocket-Nachrichten und routet sie an die entsprechenden Manager-Module.

**Zusammenspiel:**  
Vermittelt zwischen WebSocket-Verbindungen und Backend-Logik (chatManager, userManager).

---

### `src/ai.js`

**Funktion:**  
KI-Integration für automatische Chatbot-Antworten in AI-Chats.

**Zusammenspiel:**  
Wird von `chatManager.js` verwendet, um KI-Antworten zu generieren.

---

## 3. Test-Infrastruktur

### Unit-Tests (`*.test.js`)

**Funktion:**  
Jedes Backend-Modul verfügt über entsprechende Unit-Tests, die einzelne Funktionen isoliert testen.

### Integration-Tests (`src/integration/`)

**Funktion:**  
Umfassende End-to-End-Tests, die das Zusammenspiel aller Komponenten testen:
- `ai-chat.test.js` - KI-Chat-Funktionalität
- `api.test.js` - REST-API-Endpunkte
- `chat-system.test.js` - Chat-System-Integration
- `websocket.test.js` - WebSocket-Kommunikation
- Setup-Dateien für Testumgebung

---

## 4. Deployment & CI/CD

### Docker (`Dockerfile`, `.dockerignore`)

**Funktion:**  
Container-Definition für einheitliches Deployment in verschiedenen Umgebungen.

### GitHub Actions (`.github/workflows/`)

**Funktion:**  
Automatisierte CI/CD-Pipeline mit Tests und Deployment:
- `runTests.yml` - Automatische Test-Ausführung
- `build_and_push.yml` - Build und Container-Deployment

---

## Zusammenspiel der Komponenten

1. **Start:**  
   `server.js` startet Express- und WebSocket-Server, `index.html` zeigt Chat-UI.

2. **Login:**  
   Nutzer gibt Namen ein, `userManager.js` verwaltet Registrierung und Session.

3. **Chat-Kommunikation:**  
   WebSocket-Nachrichten werden über `wsHandlers.js` an `chatManager.js` weitergeleitet.

4. **KI-Integration:**  
   AI-Chats nutzen `ai.js` für automatische Antworten.

5. **Administration:**  
   Admin-Panel kommuniziert über REST-API mit `userManager.js`.

---

## Hinweise zur Erweiterung

- **Persistenz:** Die aktuelle Implementierung speichert alle Daten im Speicher. Für produktiven Einsatz sollte eine Datenbank angebunden werden.
- **Sicherheit:** Authentifizierung, Rechteverwaltung und Moderation sind über `userManager.js` erweiterbar.
- **Features:** Dateiupload, Push-Benachrichtigungen, Emoji-Support etc. sind als Add-ons möglich.

---

## Fazit

Die Anwendung besteht aus einem klaren Zusammenspiel aus Frontend (UI, Benutzerinteraktion, WebSocket-Client), Backend (Chat-, Benutzer- und KI-Management), Admin-Tools und umfassender Test-Infrastruktur. Die Modularität ermöglicht eine einfache Wartung und Erweiterung.

---