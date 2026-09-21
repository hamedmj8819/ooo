import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authenticate } from './middleware/auth';
import { authRouter } from './routes/auth';
import { modelsRouter } from './routes/models';
import { partsRouter } from './routes/parts';
import { machinesRouter } from './routes/machines';
import { operatorsRouter } from './routes/operators';
import { foundriesRouter } from './routes/foundries';
import { usersRouter } from './routes/users';
import { ordersRouter } from './routes/orders';
import { warehouseRouter } from './routes/warehouse';
import { notificationsRouter } from './routes/notifications';
import { backupRouter } from './routes/backup';
import { auditRouter } from './routes/audit';
import { filesRouter } from './routes/files';
import { analyticsRouter } from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(cookieParser());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Global authentication session resolver
  app.use(authenticate);

  // Health checks
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount Auth routes (login, logout, me, change-password)
  app.use('/api/v1/auth', authRouter);

  // Mount Core Resource API routes
  app.use('/api/v1/models', modelsRouter);
  app.use('/api/v1/parts', partsRouter);
  app.use('/api/v1/machines', machinesRouter);
  app.use('/api/v1/operators', operatorsRouter);
  app.use('/api/v1/foundries', foundriesRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/orders', ordersRouter);
  app.use('/api/v1/warehouse', warehouseRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/backup', backupRouter);
  app.use('/api/v1/audit-logs', auditRouter);
  app.use('/api/v1/files', filesRouter);
  app.use('/api/v1/analytics', analyticsRouter);

  // 404 for unhandled API routes
  app.all('/api/*all', (_req, res) => {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'مسیر API مورد نظر یافت نشد',
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
