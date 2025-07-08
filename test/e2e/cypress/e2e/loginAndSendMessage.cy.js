describe('Chat Komponente', () => {
  beforeEach(() => {
    // Direkt die Landing-Page besuchen
    cy.visit('/pages/landing/landing.html');
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
      
      // Korrigierter Button-Name
      cy.get('#new-empty-chat-btn').should('be.visible').click();
      
      // Korrigierter Container-Name
      cy.get('#chat-area').should('be.visible');
      
      // Warten bis Chat-Items erscheinen und erstes anklicken
      cy.get('.chat-item').first().should('be.visible').click();

      cy.get('#message-input')
        .should('be.visible')
        .type('Hallo, das ist ein Test!');
      
      cy.get('#send-btn').click();
      
      cy.get('#chat-messages')
        .should('contain', 'Hallo, das ist ein Test!');
      
      cy.get('#chat-messages div.received', { timeout: 10000 })
        .should('be.visible');
    });
  });
});