import { describe, it, expect } from 'vitest';
import {
  calculateOtd,
  calculateScrapAndRework,
  calculateMachineEfficiency,
  calculateTimeVariances,
  calculateFoundryQualityScores,
} from '../server/services/analyticsService';

describe('Phase 9 Analytics Service KPI Calculations', () => {
  it('should accurately calculate On-Time Delivery (OTD) percentage and average delay', () => {
    const orders = [
      {
        created_date: '2026-01-01',
        deadline_date: '2026-01-10',
        updated_at: '2026-01-08T10:00:00Z', // On time
        status: 'completed',
      },
      {
        created_date: '2026-01-01',
        deadline_date: '2026-01-10',
        updated_at: '2026-01-10T15:00:00Z', // On time
        status: 'completed',
      },
      {
        created_date: '2026-01-01',
        deadline_date: '2026-01-10',
        updated_at: '2026-01-15T12:00:00Z', // 5 days late
        status: 'completed',
      },
    ];

    const result = calculateOtd(orders);

    expect(result.totalCompleted).toBe(3);
    expect(result.onTimeCount).toBe(2);
    expect(result.lateCount).toBe(1);
    expect(result.otdPercentage).toBe(66.7);
    expect(result.avgDelayDays).toBe(5);
  });

  it('should calculate scrap rate, rework rate, and QC rejection rate correctly', () => {
    const stages = [
      {
        stage_name: 'تراشکاری',
        produced_qty: 90,
        scrap_qty: 10,
        rework_count: 2,
      },
      {
        stage_name: 'فرزکاری',
        produced_qty: 95,
        scrap_qty: 5,
        rework_count: 1,
      },
    ];

    const qcReports = [
      { decision: 'approved' },
      { decision: 'approved' },
      { decision: 'rejected' },
      { decision: 'conditional' },
    ];

    const result = calculateScrapAndRework(stages, qcReports);

    expect(result.totalProducedQty).toBe(185);
    expect(result.totalScrapQty).toBe(15);
    expect(result.scrapRatePercent).toBe(7.5); // 15 / (185 + 15) = 7.5%
    expect(result.qcRejectionRatePercent).toBe(50); // 2 out of 4 non-approved = 50%
  });

  it('should calculate machine efficiency, MTBF, and MTTR', () => {
    const downtimes = [
      { duration_minutes: 120, reason: 'خرابی اسپیندل', category: 'mechanical' },
      { duration_minutes: 60, reason: 'مشکل اینورتر', category: 'electrical' },
    ];

    const result = calculateMachineEfficiency(5, 2400, downtimes, 30);

    expect(result.totalMachines).toBe(5);
    expect(result.totalDowntimeHours).toBe(3); // (120+60)/60 = 3h
    expect(result.totalOperatingHours).toBe(40); // 2400/60 = 40h
    expect(result.mtbfHours).toBe(20); // 40h / 2 breakdowns = 20h
    expect(result.mttrHours).toBe(1.5); // 3h / 2 breakdowns = 1.5h
  });

  it('should calculate actual vs estimated stage time variance and flag updates', () => {
    const stages = [
      {
        stage_number: 1,
        stage_name: 'تراشکاری پوسته',
        estimated_minutes: 60,
        actual_working_minutes: 90, // +50% variance
      },
      {
        stage_number: 2,
        stage_name: 'فرزکاری سوراخ‌ها',
        estimated_minutes: 60,
        actual_working_minutes: 62, // +3.3% variance
      },
    ];

    const result = calculateTimeVariances(stages);

    expect(result.length).toBe(2);
    expect(result[0].variancePercent).toBe(50);
    expect(result[0].recommendationUpdate).toBe(true); // > 15%
    expect(result[1].recommendationUpdate).toBe(false);
  });

  it('should dynamically calculate foundry and supplier quality ratings', () => {
    const quotes = [
      { supplier_name: 'ریخته‌گری ایران ذوب', supplier_type: 'foundry', delivery_time_days: 10, amount_rials: 50000000 },
    ];
    const qcReports = [
      { inspector_name: 'مهندس رضایی', decision: 'approved' },
      { inspector_name: 'مهندس رضایی', decision: 'rejected' },
    ];

    const result = calculateFoundryQualityScores(quotes, qcReports);

    expect(result.totalQuotes).toBe(1);
    expect(result.supplierPerformance.length).toBe(1);
    expect(result.supplierPerformance[0].supplierName).toBe('ریخته‌گری ایران ذوب');
    expect(result.supplierPerformance[0].calculatedQualityScore).toBe(2.5); // 5.0 * (1 - 0.5)
  });
});
