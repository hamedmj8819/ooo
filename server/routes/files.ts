import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db } from '../db/database';
import { AppError } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/auth';

export const filesRouter = express.Router();

const storageDir = path.join(process.cwd(), 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.dwg', '.dxf', '.step', '.stp', '.png', '.jpg', '.jpeg', '.webp'];
    if (!allowedExts.includes(ext)) {
      return cb(new AppError(400, 'INVALID_FILE_TYPE', 'فرمت فایل مجاز نیست (فقط PDF, DWG, DXF, STEP, STP, PNG, JPG, WEBP)'));
    }
    // Prohibit executable extensions
    const prohibitedExts = ['.exe', '.bat', '.sh', '.js', '.cmd', '.php', '.py', '.html', '.htm'];
    if (prohibitedExts.includes(ext)) {
      return cb(new AppError(400, 'FORBIDDEN_FILE_TYPE', 'آپلود فایل‌های اجرایی ممنوع است'));
    }
    cb(null, true);
  },
});

// Helper for magic bytes verification
function verifyMagicBytes(buffer: Buffer, ext: string): boolean {
  if (ext === '.pdf') {
    return buffer.length >= 4 && buffer.toString('ascii', 0, 4) === '%PDF';
  }
  if (ext === '.png') {
    return buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (ext === '.webp') {
    return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  }
  // For STEP, STP, DWG, DXF, basic check: verify no executable signatures (like MZ or script tags)
  const header = buffer.toString('ascii', 0, Math.min(buffer.length, 100)).toLowerCase();
  if (header.includes('<script') || header.includes('<?php') || (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a)) {
    return false;
  }
  return true;
}

// POST /api/v1/files/upload
filesRouter.post('/upload', requirePermission('orders:read'), upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError(400, 'NO_FILE_PROVIDED', 'هیچ فایلی ارسال نشده است'));
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();
    const size = file.size;

    // Size limits by category
    const isImage = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    const isPdf = ext === '.pdf';
    const isCad = ['.dwg', '.dxf', '.step', '.stp'].includes(ext);

    if (isImage && size > 10 * 1024 * 1024) {
      return next(new AppError(400, 'FILE_TOO_LARGE', 'حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد'));
    }
    if (isPdf && size > 50 * 1024 * 1024) {
      return next(new AppError(400, 'FILE_TOO_LARGE', 'حجم فایل PDF نباید بیشتر از ۵۰ مگابایت باشد'));
    }
    if (isCad && size > 200 * 1024 * 1024) {
      return next(new AppError(400, 'FILE_TOO_LARGE', 'حجم فایل CAD/STEP نباید بیشتر از ۲۰۰ مگابایت باشد'));
    }

    // Verify magic bytes
    if (!verifyMagicBytes(file.buffer, ext)) {
      return next(new AppError(400, 'INVALID_MAGIC_BYTES', 'محتوای فایل با پسوند آن مطابقت ندارد یا نامعتبر است'));
    }

    // Compute SHA256
    const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Generate unique storage name and path
    const fileId = `FILE-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const storedFileName = `${fileId}${ext}`;
    const storageFilePath = path.join(storageDir, storedFileName);

    fs.writeFileSync(storageFilePath, file.buffer);

    const now = new Date().toISOString();
    const category = req.body.category || (isImage ? 'image' : isPdf ? 'pdf' : 'cad');
    const entityType = req.body.entityType || null;
    const entityId = req.body.entityId || null;
    const uploadedBy = req.user?.fullName || req.user?.username || 'سیستم';

    db.prepare(`
      INSERT INTO files (id, file_name, file_type, file_size, mime_type, storage_path, category, entity_type, entity_id, uploaded_by, sha256, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fileId,
      file.originalname,
      ext.replace('.', ''),
      size,
      file.mimetype || 'application/octet-stream',
      storageFilePath,
      category,
      entityType,
      entityId,
      uploadedBy,
      sha256,
      now,
      now
    );

    res.json({
      id: fileId,
      fileName: file.originalname,
      fileSize: size,
      mimeType: file.mimetype,
      sha256,
      category,
      createdAt: now,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/files/:id (Secure Download)
filesRouter.get('/:id', requirePermission('orders:read'), (req, res, next) => {
  try {
    const fileId = String(req.params.id);
    const fileRow = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId) as Record<string, unknown> | undefined;

    if (!fileRow) {
      return next(new AppError(404, 'FILE_NOT_FOUND', 'فایل مورد نظر یافت نشد'));
    }

    const storagePath = String(fileRow.storage_path);
    const resolvedPath = path.resolve(storagePath);

    // Prevent path traversal
    if (!resolvedPath.startsWith(path.resolve(storageDir))) {
      return next(new AppError(403, 'ACCESS_DENIED', 'دسترسی غیرمجاز به فایل'));
    }

    if (!fs.existsSync(resolvedPath)) {
      return next(new AppError(404, 'FILE_NOT_ON_DISK', 'فایل روی دیسک سرور موجود نمی‌باشد'));
    }

    const fileName = String(fileRow.file_name);
    const mimeType = String(fileRow.mime_type || 'application/octet-stream');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.sendFile(resolvedPath);
  } catch (error) {
    next(error);
  }
});
