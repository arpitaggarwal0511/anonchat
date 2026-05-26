const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const rooms = {};

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://anon-chat-frontend.vercel.app',
    ],
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('join-room', (roomId, username) => {
    socket.join(roomId);
    console.log(`${username} joined room: ${roomId}`);

    if (!rooms[roomId]) rooms[roomId] = [];

    rooms[roomId].forEach((msg) => {
      socket.emit('receive-message', msg);
    });
  });

  socket.on('send-message', (roomId, msg) => {
    if (!rooms[roomId]) rooms[roomId] = [];

    const attachment =
      msg.attachment &&
      typeof msg.attachment.data === 'string' &&
      typeof msg.attachment.name === 'string'
        ? {
            data: msg.attachment.data,
            name: msg.attachment.name,
            type:
              typeof msg.attachment.type === 'string'
                ? msg.attachment.type
                : 'application/octet-stream',
            size: Number.isFinite(msg.attachment.size) ? msg.attachment.size : 0,
          }
        : undefined;

    const messageWithMeta = {
      user: msg.user,
      text: typeof msg.text === 'string' ? msg.text : '',
      image: typeof msg.image === 'string' ? msg.image : undefined,
      imageName: typeof msg.imageName === 'string' ? msg.imageName : undefined,
      attachment,
      timestamp: new Date().toISOString(),
    };

    if (!messageWithMeta.text && !messageWithMeta.image && !messageWithMeta.attachment) return;

    console.log(`[${roomId}] New message from ${msg.user}`);

    rooms[roomId].push(messageWithMeta);
    io.in(roomId).emit('receive-message', messageWithMeta);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3001, () => {
  console.log('Socket.IO server running on http://localhost:3001');
});
