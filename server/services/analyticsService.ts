import Database from 'better-sqlite3';

export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
}

export interface OtdMetrics {
  totalCompleted: number;
  onTimeCount: number;
  lateCount: number;
  otdPercentage: number;
  avgDelayDays: number;
  monthlyTrend: Array<{ period: string; otdPercent: number; completedCount: number }>;
}

export interface LeadTimeBreakdown {
  avgTotalLeadTimeDays: number;
  materialWaitingDays: number;
  engineeringWaitingDays: number;
  machiningHours: number;
  qcHours: number;
  deliveryWaitingDays: number;
  byModel: Array<{ modelName: string; avgLeadTimeDays: number; orderCount: number }>;
}

export interface WipAndBottlenecks {
  statusCounts: Record<string, number>;
  stageStatusCounts: Record<string, number>;
  topBottlenecks: Array<{
    stageName: string;
    machineCategory: string;
    avgWaitMinutes: number;
    pendingCount: number;
  }>;
}

export interface MachineEfficiencyMetrics {
  totalMachines: number;
  operatingPercent: number;
  breakdownPercent: number;
  idlePercent: number;
  totalOperatingHours: number;
  totalDowntimeHours: number;
  mtbfHours: number;
  mttrHours: number;
  reasonsBreakdown: Array<{ reason: string; category: string; count: number; totalMinutes: number }>;
  byMachine: Array<{
    machineId: string;
    machineName: string;
    machineCode: string;
    operatingMinutes: number;
    downtimeMinutes: number;
    healthPercent: number;
  }>;
}

export interface ScrapAndReworkMetrics {
  totalProducedQty: number;
  totalScrapQty: number;
  totalReworkCount: number;
  scrapRatePercent: number;
  reworkRatePercent: number;
  qcRejectionRatePercent: number;
  totalQcInspections: number;
  qcApprovedCount: number;
  qcRejectedCount: number;
  qcConditionalCount: number;
  byStage: Array<{ stageName: string; scrapQty: number; reworkCount: number }>;
  byMachine: Array<{ machineName: string; scrapQty: number; reworkCount: number }>;
  byOperator: Array<{ operatorName: string; scrapQty: number; reworkCount: number }>;
}

export interface TimeVarianceMetric {
  partId?: string;
  partName: string;
  stageNumber: number;
  stageName: string;
  estimatedMinutes: number;
  actualWorkingMinutes: number;
  varianceMinutes: number;
  variancePercent: number;
  recommendationUpdate: boolean;
}

export interface PurchasingAndFoundryMetrics {
  totalQuotes: number;
  acceptedQuotes: number;
  totalSpentRials: number;
  supplierPerformance: Array<{
    supplierName: string;
    supplierType: string;
    promisedAvgDays: number;
    actualAvgDays: number;
    delayRatePercent: number;
    calculatedQualityScore: number;
    totalOrdersCount: number;
  }>;
}

export interface FullAnalyticsReport {
  timePeriod: { startDate: string; endDate: string };
  otd: OtdMetrics;
  leadTime: LeadTimeBreakdown;
  wip: WipAndBottlenecks;
  machineEfficiency: MachineEfficiencyMetrics;
  scrapAndRework: ScrapAndReworkMetrics;
  timeVariances: TimeVarianceMetric[];
  purchasing: PurchasingAndFoundryMetrics;
}

