import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup/vitest.setup.js'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'src/public/**',
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
    }
  },
  server: {
    port: 3000
  }
});