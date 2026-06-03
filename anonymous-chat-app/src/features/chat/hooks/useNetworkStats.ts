import { useEffect, useRef, useState } from 'react';
import type { SocketRef } from '../types';

type UseNetworkStatsArgs = {
  socketRef: SocketRef;
  socketUrl: string;
  onStatus: (message: string) => void;
};

export function useNetworkStats({ socketRef, socketUrl, onStatus }: UseNetworkStatsArgs) {
  const [chatLatency, setChatLatency] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const lastNetworkStatusRef = useRef('');

  useEffect(() => {
    const getReconnectMessage = () => {
      const isLocalSocket = socketUrl.includes('localhost') || socketUrl.includes('127.0.0.1');
      const isLocalPage =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '::1';

      if (isLocalSocket && isLocalPage) {
        return `Chat server reconnecting. Start it with npm run dev in chat-server, then keep ${socketUrl} running.`;
      }

      if (isLocalSocket) {
        return 'Socket URL is still localhost. Set NEXT_PUBLIC_SOCKET_URL on Netlify/Vercel and redeploy.';
      }

      return `Chat server reconnecting: ${socketUrl}`;
    };

    const updateStats = () => {
      const socket = socketRef.current;
      setConnectionStatus(socket?.connected ? 'Online' : navigator.onLine ? 'Reconnecting' : 'Offline');

      if (socket && !socket.connected) {
        const reconnectMessage = getReconnectMessage();
        lastNetworkStatusRef.current = reconnectMessage;
        onStatus(reconnectMessage);
      }

      if (!socket?.connected) return;

      if (lastNetworkStatusRef.current) {
        lastNetworkStatusRef.current = '';
        onStatus('');
      }

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