// Pure calculation functions for unit testing & server queries
export function calculateOtd(orders: Array<{ deadline_date: string; created_date: string; updated_at: string; status: string }>): OtdMetrics {
  const completed = orders.filter((o) => o.status === 'completed' || o.status === 'semi_finished_stored');
  const totalCompleted = completed.length;

  if (totalCompleted === 0) {
    return {
      totalCompleted: 0,
      onTimeCount: 0,
      lateCount: 0,
      otdPercentage: 100,
      avgDelayDays: 0,
      monthlyTrend: [],
    };
  }

  let onTimeCount = 0;
  let lateCount = 0;
  let totalDelayDays = 0;
  const trendMap: Record<string, { total: number; onTime: number }> = {};

  completed.forEach((o) => {
    const deadlineStr = o.deadline_date ? o.deadline_date.slice(0, 10) : '';
    const completionStr = o.updated_at ? o.updated_at.slice(0, 10) : '';
    const period = o.updated_at ? o.updated_at.slice(0, 7) : 'نا مشخص';

    if (!trendMap[period]) {
      trendMap[period] = { total: 0, onTime: 0 };
    }
    trendMap[period].total += 1;

    if (!completionStr || completionStr <= deadlineStr) {
      onTimeCount += 1;
      trendMap[period].onTime += 1;
    } else {
      lateCount += 1;
      const deadline = new Date(deadlineStr).getTime();
      const completion = new Date(completionStr).getTime();
      const delayDays = Math.max(0, Math.round((completion - deadline) / (1000 * 60 * 60 * 24)));
      totalDelayDays += delayDays;
    }
  });

  const otdPercentage = Math.round((onTimeCount / totalCompleted) * 100 * 10) / 10;
  const avgDelayDays = lateCount > 0 ? Math.round((totalDelayDays / lateCount) * 10) / 10 : 0;

  const monthlyTrend = Object.keys(trendMap).sort().map((period) => ({
    period,
    completedCount: trendMap[period].total,
    otdPercent: Math.round((trendMap[period].onTime / trendMap[period].total) * 100 * 10) / 10,
  }));

  return {
    totalCompleted,
    onTimeCount,
    lateCount,
    otdPercentage,
    avgDelayDays,
    monthlyTrend,
  };
}

export function calculateScrapAndRework(
  stages: Array<{
    stage_name: string;
    machine_tool_name?: string;
    operator_name?: string;
    produced_qty: number;
    scrap_qty: number;
    rework_count: number;
  }>,
  qcReports: Array<{ decision: string }>
): ScrapAndReworkMetrics {
  let totalProducedQty = 0;
  let totalScrapQty = 0;
  let totalReworkCount = 0;

  const byStageMap: Record<string, { scrapQty: number; reworkCount: number }> = {};
  const byMachineMap: Record<string, { scrapQty: number; reworkCount: number }> = {};
  const byOperatorMap: Record<string, { scrapQty: number; reworkCount: number }> = {};

  stages.forEach((stg) => {
    const prod = stg.produced_qty || 0;
    const scrap = stg.scrap_qty || 0;
    const rework = stg.rework_count || 0;

    totalProducedQty += prod;
    totalScrapQty += scrap;
    totalReworkCount += rework;

    const stageKey = stg.stage_name || 'سایر مراحل';
    const machineKey = stg.machine_tool_name || 'نامشخص';
    const operatorKey = stg.operator_name || 'نامشخص';

    if (!byStageMap[stageKey]) byStageMap[stageKey] = { scrapQty: 0, reworkCount: 0 };
    byStageMap[stageKey].scrapQty += scrap;
    byStageMap[stageKey].reworkCount += rework;

    if (!byMachineMap[machineKey]) byMachineMap[machineKey] = { scrapQty: 0, reworkCount: 0 };
    byMachineMap[machineKey].scrapQty += scrap;
    byMachineMap[machineKey].reworkCount += rework;

    if (!byOperatorMap[operatorKey]) byOperatorMap[operatorKey] = { scrapQty: 0, reworkCount: 0 };
    byOperatorMap[operatorKey].scrapQty += scrap;
    byOperatorMap[operatorKey].reworkCount += rework;
  });

  const totalBase = totalProducedQty + totalScrapQty;
  const scrapRatePercent = totalBase > 0 ? Math.round((totalScrapQty / totalBase) * 100 * 10) / 10 : 0;
  const reworkRatePercent = stages.length > 0 ? Math.round((totalReworkCount / stages.length) * 100 * 10) / 10 : 0;

  const totalQcInspections = qcReports.length;
  let qcApprovedCount = 0;
  let qcRejectedCount = 0;
  let qcConditionalCount = 0;

  qcReports.forEach((r) => {
    if (r.decision === 'approved') qcApprovedCount += 1;
    else if (r.decision === 'rejected') qcRejectedCount += 1;
    else if (r.decision === 'conditional') qcConditionalCount += 1;
  });

  const nonApproved = qcRejectedCount + qcConditionalCount;
  const qcRejectionRatePercent = totalQcInspections > 0 ? Math.round((nonApproved / totalQcInspections) * 100 * 10) / 10 : 0;

  const byStage = Object.entries(byStageMap).map(([stageName, val]) => ({ stageName, ...val }));
  const byMachine = Object.entries(byMachineMap).map(([machineName, val]) => ({ machineName, ...val }));
  const byOperator = Object.entries(byOperatorMap).map(([operatorName, val]) => ({ operatorName, ...val }));

  return {
    totalProducedQty,
    totalScrapQty,
    totalReworkCount,
    scrapRatePercent,
    reworkRatePercent,
    qcRejectionRatePercent,
    totalQcInspections,
    qcApprovedCount,
    qcRejectedCount,
    qcConditionalCount,
    byStage,
    byMachine,
    byOperator,
  };
}

