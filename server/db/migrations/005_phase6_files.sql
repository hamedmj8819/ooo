-- 005_phase6_files.sql
-- Phase 6: Real file upload, revisions, approval separation, file_id references

-- 1. Add sha256 to files if not present
-- Note: sqlite handles columns gracefully
ALTER TABLE files ADD COLUMN sha256 TEXT;

-- 2. Enhance engineering_docs for revisions and file references
ALTER TABLE engineering_docs ADD COLUMN drawing_file_id TEXT REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE engineering_docs ADD COLUMN step_file_id TEXT REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE engineering_docs ADD COLUMN revision TEXT NOT NULL DEFAULT 'A';
ALTER TABLE engineering_docs ADD COLUMN approver_id TEXT;
ALTER TABLE engineering_docs ADD COLUMN approver_name TEXT;
ALTER TABLE engineering_docs ADD COLUMN approver_role TEXT;
ALTER TABLE engineering_docs ADD COLUMN approved_at TEXT;

-- 3. Add file_id to qc_reports
ALTER TABLE qc_reports ADD COLUMN sheet_file_id TEXT REFERENCES files(id) ON DELETE SET NULL;

-- 4. Add file_id to quotes
ALTER TABLE quotes ADD COLUMN attachment_file_id TEXT REFERENCES files(id) ON DELETE SET NULL;

-- 5. Add image_file_id to entity tables for real file images instead of base64
ALTER TABLE models ADD COLUMN image_file_id TEXT REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE parts ADD COLUMN image_file_id TEXT REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE machines ADD COLUMN image_file_id TEXT REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE operators ADD COLUMN image_file_id TEXT REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE foundries ADD COLUMN image_file_id TEXT REFERENCES files(id) ON DELETE SET NULL;
