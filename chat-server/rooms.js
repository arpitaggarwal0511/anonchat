const { HISTORY_LIMIT } = require('./config');

const rooms = {};

function initRoom(roomId) {
  if (!rooms[roomId]) rooms[roomId] = [];
}

function getMessages(roomId) {
  return rooms[roomId] || [];
}

function addMessage(roomId, msg) {
  initRoom(roomId);
  rooms[roomId].push(msg);
  if (rooms[roomId].length > HISTORY_LIMIT) {
    rooms[roomId].splice(0, rooms[roomId].length - HISTORY_LIMIT);
  }
}

module.exports = { initRoom, getMessages, addMessage };
