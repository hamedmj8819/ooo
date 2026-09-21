-- 004_phase4_machines_operators_timing.sql
-- Phase 4: Machine, Operator, Real Time Tracking & Downtime Events

-- 1. Stage Events table for real-time tracking
CREATE TABLE IF NOT EXISTS stage_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- 'assigned', 'started', 'paused', 'resumed', 'completed', 'transferred', 'rework_assigned'
  timestamp TEXT NOT NULL, -- ISO-8601 UTC
  machine_id TEXT REFERENCES machines(id) ON DELETE SET NULL,
  machine_name TEXT,
  operator_id TEXT REFERENCES operators(id) ON DELETE SET NULL,
  operator_name TEXT,
  reason TEXT,
  details TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stage_events_order_stage ON stage_events(order_id, stage_number);
CREATE INDEX IF NOT EXISTS idx_stage_events_machine ON stage_events(machine_id);
CREATE INDEX IF NOT EXISTS idx_stage_events_operator ON stage_events(operator_id);

-- 2. Downtime Events table for machine breakdowns
CREATE TABLE IF NOT EXISTS downtime_events (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  stage_number INTEGER,
  start_time TEXT NOT NULL, -- ISO-8601 UTC
  end_time TEXT, -- ISO-8601 UTC
  duration_minutes INTEGER,
  reason TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'mechanical', -- 'mechanical', 'electrical', 'tooling', 'hydraulic', 'software_cnc', 'operator_error', 'other'
  reported_by TEXT NOT NULL,
  reported_by_id TEXT,
  resolved_by TEXT,
  resolved_by_id TEXT,
  repair_notes TEXT,
  spare_parts_used TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_downtime_machine ON downtime_events(machine_id);
CREATE INDEX IF NOT EXISTS idx_downtime_active ON downtime_events(machine_id, end_time);

-- 3. Maintenance Plans table (Preventive Maintenance - PM)
CREATE TABLE IF NOT EXISTS maintenance_plans (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual', 'overhaul'
  scheduled_date TEXT NOT NULL, -- ISO-8601 UTC
  completed_date TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'overdue'
  checklist TEXT NOT NULL DEFAULT '[]',
  technician_name TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_maintenance_machine ON maintenance_plans(machine_id);

-- 4. Enhance order_stages table for timing, pause tracking, outsourcing, and notes
ALTER TABLE order_stages ADD COLUMN assigned_at TEXT;
ALTER TABLE order_stages ADD COLUMN started_at TEXT;
ALTER TABLE order_stages ADD COLUMN paused_at TEXT;
ALTER TABLE order_stages ADD COLUMN resumed_at TEXT;
ALTER TABLE order_stages ADD COLUMN finished_at TEXT;
ALTER TABLE order_stages ADD COLUMN actual_working_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE order_stages ADD COLUMN total_pause_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE order_stages ADD COLUMN pause_reason TEXT;
ALTER TABLE order_stages ADD COLUMN operator_notes TEXT;
ALTER TABLE order_stages ADD COLUMN contractor_name TEXT;
ALTER TABLE order_stages ADD COLUMN sent_date TEXT;
ALTER TABLE order_stages ADD COLUMN expected_return_date TEXT;
ALTER TABLE order_stages ADD COLUMN override_category_reason TEXT;
