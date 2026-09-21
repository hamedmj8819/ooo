import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { createDatabase } from './database';
import { runMigrations } from './migrator';
import { seedDatabase } from './seed';

if (process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: Cannot reset database in production mode!');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('آیا از بازنشانی (Reset) کامل دیتابیس کارخانه اطمینان دارید؟ تمامی داده‌ها حذف خواهند شد. (y/N): ', (answer) => {
  rl.close();
  const normalized = answer.trim().toLowerCase();
  if (normalized === 'y' || normalized === 'yes' || normalized === 'بله') {
    console.log('در حال بازنشانی دیتابیس...');
    
    const dbFile = path.resolve(process.cwd(), 'data', 'mes.db');
    const dbFileWal = path.resolve(process.cwd(), 'data', 'mes.db-wal');
    const dbFileShm = path.resolve(process.cwd(), 'data', 'mes.db-shm');

    try {
      if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
      if (fs.existsSync(dbFileWal)) fs.unlinkSync(dbFileWal);
      if (fs.existsSync(dbFileShm)) fs.unlinkSync(dbFileShm);
      console.log('فایل‌های دیتابیس قبلی با موفقیت حذف شدند.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('خطا در حذف فایل‌های دیتابیس:', msg);
    }

    try {
      const db = createDatabase();
      runMigrations(db);
      seedDatabase(db);
      console.log('دیتابیس با موفقیت بازسازی، ساختاردهی و سید اولیه شد.');
      db.close();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('خطا در بازسازی دیتابیس:', msg);
    }
  } else {
    console.log('بازنشانی دیتابیس لغو شد.');
  }
});
