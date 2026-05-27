const { initRoom, getMessages, addMessage } = require('./rooms');

function registerHandlers(io) {
  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('join-room', (roomId, username) => {
      socket.join(roomId);
      console.log(`${username} joined room: ${roomId}`);

      initRoom(roomId);
      getMessages(roomId).forEach((msg) => socket.emit('receive-message', msg));
    });

    socket.on('send-message', (roomId, msg) => {
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
        user: typeof msg.user === 'string' ? msg.user.trim() : msg.user,
        text: typeof msg.text === 'string' ? msg.text : '',
        image: typeof msg.image === 'string' ? msg.image : undefined,
        imageName: typeof msg.imageName === 'string' ? msg.imageName : undefined,
        attachment,
        timestamp: new Date().toISOString(),
      };

      if (!messageWithMeta.text && !messageWithMeta.image && !messageWithMeta.attachment) return;

      console.log(`[${roomId}] New message from ${messageWithMeta.user}`);

      addMessage(roomId, messageWithMeta);
      io.in(roomId).emit('receive-message', messageWithMeta);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

module.exports = { registerHandlers };
