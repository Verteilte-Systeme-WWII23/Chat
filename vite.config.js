import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    deps: {
      inline: ['ws']
    },
    // Server-Tests benötigen manchmal mehr Zeit
    testTimeout: 10000
  },
  server: {
    port: 3000
  }
});