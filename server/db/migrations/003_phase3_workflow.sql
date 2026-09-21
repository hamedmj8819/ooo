-- 003_phase3_workflow.sql
-- Phase 3 Workflow State Machine, Counters, Routing, and QC enhancement columns

-- 1. Orders table enhancements
ALTER TABLE orders ADD COLUMN po_number TEXT;
ALTER TABLE orders ADD COLUMN hold_reason TEXT;
ALTER TABLE orders ADD COLUMN cancellation_reason TEXT;
ALTER TABLE orders ADD COLUMN quote_rejection_reason TEXT;
ALTER TABLE orders ADD COLUMN has_shortfall INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN shortfall_decision TEXT;
ALTER TABLE orders ADD COLUMN shortfall_notes TEXT;
ALTER TABLE orders ADD COLUMN previous_status TEXT;

-- 2. Order stages enhancements
ALTER TABLE order_stages ADD COLUMN parallel_group INTEGER;
ALTER TABLE order_stages ADD COLUMN rework_notes TEXT;
ALTER TABLE order_stages ADD COLUMN rework_assigned_machine_id TEXT;
ALTER TABLE order_stages ADD COLUMN rework_assigned_operator_id TEXT;
ALTER TABLE order_stages ADD COLUMN rework_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE order_stages ADD COLUMN estimated_minutes INTEGER NOT NULL DEFAULT 60;

-- 3. QC Reports enhancements
ALTER TABLE qc_reports ADD COLUMN conditional_reason TEXT;
ALTER TABLE qc_reports ADD COLUMN conditional_approved_by TEXT;
