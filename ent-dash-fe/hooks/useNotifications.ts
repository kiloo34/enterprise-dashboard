import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/AuthContext';

export function useNotifications() {
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.accessToken) return;

    // Engine API endpoint proxied via Traefik or direct backend URL.
    // Attach the JWT securely via query parameter since EventSource cannot send Auth headers.
    const eventSource = new EventSource(`http://localhost/api/v1/engine/notifications?token=${user.accessToken}`);

    eventSource.onopen = () => {
      console.log('SSE Connected: Listening for notifications');
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') {
          // Silent or console log
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
      // EventSource auto-reconnects, but we can close it if we want it to stop
      // eventSource.close(); 
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, []);

  return { connected };
}
