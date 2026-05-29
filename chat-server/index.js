const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { registerChatHandlers } = require('./src/chatRooms');
const { corsOptions, socketCorsOptions } = require('./src/cors');
const { registerVoiceHandlers } = require('./src/voiceRooms');

const app = express();
app.use(cors(corsOptions));

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'anonchat socket server' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: socketCorsOptions,
});

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  registerChatHandlers(io, socket);
  registerVoiceHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
