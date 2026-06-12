const voiceRooms = {};

const getVoiceUsers = (roomId) => Array.from(voiceRooms[roomId]?.values() || []);

const normalizeVoiceUser = (socket, user = {}) => ({
  id: socket.id,
  name: typeof user.name === 'string' && user.name.trim() ? user.name.trim() : 'Anonymous',
  stats: user.stats && typeof user.stats === 'object' ? user.stats : {},
  joinedAt: new Date().toISOString(),
});

const leaveVoiceRoom = (io, socket, roomId) => {
  if (!voiceRooms[roomId]) return;

  voiceRooms[roomId].delete(socket.id);
  socket.data.voiceRooms.delete(roomId);
  socket.to(roomId).emit('voice-user-left', socket.id);

  if (voiceRooms[roomId].size === 0) {
    delete voiceRooms[roomId];
    return;
  }

  io.in(roomId).emit('voice-roster', getVoiceUsers(roomId));
};

const registerVoiceHandlers = (io, socket) => {
  socket.data.voiceRooms = new Set();

  socket.on('voice-join', (roomId, user = {}) => {
    if (!voiceRooms[roomId]) voiceRooms[roomId] = new Map();

    const voiceUser = normalizeVoiceUser(socket, user);
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
    leaveVoiceRoom(io, socket, roomId);
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
    socket.data.voiceRooms.forEach((roomId) => leaveVoiceRoom(io, socket, roomId));
  });
};

module.exports = {
  registerVoiceHandlers,
};
