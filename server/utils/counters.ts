import type Database from 'better-sqlite3';
import { getCurrentJalaliYear, formatSequentialCode } from '../../shared/jalali';

export type CounterCodeType = 'ORD' | 'PO' | 'QC' | 'WR';

/**
 * Atomically generates next sequential code with Jalali year using SQLite counters table.
 * Example outputs: ORD-1405-0001, PO-1405-0001, QC-1405-0001, WR-1405-0001
 */
export function getNextJalaliCode(
  db: Database.Database,
  type: CounterCodeType,
  date: Date = new Date(),
  padDigits = 4
): string {
  const jalaliYear = getCurrentJalaliYear(date);
  const counterName = `${type}_${jalaliYear}`;
  const now = new Date().toISOString();

  // Atomically increment counter
  const upsertStmt = db.prepare(`
    INSERT INTO counters (name, prefix, current_value, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(name) DO UPDATE SET
      current_value = current_value + 1,
      updated_at = excluded.updated_at
  `);

  upsertStmt.run(counterName, `${type}-${jalaliYear}-`, now);

  const getStmt = db.prepare('SELECT current_value FROM counters WHERE name = ?');
  const row = getStmt.get(counterName) as { current_value: number } | undefined;
  const seq = row?.current_value || 1;

  return formatSequentialCode(type, jalaliYear, seq, padDigits);
}

export function generateOrderNumber(db: Database.Database, date?: Date): string {
  return getNextJalaliCode(db, 'ORD', date);
}

export function generatePONumber(db: Database.Database, date?: Date): string {
  return getNextJalaliCode(db, 'PO', date);
}

export function generateQCReportNumber(db: Database.Database, date?: Date): string {
  return getNextJalaliCode(db, 'QC', date);
}

export function generateWarehouseReceiptNumber(db: Database.Database, date?: Date): string {
  return getNextJalaliCode(db, 'WR', date);
}
