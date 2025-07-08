// Import commands.js using ES2015 syntax:
// import './commands'

// Unterstützung für Shadow DOM aktivieren
Cypress.ShadowDomSupport = true;

// Befehl zum Anmelden im Chat
Cypress.Commands.add('loginToChat', (username = 'Cypress-Tester') => {
  cy.visit('/');
  cy.get('#open-chat-btn').click();
  cy.get('mein-chat').shadow().find('#login-screen').should('be.visible');
  cy.get('mein-chat').shadow().find('#name-input').type(username);
  cy.get('mein-chat').shadow().find('#login-btn').click();
  cy.get('mein-chat').shadow().find('#main-container').should('be.visible');
});

// Befehl zum Senden einer Nachricht
Cypress.Commands.add('sendChatMessage', (message) => {
  cy.get('mein-chat').shadow().find('#message-input').type(message);
  cy.get('mein-chat').shadow().find('#send-btn').click();
});

// Optional: Eigene Hilfsfunktionen definieren
Cypress.Commands.add('login', (username = 'TestUser') => {
  cy.visit('/');
  cy.get('#open-chat-btn').click();
  cy.get('mein-chat').shadow().find('#username-input').type(username);
  cy.get('mein-chat').shadow().find('#login-button').click();
});