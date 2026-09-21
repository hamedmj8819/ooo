import { Router } from 'express';
import { db } from '../db/database';
import { generateId, logAudit, hashPassword } from '../db/helpers';
import { AppError } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/auth';
import type { SystemUser, UserRole } from '../../shared/types';

export const usersRouter = Router();

function mapUserRow(row: Record<string, unknown>): SystemUser {
  return {
    id: String(row.id),
    username: String(row.username),
    fullName: String(row.full_name),
    role: row.role as UserRole,
    department: String(row.department || ''),
    personnelCode: String(row.personnel_code || ''),
    phone: row.phone ? String(row.phone) : undefined,
    isActive: Boolean(row.is_active),
    lastLogin: row.last_login ? String(row.last_login) : undefined,
    mustChangePassword: Boolean(row.must_change_password),
    operatorId: row.operator_id ? String(row.operator_id) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// GET /api/v1/users
usersRouter.get('/', requirePermission('users:read'), (_req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all() as Record<string, unknown>[];
  res.json(rows.map(mapUserRow));
});

// POST /api/v1/users
usersRouter.post('/', requirePermission('users:create'), (req, res, next) => {
  try {
    const { username, password, fullName, role, department, personnelCode, phone, operatorId } = req.body;
    if (!username || !password || !fullName || !role) {
      throw new AppError(400, 'BAD_REQUEST', 'فیلدهای الزامی کاربر (نام کاربری، رمز عبور، نام کامل، نقش) را وارد کنید');
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      throw new AppError(400, 'DUPLICATE_USERNAME', 'نام کاربری از قبل در سامانه وجود دارد');
    }

    const id = generateId('USR');
    const now = new Date().toISOString();
    const hashedPassword = hashPassword(password);

    db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, role, department, personnel_code, phone, is_active, must_change_password, operator_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
    `).run(
      id,
      username,
      hashedPassword,
      fullName,
      role,
      department || '',
      personnelCode || '',
      phone || null,
      operatorId || null,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapUserRow(created);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'USER_CREATED',
      entityType: 'users',
      entityId: id,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip || req.socket.remoteAddress,
    });

    res.status(201).json(mapped);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/users/:id
usersRouter.put('/:id', requirePermission('users:update'), (req, res, next) => {
  try {
    const targetId = String(req.params.id);
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as Record<string, unknown> | undefined;
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'کاربر مورد نظر یافت نشد');
    }

    const { fullName, role, department, personnelCode, phone, isActive, password, operatorId } = req.body;

    // Safety rule: Cannot deactivate self
    if (isActive === false && req.user?.id === targetId) {
      throw new AppError(400, 'CANNOT_DEACTIVATE_SELF', 'شما نمی‌توانید حساب کاربری خودتان را غیرفعال کنید');
    }

    // Safety rule: Cannot deactivate last super_admin
    if (isActive === false && existing.role === 'super_admin') {
      const remainingAdminCount = db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'super_admin' AND is_active = 1 AND id != ?")
        .get(targetId) as { count: number };
      if (remainingAdminCount.count === 0) {
        throw new AppError(400, 'CANNOT_DEACTIVATE_LAST_SUPER_ADMIN', 'امکان غیرفعال‌سازی آخرین مدیر ارشد سامانه وجود ندارد');
      }
    }

    const now = new Date().toISOString();
    let newPasswordHash = existing.password_hash;
    let mustChangePassword = existing.must_change_password;
    if (password && String(password).trim().length > 0) {
      newPasswordHash = hashPassword(password);
      mustChangePassword = 1;
    }

    db.prepare(`
      UPDATE users SET
        full_name = COALESCE(?, full_name),
        role = COALESCE(?, role),
        department = COALESCE(?, department),
        personnel_code = COALESCE(?, personnel_code),
        phone = COALESCE(?, phone),
        is_active = COALESCE(?, is_active),
        operator_id = COALESCE(?, operator_id),
        password_hash = ?,
        must_change_password = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      fullName ?? null,
      role ?? null,
      department ?? null,
      personnelCode ?? null,
      phone ?? null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      operatorId !== undefined ? operatorId : null,
      newPasswordHash,
      mustChangePassword,
      now,
      targetId
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as Record<string, unknown>;
    const mapped = mapUserRow(updated);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'USER_UPDATED',
      entityType: 'users',
      entityId: targetId,
      oldValue: mapUserRow(existing) as unknown as Record<string, unknown>,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip || req.socket.remoteAddress,
    });

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/users/:id
usersRouter.delete('/:id', requirePermission('users:delete'), (req, res, next) => {
  try {
    const targetId = String(req.params.id);

    // Safety rule: Cannot delete self
    if (req.user?.id === targetId) {
      throw new AppError(400, 'CANNOT_DELETE_SELF', 'شما نمی‌توانید حساب کاربری خودتان را حذف کنید');
    }

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as Record<string, unknown> | undefined;
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'کاربر مورد نظر یافت نشد');
    }

    // Safety rule: Cannot delete last super_admin
    if (existing.role === 'super_admin') {
      const remainingAdminCount = db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'super_admin' AND is_active = 1 AND id != ?")
        .get(targetId) as { count: number };
      if (remainingAdminCount.count === 0) {
        throw new AppError(400, 'CANNOT_DELETE_LAST_SUPER_ADMIN', 'امکان حذف آخرین مدیر ارشد سامانه وجود ندارد');
      }
    }

    // Soft delete user to preserve audit log integrity
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?').run(now, targetId);
    // Invalidate sessions of this user
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(targetId);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'USER_DELETED_SOFT',
      entityType: 'users',
      entityId: targetId,
      oldValue: mapUserRow(existing) as unknown as Record<string, unknown>,
      newValue: { isActive: false },
      ipAddress: req.ip || req.socket.remoteAddress,
    });

    res.json({ message: 'کاربر با موفقیت غیرفعال شد', id: targetId });
  } catch (error) {
    next(error);
  }
});
