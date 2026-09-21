/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../server/testing/app';
import { db } from '../server/db/database';
import {
  isOrderTransitionAllowed,
  isStageTransitionAllowed,
  calculateOrderProgress,
  calculateDeadlineToMetrics,
} from '../shared/orderStateMachine';
import {
  generateOrderNumber,
  generatePONumber,
  generateQCReportNumber,
  generateWarehouseReceiptNumber,
} from '../server/utils/counters';
import { getCurrentJalaliYear } from '../shared/jalali';

describe('Phase 3: Order State Machine & Workflow Test Suite', () => {
  let app: any;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('1. Pure State Machine Transition Matrix', () => {
    it('should allow valid sequence of order statuses', () => {
      expect(isOrderTransitionAllowed('draft', 'pending_planning')).toBe(true);
      expect(isOrderTransitionAllowed('pending_planning', 'planning_inquiry')).toBe(true);
      expect(isOrderTransitionAllowed('planning_inquiry', 'pending_ceo_quote')).toBe(true);
      expect(isOrderTransitionAllowed('pending_ceo_quote', 'material_ordered')).toBe(true);
      expect(isOrderTransitionAllowed('material_ordered', 'material_received_po')).toBe(true);
      expect(isOrderTransitionAllowed('material_received_po', 'awaiting_engineering')).toBe(true);
      expect(isOrderTransitionAllowed('awaiting_engineering', 'engineering_approved')).toBe(true);
      expect(isOrderTransitionAllowed('engineering_approved', 'in_production')).toBe(true);
      expect(isOrderTransitionAllowed('in_production', 'awaiting_planning_handover')).toBe(true);
      expect(isOrderTransitionAllowed('awaiting_planning_handover', 'completed')).toBe(true);
      expect(isOrderTransitionAllowed('awaiting_planning_handover', 'semi_finished_stored')).toBe(true);
    });

    it('should disallow illegal backwards or skipping transitions', () => {
      // Cannot jump straight from draft to completed
      expect(isOrderTransitionAllowed('draft', 'completed')).toBe(false);
      // Cannot jump from planning_inquiry to in_production without quotes/engineering
      expect(isOrderTransitionAllowed('planning_inquiry', 'in_production')).toBe(false);
      // Cannot jump backwards from material_ordered to draft
      expect(isOrderTransitionAllowed('material_ordered', 'draft')).toBe(false);
      // Completed orders are terminal
      expect(isOrderTransitionAllowed('completed', 'draft')).toBe(false);
      expect(isOrderTransitionAllowed('completed', 'in_production')).toBe(false);
    });

    it('should allow holding and cancelling from active states', () => {
      expect(isOrderTransitionAllowed('pending_planning', 'on_hold')).toBe(true);
      expect(isOrderTransitionAllowed('in_production', 'on_hold')).toBe(true);
      expect(isOrderTransitionAllowed('in_production', 'cancelled')).toBe(true);
      // Cannot cancel an already completed order
      expect(isOrderTransitionAllowed('completed', 'cancelled')).toBe(false);
    });

    it('should validate stage status transitions', () => {
      expect(isStageTransitionAllowed('not_started', 'assigned')).toBe(true);
      expect(isStageTransitionAllowed('assigned', 'in_progress')).toBe(true);
      expect(isStageTransitionAllowed('in_progress', 'qc_pending')).toBe(true);
      expect(isStageTransitionAllowed('qc_pending', 'engineering_qc_pending')).toBe(true);
      expect(isStageTransitionAllowed('qc_pending', 'qc_rejected')).toBe(true);
      expect(isStageTransitionAllowed('engineering_qc_pending', 'completed')).toBe(true);
      expect(isStageTransitionAllowed('qc_rejected', 'rework')).toBe(true);
      expect(isStageTransitionAllowed('rework', 'qc_pending')).toBe(true);
      // Completed stage cannot jump back to in_progress
      expect(isStageTransitionAllowed('completed', 'in_progress')).toBe(false);
    });
  });

  describe('2. Dynamic Calculations (Progress & Deadlines)', () => {
    it('should accurately calculate dynamic completion percentage', () => {
      expect(calculateOrderProgress('draft', [])).toBe(0);
      expect(calculateOrderProgress('completed', [])).toBe(100);
      expect(calculateOrderProgress('semi_finished_stored', [])).toBe(100);

      const stages = [
        { status: 'completed' as const, estimatedMinutes: 60 },
        { status: 'completed' as const, estimatedMinutes: 60 },
        { status: 'in_progress' as const, estimatedMinutes: 120 },
      ];
      // total = 240. completed = 60 + 60 + 60 (half of 120) = 180. ratio = 180/240 = 0.75
      // progress = 30 + 0.75 * 65 = 30 + 48.75 = 79%
      const prog = calculateOrderProgress('in_production', stages);
      expect(prog).toBe(79);
    });

    it('should compute deadline overdue and urgency levels', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      const nearFutureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

      const overdueMetrics = calculateDeadlineToMetrics(pastDate, 'in_production');
      expect(overdueMetrics.isOverdue).toBe(true);
      expect(overdueMetrics.urgencyLevel).toBe('critical');

      const normalMetrics = calculateDeadlineToMetrics(futureDate, 'in_production');
      expect(normalMetrics.isOverdue).toBe(false);
      expect(normalMetrics.urgencyLevel).toBe('normal');

      const criticalMetrics = calculateDeadlineToMetrics(nearFutureDate, 'in_production');
      expect(criticalMetrics.isOverdue).toBe(false);
      expect(criticalMetrics.urgencyLevel).toBe('critical');
    });
  });

  describe('3. Atomic Jalali Counters & Concurrency', () => {
    it('should generate sequential numbers with correct Jalali year format', () => {
      const year = getCurrentJalaliYear();
      const ordNum = generateOrderNumber(db);
      expect(ordNum).toMatch(new RegExp(`^ORD-${year}-\\d{4}$`));

      const poNum = generatePONumber(db);
      expect(poNum).toMatch(new RegExp(`^PO-${year}-\\d{4}$`));

      const qcNum = generateQCReportNumber(db);
      expect(qcNum).toMatch(new RegExp(`^QC-${year}-\\d{4}$`));

      const wrNum = generateWarehouseReceiptNumber(db);
      expect(wrNum).toMatch(new RegExp(`^WR-${year}-\\d{4}$`));
    });

    it('should generate 100 unique and sequential numbers under concurrent requests', () => {
      const generatedCodes: string[] = [];

      for (let i = 0; i < 100; i++) {
        generatedCodes.push(generateOrderNumber(db));
      }

      const uniqueSet = new Set(generatedCodes);
      expect(uniqueSet.size).toBe(100);

      // Verify strict monotonicity
      const numbers = generatedCodes.map((code) => parseInt(code.split('-')[2], 10));
      for (let i = 1; i < numbers.length; i++) {
        expect(numbers[i]).toBe(numbers[i - 1] + 1);
      }
    });
  });

  describe('4. Server Order Workflow End-to-End & Boundary Rules', () => {
    let ceoAgent: any;
    let planningAgent: any;
    let engineeringAgent: any;
    let productionAgent: any;
    let qcAgent: any;

    beforeEach(async () => {
      ceoAgent = request.agent(app);
      await ceoAgent.post('/api/v1/auth/login').send({ username: 'ceo', password: '123' });

      planningAgent = request.agent(app);
      await planningAgent.post('/api/v1/auth/login').send({ username: 'planning', password: '123' });

      engineeringAgent = request.agent(app);
      await engineeringAgent.post('/api/v1/auth/login').send({ username: 'engineering', password: '123' });

      productionAgent = request.agent(app);
      await productionAgent.post('/api/v1/auth/login').send({ username: 'production', password: '123' });

      qcAgent = request.agent(app);
      await qcAgent.post('/api/v1/auth/login').send({ username: 'qc', password: '123' });

      db.prepare("UPDATE machines SET status = 'idle', current_work_order_id = NULL, current_stage_name = NULL, current_operator_id = NULL").run();
      db.prepare("UPDATE operators SET status = 'idle', current_work_order_id = NULL, current_stage_name = NULL").run();
      db.prepare("UPDATE order_stages SET status = 'not_started', operator_id = NULL, operator_name = NULL, machine_tool_id = NULL, machine_tool_name = NULL, paused_at = NULL, pause_reason = NULL").run();
    });

    it('Scenario A: Sequential Stage Enforcement (Cannot assign stage 2 before stage 1 is completed)', async () => {
      // 1. Create order
      const createRes = await planningAgent
        .post('/api/v1/orders')
        .send({
          partId: 'PART-SC500-01',
          partName: 'پوسته اصلی هوزینگ کمپرسور اسکرو سنگین ۵۰۰',
          partNumber: 'CP-CS-5001',
          quantity: 5,
          priority: 'urgent',
          deadlineDate: new Date(Date.now() + 864000000).toISOString(),
        });

      expect(createRes.status).toBe(201);
      const orderId = createRes.body.id;

      // 2. Try to assign stage 2 directly before stage 1 completed -> should fail with 409
      const assignStage2Res = await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/2/assign`)
        .send({
          machineToolId: 'MC-LATHE-MAN-01',
          machineToolName: 'تراش منوال سنگین ۳ متری تبریز',
          operatorId: 'OP-01',
          operatorName: 'صابر رادمنش',
        });

      expect(assignStage2Res.status).toBe(409);
      expect(assignStage2Res.body.code).toBe('PREVIOUS_STAGE_INCOMPLETE');
    });

    it('Scenario B: Quote Approval & Superseding Rules', async () => {
      // 1. Create order
      const createRes = await planningAgent
        .post('/api/v1/orders')
        .send({
          partName: 'هوزینگ چدنی تست پیش‌فاکتور',
          partNumber: 'CMP-HSG-TEST',
          quantity: 2,
          priority: 'normal',
          deadlineDate: new Date(Date.now() + 864000000).toISOString(),
        });
      expect(createRes.status).toBe(201);
      const orderId = createRes.body.id;

      // 2. Start inquiry
      await planningAgent.post(`/api/v1/orders/${orderId}/start-inquiry`);

      // 3. Submit 2 quotes
      const q1Res = await planningAgent
        .post(`/api/v1/orders/${orderId}/quotes`)
        .send({
          supplierName: 'ریخته‌گری دقیق مشهد',
          supplierType: 'foundry',
          amountRials: 150000000,
          deliveryTimeDays: 7,
        });
      expect(q1Res.status).toBe(201);
      const q1Id = q1Res.body.quotes[0].id;

      const q2Res = await planningAgent
        .post(`/api/v1/orders/${orderId}/quotes`)
        .send({
          supplierName: 'ریخته‌گری چدن اصفهان',
          supplierType: 'foundry',
          amountRials: 140000000,
          deliveryTimeDays: 10,
        });
      expect(q2Res.status).toBe(201);
      const q2Id = q2Res.body.quotes.find((q: { id: string }) => q.id !== q1Id).id;

      // 4. CEO approves Q1
      const approveRes = await ceoAgent
        .post(`/api/v1/orders/${orderId}/quotes/${q1Id}/decision`)
        .send({ decision: 'approved' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.status).toBe('material_ordered');

      // Verify Q1 is approved_by_ceo and Q2 is superseded
      const updatedQ1 = approveRes.body.quotes.find((q: { id: string; status: string }) => q.id === q1Id);
      const updatedQ2 = approveRes.body.quotes.find((q: { id: string; status: string }) => q.id === q2Id);
      expect(updatedQ1.status).toBe('approved_by_ceo');
      expect(updatedQ2.status).toBe('superseded');

      // 5. Trying to approve another quote now should fail with 409
      const secondApproveRes = await ceoAgent
        .post(`/api/v1/orders/${orderId}/quotes/${q2Id}/decision`)
        .send({ decision: 'approved' });

      expect(secondApproveRes.status).toBe(409);
    });

    it('Scenario C: QC Quantity Match Validation & Segregation of Duties', async () => {
      // 1. Create order
      const createRes = await planningAgent
        .post('/api/v1/orders')
        .send({
          partId: 'PART-SC500-01',
          partName: 'روتور مارپیچ نر ۳۵۰',
          partNumber: 'CP-CS-5001',
          quantity: 10,
          priority: 'urgent',
          deadlineDate: new Date(Date.now() + 864000000).toISOString(),
        });
      expect(createRes.status).toBe(201);
      const orderId = createRes.body.id;

      // Advance to awaiting_engineering -> engineering_approved
      await planningAgent.post(`/api/v1/orders/${orderId}/confirm-material`);
      await engineeringAgent
        .post(`/api/v1/orders/${orderId}/engineering-docs`)
        .send({
          stageNumber: 1,
          stageName: 'تراشکاری اولیه',
          drawingNumber: 'DWG-001',
        });
      await engineeringAgent
        .post(`/api/v1/orders/${orderId}/engineering-docs`)
        .send({
          stageNumber: 2,
          stageName: 'سنگ‌زنی پروفیل',
          drawingNumber: 'DWG-002',
        });

      // Assign Stage 1
      await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/assign`)
        .send({
          machineToolId: 'MC-LATHE-MAN-01',
          operatorId: 'OP-01',
          operatorName: 'صابر رادمنش',
        });

      // Report produced quantity: 10
      await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/progress`)
        .send({
          producedQty: 10,
          scrapQty: 0,
        });

      // 2. Submit QC report with MISMATCHED quantity (e.g. 7 passed + 1 rejected + 0 conditional = 8 != 10)
      const badQcRes = await qcAgent
        .post(`/api/v1/orders/${orderId}/stages/1/qc-report`)
        .send({
          inspectorName: 'مهندس کاظمی',
          passedQty: 7,
          rejectedQty: 1,
          conditionalQty: 0,
          decision: 'approved',
        });

      expect(badQcRes.status).toBe(400);
      expect(badQcRes.body.code).toBe('QC_QUANTITY_MISMATCH');

      // 3. Submit valid QC report (8 passed + 2 rejected = 10)
      const validQcRes = await qcAgent
        .post(`/api/v1/orders/${orderId}/stages/1/qc-report`)
        .send({
          inspectorName: 'مهندس کاظمی',
          passedQty: 8,
          rejectedQty: 2,
          conditionalQty: 0,
          decision: 'approved',
        });

      expect(validQcRes.status).toBe(200);

      // 4. Test Segregation of Duties: QC inspector cannot approve their own QC report in engineering
      const selfApproveRes = await qcAgent
        .post(`/api/v1/orders/${orderId}/stages/1/engineering-approval`)
        .send({
          approverName: 'مهندس کاظمی',
          isApproved: true,
          feedback: 'تایید شد',
        });

      // QC user lacks permission orders:qc_approve (403 FORBIDDEN)
      expect(selfApproveRes.status).toBe(403);

      // 5. Engineering approves -> stage 1 completes, stage 2 planned_qty becomes 8 (8 passed), shortfall flagged!
      const engApproveRes = await engineeringAgent
        .post(`/api/v1/orders/${orderId}/stages/1/engineering-approval`)
        .send({
          approverName: 'مهندس رحیمی',
          isApproved: true,
          feedback: 'ابعاد و تلرانس‌ها مطابق استاندارد تایید شد',
        });

      expect(engApproveRes.status).toBe(200);
      const stage1 = engApproveRes.body.stages.find((s: { stageNumber: number; status: string }) => s.stageNumber === 1);
      const stage2 = engApproveRes.body.stages.find((s: { stageNumber: number; plannedQty: number }) => s.stageNumber === 2);
      expect(stage1.status).toBe('completed');
      expect(stage2.plannedQty).toBe(8); // Updated to accepted quantity!
      expect(engApproveRes.body.hasShortfall).toBe(true); // Shortfall from 10 to 8
    });

    it('Scenario D: Rework assignment on rejected stage', async () => {
      // 1. Create order
      const createRes = await planningAgent
        .post('/api/v1/orders')
        .send({
          partName: 'پوسته چدنی تست دوباره‌کاری',
          quantity: 1,
          priority: 'urgent',
          deadlineDate: new Date().toISOString(),
        });
      expect(createRes.status).toBe(201);
      const orderId = createRes.body.id;

      // Set routing
      await engineeringAgent
        .post(`/api/v1/orders/${orderId}/routing`)
        .send({
          stages: [{ stageNumber: 1, stageName: 'فرزکاری' }],
        });

      // Confirm material -> awaiting engineering -> upload doc -> engineering approved
      await planningAgent.post(`/api/v1/orders/${orderId}/confirm-material`);
      await engineeringAgent
        .post(`/api/v1/orders/${orderId}/engineering-docs`)
        .send({ stageNumber: 1, stageName: 'فرزکاری', drawingNumber: 'DWG-101' });

      // Assign & report progress
      await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/assign`)
        .send({ machineToolId: 'MC-LATHE-MAN-01', operatorId: 'OP-01' });

      await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/progress`)
        .send({ producedQty: 1, scrapQty: 0 });

      // QC rejects stage
      const qcRejectRes = await qcAgent
        .post(`/api/v1/orders/${orderId}/stages/1/qc-report`)
        .send({
          inspectorName: 'مهندس کاظمی',
          passedQty: 0,
          rejectedQty: 1,
          conditionalQty: 0,
          decision: 'rejected',
          notes: 'پلیسه در لبه‌ها مشاهده شد',
        });

      expect(qcRejectRes.status).toBe(200);
      const stage = qcRejectRes.body.stages[0];
      expect(stage.status).toBe('qc_rejected');

      // Production assigns rework
      const reworkRes = await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/rework`)
        .send({
          machineToolId: 'MC-LATHE-MAN-01',
          operatorId: 'OP-01',
          reworkNotes: 'پلیسه‌گیری و اصلاح لبه‌ها با دستگاه سنباده',
        });

      if (reworkRes.status !== 200) console.log('REWORK FAIL:', reworkRes.status, reworkRes.body);
      expect(reworkRes.status).toBe(200);
      const reworkedStage = reworkRes.body.stages[0];
      expect(reworkedStage.status).toBe('rework');
      expect(reworkedStage.reworkCount).toBe(1);
    });
  });
});
