/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApp } from '../app';
import { db } from '../db/database';
import { runMigrations } from '../db/migrator';
import { seedDatabase } from '../db/seed';
import { hashPassword } from '../db/helpers';

export function createTestApp() {
  // Clear all existing tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
  
  db.exec('PRAGMA foreign_keys = OFF');
  for (const table of tables) {
    db.exec(`DROP TABLE IF EXISTS "${table.name}"`);
  }
  db.exec('PRAGMA foreign_keys = ON');

  // Run migrations
  runMigrations(db);

  // Seed standard database
  seedDatabase(db);

  // Overwrite passwords for all users to '123' for test suite compatibility
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, failed_attempts = 0, locked_until = NULL').run(hashPassword('123'));

  const app = createApp();
  return app;
}
