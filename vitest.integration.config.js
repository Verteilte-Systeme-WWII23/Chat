import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/integration/integration.setup.js'],
    testTimeout: 60000,
    include: ['src/integration/**/*.test.js'],
    deps: {
      optimizer: {
        ssr: {
          include: ['ws']
        }
      }
    },
    // Verwende projects statt environmentMatchGlobs
    projects: [
      {
        name: 'integration',
        testMatch: ['src/integration/**/*.test.js'],
        setupFiles: ['./src/integration/integration.setup.js']
      }
    ]
  },
  server: {
    port: 3000
  }
});