const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const rooms = {};
const voiceRooms = {};

const getVoiceUsers = (roomId) =>
  Array.from(voiceRooms[roomId]?.values() || []);

const app = express();
app.use(cors());


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://anon-chat-frontend.vercel.app',
        'https://anonchatrooms.netlify.app',

    ],
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);
  socket.data.voiceRooms = new Set();

  const leaveVoiceRoom = (roomId) => {
    if (!voiceRooms[roomId]) return;

    voiceRooms[roomId].delete(socket.id);
    socket.data.voiceRooms.delete(roomId);
    socket.to(roomId).emit('voice-user-left', socket.id);

    if (voiceRooms[roomId].size === 0) {
      delete voiceRooms[roomId];
    } else {
      io.in(roomId).emit('voice-roster', getVoiceUsers(roomId));
    }
  };

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

  socket.on('latency-ping', (callback) => {
    if (typeof callback === 'function') callback();
  });

  socket.on('voice-join', (roomId, user = {}) => {
    if (!voiceRooms[roomId]) voiceRooms[roomId] = new Map();

    const voiceUser = {
      id: socket.id,
      name: typeof user.name === 'string' && user.name.trim() ? user.name.trim() : 'Anonymous',
      stats: user.stats && typeof user.stats === 'object' ? user.stats : {},
      joinedAt: new Date().toISOString(),
    };
    const existingVoiceUsers = getVoiceUsers(roomId).filter((member) => member.id !== socket.id);
    voiceRooms[roomId].set(socket.id, voiceUser);
    socket.data.voiceRooms.add(roomId);
    socket.join(roomId);

    socket.emit('voice-users', existingVoiceUsers);
    socket.to(roomId).emit('voice-user-joined', voiceUser);
    io.in(roomId).emit('voice-roster', getVoiceUsers(roomId));
  });

  socket.on('voice-signal', (roomId, { to, signal }) => {
    if (!to || !signal) return;

    io.to(to).emit('voice-signal', {
      from: socket.id,
      signal,
    });
  });

  socket.on('voice-leave', (roomId) => {
    leaveVoiceRoom(roomId);
    io.in(roomId).emit('voice-roster', getVoiceUsers(roomId));
  });

  socket.on('voice-stats', (roomId, stats = {}) => {
    const member = voiceRooms[roomId]?.get(socket.id);
    if (!member) return;

    member.stats = stats;
    socket.to(roomId).emit('voice-user-stats', {
      id: socket.id,
      stats,
    });
  });

  socket.on('disconnect', () => {
    socket.data.voiceRooms.forEach((roomId) => leaveVoiceRoom(roomId));
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
