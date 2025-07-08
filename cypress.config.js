import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'test/endToEnd/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: false,
    pageLoadTimeout: 10000, // 2 Minuten
    defaultCommandTimeout: 10000, 
    testTimeout: 60000,
  },
});