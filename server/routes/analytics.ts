import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { getFullAnalyticsReport, generateAnalyticsCsv } from '../services/analyticsService';
import { requireAuth, requirePermission } from '../middleware/auth';

export const analyticsRouter = Router();

// GET /api/v1/analytics
analyticsRouter.get('/', requirePermission('orders:read'), (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '2020-01-01';
    const endDate = (req.query.endDate as string) || new Date().toISOString().slice(0, 10);

    const report = getFullAnalyticsReport(db, { startDate, endDate });
    res.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در محاسبه شاخص‌های تحلیلی';
    res.status(500).json({ code: 'ANALYTICS_ERROR', message });
  }
});

// GET /api/v1/analytics/export/csv
analyticsRouter.get('/export/csv', requirePermission('orders:read'), (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '2020-01-01';
    const endDate = (req.query.endDate as string) || new Date().toISOString().slice(0, 10);

    const report = getFullAnalyticsReport(db, { startDate, endDate });
    const csvContent = generateAnalyticsCsv(report);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="MES-CEO-Analytics-${endDate}.csv"`);
    res.status(200).send(csvContent);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در خروجی فایل CSV';
    res.status(500).json({ code: 'EXPORT_ERROR', message });
  }
});