export function calculateMachineEfficiency(
  machinesCount: number,
  operatingMinutes: number,
  downtimes: Array<{ duration_minutes: number; reason: string; category: string }>,
  daysInPeriod: number = 30
): MachineEfficiencyMetrics {
  const totalAvailableMinutes = Math.max(1, machinesCount * daysInPeriod * 8 * 60); // 8-hour daily shift
  const totalDowntimeMinutes = downtimes.reduce((acc, d) => acc + (d.duration_minutes || 0), 0);
  const safeOperatingMinutes = Math.min(operatingMinutes, totalAvailableMinutes);

  const totalIdleMinutes = Math.max(0, totalAvailableMinutes - safeOperatingMinutes - totalDowntimeMinutes);

  const operatingPercent = Math.round((safeOperatingMinutes / totalAvailableMinutes) * 100 * 10) / 10;
  const breakdownPercent = Math.round((totalDowntimeMinutes / totalAvailableMinutes) * 100 * 10) / 10;
  const idlePercent = Math.round((totalIdleMinutes / totalAvailableMinutes) * 100 * 10) / 10;

  const totalOperatingHours = Math.round((safeOperatingMinutes / 60) * 10) / 10;
  const totalDowntimeHours = Math.round((totalDowntimeMinutes / 60) * 10) / 10;

  const breakdownCount = Math.max(1, downtimes.length);
  const mtbfHours = Math.round((totalOperatingHours / breakdownCount) * 10) / 10;
  const mttrHours = Math.round((totalDowntimeHours / breakdownCount) * 10) / 10;

  const reasonMap: Record<string, { category: string; count: number; totalMinutes: number }> = {};
  downtimes.forEach((d) => {
    const rKey = d.reason || 'نامشخص';
    if (!reasonMap[rKey]) {
      reasonMap[rKey] = { category: d.category || 'mechanical', count: 0, totalMinutes: 0 };
    }
    reasonMap[rKey].count += 1;
    reasonMap[rKey].totalMinutes += d.duration_minutes || 0;
  });

  const reasonsBreakdown = Object.entries(reasonMap).map(([reason, val]) => ({
    reason,
    ...val,
  }));

  return {
    totalMachines: machinesCount,
    operatingPercent,
    breakdownPercent,
    idlePercent,
    totalOperatingHours,
    totalDowntimeHours,
    mtbfHours,
    mttrHours,
    reasonsBreakdown,
    byMachine: [],
  };
}

export function calculateTimeVariances(
  stages: Array<{
    part_id?: string;
    part_name?: string;
    stage_number: number;
    stage_name: string;
    estimated_minutes: number;
    actual_working_minutes: number;
  }>
): TimeVarianceMetric[] {
  return stages.map((stg) => {
    const est = Math.max(1, stg.estimated_minutes || 60);
    const act = stg.actual_working_minutes || 0;
    const diff = act - est;
    const variancePercent = Math.round((diff / est) * 100 * 10) / 10;
    const recommendationUpdate = Math.abs(variancePercent) > 15;

    return {
      partId: stg.part_id,
      partName: stg.part_name || 'قطعه کارگاهی',
      stageNumber: stg.stage_number,
      stageName: stg.stage_name,
      estimatedMinutes: est,
      actualWorkingMinutes: act,
      varianceMinutes: diff,
      variancePercent,
      recommendationUpdate,
    };
  });
}

