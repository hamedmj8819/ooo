-- 001_initial_schema.sql
-- Initial database schema for MES Compressor Factory

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  personnel_code TEXT NOT NULL,
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Models table (Compressor Models)
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'screw',
  capacity_m3_min REAL NOT NULL DEFAULT 0,
  working_pressure_bar REAL NOT NULL DEFAULT 0,
  motor_power_kw REAL NOT NULL DEFAULT 0,
  cooling_type TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image TEXT,
  image_url TEXT,
  parts_count INTEGER NOT NULL DEFAULT 0,
  in_house_ratio REAL NOT NULL DEFAULT 80,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. Parts table
CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  part_number TEXT NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  machine_model_id TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'manufactured',
  material TEXT NOT NULL DEFAULT '',
  raw_weight_kg REAL NOT NULL DEFAULT 0,
  finished_weight_kg REAL NOT NULL DEFAULT 0,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER NOT NULL DEFAULT 0,
  default_drawing_name TEXT,
  default_step_file_name TEXT,
  supplier_name TEXT,
  notes TEXT,
  image TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 4. Part default manufacturing stages
CREATE TABLE IF NOT EXISTS part_stages (
  id TEXT PRIMARY KEY,
  part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  default_machine_category_id TEXT NOT NULL DEFAULT 'cnc_lathe',
  estimated_minutes INTEGER NOT NULL DEFAULT 60,
  required_drawing_type TEXT NOT NULL DEFAULT '2D Drawing + STEP',
  is_outsourced INTEGER NOT NULL DEFAULT 0,
  qc_checkpoints TEXT NOT NULL DEFAULT '[]',
  pdf_drawing_file_name TEXT,
  step_file_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(part_id, stage_number)
);

-- 5. Machines table
CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'internal',
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  current_work_order_id TEXT,
  current_part_name TEXT,
  current_stage_name TEXT,
  current_operator_id TEXT,
  current_operator_name TEXT,
  breakdown_reason TEXT,
  breakdown_reported_at TEXT,
  location TEXT NOT NULL DEFAULT 'سالن ماشین‌کاری',
  specifications TEXT NOT NULL DEFAULT '',
  last_maintenance_date TEXT NOT NULL,
  health_percent REAL NOT NULL DEFAULT 100,
  image TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 6. Operators table
CREATE TABLE IF NOT EXISTS operators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  personnel_code TEXT NOT NULL UNIQUE,
  specialty TEXT NOT NULL,
  assigned_machine_id TEXT REFERENCES machines(id) ON DELETE SET NULL,
  current_work_order_id TEXT,
  current_stage_name TEXT,
  shift TEXT NOT NULL DEFAULT 'morning',
  total_parts_produced_today INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'idle',
  image TEXT,
  image_url TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 7. Foundries & Suppliers table
CREATE TABLE IF NOT EXISTS foundries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  manager TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  capabilities TEXT NOT NULL DEFAULT '[]',
  quality_rating REAL NOT NULL DEFAULT 5.0,
  active_orders_count INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  image_url TEXT,
  logo_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 8. Production Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  is_custom_order INTEGER NOT NULL DEFAULT 0,
  custom_details TEXT,
  compressor_model_id TEXT REFERENCES models(id) ON DELETE SET NULL,
  compressor_model_name TEXT,
  part_id TEXT REFERENCES parts(id) ON DELETE SET NULL,
  part_name TEXT NOT NULL,
  part_number TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'normal',
  deadline_date TEXT NOT NULL,
  created_date TEXT NOT NULL,
  created_by_role TEXT NOT NULL DEFAULT 'ceo',
  created_by_name TEXT NOT NULL DEFAULT 'مدیرعامل',
  status TEXT NOT NULL DEFAULT 'pending_planning',
  completion_percentage REAL NOT NULL DEFAULT 0,
  delivered_to_warehouse_qty INTEGER DEFAULT 0,
  is_delivered_semi_finished INTEGER DEFAULT 0,
  warehouse_receipt_number TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 9. Order Stages execution table
