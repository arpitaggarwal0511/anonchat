import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
};
