import { useState, useEffect } from 'react';
import {
  UserRole,
  CompressorModel,
  PartDefinition,
  MachineTool,
  FoundryPartner,
  OperatorProfile,
  ProductionOrder,
  WarehouseItem,
  SystemNotification,
  Quote,
  StageEngineeringDoc,
  StageExecutionProgress,
  StageQCReport,
  StageEngineeringApproval,
  Priority,
  SystemUser
} from '../types';
import {
  INITIAL_COMPRESSOR_MODELS,
  INITIAL_PARTS,
  INITIAL_MACHINE_TOOLS,
  INITIAL_FOUNDRIES,
  INITIAL_OPERATORS,
  INITIAL_ORDERS,
  INITIAL_WAREHOUSE,
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS
} from './initialData';

const STORAGE_KEY_PREFIX = 'mes_compressor_';

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export function useMESStore() {
  const [users, setUsers] = useState<SystemUser[]>(() =>
    getStoredItem<SystemUser[]>('users', INITIAL_USERS)
  );

  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() =>
    getStoredItem<SystemUser | null>('current_user', INITIAL_USERS[0]) // Default logged in as admin for immediate usability
  );

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => 
    currentUser ? currentUser.role : getStoredItem<UserRole>('current_role', 'super_admin')
  );

  const [compressorModels, setCompressorModels] = useState<CompressorModel[]>(() =>
    getStoredItem<CompressorModel[]>('models', INITIAL_COMPRESSOR_MODELS)
  );

  const [parts, setParts] = useState<PartDefinition[]>(() =>
    getStoredItem<PartDefinition[]>('parts', INITIAL_PARTS)
  );

  const [machineTools, setMachineTools] = useState<MachineTool[]>(() =>
    getStoredItem<MachineTool[]>('machines', INITIAL_MACHINE_TOOLS)
  );

  const [foundries, setFoundries] = useState<FoundryPartner[]>(() =>
    getStoredItem<FoundryPartner[]>('foundries', INITIAL_FOUNDRIES)
  );

  const [operators, setOperators] = useState<OperatorProfile[]>(() =>
    getStoredItem<OperatorProfile[]>('operators', INITIAL_OPERATORS)
  );

  const [orders, setOrders] = useState<ProductionOrder[]>(() =>
    getStoredItem<ProductionOrder[]>('orders', INITIAL_ORDERS)
  );

  const [warehouse, setWarehouse] = useState<WarehouseItem[]>(() =>
    getStoredItem<WarehouseItem[]>('warehouse', INITIAL_WAREHOUSE)
  );

  const [notifications, setNotifications] = useState<SystemNotification[]>(() =>
    getStoredItem<SystemNotification[]>('notifications', INITIAL_NOTIFICATIONS)
  );

  // Sync to localStorage
  useEffect(() => { setStoredItem('users', users); }, [users]);
  useEffect(() => { setStoredItem('current_user', currentUser); }, [currentUser]);
  useEffect(() => { setStoredItem('current_role', currentUserRole); }, [currentUserRole]);
  useEffect(() => { setStoredItem('models', compressorModels); }, [compressorModels]);
  useEffect(() => { setStoredItem('parts', parts); }, [parts]);
  useEffect(() => { setStoredItem('machines', machineTools); }, [machineTools]);
  useEffect(() => { setStoredItem('foundries', foundries); }, [foundries]);
  useEffect(() => { setStoredItem('operators', operators); }, [operators]);
  useEffect(() => { setStoredItem('orders', orders); }, [orders]);
  useEffect(() => { setStoredItem('warehouse', warehouse); }, [warehouse]);
  useEffect(() => { setStoredItem('notifications', notifications); }, [notifications]);

  // Helper to add notification
  const addNotification = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error',
    targetRoles: UserRole[],
    linkOrderId?: string
  ) => {
    const newNotif: SystemNotification = {
      id: 'NOTIF-' + Date.now().toString().slice(-6),
      title,
      message,
      type,
      targetRoles,
      createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      linkOrderId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // --- ORDER WORKFLOW METHODS ---

  // 1. Create order (CEO or Planning)
  const createOrder = (params: {
    title: string;
    isCustomOrder: boolean;
    customDetails?: {
      partName: string;
      application: string;
      material: string;
      technicalSpecs: string;
      sampleProvided: boolean;
    };
    compressorModelId?: string;
    compressorModelName?: string;
    partId?: string;
    partName: string;
    partNumber: string;
    quantity: number;
    priority: Priority;
    deadlineDate: string;
    notes?: string;
    createdByRole: UserRole;
    createdByName: string;
  }) => {
    const orderId = 'PO-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
    const orderNum = `PO-${orderId.split('-')[2]}/${params.partNumber.slice(0, 6)}`;

    // Prepare default stages if part is known
    let initialStages: StageExecutionProgress[] = [];
    if (!params.isCustomOrder && params.partId) {
      const selectedPart = parts.find(p => p.id === params.partId);
      if (selectedPart && selectedPart.defaultStages.length > 0) {
        initialStages = selectedPart.defaultStages.map(stg => ({
          stageNumber: stg.stageNumber,
          stageName: stg.name,
          status: 'not_started',
          plannedQty: params.quantity,
          producedQty: 0,
          scrapQty: 0,
          qcApproved: false,
          isOutsourced: stg.isOutsourced
        }));
      }
    }

    const newOrder: ProductionOrder = {
      id: orderId,
      orderNumber: orderNum,
      title: params.title,
      isCustomOrder: params.isCustomOrder,
      customDetails: params.customDetails,
      compressorModelId: params.compressorModelId,
      compressorModelName: params.compressorModelName,
      partId: params.partId,
      partName: params.partName,
      partNumber: params.partNumber,
      quantity: params.quantity,
      priority: params.priority,
      deadlineDate: params.deadlineDate,
      createdDate: new Date().toLocaleDateString('fa-IR'),
      createdByRole: params.createdByRole,
      createdByName: params.createdByName,
      status: params.createdByRole === 'ceo' ? 'pending_planning' : 'planning_inquiry',
      quotes: [],
      engineeringDocs: [],
      stages: initialStages,
      completionPercentage: 5,
      notes: params.notes
    };

    setOrders(prev => [newOrder, ...prev]);

    addNotification(
      `سفارش جدید صادر شد: ${newOrder.orderNumber}`,
      `دستور ساخت برای ${params.partName} (تعداد: ${params.quantity}) با اولویت ${params.priority === 'emergency' ? 'اورژانسی' : params.priority === 'urgent' ? 'فوری' : 'عادی'} ثبت گردید.`,
      'info',
      ['planning', 'ceo'],
      orderId
    );

    return newOrder;
  };

  // 2. Planning: Add Quote from Foundry/Vendor & Send to CEO
  const addQuoteToOrder = (orderId: string, quoteData: {
    supplierName: string;
    supplierType: 'foundry' | 'raw_material' | 'outsourcing' | 'importer';
    amountRials: number;
    deliveryTimeDays: number;
    notes?: string;
    attachmentFileName?: string;
  }) => {
    const newQuote: Quote = {
      id: 'Q-' + Date.now().toString().slice(-5),
      orderId,
      supplierName: quoteData.supplierName,
      supplierType: quoteData.supplierType,
      amountRials: quoteData.amountRials,
      deliveryTimeDays: quoteData.deliveryTimeDays,
      dateSubmitted: new Date().toLocaleDateString('fa-IR'),
      status: 'pending_ceo',
      notes: quoteData.notes,
      attachmentFileName: quoteData.attachmentFileName || 'پیش‌فاکتور-استعلام-رسمی.pdf',
      attachmentFileType: 'pdf',
      submittedBy: 'واحد برنامه‌ریزی و تدارکات'
    };

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: 'pending_ceo_quote',
          quotes: [...ord.quotes, newQuote]
        };
      }
      return ord;
    }));

    addNotification(
      'پیش‌فاکتور جدید آماده تایید مدیرعامل',
      `پیش‌فاکتور از ${quoteData.supplierName} به مبلغ ${quoteData.amountRials.toLocaleString()} ریال برای سفارش ${orderId} ثبت شد.`,
      'warning',
      ['ceo'],
      orderId
    );
  };

  // 3. CEO: Approve or Reject Quote
  const decideOnQuote = (orderId: string, quoteId: string, decision: 'approved' | 'rejected', reason?: string) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const updatedQuotes = ord.quotes.map(q => {
          if (q.id === quoteId) {
            return {
              ...q,
              status: decision === 'approved' ? ('approved_by_ceo' as const) : ('rejected_by_ceo' as const),
              rejectionReason: reason,
              decidedAt: new Date().toLocaleDateString('fa-IR')
            };
          }
          return q;
        });

        const newStatus = decision === 'approved' ? 'material_ordered' : 'quote_rejected';

        return {
          ...ord,
          quotes: updatedQuotes,
          status: newStatus
        };
      }
      return ord;
    }));

    addNotification(
      decision === 'approved' ? 'پیش‌فاکتور تایید شد' : 'پیش‌فاکتور رد شد',
      decision === 'approved'
        ? `پیش‌فاکتور سفارش ${orderId} توسط مدیرعامل تایید شد و دستور خرید متریال/ریخته‌گری صادر گردید.`
        : `پیش‌فاکتور سفارش ${orderId} رد شد. دلیل: ${reason || 'عدم توافق روی قیمت/زمان'}`,
      decision === 'approved' ? 'success' : 'error',
      ['planning'],
      orderId
    );
  };

  // 4. Planning: Material Arrived -> Issue PO & Request Engineering Drawings
  const markMaterialReceivedAndIssuePO = (orderId: string) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: 'awaiting_engineering',
          completionPercentage: 20
        };
      }
      return ord;
    }));

    addNotification(
      'متریال دریافت شد - درخواست نقشه مهندسی',
      `متریال/قطعه ریخته‌گری سفارش ${orderId} تحویل شد. لطفاً نقشه‌های ساخت و فایل‌های STEP برای تمامی مراحل بارگذاری شوند.`,
      'info',
      ['engineering', 'planning'],
      orderId
    );
  };

  // 5. Engineering: Upload Drawing / STEP for stage and Approve
  const uploadEngineeringDoc = (orderId: string, doc: {
    stageNumber: number;
    stageName: string;
    drawingNumber: string;
    drawingFileName: string;
    stepFileName: string;
    notes?: string;
  }) => {
    const newDoc: StageEngineeringDoc = {
      stageNumber: doc.stageNumber,
      stageName: doc.stageName,
      drawingNumber: doc.drawingNumber,
      drawingFileName: doc.drawingFileName,
      stepFileName: doc.stepFileName,
      uploadedAt: new Date().toLocaleDateString('fa-IR'),
      uploadedBy: 'واحد مهندسی مکانیک',
      isApproved: true,
      notes: doc.notes,
      cadPreviewData: {
        primitiveShape: doc.stageName.includes('پوسته') || doc.stageName.includes('سیلندر') ? 'casing_block' :
                        doc.stageName.includes('روتور') || doc.stageName.includes('ماردون') ? 'cylinder_rotor' : 'flange_head',
        dimensions: { length: 300, diameter: 150 }
      }
    };

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const existingDocs = ord.engineeringDocs.filter(d => d.stageNumber !== doc.stageNumber);
        const updatedDocs = [...existingDocs, newDoc].sort((a, b) => a.stageNumber - b.stageNumber);
        
        // If all stages have engineering docs approved, transition to engineering_approved
        const requiredStagesCount = ord.stages.length > 0 ? ord.stages.length : 1;
        const allCovered = updatedDocs.length >= requiredStagesCount;

        return {
          ...ord,
          engineeringDocs: updatedDocs,
          status: allCovered ? 'engineering_approved' : ord.status,
          completionPercentage: Math.max(ord.completionPercentage, 35)
        };
      }
      return ord;
    }));

    addNotification(
      'نقشه مهندسی و فایل STEP بارگذاری شد',
      `نقشه ${doc.drawingNumber} برای مرحله ${doc.stageNumber} سفارش ${orderId} توسط مهندسی تایید و آماده تولید گردید.`,
      'success',
      ['planning', 'production'],
      orderId
    );
  };

  // 6. Production Manager: Assign stage to Machine & Operator
  const assignStageToProduction = (orderId: string, stageNumber: number, machineId: string, operatorId: string) => {
    const machine = machineTools.find(m => m.id === machineId);
    const operator = operators.find(o => o.id === operatorId);

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const updatedStages = ord.stages.map(stg => {
          if (stg.stageNumber === stageNumber) {
            return {
              ...stg,
              machineToolId: machineId,
              machineToolName: machine?.name || 'دستگاه نامشخص',
              operatorId,
              operatorName: operator?.name || 'اپراتور نامشخص',
              status: 'in_progress' as const,
              startTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
            };
          }
          return stg;
        });

        return {
          ...ord,
          status: 'in_production',
          stages: updatedStages,
          completionPercentage: Math.max(ord.completionPercentage, 40)
        };
      }
      return ord;
    }));

    // Update machine status to active and assign operator
    if (machine) {
      setMachineTools(prev => prev.map(m => {
        if (m.id === machineId) {
          return {
            ...m,
            status: 'active',
            currentWorkOrderId: orderId,
            currentOperatorId: operatorId,
            currentOperatorName: operator?.name,
            currentStageName: `مرحله ${stageNumber}`
          };
        }
        return m;
      }));
    }

    // Update operator status
    if (operator) {
      setOperators(prev => prev.map(o => {
        if (o.id === operatorId) {
          return {
            ...o,
            status: 'working',
            assignedMachineId: machineId,
            currentWorkOrderId: orderId,
            currentStageName: `مرحله ${stageNumber}`
          };
        }
        return o;
      }));
    }

    addNotification(
      'تخصیص کار به خط تولید',
      `سفارش ${orderId} (مرحله ${stageNumber}) به ${machine?.name} با اپراتوری ${operator?.name} اختصاص یافت.`,
      'info',
      ['production', 'operator', 'planning'],
      orderId
    );
  };

  // 7. Operator: Report Machine Breakdown
  const reportMachineBreakdown = (machineId: string, reason: string) => {
    const timeStr = new Date().toLocaleDateString('fa-IR') + ' - ساعت ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    
    let machineName = '';
    setMachineTools(prev => prev.map(m => {
      if (m.id === machineId) {
        machineName = m.name;
        return {
          ...m,
          status: 'breakdown',
          breakdownReason: reason,
          breakdownReportedAt: timeStr,
          healthPercent: Math.max(30, m.healthPercent - 25)
        };
      }
      return m;
    }));

    addNotification(
      `🚨 توقف اضطراری و خرابی: ${machineName}`,
      `دستگاه اعلام خرابی کرد! علت: ${reason}. کارگاه نیازمند اعزام سریع تیم تعمیرات و نگهداری (نت) است.`,
      'error',
      ['super_admin', 'production', 'planning']
    );
  };

  // 8. Resolve Machine Breakdown
  const resolveMachineBreakdown = (machineId: string) => {
    setMachineTools(prev => prev.map(m => {
      if (m.id === machineId) {
        return {
          ...m,
          status: 'idle',
          breakdownReason: undefined,
          breakdownReportedAt: undefined,
          lastMaintenanceDate: new Date().toLocaleDateString('fa-IR'),
          healthPercent: 95
        };
      }
      return m;
    }));

    addNotification(
      'رفع خرابی دستگاه و آماده به کار',
      `تعمیرات دستگاه با موفقیت انجام شد و دستگاه به وضعیت آماده‌به‌کار (Idle) بازگشت.`,
      'success',
      ['production', 'operator']
    );
  };

  // 9. Operator: Log Produced Parts / Complete Stage -> QC Review
  const logStageOutput = (orderId: string, stageNumber: number, goodPieces: number, scrapPieces: number) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const updatedStages = ord.stages.map(stg => {
          if (stg.stageNumber === stageNumber) {
            return {
              ...stg,
              producedQty: goodPieces,
              scrapQty: scrapPieces,
              status: 'qc_pending' as const
            };
          }
          return stg;
        });

        return {
          ...ord,
          stages: updatedStages
        };
      }
      return ord;
    }));

    addNotification(
      'اتمام مرحله ماشین‌کاری - آماده بازرسی کیفی (QC)',
      `مرحله ${stageNumber} سفارش ${orderId} با ${goodPieces} قطعه سالم ثبت شد و به ایستگاه کنترل کیفی تحویل گردید.`,
      'info',
      ['qc', 'production', 'planning'],
      orderId
    );
  };

  // 10. QC: Submit Stage QC Inspection Report & Upload Inspection Sheet
  const submitStageQCReport = (
    orderId: string,
    stageNumber: number,
    reportData: Omit<StageQCReport, 'reportNumber' | 'inspectedAt'> & { reportNumber?: string }
  ) => {
    const reportNumber = reportData.reportNumber || 'QC-' + Math.floor(1000 + Math.random() * 9000);
    const nowFa = new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    const fullReport: StageQCReport = {
      ...reportData,
      reportNumber,
      inspectedAt: nowFa,
      sheetUploadedAt: nowFa
    };

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const updatedStages = ord.stages.map(stg => {
          if (stg.stageNumber === stageNumber) {
            const isApprovedOrCond = reportData.decision === 'approved' || reportData.decision === 'conditional';
            return {
              ...stg,
              qcApproved: isApprovedOrCond,
              qcInspectorName: reportData.inspectorName,
              qcNotes: reportData.notes,
              qcReport: fullReport,
              status: isApprovedOrCond ? ('engineering_qc_pending' as const) : ('qc_rejected' as const)
            };
          }
          return stg;
        });

        return {
          ...ord,
          stages: updatedStages
        };
      }
      return ord;
    }));

    if (reportData.decision === 'rejected') {
      addNotification(
        'عدم انطباق در کنترل کیفیت (QC)',
        `برگه QC شماره ${reportNumber} برای مرحله ${stageNumber} سفارش ${orderId} با عدم انطباق (رد قطعه) ثبت شد: ${reportData.notes}`,
        'warning',
        ['production', 'operator', 'engineering'],
        orderId
      );
    } else {
      addNotification(
        'برگه کنترل کیفیت (QC) بارگذاری شد',
        `برگه بازرسی کیفی شماره ${reportNumber} برای مرحله ${stageNumber} سفارش ${orderId} ثبت شد و در انتظار تایید مدیر مهندسی جهت ترخیص به مرحله بعد است.`,
        'info',
        ['engineering', 'production', 'planning'],
        orderId
      );
    }
  };

  // 10-B. Engineering: Approve QC Report & Release to Next Stage or Planning Handover
  const approveStageByEngineering = (
    orderId: string,
    stageNumber: number,
    approverName: string,
    feedback?: string
  ) => {
    const nowFa = new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    let targetOrderNumber = orderId;
    let nextStageInfo: { exists: boolean; name?: string; num?: number } = { exists: false };

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        targetOrderNumber = ord.orderNumber;
        const currentStageIndex = ord.stages.findIndex(s => s.stageNumber === stageNumber);
        const hasNextStage = currentStageIndex >= 0 && currentStageIndex < ord.stages.length - 1;
        const nextStage = hasNextStage ? ord.stages[currentStageIndex + 1] : null;

        if (nextStage) {
          nextStageInfo = { exists: true, name: nextStage.stageName, num: nextStage.stageNumber };
        }

        const updatedStages = ord.stages.map((stg, idx) => {
          if (stg.stageNumber === stageNumber) {
            const approval: StageEngineeringApproval = {
              approvedAt: nowFa,
              approverName,
              isApproved: true,
              feedback,
              isFinalStage: !hasNextStage,
              canAdvanceToNextStage: true
            };

            return {
              ...stg,
              status: 'completed' as const,
              engineeringApproval: approval
            };
          }

          // If next stage was not started, unlock it for production
          if (hasNextStage && idx === currentStageIndex + 1) {
            return {
              ...stg,
              status: stg.status === 'not_started' ? ('not_started' as const) : stg.status
            };
          }

          return stg;
        });

        // Recalculate completion percentage
        const completedStages = updatedStages.filter(s => s.status === 'completed').length;
        const totalStages = updatedStages.length || 1;
        const isAllDone = completedStages === totalStages;
        const percent = isAllDone ? 100 : Math.min(95, Math.round(30 + (completedStages / totalStages) * 65));

        return {
          ...ord,
          stages: updatedStages,
          status: isAllDone ? ('awaiting_planning_handover' as const) : ord.status,
          completionPercentage: percent
        };
      }
      return ord;
    }));

    if (nextStageInfo.exists) {
      addNotification(
        'تاییدیه مدیر مهندسی - ترخیص به مرحله بعد',
        `مرحله ${stageNumber} سفارش ${targetOrderNumber} توسط ${approverName} تایید شد. مرحله بعدی (${nextStageInfo.name}) آماده واگذاری و ماشین‌کاری است.`,
        'success',
        ['production', 'operator', 'planning'],
        orderId
      );
    } else {
      addNotification(
        'اتمام کلیه مراحل ساخت (تموم‌کار) - تحویل به انبار',
        `کلیه مراحل ساخت و کنترل کیفی سفارش ${targetOrderNumber} توسط مدیر مهندسی تایید نهایی شد (تموم‌کار). آماده صدور رسید و تحویل به انبار توسط مدیر برنامه‌ریزی.`,
        'success',
        ['planning', 'ceo', 'warehouse'],
        orderId
      );
    }
  };

  // 10-C. Engineering: Reject Stage QC Report (Rework Needed)
  const rejectStageByEngineering = (
    orderId: string,
    stageNumber: number,
    approverName: string,
    reason: string
  ) => {
    const nowFa = new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const updatedStages = ord.stages.map(stg => {
          if (stg.stageNumber === stageNumber) {
            const approval: StageEngineeringApproval = {
              approvedAt: nowFa,
              approverName,
              isApproved: false,
              feedback: reason,
              isFinalStage: false,
              canAdvanceToNextStage: false
            };

            return {
              ...stg,
              status: 'qc_rejected' as const,
              engineeringApproval: approval
            };
          }
          return stg;
        });

        return {
          ...ord,
          stages: updatedStages
        };
      }
      return ord;
    }));

    addNotification(
      'رد فنی توسط مدیر مهندسی (نیاز به اصلاح)',
      `گزارش کیفی مرحله ${stageNumber} سفارش ${orderId} توسط ${approverName} رد شد: ${reason}`,
      'error',
      ['qc', 'production', 'operator'],
      orderId
    );
  };

  // 10-D. Legacy/Direct QC approval helper
  const approveStageQC = (orderId: string, stageNumber: number, inspectorName: string, notes?: string) => {
    submitStageQCReport(orderId, stageNumber, {
      inspectorName,
      passedQty: 1,
      rejectedQty: 0,
      conditionalQty: 0,
      decision: 'approved',
      dimensionalCheckPassed: true,
      surfaceRoughnessPassed: true,
      notes: notes || 'ابعاد و زبری سطح تایید شد',
      sheetFileName: 'QC-Standard-Form.pdf',
      sheetFileSize: '520 KB'
    });
  };

  // 11. Handover to Warehouse (Final or Semi-Finished)
  const handoverToWarehouse = (orderId: string, quantity: number = 1, isSemiFinished: boolean = false) => {
    const receiptNum = 'REC-' + Math.floor(1000 + Math.random() * 9000);

    let targetOrder: ProductionOrder | undefined;

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        targetOrder = ord;
        const finalQty = quantity || ord.quantity || 1;
        return {
          ...ord,
          status: isSemiFinished ? 'semi_finished_stored' : 'completed',
          completionPercentage: 100,
          deliveredToWarehouseQty: finalQty,
          isDeliveredSemiFinished: isSemiFinished,
          warehouseReceiptNumber: receiptNum
        };
      }
      return ord;
    }));

    // Update or add in warehouse
    if (targetOrder) {
      const currentTarget = targetOrder;
      setWarehouse(prev => {
        const existing = prev.find(w => w.partNumber === currentTarget.partNumber);
        if (existing) {
          return prev.map(w => w.id === existing.id ? {
            ...w,
            quantity: w.quantity + quantity,
            lastUpdated: new Date().toLocaleDateString('fa-IR')
          } : w);
        } else {
          return [
            ...prev,
            {
              id: 'WH-' + Date.now().toString().slice(-4),
              partNumber: currentTarget.partNumber,
              name: currentTarget.partName + (isSemiFinished ? ' (نیمه‌ساخته)' : ''),
              type: isSemiFinished ? 'semi_finished' : 'final_product',
              quantity,
              unit: 'عدد',
              shelfLocation: 'انبار مرکزی خط مونتاژ',
              lastUpdated: new Date().toLocaleDateString('fa-IR')
            }
          ];
        }
      });
    }

    addNotification(
      `رسید انبار صادر شد: ${receiptNum}`,
      `تعداد ${quantity} عدد ${targetOrder?.partName || 'قطعه'} (${isSemiFinished ? 'نیمه‌ساخته' : 'نهایی'}) با موفقیت به انبار تحویل گردید.`,
      'success',
      ['ceo', 'planning', 'production'],
      orderId
    );
  };

  // Super Admin: CRUD Models and Parts
  const addCompressorModel = (model: CompressorModel) => {
    setCompressorModels(prev => [...prev, model]);
  };

  const updateCompressorModel = (model: CompressorModel) => {
    setCompressorModels(prev => prev.map(m => m.id === model.id ? model : m));
  };

  const addPartDefinition = (part: PartDefinition) => {
    setParts(prev => [...prev, part]);
  };

  const updatePartDefinition = (part: PartDefinition) => {
    setParts(prev => prev.map(p => p.id === part.id ? part : p));
  };

  const addMachineTool = (machine: MachineTool) => {
    setMachineTools(prev => [...prev, machine]);
  };

  const updateMachineTool = (machine: MachineTool) => {
    setMachineTools(prev => prev.map(m => m.id === machine.id ? machine : m));
  };

  // Export / Import Database JSON
  const exportDatabaseJson = () => {
    const data = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      compressorModels,
      parts,
      machineTools,
      foundries,
      operators,
      orders,
      warehouse,
      notifications
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MES_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatabaseJson = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.compressorModels) setCompressorModels(data.compressorModels);
      if (data.parts) setParts(data.parts);
      if (data.machineTools) setMachineTools(data.machineTools);
      if (data.foundries) setFoundries(data.foundries);
      if (data.operators) setOperators(data.operators);
      if (data.orders) setOrders(data.orders);
      if (data.warehouse) setWarehouse(data.warehouse);
      if (data.notifications) setNotifications(data.notifications);
      alert('دیتابیس با موفقیت بازگردانی شد.');
    } catch (e) {
      alert('خطا در خواندن فایل JSON پشتیبان.');
      console.error(e);
    }
  };

  const resetToFactoryDefaults = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید تمام اطلاعات به پیش‌فرض کارخانه بازگردد؟')) {
      localStorage.clear();
      setCompressorModels(INITIAL_COMPRESSOR_MODELS);
      setParts(INITIAL_PARTS);
      setMachineTools(INITIAL_MACHINE_TOOLS);
      setFoundries(INITIAL_FOUNDRIES);
      setOperators(INITIAL_OPERATORS);
      setOrders(INITIAL_ORDERS);
      setWarehouse(INITIAL_WAREHOUSE);
      setNotifications(INITIAL_NOTIFICATIONS);
      window.location.reload();
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const addFoundry = (foundry: FoundryPartner) => {
    setFoundries(prev => [...prev, foundry]);
  };

  const addOperator = (operator: OperatorProfile) => {
    setOperators(prev => [...prev, operator]);
  };

  // Auth methods
  const login = (username: string, password: string): { success: boolean; message?: string } => {
    const user = users.find(u => u.username.trim().toLowerCase() === username.trim().toLowerCase() && u.password === password);
    if (!user) {
      return { success: false, message: 'نام کاربری یا کلمه عبور وارد شده اشتباه است.' };
    }
    if (!user.isActive) {
      return { success: false, message: 'حساب کاربری شما غیرفعال شده است. لطفاً با سوپر ادمین هماهنگ فرمایید.' };
    }
    const updatedUser: SystemUser = {
      ...user,
      lastLogin: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setCurrentUserRole(user.role);
    addNotification('ورود موفق به سامانه', `کاربر ${user.fullName} (${user.department}) وارد سامانه شد.`, 'info', ['super_admin']);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Super Admin: User Management CRUD
  const addUser = (userData: Omit<SystemUser, 'id' | 'createdAt'>) => {
    const newUser: SystemUser = {
      ...userData,
      id: 'USR-' + Date.now().toString().slice(-4),
      createdAt: new Date().toLocaleDateString('fa-IR')
    };
    setUsers(prev => [...prev, newUser]);
    addNotification('تعریف کاربر جدید', `کاربر جدید "${newUser.fullName}" با دسترسی ${newUser.department} ایجاد گردید.`, 'success', ['super_admin']);
  };

  const updateUser = (updatedUser: SystemUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      setCurrentUserRole(updatedUser.role);
    }
    addNotification('ویرایش کاربر', `مشخصات کاربر ${updatedUser.fullName} بروزرسانی شد.`, 'info', ['super_admin']);
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    addNotification('حذف کاربر', 'یک حساب کاربری از سامانه کارخانه حذف شد.', 'warning', ['super_admin']);
  };

  // Engineering: Part Drawings and STEP Management
  const updatePartStageDrawings = (partId: string, stageNumber: number, pdfFileName: string, stepFileName: string) => {
    setParts(prev => prev.map(p => {
      if (p.id !== partId) return p;
      const updatedStages = p.defaultStages.map(s => {
        if (s.stageNumber !== stageNumber) return s;
        return {
          ...s,
          pdfDrawingFileName: pdfFileName || s.pdfDrawingFileName,
          stepFileName: stepFileName || s.stepFileName,
          updatedAt: new Date().toLocaleDateString('fa-IR')
        };
      });
      return {
        ...p,
        defaultStages: updatedStages
      };
    }));
    addNotification('ثبت مدارک فنی مهندسی', `نقشه فنی مرحله ${stageNumber} قطعه بروزرسانی گردید.`, 'success', ['engineering', 'production']);
  };

  const updatePartMasterDrawings = (partId: string, defaultDrawingName: string, defaultStepFileName: string) => {
    setParts(prev => prev.map(p => {
      if (p.id !== partId) return p;
      return {
        ...p,
        defaultDrawingName: defaultDrawingName || p.defaultDrawingName,
        defaultStepFileName: defaultStepFileName || p.defaultStepFileName
      };
    }));
    addNotification('ثبت فایل‌های مهندسی قطعه', `نقشه کلی و فایل STEP قطعه در آرشیو فنی بارگذاری شد.`, 'success', ['engineering']);
  };

  return {
    users,
    currentUser,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    updatePartStageDrawings,
    updatePartMasterDrawings,
    currentUserRole,
    setCurrentUserRole,
    compressorModels,
    models: compressorModels,
    parts,
    machineTools,
    machines: machineTools,
    foundries,
    operators,
    orders,
    warehouse,
    inventory: warehouse,
    notifications,
    // Methods
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    createOrder,
    addQuoteToOrder,
    decideOnQuote,
    decideQuote: decideOnQuote,
    markMaterialReceivedAndIssuePO,
    uploadEngineeringDoc,
    assignStageToProduction,
    assignStageToMachine: assignStageToProduction,
    reportMachineBreakdown,
    resolveMachineBreakdown,
    logStageOutput,
    finishStage: logStageOutput,
    submitStageQCReport,
    approveStageByEngineering,
    rejectStageByEngineering,
    approveStageQC,
    handoverToWarehouse,
    addCompressorModel,
    addModel: addCompressorModel,
    updateCompressorModel,
    addPartDefinition,
    addPart: addPartDefinition,
    updatePartDefinition,
    addMachineTool,
    addMachine: addMachineTool,
    updateMachineTool,
    addFoundry,
    addOperator,
    exportDatabaseJson,
    exportDatabase: exportDatabaseJson,
    importDatabaseJson,
    importDatabase: importDatabaseJson,
    resetToFactoryDefaults,
    resetFactoryData: resetToFactoryDefaults
  };
}
