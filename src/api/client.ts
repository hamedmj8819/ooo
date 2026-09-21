import type {
  CompressorModel,
  PartDefinition,
  MachineTool,
  FoundryPartner,
  OperatorProfile,
  ProductionOrder,
  WarehouseItem,
  StockMovement,
  SystemNotification,
  SystemUser,
  CreateOrderParams,
  CreateQuoteParams,
  StageQCReport,
  StageEngineeringApproval,
  AuditLogItem,
} from '../types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Sends httpOnly session cookie
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorMessage = res.statusText || `API error (${res.status})`;
    let errorCode: string | undefined;

    try {
      const errorData = (await res.json()) as { code?: string; message?: string };
      if (errorData?.message) errorMessage = errorData.message;
      if (errorData?.code) errorCode = errorData.code;
    } catch {
      // use default statusText
    }

    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('mes:unauthorized', { detail: { message: errorMessage } }));
    } else if (res.status === 403) {
      window.dispatchEvent(
        new CustomEvent('mes:forbidden', {
          detail: { message: errorMessage || 'شما دسترسی لازم برای این عملیات را ندارید', code: errorCode },
        })
      );
    }

    throw new ApiError(res.status, errorMessage, errorCode);
  }

  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<SystemUser>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    logout: () =>
      request<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
      }),
    me: () => request<SystemUser>('/auth/me'),
    changePassword: (oldPassword: string, newPassword: string) =>
      request<SystemUser>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      }),
  },

  audit: {
    getLogs: (params?: {
      userId?: string;
      action?: string;
      entityType?: string;
      entityId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== '') {
            searchParams.set(key, String(val));
          }
        });
      }
      const qs = searchParams.toString();
      return request<{
        logs: AuditLogItem[];
        total: number;
        limit: number;
        offset: number;
      }>(`/audit-logs${qs ? `?${qs}` : ''}`);
    },
  },

  models: {
    getAll: () => request<CompressorModel[]>('/models'),
    getById: (id: string) => request<CompressorModel>(`/models/${id}`),
    create: (data: Partial<CompressorModel>) =>
      request<CompressorModel>('/models', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CompressorModel>) =>
      request<CompressorModel>(`/models/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/models/${id}`, { method: 'DELETE' }),
  },

  parts: {
    getAll: (modelId?: string) =>
      request<PartDefinition[]>(`/parts${modelId ? `?modelId=${encodeURIComponent(modelId)}` : ''}`),
    getById: (id: string) => request<PartDefinition>(`/parts/${id}`),
    create: (data: Partial<PartDefinition>) =>
      request<PartDefinition>('/parts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<PartDefinition>) =>
      request<PartDefinition>(`/parts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/parts/${id}`, { method: 'DELETE' }),
    updateMasterDrawings: (id: string, defaultDrawingName: string, defaultStepFileName: string) =>
      request<PartDefinition>(`/parts/${id}/master-drawings`, {
        method: 'PUT',
        body: JSON.stringify({ defaultDrawingName, defaultStepFileName }),
      }),
    updateStageDrawings: (
      id: string,
      stageNumber: number,
      pdfDrawingFileName: string,
      stepFileName: string
    ) =>
      request<PartDefinition>(`/parts/${id}/stages/${stageNumber}/drawings`, {
        method: 'PUT',
        body: JSON.stringify({ pdfDrawingFileName, stepFileName }),
      }),
  },

  machines: {
    getAll: () => request<MachineTool[]>('/machines'),
    getById: (id: string) => request<MachineTool>(`/machines/${id}`),
    create: (data: Partial<MachineTool>) =>
      request<MachineTool>('/machines', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<MachineTool>) =>
      request<MachineTool>(`/machines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/machines/${id}`, { method: 'DELETE' }),
    reportBreakdown: (id: string, reason: string, reportedBy?: string) =>
      request<MachineTool>(`/machines/${id}/breakdown`, {
        method: 'POST',
        body: JSON.stringify({ reason, reportedBy }),
      }),
    resolveBreakdown: (id: string) =>
      request<MachineTool>(`/machines/${id}/resolve-breakdown`, { method: 'POST' }),
  },

  operators: {
    getAll: () => request<OperatorProfile[]>('/operators'),
    getById: (id: string) => request<OperatorProfile>(`/operators/${id}`),
    create: (data: Partial<OperatorProfile>) =>
      request<OperatorProfile>('/operators', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<OperatorProfile>) =>
      request<OperatorProfile>(`/operators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/operators/${id}`, { method: 'DELETE' }),
  },

  foundries: {
    getAll: () => request<FoundryPartner[]>('/foundries'),
    getById: (id: string) => request<FoundryPartner>(`/foundries/${id}`),
    create: (data: Partial<FoundryPartner>) =>
      request<FoundryPartner>('/foundries', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<FoundryPartner>) =>
      request<FoundryPartner>(`/foundries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/foundries/${id}`, { method: 'DELETE' }),
  },

  users: {
    getAll: () => request<SystemUser[]>('/users'),
    create: (data: Partial<SystemUser> & { password?: string }) =>
      request<SystemUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<SystemUser> & { password?: string }) =>
      request<SystemUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/users/${id}`, { method: 'DELETE' }),
  },

  orders: {
    getAll: (status?: string) =>
      request<ProductionOrder[]>(`/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    getById: (id: string) => request<ProductionOrder>(`/orders/${id}`),
    create: (data: CreateOrderParams) =>
      request<ProductionOrder>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/orders/${id}`, { method: 'DELETE' }),
    addQuote: (id: string, data: CreateQuoteParams) =>
      request<ProductionOrder>(`/orders/${id}/quotes`, { method: 'POST', body: JSON.stringify(data) }),
    decideQuote: (id: string, quoteId: string, decision: 'approved' | 'rejected', rejectionReason?: string, decidedBy?: string) =>
      request<ProductionOrder>(`/orders/${id}/quotes/${quoteId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, rejectionReason, decidedBy }),
      }),
    confirmMaterial: (id: string) =>
      request<ProductionOrder>(`/orders/${id}/confirm-material`, { method: 'POST' }),
    uploadEngineeringDoc: (
      id: string,
      data: {
        stageNumber: number;
        stageName: string;
        drawingNumber: string;
        drawingFileName?: string;
        drawingFileType?: 'pdf' | 'dwg' | 'image';
        stepFileName?: string;
        notes?: string;
      }
    ) =>
      request<ProductionOrder>(`/orders/${id}/engineering-docs`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    assignStage: (
      id: string,
      stageNumber: number,
      machineToolId: string,
      machineToolName: string,
      operatorId: string,
      operatorName: string
    ) =>
      request<ProductionOrder>(`/orders/${id}/stages/${stageNumber}/assign`, {
        method: 'POST',
        body: JSON.stringify({ machineToolId, machineToolName, operatorId, operatorName }),
      }),
    startStage: (id: string, stageNumber: number) =>
      request<ProductionOrder>(`/orders/${id}/stages/${stageNumber}/start`, { method: 'POST' }),
    reportProgress: (
      id: string,
      stageNumber: number,
      producedQty: number,
      scrapQty: number,
      status?: string
    ) =>
      request<ProductionOrder>(`/orders/${id}/stages/${stageNumber}/progress`, {
        method: 'POST',
        body: JSON.stringify({ producedQty, scrapQty, status }),
      }),
    submitQCReport: (id: string, stageNumber: number, data: Partial<StageQCReport>) =>
      request<ProductionOrder>(`/orders/${id}/stages/${stageNumber}/qc-report`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    engineeringApproval: (id: string, stageNumber: number, data: Partial<StageEngineeringApproval>) =>
      request<ProductionOrder>(`/orders/${id}/stages/${stageNumber}/engineering-approval`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    handoverWarehouse: (
      id: string,
      data: {
        deliveredQty: number;
        isSemiFinished?: boolean;
        warehouseReceiptNumber?: string;
        shelfLocation?: string;
        notes?: string;
      }
    ) =>
      request<ProductionOrder>(`/orders/${id}/handover-warehouse`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  warehouse: {
    getAll: () => request<WarehouseItem[]>('/warehouse'),
    getMovements: () => request<StockMovement[]>('/warehouse/movements'),
    create: (data: Partial<WarehouseItem>) =>
      request<WarehouseItem>('/warehouse', { method: 'POST', body: JSON.stringify(data) }),
    adjust: (id: string, delta: number, reason?: string, performedBy?: string) =>
      request<WarehouseItem>(`/warehouse/${id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ delta, reason, performedBy }),
      }),
  },

  notifications: {
    getAll: (role?: string) =>
      request<SystemNotification[]>(`/notifications${role ? `?role=${encodeURIComponent(role)}` : ''}`),
    markRead: (id: string) =>
      request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () =>
      request<{ success: boolean }>('/notifications/read-all', { method: 'POST' }),
  },

  backup: {
    exportUrl: `${API_BASE}/backup/export`,
    reset: () =>
      request<{ success: boolean; message: string }>('/backup/reset', { method: 'POST' }),
  },

  analytics: {
    getReport: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const qs = params.toString();
      return request<import('../../server/services/analyticsService').FullAnalyticsReport>(
        `/analytics${qs ? `?${qs}` : ''}`
      );
    },
    exportCsvUrl: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const qs = params.toString();
      return `${API_BASE}/analytics/export/csv${qs ? `?${qs}` : ''}`;
    },
  },
};
