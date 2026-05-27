const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  `http://localhost:${PORT}`,
  'http://localhost:3000',
  'https://anon-chat-frontend.vercel.app',
  'https://anonchatrooms.netlify.app',
];

//! cold-start buffer: sent to new joiners who have no local history yet.
//! clients will persist their own full history client-side (future task).

const HISTORY_LIMIT = 100;

module.exports = { PORT, ALLOWED_ORIGINS, HISTORY_LIMIT };
