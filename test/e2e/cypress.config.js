import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    experimentalRunAllSpecs: true,
    includeShadowDom: true,
    specPattern: 'test/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'test/e2e/cypress/support/e2e.js',
    testTimeout: 60000,
    defaultCommandTimeout: 10000,
    viewportWidth: 1280,
    viewportHeight: 800
  },
});