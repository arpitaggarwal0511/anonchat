const configuredOrigins = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  'http://localhost:3000',
  'https://anon-chat-frontend.vercel.app',
  'https://anonchatrooms.netlify.app',
  ...configuredOrigins,
]);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  try {
    const { hostname } = new URL(origin);
    return (
      allowedOrigins.has(origin) ||
      hostname.endsWith('.netlify.app') ||
      hostname.endsWith('.vercel.app')
    );
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, isAllowedOrigin(origin));
  },
};

const socketCorsOptions = {
  ...corsOptions,
  methods: ['GET', 'POST', 'OPTIONS'],
};

module.exports = {
  corsOptions,
  socketCorsOptions,
};
