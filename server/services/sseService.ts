import type { Request, Response } from 'express';
import type { UserRole } from '../../shared/types';

export interface SSEClient {
  id: string;
  userId: string;
  userRole: UserRole;
  res: Response;
  req: Request;
}

class SSEService {
  private clients: Map<string, SSEClient> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Send periodic SSE comment ping every 15s to keep connections alive
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 15000);
  }

  public addClient(client: SSEClient) {
    this.clients.set(client.id, client);

    // Initial connection message
    client.res.write(`event: connected\ndata: ${JSON.stringify({ clientId: client.id, time: new Date().toISOString() })}\n\n`);

    client.req.on('close', () => {
      this.clients.delete(client.id);
    });
  }

  public removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
    }
  }

  private sendPing() {
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(`:ping\n\n`);
      } catch {
        this.clients.delete(id);
      }
    }
  }

  public broadcastNotification(notification: Record<string, unknown>, recipientUserIds: string[]) {
    const recipientSet = new Set(recipientUserIds);
    const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;

    for (const [id, client] of this.clients.entries()) {
      if (recipientSet.has(client.userId)) {
        try {
          client.res.write(payload);
        } catch {
          this.clients.delete(id);
        }
      }
    }
  }

  public broadcastOrderUpdate(orderId: string, status?: string) {
    const payload = `event: order_update\ndata: ${JSON.stringify({ orderId, status, timestamp: new Date().toISOString() })}\n\n`;

    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(payload);
      } catch {
        this.clients.delete(id);
      }
    }
  }

  public broadcastMachineUpdate(machineId: string, status?: string) {
    const payload = `event: machine_update\ndata: ${JSON.stringify({ machineId, status, timestamp: new Date().toISOString() })}\n\n`;

    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(payload);
      } catch {
        this.clients.delete(id);
      }
    }
  }

  public broadcastEvent(eventType: string, data: Record<string, unknown>) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(payload);
      } catch {
        this.clients.delete(id);
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const sseService = new SSEService();
