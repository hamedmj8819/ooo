import { startServer } from './server/index';

startServer().catch((err) => {
  console.error('[Fatal Error] Failed to start MES server:', err);
  process.exit(1);
});
