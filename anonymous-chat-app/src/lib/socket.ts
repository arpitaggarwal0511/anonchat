import { io, Socket } from 'socket.io-client';

const DEFAULT_SOCKET_PORT = '3001';

const isLocalHostname = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

const resolveSocketUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (configuredUrl) return configuredUrl;

  if (typeof window !== 'undefined' && isLocalHostname(window.location.hostname)) {
    return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_SOCKET_PORT}`;
  }

  return `http://localhost:${DEFAULT_SOCKET_PORT}`;
};

const URL = resolveSocketUrl();

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const getSocketUrl = (): string => URL;
