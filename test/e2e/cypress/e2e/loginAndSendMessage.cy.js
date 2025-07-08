describe('Chat Komponente', () => {
  beforeEach(() => {
    // Startseite besuchen (jetzt test.html)
    cy.visit('/');
    cy.get('#open-chat-btn').should('be.visible');
  });

  it('User kann sich anmelden und eine Nachricht senden', () => {
    cy.get('#open-chat-btn').click();
    cy.get('mein-chat').should('be.visible');
    
    cy.get('mein-chat').shadow().within(() => {
      cy.get('#login-screen').should('be.visible');
      cy.get('#name-input').should('be.visible').type('Testuser');
      cy.get('#login-btn').click();
      
      cy.get('#main-container').should('be.visible', { timeout: 5000 });
      
      // Chat erstellen
      cy.get('#new-empty-chat-btn').should('be.visible').click();
      
      // Chat-Bereich sollte sichtbar sein
      cy.get('#chat-area').should('be.visible');
      
      // Auf das erste Chat-Element klicken
      cy.get('.chat-item').first().should('be.visible').click();

      // Nachricht eingeben und senden
      cy.get('#message-input')
        .should('be.visible')
        .type('Hallo, das ist ein Test!');
      
      cy.get('#send-btn').click();
      
      // Nachricht sollte im Chat erscheinen
      cy.get('#chat-messages')
        .should('contain', 'Hallo, das ist ein Test!');
      
      // Warten auf die Antwort (falls KI aktiviert ist)
      cy.get('#chat-messages div.received', { timeout: 10000 })
        .should('be.visible');
    });
  });
});