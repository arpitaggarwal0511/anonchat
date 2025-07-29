const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const rooms = {}; // ✅ { roomId: [ { user, text, timestamp } ] }

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://anonchatrooms.netlify.app/',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('🟢 New user connected:', socket.id);

  socket.on('join-room', (roomId, username) => {
    socket.join(roomId);
    console.log(`👥 ${username} joined room: ${roomId}`);

    if (!rooms[roomId]) rooms[roomId] = [];

    // 🔁 Send each past message via 'receive-message'
    rooms[roomId].forEach((msg) => {
      socket.emit('receive-message', msg);
    });
  });

  socket.on('send-message', (roomId, msg) => {
    const messageWithMeta = {
      user: msg.user,
      text: msg.text,
      timestamp: new Date().toISOString(),
    };

    console.log(`📨 [${roomId}] New message from ${msg.user}: ${msg.text}`);

    rooms[roomId].push(messageWithMeta);

    // ✅ Emit message to all users in the room, including sender
    io.in(roomId).emit('receive-message', messageWithMeta);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

server.listen(3001, () => {
  console.log('✅ Socket.IO server running on http://localhost:3001');
});