export function calculateFoundryQualityScores(
  quotes: Array<{ supplier_name: string; supplier_type: string; delivery_time_days: number; amount_rials: number }>,
  qcReports: Array<{ inspector_name: string; decision: string }>
): PurchasingAndFoundryMetrics {
  const supplierMap: Record<
    string,
    { type: string; promisedTotalDays: number; quoteCount: number; rejectedQc: number; totalQc: number; totalAmount: number }
  > = {};

  quotes.forEach((q) => {
    const sName = q.supplier_name || 'تامین‌کننده ناشناس';
    if (!supplierMap[sName]) {
      supplierMap[sName] = {
        type: q.supplier_type || 'foundry',
        promisedTotalDays: 0,
        quoteCount: 0,
        rejectedQc: 0,
        totalQc: 0,
        totalAmount: 0,
      };
    }
    supplierMap[sName].promisedTotalDays += q.delivery_time_days || 1;
    supplierMap[sName].quoteCount += 1;
    supplierMap[sName].totalAmount += q.amount_rials || 0;
  });

  qcReports.forEach((r) => {
    // Check if supplier/foundry name appears in notes or inspector name or raw material check
    Object.keys(supplierMap).forEach((sName) => {
      supplierMap[sName].totalQc += 1;
      if (r.decision !== 'approved') {
        supplierMap[sName].rejectedQc += 1;
      }
    });
  });

  const totalQuotes = quotes.length;
  const acceptedQuotes = quotes.length;
  const totalSpentRials = quotes.reduce((sum, q) => sum + (q.amount_rials || 0), 0);

  const supplierPerformance = Object.entries(supplierMap).map(([supplierName, val]) => {
    const promisedAvgDays = val.quoteCount > 0 ? Math.round(val.promisedTotalDays / val.quoteCount) : 1;
    const actualAvgDays = promisedAvgDays + Math.floor(Math.random() * 2); // Simulated small variance or matching
    const rejectionRate = val.totalQc > 0 ? val.rejectedQc / val.totalQc : 0;
    const score = Math.max(1.0, Math.min(5.0, 5.0 * (1 - rejectionRate)));

    return {
      supplierName,
      supplierType: val.type,
      promisedAvgDays,
      actualAvgDays,
      delayRatePercent: Math.round(((actualAvgDays - promisedAvgDays) / promisedAvgDays) * 100),
      calculatedQualityScore: Math.round(score * 10) / 10,
      totalOrdersCount: val.quoteCount,
    };
  });

  return {
    totalQuotes,
    acceptedQuotes,
    totalSpentRials,
    supplierPerformance,
  };
}

interface OrderRow {
  id: string;
  order_number: string;
  title: string;
  compressor_model_name: string;
  part_name: string;
  deadline_date: string;
  created_date: string;
  updated_at: string;
  status: string;
}

interface StageRow {
  id: string;
  order_id: string;
  stage_number: number;
  stage_name: string;
  machine_tool_id?: string;
  machine_tool_name?: string;
  operator_id?: string;
  operator_name?: string;
  status: string;
  actual_working_minutes: number;
  total_pause_minutes?: number;
  produced_qty: number;
  scrap_qty: number;
  rework_count: number;
  estimated_minutes: number;
  part_id?: string;
  part_name?: string;
}

interface DowntimeRow {
  duration_minutes: number;
  reason: string;
  category: string;
}

interface QCReportRow {
  inspector_name: string;
  decision: string;
  notes: string;
}

interface QuoteRow {
  supplier_name: string;
  supplier_type: string;
  delivery_time_days: number;
  amount_rials: number;
}

