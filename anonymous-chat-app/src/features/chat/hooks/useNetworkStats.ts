import { useEffect, useState } from 'react';
import type { SocketRef } from '../types';

type UseNetworkStatsArgs = {
  socketRef: SocketRef;
  socketUrl: string;
  onStatus: (message: string) => void;
};

export function useNetworkStats({ socketRef, socketUrl, onStatus }: UseNetworkStatsArgs) {
  const [chatLatency, setChatLatency] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');

  useEffect(() => {
    const updateStats = () => {
      const socket = socketRef.current;
      setConnectionStatus(socket?.connected ? 'Online' : navigator.onLine ? 'Reconnecting' : 'Offline');

      if (socket && !socket.connected) {
        const usingLocalhost = socketUrl.includes('localhost') || socketUrl.includes('127.0.0.1');
        onStatus(
          usingLocalhost
            ? 'Socket URL is still localhost. Set NEXT_PUBLIC_SOCKET_URL on Netlify and redeploy.'
            : `Chat server reconnecting: ${socketUrl}`
        );
      }

      if (!socket?.connected) return;

      const sentAt = performance.now();
      socket.timeout(2000).emit('latency-ping', (error?: Error) => {
        if (error) {
          setChatLatency(null);
          return;
        }

        setChatLatency(Math.round(performance.now() - sentAt));
      });
    };

    updateStats();
    const interval = window.setInterval(updateStats, 3000);
    window.addEventListener('online', updateStats);
    window.addEventListener('offline', updateStats);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', updateStats);
      window.removeEventListener('offline', updateStats);
    };
  }, [onStatus, socketRef, socketUrl]);

  return { chatLatency, connectionStatus };
}
