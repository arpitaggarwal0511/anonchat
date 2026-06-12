export const siteConfig = {
  name: 'ShitsApp',
  title: 'ShitsApp - Anonymous Chat Without the Privacy Theater',
  description:
    'ShitsApp is a darkly sarcastic privacy parody for anonymous private chat rooms, voice, images, and files without pretending your data needs a business model.',
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    'https://shitsapp.netlify.app',
  keywords: [
    'shitsapp',
    'shits app',
    'anonymous chat',
    'anonymous chat app',
    'private chat room',
    'private messaging',
    'no signup chat',
    'temporary chat room',
    'secure chat alternative',
    'privacy parody chat',
    'privacy first chat',
    'dark humor chat app',
    'chat room with voice',
    'free private chat',
  ],
};

export function absoluteUrl(path = '/') {
  return new URL(path, siteConfig.url).toString();
}
