import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApp } from './app';
import { db } from './db/database';
import { runMigrations } from './db/migrator';
import { seedDatabase } from './db/seed';

export async function startServer(): Promise<void> {
  // 1. Run migrations and seed
  console.log('[MES Server] Initializing SQLite database...');
  runMigrations(db);
  seedDatabase(db);

  // 2. Create Express app
  const app = createApp();
  const PORT = 3000;

  // 3. Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[MES Server] Mounting Vite dev middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MES Server] Server running on http://0.0.0.0:${PORT}`);
  });
}
