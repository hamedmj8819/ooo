import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeSSE(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef<number>(2000); // initial backoff 2s

  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;

      try {
        eventSource = new EventSource('/api/v1/notifications/stream', {
          withCredentials: true,
        });

        eventSource.onopen = () => {
          // Reset backoff on successful connection
          backoffRef.current = 2000;
        };

        eventSource.addEventListener('connected', () => {
          // Connection verified
        });

        eventSource.addEventListener('notification', () => {
          // Invalidate notifications query to re-fetch targeted list
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        });

        eventSource.addEventListener('order_updated', (event) => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          try {
            const data = JSON.parse(event.data);
            if (data?.orderId) {
              queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
            }
          } catch {
            // ignore JSON parse error
          }
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        });

        eventSource.addEventListener('machine_updated', (event) => {
          queryClient.invalidateQueries({ queryKey: ['machines'] });
          try {
            const data = JSON.parse(event.data);
            if (data?.machineId) {
              queryClient.invalidateQueries({ queryKey: ['machine', data.machineId] });
            }
          } catch {
            // ignore
          }
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }

          if (!isUnmounted) {
            // Schedule reconnect with exponential backoff (max 30s)
            const delay = backoffRef.current;
            backoffRef.current = Math.min(delay * 2, 30000);

            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        };
      } catch (err) {
        console.error('Failed to initialize SSE connection:', err);
      }
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [enabled, queryClient]);
}
