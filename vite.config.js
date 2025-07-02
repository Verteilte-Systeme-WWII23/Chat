import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'src/integration/integration.setup.js',
        'src/integration/setup.js',
        'src/integration/test-mocks.js',
        'vitest.setup.js',
        '**/node_modules/**',
        '**/*.test.js',
        '**/*.spec.js',
        '**/*.config.js'
      ]
    },
    deps: {
      optimizer: {
        ssr: {
          include: ['ws']
        }
      }
    },
    testTimeout: 30000,
    
    // globalSetup statt environmentMatchGlobs verwenden
    globalSetup: './src/integration/integration.setup.js'
  },
  server: {
    port: 3000
  }
});