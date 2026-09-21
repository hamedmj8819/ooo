/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../server/testing/app';
import { db } from '../server/db/database';

describe('Phase 4: Machine, Operator, Resource Management & Real-time Tracking Suite', () => {
  let app: any;

  beforeAll(() => {
    app = createTestApp();
  });

  let productionAgent: any;
  let planningAgent: any;
  let engineeringAgent: any;
  let qcAgent: any;
  let operatorAgent: any;

  beforeEach(async () => {
    productionAgent = request.agent(app);
    await productionAgent.post('/api/v1/auth/login').send({ username: 'production', password: '123' });

    planningAgent = request.agent(app);
    await planningAgent.post('/api/v1/auth/login').send({ username: 'planning', password: '123' });

    engineeringAgent = request.agent(app);
    await engineeringAgent.post('/api/v1/auth/login').send({ username: 'engineering', password: '123' });

    qcAgent = request.agent(app);
    await qcAgent.post('/api/v1/auth/login').send({ username: 'qc', password: '123' });

    operatorAgent = request.agent(app);
    await operatorAgent.post('/api/v1/auth/login').send({ username: 'operator', password: '123' });

    // Reset machine, operator, and order stage states between tests
    db.prepare("UPDATE machines SET status = 'idle', current_work_order_id = NULL, current_stage_name = NULL, current_operator_id = NULL").run();
    db.prepare("UPDATE operators SET status = 'idle', current_work_order_id = NULL, current_stage_name = NULL").run();
    db.prepare("UPDATE order_stages SET status = 'not_started', operator_id = NULL, operator_name = NULL, machine_tool_id = NULL, machine_tool_name = NULL, paused_at = NULL, pause_reason = NULL").run();
  });

  // Helper to create a ready-for-production order
  async function createProductionReadyOrder(partId = 'PART-SC500-01') {
    const createRes = await planningAgent
      .post('/api/v1/orders')
      .send({
        partId,
        partName: 'روتور مارپیچ تست فاز ۴',
        partNumber: 'CP-TEST-04',
        quantity: 5,
        priority: 'urgent',
        deadlineDate: new Date(Date.now() + 864000000).toISOString(),
      });

    const orderId = createRes.body.id;

    // Advance order to engineering_approved
    await planningAgent.post(`/api/v1/orders/${orderId}/confirm-material`);
    await engineeringAgent
      .post(`/api/v1/orders/${orderId}/engineering-docs`)
      .send({ stageNumber: 1, stageName: 'تراشکاری خشن', drawingNumber: 'DWG-401' });
    await engineeringAgent
      .post(`/api/v1/orders/${orderId}/engineering-docs`)
      .send({ stageNumber: 2, stageName: 'فرزکاری شیار', drawingNumber: 'DWG-402' });

    return orderId;
  }

  describe('1. Machine & Operator Assignment Rules', () => {
    it('Rule 1.1: Only idle machines can be assigned (Rejects active / breakdown / maintenance)', async () => {
      const orderId = await createProductionReadyOrder();

      // Put machine in active state
      db.prepare("UPDATE machines SET status = 'active' WHERE id = 'MC-LATHE-MAN-01'").run();

      // Attempt assign
      const res = await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/assign`)
        .send({
          machineToolId: 'MC-LATHE-MAN-01',
          operatorId: 'OP-01',
          overrideCategory: true,
          overrideCategoryReason: 'تست',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('MACHINE_NOT_IDLE');

      // Put machine in breakdown
      db.prepare("UPDATE machines SET status = 'breakdown' WHERE id = 'MC-LATHE-MAN-01'").run();
      const res2 = await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/assign`)
        .send({
          machineToolId: 'MC-LATHE-MAN-01',
          operatorId: 'OP-01',
          overrideCategory: true,
          overrideCategoryReason: 'تست',
        });

      expect(res2.status).toBe(409);
      expect(res2.body.code).toBe('MACHINE_NOT_IDLE');

      // Put machine in maintenance
      db.prepare("UPDATE machines SET status = 'maintenance' WHERE id = 'MC-LATHE-MAN-01'").run();
      const res3 = await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/assign`)
        .send({
          machineToolId: 'MC-LATHE-MAN-01',
          operatorId: 'OP-01',
          overrideCategory: true,
          overrideCategoryReason: 'تست',
        });

      expect(res3.status).toBe(409);
      expect(res3.body.code).toBe('MACHINE_NOT_IDLE');
    });

    it('Rule 1.2: Operator concurrency (Max 1 active stage per operator at any time)', async () => {
      const orderId1 = await createProductionReadyOrder();
      const orderId2 = await createProductionReadyOrder();

      // Assign Operator OP-01 to order 1
      const assignRes = await productionAgent
        .post(`/api/v1/orders/${orderId1}/stages/1/assign`)
        .send({
          machineToolId: 'MC-LATHE-MAN-01',
          operatorId: 'OP-01',
          overrideCategory: true,
          overrideCategoryReason: 'تست',
        });
      expect(assignRes.status).toBe(200);

      // Start the stage 1 so operator is 'working' / busy
      const startRes = await operatorAgent
        .post(`/api/v1/orders/${orderId1}/stages/1/start`)
        .send({});
      expect(startRes.status).toBe(200);

      // Attempt to assign same busy operator OP-01 to order 2 -> should fail with 409 OPERATOR_BUSY
      const conflictRes = await productionAgent
        .post(`/api/v1/orders/${orderId2}/stages/1/assign`)
        .send({
          machineToolId: 'MC-LATHE-CNC-01',
          operatorId: 'OP-01',
          overrideCategory: true,
          overrideCategoryReason: 'تست',
        });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.code).toBe('OPERATOR_BUSY');
    });

    it('Rule 1.3: Machine category mismatch requires explicit manager override with reason', async () => {
      const orderId = await createProductionReadyOrder();

      // PART-SC500-01 Stage 1 defaults to 'cnc_lathe' machine category
      // MC-MILL-GANTRY-01 is 'gantry_mill', which is a mismatch

      // Try assigning mismatch machine without override flag -> should fail (409)
      const mismatchRes = await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/assign`)
        .send({
          machineToolId: 'MC-MILL-GANTRY-01',
          operatorId: 'OP-01',
        });

      expect(mismatchRes.status).toBe(409);
      expect(mismatchRes.body.code).toBe('MACHINE_CATEGORY_MISMATCH');

      // Try assigning with override flag but NO reason -> should fail (400)
      const mismatchNoReasonRes = await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/assign`)
        .send({
          machineToolId: 'MC-MILL-GANTRY-01',
          operatorId: 'OP-01',
          overrideCategory: true,
        });

      expect(mismatchNoReasonRes.status).toBe(400);
      expect(mismatchNoReasonRes.body.code).toBe('OVERRIDE_REASON_REQUIRED');

      // Try with correct override and reason -> should succeed (200)
      const successRes = await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/assign`)
        .send({
          machineToolId: 'MC-MILL-GANTRY-01',
          operatorId: 'OP-01',
          overrideCategory: true,
          overrideCategoryReason: 'استفاده از فرز برای پرداخت خشن مجاز است',
        });

      expect(successRes.status).toBe(200);
    });

    it('Rule 1.4: Outsourced stage assigns contractor details and dates without machine', async () => {
      // PART-SC500-02 has an outsourced stage
      const orderId = await createProductionReadyOrder('PART-SC500-02');

      // Stage 1 must be completed first
      db.prepare("UPDATE order_stages SET status = 'completed' WHERE order_id = ? AND stage_number = 1").run(orderId);

      // Stage 2 is outsourced
      const outsourceRes = await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/2/assign`)
        .send({
          isOutsourced: true,
          contractorName: 'شرکت آبکاری شمال',
          sentDate: '2026-04-10',
          expectedReturnDate: '2026-04-15',
        });

      expect(outsourceRes.status).toBe(200);
      const updatedStage = outsourceRes.body.stages.find((s: { stageNumber: number }) => s.stageNumber === 2);
      expect(updatedStage.status).toBe('assigned');
      expect(updatedStage.contractorName).toBe('شرکت آبکاری شمال');
    });
  });

  describe('2. Stage Execution Lifecycle & Automatic Resource Release', () => {
    it('Flow 2.1: Start -> Pause -> Resume -> Finish with automatic resource release', async () => {
      const orderId = await createProductionReadyOrder();

      // Assign
      await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/assign`)
        .send({
          machineToolId: 'MC-LATHE-MAN-01',
          operatorId: 'OP-01',
          overrideCategory: true,
          overrideCategoryReason: 'تست',
        });

      // Start -> Marks machine 'active', operator 'working'
      const startRes = await operatorAgent
        .post(`/api/v1/orders/${orderId}/stages/1/start`)
        .send({});
      expect(startRes.status).toBe(200);

      const m1 = db.prepare("SELECT * FROM machines WHERE id = 'MC-LATHE-MAN-01'").get() as any;
      const op1 = db.prepare("SELECT * FROM operators WHERE id = 'OP-01'").get() as any;
      expect(m1.status).toBe('active');
      expect(op1.status).toBe('working');

      // Pause -> Marks machine 'idle', operator 'idle'
      const pauseRes = await operatorAgent
        .post(`/api/v1/orders/${orderId}/stages/1/pause`)
        .send({ reason: 'power_cut' });
      expect(pauseRes.status).toBe(200);

      const m2 = db.prepare("SELECT * FROM machines WHERE id = 'MC-LATHE-MAN-01'").get() as any;
      const op2 = db.prepare("SELECT * FROM operators WHERE id = 'OP-01'").get() as any;
      expect(m2.status).toBe('idle');
      expect(op2.status).toBe('idle');

      // Resume -> Marks active/working again
      const resumeRes = await operatorAgent
        .post(`/api/v1/orders/${orderId}/stages/1/resume`)
        .send({});
      expect(resumeRes.status).toBe(200);

      const m3 = db.prepare("SELECT * FROM machines WHERE id = 'MC-LATHE-MAN-01'").get() as any;
      expect(m3.status).toBe('active');

      // Report produced quantity -> Finishes stage & releases resources (machine and operator become idle)
      const progressRes = await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/progress`)
        .send({ producedQty: 5, scrapQty: 0 });
      expect(progressRes.status).toBe(200);

      const m4 = db.prepare("SELECT * FROM machines WHERE id = 'MC-LATHE-MAN-01'").get() as any;
      const op4 = db.prepare("SELECT * FROM operators WHERE id = 'OP-01'").get() as any;
      expect(m4.status).toBe('idle');
      expect(op4.status).toBe('idle');
    });

    it('Flow 2.2: Stage transfer to another machine due to bottleneck/reallocation', async () => {
      const orderId = await createProductionReadyOrder();

      // Assign to Lathe 1
      await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/assign`)
        .send({
          machineToolId: 'MC-LATHE-MAN-01',
          operatorId: 'OP-01',
          overrideCategory: true,
          overrideCategoryReason: 'تست',
        });

      // Transfer to CNC Lathe 1 (with explicit transfer reason)
      const transferRes = await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/transfer`)
        .send({
          machineToolId: 'MC-LATHE-CNC-01',
          operatorId: 'OP-01',
          reason: 'خرابی جزئی ابزاردهنده دستگاه اول و نیاز به اتمام سریع‌تر',
        });

      expect(transferRes.status).toBe(200);
      const stage = transferRes.body.stages[0];
      expect(stage.machineToolId).toBe('MC-LATHE-CNC-01');

      // Original machine Lathe 1 should be released (idle)
      const originalMachine = db.prepare("SELECT * FROM machines WHERE id = 'MC-LATHE-MAN-01'").get() as any;
      expect(originalMachine.status).toBe('idle');
    });
  });

  describe('3. Machine Breakdown Handling & Auto-Pausing Stages', () => {
    it('Reporting breakdown pauses running stages and marks machine breakdown', async () => {
      const orderId = await createProductionReadyOrder();

      // Assign and start
      await productionAgent
        .post(`/api/v1/orders/${orderId}/stages/1/assign`)
        .send({
          machineToolId: 'MC-LATHE-MAN-01',
          operatorId: 'OP-01',
          overrideCategory: true,
          overrideCategoryReason: 'تست',
        });
      await operatorAgent
        .post(`/api/v1/orders/${orderId}/stages/1/start`)
        .send({});

      // Report breakdown
      const breakdownRes = await productionAgent
        .post('/api/v1/machines/MC-LATHE-MAN-01/breakdown')
        .send({
          reason: 'overheating_spindle',
          reporterName: 'علی اکبری',
        });

      expect(breakdownRes.status).toBe(200);
      expect(breakdownRes.body.status).toBe('breakdown');

      // Running stage on that machine should be auto-paused
      const pausedStage = db.prepare("SELECT * FROM order_stages WHERE order_id = ? AND stage_number = 1").get(orderId) as any;
      expect(pausedStage.status).toBe('paused');
      expect(pausedStage.pause_reason).toContain('overheating_spindle');

      // Operator should be released (idle)
      const op = db.prepare("SELECT * FROM operators WHERE id = 'OP-01'").get() as any;
      expect(op.status).toBe('idle');
    });
  });
});
