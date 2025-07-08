describe('Chat: User kann sich anmelden und AI-Nachricht senden', () => {
    it('User meldet sich an und schreibt an die AI', () => {
      cy.visit('http://localhost:3000/');
  
      // Chat öffnen
      cy.get('#open-chat-btn').click();
  
      // Login-Screen sollte sichtbar sein
      cy.get('mein-chat').shadow().find('#login-screen').should('be.visible');
  
      // Namen eingeben und anmelden
      cy.get('mein-chat').shadow().find('#name-input').type('Testuser');
      cy.get('mein-chat').shadow().find('#login-btn').click();
  
      // Hauptbereich sollte sichtbar sein
      cy.get('mein-chat').shadow().find('#main-container').should('be.visible');
  
      // Optional: Neuen Chat mit AI starten, falls nötig
      // cy.get('mein-chat').shadow().find('#new-empty-chat-btn').click();
  
      // Nachricht an die AI schreiben
      cy.get('mein-chat').shadow().find('#message-input').type('Hallo AI!');
      cy.get('mein-chat').shadow().find('#send-btn').click();
  
      // Nachricht sollte im Chat erscheinen
      cy.get('mein-chat').shadow().find('#chat-messages')
        .contains('Hallo AI!').should('exist');
  
      // Optional: Auf Antwort der AI warten und prüfen
      cy.get('mein-chat').shadow().find('#chat-messages')
        .contains(/AI|KI|Antwort/i, { timeout: 10000 }).should('exist');
    });
  });