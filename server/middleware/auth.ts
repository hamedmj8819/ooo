import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { AppError } from './errorHandler';
import { hasPermission, Permission } from '../../shared/permissions';
import type { UserRole } from '../../shared/types';

export interface AuthenticatedUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  department: string;
  personnelCode: string;
  phone?: string;
  isActive: boolean;
  mustChangePassword: boolean;
  operatorId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const sessionCookie = req.cookies?.mes_session;
    const authHeader = req.headers.authorization;
    let sessionId: string | undefined = sessionCookie;

    if (!sessionId && authHeader && authHeader.startsWith('Bearer ')) {
      sessionId = authHeader.slice(7).trim();
    }

    if (!sessionId) {
      return next();
    }

    const now = new Date().toISOString();
    const sessionRow = db
      .prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?')
      .get(sessionId, now) as { id: string; user_id: string; role: string } | undefined;

    if (!sessionRow) {
      return next();
    }

    const userRow = db
      .prepare(
        'SELECT id, username, full_name, role, department, personnel_code, phone, is_active, must_change_password, operator_id FROM users WHERE id = ?'
      )
      .get(sessionRow.user_id) as Record<string, unknown> | undefined;

    if (!userRow || !userRow.is_active) {
      // Invalidate stale session
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
      return next();
    }

    req.sessionId = sessionId;
    req.user = {
      id: String(userRow.id),
      username: String(userRow.username),
      fullName: String(userRow.full_name),
      role: userRow.role as UserRole,
      department: String(userRow.department || ''),
      personnelCode: String(userRow.personnel_code || ''),
      phone: userRow.phone ? String(userRow.phone) : undefined,
      isActive: Boolean(userRow.is_active),
      mustChangePassword: Boolean(userRow.must_change_password),
      operatorId: userRow.operator_id ? String(userRow.operator_id) : undefined,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'احراز هویت انجام نشده است؛ لطفاً وارد سامانه شوید');
  }
  next();
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'احراز هویت انجام نشده است؛ لطفاً وارد سامانه شوید');
    }

    // If password change required, prevent access to business endpoints
    if (
      req.user.mustChangePassword &&
      !req.path.includes('/auth/change-password') &&
      !req.path.includes('/auth/logout') &&
      !req.path.includes('/auth/me')
    ) {
      throw new AppError(
        403,
        'PASSWORD_CHANGE_REQUIRED',
        'تغییر رمز عبور در اولین ورود اجباری است. لطفاً ابتدا رمز عبور جدید ثبت کنید'
      );
    }

    if (!hasPermission(req.user.role, permission)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        `نقش ${req.user.role} دسترسی لازم برای عملیات "${permission}" را ندارد`
      );
    }

    next();
  };
}
