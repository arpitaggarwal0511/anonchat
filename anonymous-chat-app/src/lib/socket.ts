// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

const URL = 'http://localhost:3001'; // Backend server URL

let socket: Socket | null = null;

/**
 * Returns a singleton Socket.IO client instance.
 * Ensures only one socket is created during the app's lifetime.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
  } else if (!socket.connected) {
    // ⚠️ Optional: reconnect manually if needed
    socket.connect();
  }

  return socket;
};