CREATE TABLE IF NOT EXISTS order_stages (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  machine_tool_id TEXT REFERENCES machines(id) ON DELETE SET NULL,
  machine_tool_name TEXT,
  operator_id TEXT REFERENCES operators(id) ON DELETE SET NULL,
  operator_name TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  start_time TEXT,
  end_time TEXT,
  planned_qty INTEGER NOT NULL DEFAULT 1,
  produced_qty INTEGER NOT NULL DEFAULT 0,
  scrap_qty INTEGER NOT NULL DEFAULT 0,
  qc_approved INTEGER NOT NULL DEFAULT 0,
  qc_inspector_name TEXT,
  qc_notes TEXT,
  is_outsourced INTEGER NOT NULL DEFAULT 0,
  outsourced_vendor_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(order_id, stage_number)
);

-- 10. Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  supplier_type TEXT NOT NULL,
  amount_rials INTEGER NOT NULL DEFAULT 0,
  delivery_time_days INTEGER NOT NULL DEFAULT 1,
  date_submitted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_ceo',
  attachment_file_name TEXT,
  attachment_file_type TEXT,
  notes TEXT,
  rejection_reason TEXT,
  submitted_by TEXT NOT NULL DEFAULT 'واحد برنامه‌ریزی',
  decided_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 11. Engineering Documents table
CREATE TABLE IF NOT EXISTS engineering_docs (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  drawing_number TEXT NOT NULL,
  drawing_file_name TEXT,
  drawing_file_type TEXT DEFAULT 'pdf',
  step_file_name TEXT,
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT,
  uploaded_by_role TEXT,
  uploaded_by_name TEXT,
  is_approved INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  cad_preview_data TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(order_id, stage_number)
);

-- 12. QC Reports table
CREATE TABLE IF NOT EXISTS qc_reports (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  report_number TEXT NOT NULL,
  inspected_at TEXT NOT NULL,
  inspector_name TEXT NOT NULL,
  inspector_personnel_code TEXT,
  passed_qty INTEGER NOT NULL DEFAULT 0,
  rejected_qty INTEGER NOT NULL DEFAULT 0,
  conditional_qty INTEGER NOT NULL DEFAULT 0,
  decision TEXT NOT NULL DEFAULT 'approved',
  dimensional_check_passed INTEGER NOT NULL DEFAULT 1,
  surface_roughness_passed INTEGER NOT NULL DEFAULT 1,
  hardness_rockwell TEXT,
  roughness_ra TEXT,
  measured_tolerances TEXT,
  notes TEXT NOT NULL DEFAULT '',
  sheet_file_name TEXT NOT NULL DEFAULT 'QC-Report.pdf',
  sheet_file_size TEXT,
  sheet_uploaded_at TEXT,
  engineering_approval TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(order_id, stage_number)
);

-- 13. Warehouse Items table
CREATE TABLE IF NOT EXISTS warehouse_items (
  id TEXT PRIMARY KEY,
  part_number TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'عدد',
  shelf_location TEXT NOT NULL DEFAULT 'A-01',
  min_threshold INTEGER NOT NULL DEFAULT 0,
  last_updated TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 14. Stock Movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES warehouse_items(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reference_number TEXT,
  notes TEXT,
  performed_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 15. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  target_roles TEXT NOT NULL, -- JSON array
  is_read INTEGER NOT NULL DEFAULT 0,
  link_order_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 16. Files metadata table
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  category TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  uploaded_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 17. Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 18. Counters table for sequential numbers
CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY,
  prefix TEXT NOT NULL DEFAULT '',
  current_value INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

-- Indexes for performance and foreign keys
CREATE INDEX IF NOT EXISTS idx_parts_model ON parts(machine_model_id);
CREATE INDEX IF NOT EXISTS idx_part_stages_part ON part_stages(part_id);
CREATE INDEX IF NOT EXISTS idx_order_stages_order ON order_stages(order_id);
CREATE INDEX IF NOT EXISTS idx_quotes_order ON quotes(order_id);
CREATE INDEX IF NOT EXISTS idx_eng_docs_order ON engineering_docs(order_id);
CREATE INDEX IF NOT EXISTS idx_qc_reports_order ON qc_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_model ON orders(compressor_model_id);
CREATE INDEX IF NOT EXISTS idx_orders_part ON orders(part_id);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
