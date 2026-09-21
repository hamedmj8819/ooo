import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const isTest = typeof process.env.VITEST !== 'undefined' || process.env.NODE_ENV === 'test';

let DB_PATH = process.env.DATABASE_PATH;

if (isTest && !DB_PATH) {
  DB_PATH = ':memory:';
} else if (!DB_PATH) {
  const DB_DIR = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  DB_PATH = path.join(DB_DIR, 'mes.db');
}

// Hard guard for tests
if (isTest) {
  const resolvedPath = path.resolve(DB_PATH);
  const baseName = path.basename(resolvedPath);
  const normalizedPath = resolvedPath.replace(/\\/g, '/');
  const isInDataDir = normalizedPath.includes('/data/') || normalizedPath.endsWith('/data');
  if (baseName === 'mes.db' || isInDataDir) {
    throw new Error('Refusing to run tests against a real database: ' + DB_PATH);
  }
}

export { DB_PATH };

export function createDatabase(dbPath = DB_PATH): Database.Database {
  const db = new Database(dbPath);
  if (dbPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  return db;
}

export const db = createDatabase();
