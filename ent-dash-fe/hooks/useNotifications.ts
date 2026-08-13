import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/AuthContext';
import { api } from '@/utils/api';

/**
 * Fetch a short-lived SSE ticket (TTL 60s) from the IAM service.
 * This ticket is used as the query parameter for the SSE endpoint so that
 * the main access token never appears in server logs or browser history.
 */
async function fetchSseTicket(): Promise<string> {
  const data = await api<{ sse_ticket: string }>('api/auth/sse-ticket', {
    method: 'POST',
    showErrorToast: false,
  });
  return data.sse_ticket;
}

export function useNotifications() {
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.accessToken) return;

    let eventSource: EventSource | null = null;
    let cancelled = false;

    const connect = async () => {
      try {
        // Obtain a short-lived SSE ticket instead of passing the main JWT in the URL.
        const ticket = await fetchSseTicket();
        if (cancelled) return;

        eventSource = new EventSource(`/api/engine/notifications?token=${ticket}`);

        eventSource.onopen = () => {
          console.log('SSE Connected: Listening for notifications');
          setConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'connected') {
              // Silent — initial handshake
            } else if (data.type === 'success') {
              toast.success(data.message, { description: data.details });
            } else if (data.type === 'error') {
              toast.error(data.message, { description: data.details });
            } else {
              toast.info(data.message, { description: data.details });
            }
          } catch (err) {
            console.error('Error parsing SSE message:', err);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE Connection Error:', error);
          setConnected(false);
        };
      } catch (err) {
        console.error('Failed to obtain SSE ticket:', err);
      }
    };

    connect();

    return () => {
      cancelled = true;
      eventSource?.close();
      setConnected(false);
    };
  }, [user?.accessToken]);

  return { connected };
}
