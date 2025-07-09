
# Chat-Komponente

Eine moderne, webbasierte Chat-Anwendung mit Echtzeit-Kommunikation, KI-Integration, Admin-Panel und Docker-Support.

## Features

- Echtzeit-Nachrichtenübertragung via WebSockets
- KI-gestützter Chat (Google Gemini)
- Multi-User-Gruppenchats
- Drag & Drop Chat-Oberfläche
- Admin-Panel zur Benutzerverwaltung
- Bereitstellung als Docker-Container

---

## Voraussetzungen

- **Node.js** ab Version 18.0.0
- **npm** ab Version 9.0.0
- **Docker** ab Version 20.10.0 (für Container-Deployment)
- **Git** für die Versionsverwaltung

---

## Quick Start

Die Funktionalitäten können, sofern eine Verbindung zum Server der DHBW mittels Cisco-VPN besteht, [hier](http://141.72.13.151:8300/) getestet werden.
Um die Komponente selbst zu integrieren:

### 1. Bereitstellen des Backends 

#### 1. Clone Repository
```bash
git clone https://github.com/Verteilte-Systeme-WWII23/Chat.git
```

#### 2. Install Dependencies
```bash
npm install
```

### 3. Environments & Secrets

```bash
touch .env
# Die File muss folgende Parameter beinhalten
GEMINI_API_KEY = <YOUR_API_KEY> 
ADMIN_PASSWORD = <YOUR_PASSWORD> (OPTIONAL)
PORT = <PORT> (OPTIONAL)
```
*_NOTE:_*  Ein GEMINI_API_KEY kann [hier](https://ai.google.dev/gemini-api/docs/api-key?hl=de) erhalten werden.

#### 3. Build Container
```bash
# Build Container
docker build -t chat-app .      
```

#### 4. Container auf dem Server starten
```bash
# Run Container
docker run -t -p 3000:3000 chat-app 
```
*_NOTE:_*  Die Docker-Befehle dienen als Beispiel und können natürlich angepasst werden.


### 2. Einbinden der Komponente in eigener Seite

#### 1.Module importieren

```html
<!-- Chat-Komponente einbinden -->
<script type="module" src="http://<SERVER_HOST>:<PORT>/components/chat/mein-chat.js"></script>
```
*_NOTE_* Ersetze <SERVER_HOST>:<PORT> durch die Adresse deines Servers

#### 2. Komponente im Body platzieren

```html
<mein-chat server-url="<SERVER_HOST>:<PORT>">
  <span slot="header-title">
    <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ac.svg" alt="Chat Icon" class="header-chat-icon" />
    <span>Mein DHBW Chat</span>
  </span>
</mein-chat>
```
*_NOTE_* Mittels Slot kann die Header-Zeile angepasst werden

#### 3. Kompontente anzeigen (z.B. mittels Button)

```html
<button id="open-chat-btn">Chat öffnen</button>
<script>
  document.getElementById("open-chat-btn").onclick = () => {
    document.querySelector("mein-chat").style.display = "block";
  };
</script>

```
*_NOTE_* Ein Slot für den Trigger-Button ist nicht vorgesehen, da Slots immer Teil der Komponente selbst sind. Da der Öffnen-Button jedoch nicht zur Chat-Komponente gehört und flexibel an verschiedenen Stellen der Seite eingebunden werden kann, muss dieser Button außerhalb der Komponente eigenständig erstellt und platziert werden.

#### 4. Contracts für Styling der Komponente

Um das Styling der Komponente an das der Webseite anzupassen müssen folgende Varibalen in der CSS der Hauptseite gesetzt werden.

```css
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    font-weight: inherit;
    font-style: inherit;
    color: var(--text);
    text-shadow: inherit;
    letter-spacing: inherit;
    text-transform: inherit;

    --surface: var(--surface, #ffffff);
    --border: var(--border, #e1e8ed);
    --text: var(--text, #2c3e50);
    --primary: var(--primary, #34db5b);
```
