import type Database from 'better-sqlite3';
import { hashPassword } from './helpers';
import {
  INITIAL_COMPRESSOR_MODELS,
  INITIAL_PARTS,
  INITIAL_MACHINE_TOOLS,
  INITIAL_FOUNDRIES,
  INITIAL_OPERATORS,
  INITIAL_ORDERS,
  INITIAL_WAREHOUSE as INITIAL_WAREHOUSE_ITEMS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS,
} from '../../src/data/initialData';

export function seedDatabase(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();

  const seedTx = db.transaction(() => {
    // 1. Seed Users
    const insertUser = db.prepare(`
      INSERT INTO users (
        id, username, password_hash, full_name, role, department, personnel_code,
        phone, is_active, must_change_password, failed_attempts, operator_id, created_at, updated_at
      )
      VALUES (
        @id, @username, @password_hash, @full_name, @role, @department, @personnel_code,
        @phone, @is_active, @must_change_password, 0, @operator_id, @created_at, @updated_at
      )
    `);

    for (const u of INITIAL_USERS) {
      let operatorId: string | null = null;
      if (u.role === 'operator' || u.username === 'operator') {
        operatorId = 'OP-01';
      }
      insertUser.run({
        id: u.id,
        username: u.username,
        password_hash: hashPassword(u.password || 'Admin@1403'),
        full_name: u.fullName,
        role: u.role,
        department: u.department,
        personnel_code: u.personnelCode,
        phone: u.phone || null,
        is_active: u.isActive ? 1 : 0,
        must_change_password: 0,
        operator_id: operatorId,
        created_at: now,
        updated_at: now,
      });
    }

    // 2. Seed Models
    const insertModel = db.prepare(`
      INSERT INTO models (id, code, name, name_en, type, capacity_m3_min, working_pressure_bar, motor_power_kw, cooling_type, description, image, image_url, parts_count, in_house_ratio, created_at, updated_at)
      VALUES (@id, @code, @name, @name_en, @type, @capacity_m3_min, @working_pressure_bar, @motor_power_kw, @cooling_type, @description, @image, @image_url, @parts_count, @in_house_ratio, @created_at, @updated_at)
    `);

    for (const m of INITIAL_COMPRESSOR_MODELS) {
      insertModel.run({
        id: m.id,
        code: m.code,
        name: m.name,
        name_en: m.nameEn || '',
        type: m.type || 'screw',
        capacity_m3_min: m.capacityM3Min || 0,
        working_pressure_bar: m.workingPressureBar || 0,
        motor_power_kw: m.motorPowerKw || 0,
        cooling_type: m.coolingType || '',
        description: m.description || '',
        image: m.image || null,
        image_url: m.imageUrl || null,
        parts_count: m.partsCount || 0,
        in_house_ratio: m.inHouseRatio || 80,
        created_at: now,
        updated_at: now,
      });
    }

    // 3. Seed Parts and Part Stages
    const insertPart = db.prepare(`
      INSERT INTO parts (id, part_number, name, name_en, machine_model_id, category, material, raw_weight_kg, finished_weight_kg, stock_qty, min_stock_alert, default_drawing_name, default_step_file_name, supplier_name, notes, image, image_url, created_at, updated_at)
      VALUES (@id, @part_number, @name, @name_en, @machine_model_id, @category, @material, @raw_weight_kg, @finished_weight_kg, @stock_qty, @min_stock_alert, @default_drawing_name, @default_step_file_name, @supplier_name, @notes, @image, @image_url, @created_at, @updated_at)
    `);

    const insertPartStage = db.prepare(`
      INSERT INTO part_stages (id, part_id, stage_number, name, description, default_machine_category_id, estimated_minutes, required_drawing_type, is_outsourced, qc_checkpoints, pdf_drawing_file_name, step_file_name, created_at, updated_at)
      VALUES (@id, @part_id, @stage_number, @name, @description, @default_machine_category_id, @estimated_minutes, @required_drawing_type, @is_outsourced, @qc_checkpoints, @pdf_drawing_file_name, @step_file_name, @created_at, @updated_at)
    `);

    for (const p of INITIAL_PARTS) {
      insertPart.run({
        id: p.id,
        part_number: p.partNumber,
        name: p.name,
        name_en: p.nameEn || '',
        machine_model_id: p.machineModelId,
        category: p.category,
        material: p.material,
        raw_weight_kg: p.rawWeightKg || 0,
        finished_weight_kg: p.finishedWeightKg || 0,
        stock_qty: p.stockQty || 0,
        min_stock_alert: p.minStockAlert || 0,
        default_drawing_name: p.defaultDrawingName || null,
        default_step_file_name: p.defaultStepFileName || null,
        supplier_name: p.supplierName || null,
        notes: p.notes || null,
        image: p.image || null,
        image_url: p.imageUrl || null,
        created_at: now,
        updated_at: now,
      });

      if (p.defaultStages && Array.isArray(p.defaultStages)) {
        for (const st of p.defaultStages) {
          insertPartStage.run({
            id: `PSTG-${p.id}-${st.stageNumber}`,
            part_id: p.id,
            stage_number: st.stageNumber,
            name: st.name,
            description: st.description || '',
            default_machine_category_id: st.defaultMachineCategoryId || 'cnc_lathe',
            estimated_minutes: st.estimatedMinutes || 60,
            required_drawing_type: st.requiredDrawingType || '2D Drawing + STEP',
            is_outsourced: st.isOutsourced ? 1 : 0,
            qc_checkpoints: JSON.stringify(st.qcCheckpoints || []),
            pdf_drawing_file_name: st.pdfDrawingFileName || null,
            step_file_name: st.stepFileName || null,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    // 4. Seed Machines
    const insertMachine = db.prepare(`
      INSERT INTO machines (id, name, code, type, category, status, location, specifications, last_maintenance_date, health_percent, image, image_url, created_at, updated_at)
      VALUES (@id, @name, @code, @type, @category, @status, @location, @specifications, @last_maintenance_date, @health_percent, @image, @image_url, @created_at, @updated_at)
    `);

    for (const m of INITIAL_MACHINE_TOOLS) {
      insertMachine.run({
        id: m.id,
        name: m.name,
        code: m.code,
        type: m.type || 'internal',
        category: m.category,
        status: m.status || 'idle',
        location: m.location || 'سالن ماشین‌کاری',
        specifications: m.specifications || '',
        last_maintenance_date: now,
        health_percent: m.healthPercent || 100,
        image: m.image || null,
        image_url: m.imageUrl || null,
        created_at: now,
        updated_at: now,
      });
    }

    // 5. Seed Operators
    const insertOperator = db.prepare(`
      INSERT INTO operators (id, name, personnel_code, specialty, assigned_machine_id, shift, total_parts_produced_today, status, image, image_url, avatar_url, created_at, updated_at)
      VALUES (@id, @name, @personnel_code, @specialty, @assigned_machine_id, @shift, @total_parts_produced_today, @status, @image, @image_url, @avatar_url, @created_at, @updated_at)
    `);

    for (const op of INITIAL_OPERATORS) {
      insertOperator.run({
        id: op.id,
        name: op.name,
        personnel_code: op.personnelCode,
        specialty: op.specialty,
        assigned_machine_id: op.assignedMachineId || null,
        shift: op.shift || 'morning',
        total_parts_produced_today: op.totalPartsProducedToday || 0,
        status: op.status || 'idle',
        image: op.image || null,
        image_url: op.imageUrl || null,
        avatar_url: op.avatarUrl || null,
        created_at: now,
        updated_at: now,
      });
    }

    // 6. Seed Foundries
    const insertFoundry = db.prepare(`
      INSERT INTO foundries (id, name, manager, phone, city, capabilities, quality_rating, active_orders_count, image, image_url, logo_url, created_at, updated_at)
      VALUES (@id, @name, @manager, @phone, @city, @capabilities, @quality_rating, @active_orders_count, @image, @image_url, @logo_url, @created_at, @updated_at)
    `);

    for (const f of INITIAL_FOUNDRIES) {
      insertFoundry.run({
        id: f.id,
        name: f.name,
        manager: f.manager || '',
        phone: f.phone || '',
        city: f.city || '',
        capabilities: JSON.stringify(f.capabilities || []),
        quality_rating: f.qualityRating || 5.0,
        active_orders_count: f.activeOrdersCount || 0,
        image: f.image || null,
        image_url: f.imageUrl || null,
        logo_url: f.logoUrl || null,
        created_at: now,
        updated_at: now,
      });
    }

    // 7. Seed Orders, Stages, Quotes, Docs
    const insertOrder = db.prepare(`
      INSERT INTO orders (id, order_number, title, is_custom_order, custom_details, compressor_model_id, compressor_model_name, part_id, part_name, part_number, quantity, priority, deadline_date, created_date, created_by_role, created_by_name, status, completion_percentage, delivered_to_warehouse_qty, is_delivered_semi_finished, warehouse_receipt_number, notes, created_at, updated_at)
      VALUES (@id, @order_number, @title, @is_custom_order, @custom_details, @compressor_model_id, @compressor_model_name, @part_id, @part_name, @part_number, @quantity, @priority, @deadline_date, @created_date, @created_by_role, @created_by_name, @status, @completion_percentage, @delivered_to_warehouse_qty, @is_delivered_semi_finished, @warehouse_receipt_number, @notes, @created_at, @updated_at)
    `);

    const insertOrderStage = db.prepare(`
      INSERT INTO order_stages (id, order_id, stage_number, stage_name, machine_tool_id, machine_tool_name, operator_id, operator_name, status, start_time, end_time, planned_qty, produced_qty, scrap_qty, qc_approved, qc_inspector_name, qc_notes, is_outsourced, outsourced_vendor_name, created_at, updated_at)
      VALUES (@id, @order_id, @stage_number, @stage_name, @machine_tool_id, @machine_tool_name, @operator_id, @operator_name, @status, @start_time, @end_time, @planned_qty, @produced_qty, @scrap_qty, @qc_approved, @qc_inspector_name, @qc_notes, @is_outsourced, @outsourced_vendor_name, @created_at, @updated_at)
    `);

    const insertQuote = db.prepare(`
      INSERT INTO quotes (id, order_id, supplier_name, supplier_type, amount_rials, delivery_time_days, date_submitted, status, attachment_file_name, attachment_file_type, notes, rejection_reason, submitted_by, decided_at, created_at, updated_at)
      VALUES (@id, @order_id, @supplier_name, @supplier_type, @amount_rials, @delivery_time_days, @date_submitted, @status, @attachment_file_name, @attachment_file_type, @notes, @rejection_reason, @submitted_by, @decided_at, @created_at, @updated_at)
    `);

    const insertDoc = db.prepare(`
      INSERT INTO engineering_docs (id, order_id, stage_number, stage_name, drawing_number, drawing_file_name, drawing_file_type, step_file_name, uploaded_at, uploaded_by, uploaded_by_role, uploaded_by_name, is_approved, status, notes, cad_preview_data, created_at, updated_at)
      VALUES (@id, @order_id, @stage_number, @stage_name, @drawing_number, @drawing_file_name, @drawing_file_type, @step_file_name, @uploaded_at, @uploaded_by, @uploaded_by_role, @uploaded_by_name, @is_approved, @status, @notes, @cad_preview_data, @created_at, @updated_at)
    `);

    const insertQc = db.prepare(`
      INSERT INTO qc_reports (id, order_id, stage_number, report_number, inspected_at, inspector_name, inspector_personnel_code, passed_qty, rejected_qty, conditional_qty, decision, dimensional_check_passed, surface_roughness_passed, hardness_rockwell, roughness_ra, measured_tolerances, notes, sheet_file_name, sheet_file_size, sheet_uploaded_at, engineering_approval, created_at, updated_at)
      VALUES (@id, @order_id, @stage_number, @report_number, @inspected_at, @inspector_name, @inspector_personnel_code, @passed_qty, @rejected_qty, @conditional_qty, @decision, @dimensional_check_passed, @surface_roughness_passed, @hardness_rockwell, @roughness_ra, @measured_tolerances, @notes, @sheet_file_name, @sheet_file_size, @sheet_uploaded_at, @engineering_approval, @created_at, @updated_at)
    `);

    for (const ord of INITIAL_ORDERS) {
      insertOrder.run({
        id: ord.id,
        order_number: ord.orderNumber || ord.id,
        title: ord.title,
        is_custom_order: ord.isCustomOrder ? 1 : 0,
        custom_details: ord.customDetails ? JSON.stringify(ord.customDetails) : null,
        compressor_model_id: ord.compressorModelId || null,
        compressor_model_name: ord.compressorModelName || null,
        part_id: ord.partId || null,
        part_name: ord.partName,
        part_number: ord.partNumber,
        quantity: ord.quantity,
        priority: ord.priority || 'normal',
        deadline_date: now,
        created_date: now,
        created_by_role: ord.createdByRole || 'ceo',
        created_by_name: ord.createdByName || 'مدیرعامل',
        status: ord.status || 'pending_planning',
        completion_percentage: ord.completionPercentage || 0,
        delivered_to_warehouse_qty: ord.deliveredToWarehouseQty || 0,
        is_delivered_semi_finished: ord.isDeliveredSemiFinished ? 1 : 0,
        warehouse_receipt_number: ord.warehouseReceiptNumber || null,
        notes: ord.notes || null,
        created_at: now,
        updated_at: now,
      });

      if (ord.stages) {
        for (const stg of ord.stages) {
          insertOrderStage.run({
            id: `OSTG-${ord.id}-${stg.stageNumber}`,
            order_id: ord.id,
            stage_number: stg.stageNumber,
            stage_name: stg.stageName,
            machine_tool_id: stg.machineToolId || null,
            machine_tool_name: stg.machineToolName || null,
            operator_id: stg.operatorId || null,
            operator_name: stg.operatorName || null,
            status: stg.status || 'not_started',
            start_time: stg.startTime || null,
            end_time: stg.endTime || null,
            planned_qty: stg.plannedQty || ord.quantity,
            produced_qty: stg.producedQty || 0,
            scrap_qty: stg.scrapQty || 0,
            qc_approved: stg.qcApproved ? 1 : 0,
            qc_inspector_name: stg.qcInspectorName || null,
            qc_notes: stg.qcNotes || null,
            is_outsourced: stg.isOutsourced ? 1 : 0,
            outsourced_vendor_name: stg.outsourcedVendorName || null,
            created_at: now,
            updated_at: now,
          });

          if (stg.qcReport) {
            insertQc.run({
              id: `QC-${ord.id}-${stg.stageNumber}`,
              order_id: ord.id,
              stage_number: stg.stageNumber,
              report_number: stg.qcReport.reportNumber || `QC-REP-${ord.id}-${stg.stageNumber}`,
              inspected_at: now,
              inspector_name: stg.qcReport.inspectorName || 'کنترل کیفیت',
              inspector_personnel_code: stg.qcReport.inspectorPersonnelCode || null,
              passed_qty: stg.qcReport.passedQty || 0,
              rejected_qty: stg.qcReport.rejectedQty || 0,
              conditional_qty: stg.qcReport.conditionalQty || 0,
              decision: stg.qcReport.decision || 'approved',
              dimensional_check_passed: stg.qcReport.dimensionalCheckPassed ? 1 : 0,
              surface_roughness_passed: stg.qcReport.surfaceRoughnessPassed ? 1 : 0,
              hardness_rockwell: stg.qcReport.hardnessRockwell || null,
              roughness_ra: stg.qcReport.roughnessRa || null,
              measured_tolerances: stg.qcReport.measuredTolerances || null,
              notes: stg.qcReport.notes || '',
              sheet_file_name: stg.qcReport.sheetFileName || 'QC-Report.pdf',
              sheet_file_size: stg.qcReport.sheetFileSize || null,
              sheet_uploaded_at: now,
              engineering_approval:
                stg.engineeringApproval
                  ? JSON.stringify(stg.engineeringApproval)
                  : null,
              created_at: now,
              updated_at: now,
            });
          }
        }
      }

      if (ord.quotes) {
        for (const q of ord.quotes) {
          insertQuote.run({
            id: q.id,
            order_id: ord.id,
            supplier_name: q.supplierName,
            supplier_type: q.supplierType,
            amount_rials: Math.round(q.amountRials) || 0,
            delivery_time_days: q.deliveryTimeDays || 1,
            date_submitted: now,
            status: q.status || 'pending_ceo',
            attachment_file_name: q.attachmentFileName || null,
            attachment_file_type: q.attachmentFileType || null,
            notes: q.notes || null,
            rejection_reason: q.rejectionReason || null,
            submitted_by: q.submittedBy || 'واحد برنامه‌ریزی',
            decided_at: q.decidedAt || null,
            created_at: now,
            updated_at: now,
          });
        }
      }

      if (ord.engineeringDocs) {
        for (const doc of ord.engineeringDocs) {
          insertDoc.run({
            id: doc.id || `EDOC-${ord.id}-${doc.stageNumber}`,
            order_id: ord.id,
            stage_number: doc.stageNumber,
            stage_name: doc.stageName,
            drawing_number: doc.drawingNumber,
            drawing_file_name: doc.drawingFileName || null,
            drawing_file_type: doc.drawingFileType || 'pdf',
            step_file_name: doc.stepFileName || null,
            uploaded_at: now,
            uploaded_by: doc.uploadedBy || null,
            uploaded_by_role: doc.uploadedByRole || 'engineering',
            uploaded_by_name: doc.uploadedByName || 'واحد مهندسی',
            is_approved: doc.isApproved ? 1 : 0,
            status: doc.status || 'pending',
            notes: doc.notes || null,
            cad_preview_data: doc.cadPreviewData ? JSON.stringify(doc.cadPreviewData) : null,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    // 8. Seed Warehouse Items
    const insertWarehouse = db.prepare(`
      INSERT INTO warehouse_items (id, part_number, name, type, quantity, unit, shelf_location, min_threshold, last_updated, created_at, updated_at)
      VALUES (@id, @part_number, @name, @type, @quantity, @unit, @shelf_location, @min_threshold, @last_updated, @created_at, @updated_at)
    `);

    for (const wi of INITIAL_WAREHOUSE_ITEMS) {
      insertWarehouse.run({
        id: wi.id,
        part_number: wi.partNumber,
        name: wi.name,
        type: wi.type,
        quantity: wi.quantity || 0,
        unit: wi.unit || 'عدد',
        shelf_location: wi.shelfLocation || 'A-01',
        min_threshold: 5,
        last_updated: now,
        created_at: now,
        updated_at: now,
      });
    }

    // 9. Seed Notifications
    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, title, message, type, target_roles, is_read, link_order_id, created_at, updated_at)
      VALUES (@id, @title, @message, @type, @target_roles, @is_read, @link_order_id, @created_at, @updated_at)
    `);

    for (const n of INITIAL_NOTIFICATIONS) {
      insertNotif.run({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type || 'info',
        target_roles: JSON.stringify(n.targetRoles || ['super_admin']),
        is_read: n.isRead ? 1 : 0,
        link_order_id: n.linkOrderId || null,
        created_at: now,
        updated_at: now,
      });
    }

    // 10. Seed Counters
    const insertCounter = db.prepare(`
      INSERT INTO counters (name, prefix, current_value, updated_at)
      VALUES (?, ?, ?, ?)
    `);

    insertCounter.run('order_number', 'PO-1403-', 100, now);
    insertCounter.run('qc_report', 'QC-REP-', 500, now);

    db.prepare(`
      INSERT OR IGNORE INTO files (id, file_name, file_type, file_size, mime_type, storage_path, category, uploaded_by, created_at, updated_at)
      VALUES ('FILE-TEST-01', 'Test-Drawing.pdf', 'pdf', 1024, 'application/pdf', 'storage/FILE-TEST-01.pdf', 'engineering', 'سیستم', ?, ?)
    `).run(now, now);

    console.log('[DB Seed] Successfully seeded initial MES database with default datasets.');
  });

  seedTx();
}
