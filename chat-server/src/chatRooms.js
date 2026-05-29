const rooms = {};
const roomMembers = {};

const createMessageId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeAttachment = (attachment) => {
  if (
    !attachment ||
    typeof attachment.data !== 'string' ||
    typeof attachment.name !== 'string'
  ) {
    return undefined;
  }

  return {
    data: attachment.data,
    name: attachment.name,
    type: typeof attachment.type === 'string' ? attachment.type : 'application/octet-stream',
    size: Number.isFinite(attachment.size) ? attachment.size : 0,
  };
};

const buildMessage = (socket, msg) => {
  const message = {
    id: createMessageId(),
    senderId: socket.id,
    user: msg.user,
    text: typeof msg.text === 'string' ? msg.text : '',
    image: typeof msg.image === 'string' ? msg.image : undefined,
    imageName: typeof msg.imageName === 'string' ? msg.imageName : undefined,
    attachment: normalizeAttachment(msg.attachment),
    timestamp: new Date().toISOString(),
    readBy: [],
  };

  if (!message.text && !message.image && !message.attachment) return null;
  return message;
};

const registerChatHandlers = (io, socket) => {
  socket.on('join-room', (roomId, username) => {
    socket.join(roomId);
    socket.data.chatRooms = socket.data.chatRooms || new Set();
    socket.data.chatRooms.add(roomId);
    socket.data.username = username;
    console.log(`${username} joined room: ${roomId}`);

    if (!rooms[roomId]) rooms[roomId] = [];
    if (!roomMembers[roomId]) roomMembers[roomId] = new Map();
    roomMembers[roomId].set(socket.id, {
      id: socket.id,
      username,
    });

    rooms[roomId].forEach((message) => {
      socket.emit('receive-message', message);
    });
  });

  socket.on('send-message', (roomId, msg) => {
    if (!rooms[roomId]) rooms[roomId] = [];

    const message = buildMessage(socket, msg);
    if (!message) return;

    console.log(`[${roomId}] New message from ${msg.user}`);
    rooms[roomId].push(message);
    io.in(roomId).emit('receive-message', message);
  });

  socket.on('mark-read', (roomId, messageIds = []) => {
    if (!rooms[roomId] || !Array.isArray(messageIds)) return;

    const username = socket.data.username || 'Anonymous';
    const readAt = new Date().toISOString();

    messageIds.forEach((messageId) => {
      const message = rooms[roomId].find((item) => item.id === messageId);
      if (!message || message.senderId === socket.id) return;

      const alreadyRead = message.readBy.some((reader) => reader.userId === socket.id);
      if (alreadyRead) return;

      const receipt = {
        userId: socket.id,
        username,
        readAt,
      };
      message.readBy.push(receipt);

      io.in(roomId).emit('message-read', {
        messageId,
        receipt,
      });
    });
  });

  socket.on('latency-ping', (callback) => {
    if (typeof callback === 'function') callback();
  });

  socket.on('disconnect', () => {
    socket.data.chatRooms?.forEach((roomId) => {
      roomMembers[roomId]?.delete(socket.id);
      if (roomMembers[roomId]?.size === 0) {
        delete roomMembers[roomId];
      }
    });
  });
};

module.exports = {
  registerChatHandlers,
};
