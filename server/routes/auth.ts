import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db/database';
import { verifyPassword, hashPassword, logAudit } from '../db/helpers';
import { validateBody } from '../middleware/validate';
import { LoginSchema, ChangePasswordSchema } from '../../shared/schemas';
import { AppError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import type { UserRole } from '../../shared/types';

export const authRouter = Router();

const SESSION_EXPIRY_DAYS = 30;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;

// POST /api/v1/auth/login
authRouter.post('/login', validateBody(LoginSchema), (req, res, next) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.get('user-agent') || 'Unknown';
    const now = new Date();
    const nowIso = now.toISOString();

    const userRow = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as Record<string, unknown> | undefined;

    if (!userRow) {
      logAudit(db, {
        userName: username,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'users',
        entityId: 'unknown',
        details: { reason: 'USER_NOT_FOUND', username },
        ipAddress,
      });
      throw new AppError(401, 'INVALID_CREDENTIALS', 'نام کاربری یا رمز عبور اشتباه است');
    }

    const userId = String(userRow.id);
    const userRole = userRow.role as UserRole;
    const isActive = Boolean(userRow.is_active);

    if (!isActive) {
      throw new AppError(403, 'ACCOUNT_DISABLED', 'حساب کاربری شما غیرفعال شده است');
    }

    // Check account lockout
    if (userRow.locked_until) {
      const lockedUntil = new Date(String(userRow.locked_until));
      if (lockedUntil > now) {
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
        logAudit(db, {
          userId,
          userName: username,
          userRole,
          action: 'AUTH_LOGIN_LOCKED_ATTEMPT',
          entityType: 'users',
          entityId: userId,
          details: { remainingMinutes },
          ipAddress,
        });
        throw new AppError(
          423,
          'ACCOUNT_LOCKED',
          `حساب کاربری شما به دلیل تلاش‌های ناموفق مکرر قفل است. لطفاً پس از ${remainingMinutes} دقیقه دیگر تلاش فرمایید`
        );
      }
    }

    // Verify Password
    const passwordHash = String(userRow.password_hash || '');
    const isPasswordValid = verifyPassword(password, passwordHash);

    if (!isPasswordValid) {
      const currentFailed = Number(userRow.failed_attempts || 0) + 1;
      let lockedUntilIso: string | null = null;

      if (currentFailed >= MAX_FAILED_ATTEMPTS) {
        const lockoutDate = new Date(now.getTime() + LOCKOUT_MINUTES * 60000);
        lockedUntilIso = lockoutDate.toISOString();
        db.prepare(
          'UPDATE users SET failed_attempts = 0, locked_until = ?, updated_at = ? WHERE id = ?'
        ).run(lockedUntilIso, nowIso, userId);

        logAudit(db, {
          userId,
          userName: username,
          userRole,
          action: 'AUTH_ACCOUNT_LOCKED',
          entityType: 'users',
          entityId: userId,
          details: { failedAttempts: currentFailed, lockoutMinutes: LOCKOUT_MINUTES },
          ipAddress,
        });

        throw new AppError(
          423,
          'ACCOUNT_LOCKED',
          `تعداد تلاش‌های ناموفق بیش از حد مجاز بود. حساب شما به مدت ${LOCKOUT_MINUTES} دقیقه قفل گردید`
        );
      } else {
        db.prepare('UPDATE users SET failed_attempts = ?, updated_at = ? WHERE id = ?').run(
          currentFailed,
          nowIso,
          userId
        );

        logAudit(db, {
          userId,
          userName: username,
          userRole,
          action: 'AUTH_LOGIN_FAILED',
          entityType: 'users',
          entityId: userId,
          details: { attemptNumber: currentFailed, remaining: MAX_FAILED_ATTEMPTS - currentFailed },
          ipAddress,
        });

        throw new AppError(
          401,
          'INVALID_CREDENTIALS',
          `نام کاربری یا رمز عبور اشتباه است (${MAX_FAILED_ATTEMPTS - currentFailed} تلاش باقی‌مانده)`
        );
      }
    }

    // Success: reset lockout and failed attempts
    const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const sessionId = crypto.randomUUID();

    const loginTx = db.transaction(() => {
      db.prepare(
        'UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login = ?, updated_at = ? WHERE id = ?'
      ).run(nowIso, nowIso, userId);

      db.prepare(`
        INSERT INTO sessions (id, user_id, role, ip_address, user_agent, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(sessionId, userId, userRole, ipAddress, userAgent, expiresAt, nowIso);
    });
    loginTx();

    // Set HTTP-only Cookie
    res.cookie('mes_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      secure: false, // compatible with offline LAN HTTP
    });

    logAudit(db, {
      userId,
      userName: username,
      userRole,
      action: 'AUTH_LOGIN_SUCCESS',
      entityType: 'users',
      entityId: userId,
      details: { sessionId: sessionId.slice(0, 8) + '...' },
      ipAddress,
    });

    res.json({
      user: {
        id: userId,
        username: String(userRow.username),
        fullName: String(userRow.full_name),
        role: userRole,
        department: String(userRow.department || ''),
        personnelCode: String(userRow.personnel_code || ''),
        phone: userRow.phone ? String(userRow.phone) : undefined,
        isActive,
        mustChangePassword: Boolean(userRow.must_change_password),
        operatorId: userRow.operator_id ? String(userRow.operator_id) : undefined,
      },
      sessionId,
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/logout
authRouter.post('/logout', (req, res, next) => {
  try {
    const sessionId = req.sessionId || req.cookies?.mes_session;
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (sessionId) {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    }

    if (req.user) {
      logAudit(db, {
        userId: req.user.id,
        userName: req.user.username,
        userRole: req.user.role,
        action: 'AUTH_LOGOUT',
        entityType: 'users',
        entityId: req.user.id,
        ipAddress,
      });
    }

    res.clearCookie('mes_session', { path: '/' });
    res.json({ message: 'با موفقیت از سامانه خارج شدید' });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/v1/auth/change-password
authRouter.post('/change-password', requireAuth, validateBody(ChangePasswordSchema), (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user!.id;
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const nowIso = new Date().toISOString();

    const userRow = db
      .prepare('SELECT password_hash FROM users WHERE id = ?')
      .get(userId) as { password_hash: string } | undefined;

    if (!userRow || !verifyPassword(oldPassword, userRow.password_hash)) {
      throw new AppError(400, 'INVALID_OLD_PASSWORD', 'رمز عبور فعلی نادرست است');
    }

    if (oldPassword === newPassword) {
      throw new AppError(400, 'PASSWORD_UNCHANGED', 'رمز عبور جدید نمی‌تواند مشابه رمز عبور فعلی باشد');
    }

    const newHash = hashPassword(newPassword);

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, must_change_password = 0, updated_at = ? 
      WHERE id = ?
    `).run(newHash, nowIso, userId);

    logAudit(db, {
      userId,
      userName: req.user!.username,
      userRole: req.user!.role,
      action: 'AUTH_PASSWORD_CHANGED',
      entityType: 'users',
      entityId: userId,
      ipAddress,
    });

    res.json({
      message: 'رمز عبور جدید با موفقیت ذخیره شد',
      mustChangePassword: false,
    });
  } catch (error) {
    next(error);
  }
});
