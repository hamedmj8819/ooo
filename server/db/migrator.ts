import fs from 'fs';
import path from 'path';
import type Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  // Ensure migrations tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);

  const candidates = [
    path.resolve(process.cwd(), 'server', 'db', 'migrations'),
    path.resolve(process.cwd(), 'dist', 'migrations'),
    path.resolve(process.cwd(), 'migrations'),
  ];
  const migrationsDir = candidates.find((dir) => fs.existsSync(dir));
  if (!migrationsDir) {
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const appliedRows = db.prepare('SELECT filename FROM _migrations').all() as { filename: string }[];
  const appliedSet = new Set(appliedRows.map((r) => r.filename));

  for (const file of files) {
    if (appliedSet.has(file)) {
      continue;
    }

    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');

    const migrateTx = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (filename, applied_at) VALUES (?, ?)').run(
        file,
        new Date().toISOString()
      );
    });

    migrateTx();
    console.log(`[DB Migration] Applied: ${file}`);
  }
}
