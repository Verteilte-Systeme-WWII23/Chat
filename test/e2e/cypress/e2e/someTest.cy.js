describe('Chat Komponente', () => {
  beforeEach(() => {
    // Vor jedem Test die Startseite besuchen
    cy.visit('/');
    // Warten bis die Seite vollständig geladen ist
    cy.get('#open-chat-btn').should('be.visible');
  });

  it('User kann sich anmelden und eine Nachricht senden', () => {
    // Chat-Button klicken
    cy.get('#open-chat-btn').click();
    
    // Überprüfen, ob die Chat-Komponente sichtbar ist
    cy.get('mein-chat').should('be.visible');
    
    // Zugriff auf Shadow DOM
    cy.get('mein-chat').shadow().within(() => {
      // Prüfen, ob der Login-Screen angezeigt wird
      cy.get('#login-screen').should('be.visible');
      
      // Benutzer-Namen eingeben
      cy.get('#name-input').should('be.visible').type('Testuser');
      
      // Login-Button klicken
      cy.get('#login-btn').click();
      
      // Hauptcontainer sollte nach erfolgreichem Login sichtbar sein
      cy.get('#main-container').should('be.visible', { timeout: 5000 });
      
      // Neuen Chat erstellen
      cy.get('#new-chat-btn').should('be.visible').click();
      
      // Warten bis der Chat geladen ist
      cy.get('#chat-container').should('be.visible');
      
      // Nachricht eingeben und senden
      cy.get('#message-input')
        .should('be.visible')
        .type('Hallo, das ist ein Test!');
      
      cy.get('#send-btn').click();
      
      // Prüfen, ob die Nachricht im Chat angezeigt wird
      cy.get('#chat-messages')
        .should('contain', 'Hallo, das ist ein Test!');
      
      // Auf AI-Antwort warten (längeres Timeout, da die AI Zeit benötigt)
      cy.get('#chat-messages .message-item.ai', { timeout: 10000 })
        .should('be.visible');
    });
  });
});