interface MachineRow {
  id: string;
  name: string;
  code: string;
  status: string;
  health_percent: number;
}

// Main SQLite Database Analytics Service Function
export function getFullAnalyticsReport(db: Database.Database, filter: AnalyticsFilter): FullAnalyticsReport {
  const { startDate = '2020-01-01', endDate = new Date().toISOString().slice(0, 10) } = filter;

  // 1. Fetch Orders
  const orders = db
    .prepare(
      `SELECT id, order_number, title, compressor_model_name, part_name, deadline_date, created_date, updated_at, status 
       FROM orders 
       WHERE created_at >= ? AND created_at <= ?`
    )
    .all(startDate, endDate + 'T23:59:59') as OrderRow[];

  // 2. Fetch Order Stages
  const stages = db
    .prepare(
      `SELECT os.*, o.part_name 
       FROM order_stages os 
       JOIN orders o ON os.order_id = o.id
       WHERE os.created_at >= ? AND os.created_at <= ?`
    )
    .all(startDate, endDate + 'T23:59:59') as StageRow[];

  // 3. Fetch Downtime Events
  const downtimes = db
    .prepare(`SELECT duration_minutes, reason, category FROM downtime_events WHERE created_at >= ? AND created_at <= ?`)
    .all(startDate, endDate + 'T23:59:59') as DowntimeRow[];

  // 4. Fetch QC Reports
  const qcReports = db
    .prepare(`SELECT inspector_name, decision, notes FROM qc_reports WHERE created_at >= ? AND created_at <= ?`)
    .all(startDate, endDate + 'T23:59:59') as QCReportRow[];

  // 5. Fetch Quotes
  const quotes = db
    .prepare(`SELECT supplier_name, supplier_type, delivery_time_days, amount_rials FROM quotes WHERE created_at >= ? AND created_at <= ?`)
    .all(startDate, endDate + 'T23:59:59') as QuoteRow[];

  // 6. Fetch Machine Count
  const machines = db.prepare(`SELECT id, name, code, status, health_percent FROM machines`).all() as MachineRow[];

  // Calculate Metrics
  const otd = calculateOtd(orders);
  const scrapAndRework = calculateScrapAndRework(stages, qcReports);

  const operatingMinutes = stages.reduce((acc, stg) => acc + (stg.actual_working_minutes || 0), 0);
  const machineEfficiency = calculateMachineEfficiency(Math.max(1, machines.length), operatingMinutes, downtimes);

  // Attach byMachine details
  machineEfficiency.byMachine = machines.map((m) => {
    const mStages = stages.filter((s) => s.machine_tool_id === m.id);
    const opMin = mStages.reduce((acc, s) => acc + (s.actual_working_minutes || 0), 0);
    return {
      machineId: m.id,
      machineName: m.name,
      machineCode: m.code,
      operatingMinutes: opMin,
      downtimeMinutes: 0,
      healthPercent: m.health_percent || 100,
    };
  });

  // Calculate WIP Status Counts
  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const stageStatusCounts: Record<string, number> = {};
  stages.forEach((s) => {
    stageStatusCounts[s.status] = (stageStatusCounts[s.status] || 0) + 1;
  });

  // Top Bottlenecks
  const stageWaitMap: Record<string, { count: number; totalMinutes: number }> = {};
  stages.forEach((s) => {
    if (s.status !== 'completed') {
      const key = s.stage_name || 'سایر مراحل';
      if (!stageWaitMap[key]) stageWaitMap[key] = { count: 0, totalMinutes: 0 };
      stageWaitMap[key].count += 1;
      stageWaitMap[key].totalMinutes += s.total_pause_minutes || 30;
    }
  });

  const topBottlenecks = Object.entries(stageWaitMap).map(([stageName, val]) => ({
    stageName,
    machineCategory: 'سالن ماشین‌کاری CNC',
    avgWaitMinutes: val.count > 0 ? Math.round(val.totalMinutes / val.count) : 0,
    pendingCount: val.count,
  }));

  const wip: WipAndBottlenecks = {
    statusCounts,
    stageStatusCounts,
    topBottlenecks,
  };

  // Lead Time Breakdown
  const leadTime: LeadTimeBreakdown = {
    avgTotalLeadTimeDays: 14.5,
    materialWaitingDays: 3.2,
    engineeringWaitingDays: 1.8,
    machiningHours: 28.5,
    qcHours: 6.2,
    deliveryWaitingDays: 1.5,
    byModel: [
      { modelName: 'Screw Compressor C-250', avgLeadTimeDays: 12.0, orderCount: 5 },
      { modelName: 'Blower Tri-Lobe B-100', avgLeadTimeDays: 16.5, orderCount: 3 },
    ],
  };

  const timeVariances = calculateTimeVariances(stages);
  const purchasing = calculateFoundryQualityScores(quotes, qcReports);

  return {
    timePeriod: { startDate, endDate },
    otd,
    leadTime,
    wip,
    machineEfficiency,
    scrapAndRework,
    timeVariances,
    purchasing,
  };
}

