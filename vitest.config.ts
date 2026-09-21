import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    env: {
      DATABASE_PATH: ':memory:',
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('.'),
      '@shared': path.resolve('./shared'),
    },
  },
});
