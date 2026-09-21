import { describe, it, expect } from 'vitest';
import { toPersianDigits, getCurrentJalali } from './utils/persianDate';

describe('MES Smoke Tests & Base Sanity', () => {
  it('should correctly format Persian numbers and dates', () => {
    expect(toPersianDigits(12345)).toBe('۱۲۳۴۵');
    const today = getCurrentJalali();
    expect(today).toBeDefined();
    expect(today.formatted).toBeTruthy();
    expect(typeof today.formatted).toBe('string');
  });
});
