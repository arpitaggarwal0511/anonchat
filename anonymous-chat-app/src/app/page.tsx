'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnonymousUser } from '@/features/chat/hooks/useAnonymousUser';
import Footer from './Footer';

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const ROOM_CODE_NUMBERS = '23456789';
const ROOM_CODE_CHARS = `${ROOM_CODE_LETTERS}${ROOM_CODE_NUMBERS}`;

const getRandomIndex = (max: number) => {
  const values = new Uint32Array(1);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values);
    return values[0] % max;
  }

  return Math.floor(Math.random() * max);
};

const pickChar = (source: string) => source[getRandomIndex(source.length)];

const createRoomCode = () => {
  const code = [pickChar(ROOM_CODE_LETTERS), pickChar(ROOM_CODE_NUMBERS)];

  while (code.length < ROOM_CODE_LENGTH) {
    code.push(pickChar(ROOM_CODE_CHARS));
  }

  for (let index = code.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomIndex(index + 1);
    [code[index], code[swapIndex]] = [code[swapIndex], code[index]];
  }

  return code.join('');
};

const normalizeRoomCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);

const isValidRoomCode = (value: string) =>
  value.length === ROOM_CODE_LENGTH && /[A-Z]/.test(value) && /[0-9]/.test(value);

const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ShitsApp',
  applicationCategory: 'CommunicationApplication',
  operatingSystem: 'Web',
  description:
    'ShitsApp is a no-signup anonymous chat app and privacy parody for private room-based messaging, pasted images, file attachments, and voice chat.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Anonymous chat rooms',
    'No account signup',
    'Private room codes',
    'Image and file sharing',
    'Voice chat',
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is ShitsApp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ShitsApp is a free anonymous chat website where you create a private room, share the room code, and chat without creating an account or donating your entire personality to an ad machine.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is ShitsApp private?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ShitsApp is built for quick private rooms, temporary messaging, images, files, and voice chat without account registration, profile mining, or fake privacy theatre.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to sign up to use ShitsApp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. You can create or join a ShitsApp room with a room code and start chatting without account registration, profile mining, or fake privacy theatre.',
      },
    },
  ],
};

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [nameStatus, setNameStatus] = useState('');
  const [isDark, setIsDark] = useState(false);
  const user = useAnonymousUser(setNameStatus);

  useEffect(() => {
    setIsDark(localStorage.getItem('anon-theme') === 'dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('anon-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const createRoom = () => {
    user.commitDraftUsername();
    router.push(`/chat/${createRoomCode()}`);
  };

  const joinRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = normalizeRoomCode(roomCode);
    if (!isValidRoomCode(code)) return;

    user.commitDraftUsername();
    router.push(`/chat/${encodeURIComponent(code)}`);
  };

  const shellClass = isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-[#efeae2] text-[#111b21]';
  const panelClass = isDark
    ? 'border-[#222e35] bg-[#111b21]'
    : 'border-[#d1d7db] bg-[#f0f2f5]';
  const formPanelClass = isDark ? 'bg-[#0b141a]' : 'bg-[#efeae2]';
  const inputClass = isDark
    ? 'border-[#2a3942] bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]'
    : 'border-[#d1d7db] bg-white text-[#111b21] placeholder-[#667781]';
  const mutedText = isDark ? 'text-[#aebac1]' : 'text-[#54656f]';
  const headingText = isDark ? 'text-[#e9edef]' : 'text-[#111b21]';
  const cardClass = isDark
    ? 'border border-[#222e35] bg-[#202c33] text-[#d1d7db]'
    : 'border border-[#d1d7db] bg-white text-[#3b4a54]';
  const canJoinRoom = isValidRoomCode(roomCode);

  return (
    <div className={`relative flex min-h-screen flex-col ${shellClass}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productJsonLd, faqJsonLd]),
        }}
      />
      <div className="absolute inset-x-0 top-0 h-56 bg-[#00a884]" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10">
        <section className={`w-full overflow-hidden rounded-3xl border shadow-2xl ${panelClass}`}>
          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <p className="rounded-full bg-[#00a884]/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#00a884]">
                    ShitsApp anonymous chat
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsDark((current) => !current)}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border text-lg transition focus:outline-none focus:ring-2 focus:ring-[#00a884] ${
                      isDark
                        ? 'border-[#2a3942] bg-[#202c33] text-[#d1d7db]'
                        : 'border-[#d1d7db] bg-white text-[#54656f]'
                    }`}
                    aria-label={isDark ? 'Switch to white mode' : 'Switch to dark mode'}
                    title={isDark ? 'Switch to white mode' : 'Switch to dark mode'}
                  >
                    {isDark ? '\u2600' : '\u263E'}
                  </button>
                </div>

                <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
                  Chat without donating your soul.
                </h1>
                <p className={`mt-5 max-w-2xl text-base leading-8 sm:text-lg ${mutedText}`}>
                  Create a private room, share the code, and talk like the internet has not
                  completely ruined trust yet. Messages, pasted images, file attachments, and
                  voice are here. Account signups, profile mining, and creepy little rituals are not.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className={`rounded-2xl p-4 ${cardClass}`}>
                  <p className={`text-2xl font-black ${headingText}`}>0</p>
                  <p className="mt-1 text-sm">accounts required</p>
                </div>
                <div className={`rounded-2xl p-4 ${cardClass}`}>
                  <p className={`text-2xl font-black ${headingText}`}>1</p>
                  <p className="mt-1 text-sm">Room code to share</p>
                </div>
                <div className={`rounded-2xl p-4 ${cardClass}`}>
                  <p className={`text-2xl font-black ${headingText}`}>{'\u221E'}</p>
                  <p className="mt-1 text-sm">ways to avoid small talk</p>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl p-5 shadow-inner ${formPanelClass}`}>
              <h2 className={`text-2xl font-bold ${headingText}`}>Start a private room</h2>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Choose your name, then create or join a clean private room.
              </p>

              <div
                className={`mt-5 rounded-2xl border p-4 ${
                  isDark ? 'border-[#222e35] bg-[#202c33]' : 'border-[#d1d7db] bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="anon-name" className={`text-sm font-semibold ${headingText}`}>
                    Your name
                  </label>
                  {nameStatus && <span className="text-xs font-semibold text-[#00a884]">{nameStatus}</span>}
                </div>
                <form onSubmit={user.saveUsername} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <input
                    id="anon-name"
                    value={user.draftUsername}
                    onChange={(event) => {
                      setNameStatus('');
                      user.setDraftUsername(event.target.value);
                    }}
                    className={`min-w-0 rounded-full border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00a884] ${inputClass}`}
                    placeholder="Choose your name"
                    aria-label="Anonymous chat name"
                    maxLength={24}
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[#00a884] px-5 py-3 font-semibold text-[#06261f] transition hover:bg-[#06cf9c] focus:outline-none focus:ring-2 focus:ring-[#00a884] disabled:cursor-not-allowed disabled:bg-[#8696a0]"
                    disabled={!user.draftUsername.trim()}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={user.randomizeUsername}
                    className={`rounded-full border px-5 py-3 font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#00a884] ${
                      isDark
                        ? 'border-[#2a3942] bg-[#111b21] text-[#d1d7db] hover:bg-[#2a3942]'
                        : 'border-[#d1d7db] bg-white text-[#111b21] hover:bg-[#f5f6f6]'
                    }`}
                  >
                    Random
                  </button>
                </form>
              </div>

              <form onSubmit={joinRoom} className="mt-4 flex min-w-0 gap-2">
                <input
                  value={roomCode}
                  onChange={(event) => setRoomCode(normalizeRoomCode(event.target.value))}
                  className={`min-w-0 flex-1 rounded-full border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00a884] ${inputClass}`}
                  placeholder="ABC123"
                  aria-label="Six character private room ID"
                  autoCapitalize="characters"
                  maxLength={ROOM_CODE_LENGTH}
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#00a884] px-5 py-3 font-semibold text-[#06261f] transition hover:bg-[#06cf9c] focus:outline-none focus:ring-2 focus:ring-[#00a884] disabled:cursor-not-allowed disabled:bg-[#8696a0]"
                  disabled={!canJoinRoom}
                >
                  Join
                </button>
              </form>
              <button
                type="button"
                onClick={createRoom}
                className="mt-3 w-full rounded-full bg-[#00a884] px-6 py-3 font-semibold text-[#06261f] shadow transition hover:bg-[#06cf9c] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              >
                Create private ShitsApp room
              </button>

              <div
                className={`mt-5 grid gap-3 rounded-2xl p-4 text-sm ${
                  isDark ? 'bg-[#202c33] text-[#d1d7db]' : 'bg-[#d9fdd3] text-[#3b4a54]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#00a884] text-[#06261f]">
                    1
                  </span>
                  <span>Rooms use short private IDs with letters and numbers.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#00a884] text-[#06261f]">
                    2
                  </span>
                  <span>Use emoji, pasted images, file attachments, and voice inside the room.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#00a884] text-[#06261f]">
                    3
                  </span>
                  <span>Set your anonymous name from this menu before entering.</span>
                </div>
              </div>
            </div>
          </div>

          <section
            aria-labelledby="why-shitsapp"
            className={`border-t p-5 sm:p-8 ${
              isDark
                ? 'border-[#222e35] bg-[#111b21] text-[#d1d7db]'
                : 'border-[#d1d7db] bg-[#f0f2f5] text-[#3b4a54]'
            }`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#00a884]">
                  Privacy settings, allegedly
                </p>
                <h2 id="why-shitsapp" className={`mt-2 text-3xl font-black ${headingText}`}>
                  Built for people who read the fine print and regret it.
                </h2>
              </div>
              <p className={`max-w-sm text-sm ${mutedText}`}>
                ShitsApp is independent, sarcastic, and allergic to unnecessary profile setup.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className={`rounded-2xl p-5 ${isDark ? 'bg-[#0b141a]' : 'bg-white'}`}>
                <h3 className={`font-semibold ${headingText}`}>Anonymous by default</h3>
                <p className="mt-2">
                  Start a private chat room without phone numbers, profile setup, or an emotional support cookie banner.
                </p>
              </article>
              <article className={`rounded-2xl p-5 ${isDark ? 'bg-[#0b141a]' : 'bg-white'}`}>
                <h3 className={`font-semibold ${headingText}`}>Built for quick rooms</h3>
                <p className="mt-2">
                  Share a room code with one person or a small group, then leave when the conversation has suffered enough.
                </p>
              </article>
              <article className={`rounded-2xl p-5 ${isDark ? 'bg-[#0b141a]' : 'bg-white'}`}>
                <h3 className={`font-semibold ${headingText}`}>More than text</h3>
                <p className="mt-2">
                  Send chat messages, paste images, attach files, and turn on voice when typing cannot carry the disappointment.
                </p>
              </article>
            </div>

            <p className={`mt-5 text-sm ${mutedText}`}>
              This is a privacy parody with useful chat features, not a sacred vault guarded by
              marketing copy. Use it when you want a quick room and fewer questions.
            </p>
          </section>
        </section>
      </main>
      <Footer isDark={isDark} />
    </div>
  );
}