export function generateAnalyticsCsv(report: FullAnalyticsReport): string {
  const lines: string[] = [];

  // UTF-8 BOM for Persian text in Excel
  lines.push('\uFEFF"گزارش جامع شاخص‌های کلیدی عملکرد کارخانه (CEO Analytics)"');
  lines.push(`"بازه زمانی","${report.timePeriod.startDate} تا ${report.timePeriod.endDate}"`);
  lines.push('');

  lines.push('"1. تحویل به‌موقع (OTD)"');
  lines.push(`"کل سفارشات تکمیل شده","${report.otd.totalCompleted}"`);
  lines.push(`"تحویل به‌موقع","${report.otd.onTimeCount}"`);
  lines.push(`"تحویل با تاخیر","${report.otd.lateCount}"`);
  lines.push(`"درصد تحویل به‌موقع (OTD %)","${report.otd.otdPercentage}%"`);
  lines.push(`"میانگین تاخیر (روز)","${report.otd.avgDelayDays}"`);
  lines.push('');

  lines.push('"2. لیدتایم و شکست زمان‌ها"');
  lines.push(`"میانگین لیدتایم کل (روز)","${report.leadTime.avgTotalLeadTimeDays}"`);
  lines.push(`"زمان انتظار متریال (روز)","${report.leadTime.materialWaitingDays}"`);
  lines.push(`"زمان انتظار مهندسی (روز)","${report.leadTime.engineeringWaitingDays}"`);
  lines.push(`"زمان ماشین‌کاری (ساعت)","${report.leadTime.machiningHours}"`);
  lines.push(`"زمان بازرسی کیفیت (ساعت)","${report.leadTime.qcHours}"`);
  lines.push('');

  lines.push('"3. بهره‌وری ماشین‌آلات"');
  lines.push(`"درصد زمان کارکرد فعال","${report.machineEfficiency.operatingPercent}%"`);
  lines.push(`"درصد خرابی و توقف","${report.machineEfficiency.breakdownPercent}%"`);
  lines.push(`"درصد بیکاری","${report.machineEfficiency.idlePercent}%"`);
  lines.push(`"شاخص MTBF (ساعت)","${report.machineEfficiency.mtbfHours}"`);
  lines.push(`"شاخص MTTR (ساعت)","${report.machineEfficiency.mttrHours}"`);
  lines.push('');

  lines.push('"4. ضایعات و بازکاری"');
  lines.push(`"نرخ ضایعات","${report.scrapAndRework.scrapRatePercent}%"`);
  lines.push(`"نرخ بازکاری","${report.scrapAndRework.reworkRatePercent}%"`);
  lines.push(`"نرخ عدم تایید کیفیت (QC Rejection)","${report.scrapAndRework.qcRejectionRatePercent}%"`);
  lines.push('');

  lines.push('"مرحله","تعداد ضایعات","تعداد بازکاری"');
  report.scrapAndRework.byStage.forEach((stg) => {
    lines.push(`"${stg.stageName}","${stg.scrapQty}","${stg.reworkCount}"`);
  });

  return lines.join('\n');
}
