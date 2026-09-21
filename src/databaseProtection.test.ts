import { describe, it, expect } from 'vitest';
import { DB_PATH } from '../server/db/database';
import fs from 'fs';
import path from 'path';

describe('Database Protection and Isolation Guard', () => {
  it('should guarantee that the test database path is in-memory and NOT a physical mes.db', () => {
    expect(DB_PATH).toBe(':memory:');
  });

  it('should guarantee that data/mes.db does not get created or modified during tests', () => {
    const dataDir = path.resolve(process.cwd(), 'data');
    const mesDbPath = path.join(dataDir, 'mes.db');
    
    if (fs.existsSync(mesDbPath)) {
      const stats = fs.statSync(mesDbPath);
      const diffMs = Date.now() - stats.mtimeMs;
      // It must not have been modified in the last 10 seconds of tests running
      expect(diffMs).toBeGreaterThan(10000);
    } else {
      // If it doesn't exist, that is perfect!
      expect(fs.existsSync(mesDbPath)).toBe(false);
    }
  });
});
