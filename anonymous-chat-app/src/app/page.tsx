'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Footer from './Footer';

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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(localStorage.getItem('anon-theme') === 'dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('anon-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const createRoom = () => {
    router.push(`/chat/${uuidv4()}`);
  };

  const joinRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = roomCode.trim();
    if (!code) return;
    router.push(`/chat/${encodeURIComponent(code)}`);
  };

  const shellClass = isDark
    ? 'bg-slate-950 text-slate-100'
    : 'bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),#f8fafc] text-slate-950';
  const panelClass = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white';
  const inputClass = isDark
    ? 'border-slate-700 bg-slate-950 text-white placeholder-slate-500'
    : 'border-slate-300 bg-slate-50 text-slate-950 placeholder-slate-500';
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-700';
  const headingText = isDark ? 'text-white' : 'text-slate-950';
  const cardClass = isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-50 text-slate-700';

  return (
    <div className={`flex min-h-screen flex-col ${shellClass}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productJsonLd, faqJsonLd]),
        }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10">
        <section className={`w-full overflow-hidden rounded-3xl border shadow-2xl ${panelClass}`}>
          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <p className="rounded-full bg-blue-600/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-blue-500">
                    ShitsApp anonymous chat
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsDark((current) => !current)}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border text-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
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
                  <p className="mt-1 text-sm">room code to share</p>
                </div>
                <div className={`rounded-2xl p-4 ${cardClass}`}>
                  <p className={`text-2xl font-black ${headingText}`}>{'\u221E'}</p>
                  <p className="mt-1 text-sm">ways to avoid small talk</p>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl p-5 shadow-inner ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
              <h2 className={`text-2xl font-bold ${headingText}`}>Start a private room</h2>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Bring your own human. We provide the room code and the faint illusion of control.
              </p>

              <form onSubmit={joinRoom} className="mt-5 flex min-w-0 gap-2">
                <input
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value)}
                  className={`min-w-0 flex-1 rounded-full border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                  placeholder="Paste room code"
                  aria-label="ShitsApp private room code"
                />
                <button
                  type="submit"
                  className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={!roomCode.trim()}
                >
                  Join
                </button>
              </form>
              <button
                type="button"
                onClick={createRoom}
                className="mt-3 w-full rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Create private ShitsApp room
              </button>

              <div className={`mt-5 grid gap-3 rounded-2xl p-4 text-sm ${isDark ? 'bg-slate-900 text-slate-300' : 'bg-blue-50 text-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white">
                    1
                  </span>
                  <span>Share only the room code. Revolutionary concept: consent.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white">
                    2
                  </span>
                  <span>Use emoji, pasted images, file attachments, and voice inside the room.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white">
                    3
                  </span>
                  <span>Change your anonymous name before sending. Identity crisis supported.</span>
                </div>
              </div>
            </div>
          </div>

          <section
            aria-labelledby="why-shitsapp"
            className={`border-t p-5 sm:p-8 ${
              isDark ? 'border-slate-800 bg-slate-900/70 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">
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
              <article className={`rounded-2xl p-5 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <h3 className={`font-semibold ${headingText}`}>Anonymous by default</h3>
                <p className="mt-2">
                  Start a private chat room without phone numbers, profile setup, or an emotional support cookie banner.
                </p>
              </article>
              <article className={`rounded-2xl p-5 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <h3 className={`font-semibold ${headingText}`}>Built for quick rooms</h3>
                <p className="mt-2">
                  Share a room code with one person or a small group, then leave when the conversation has suffered enough.
                </p>
              </article>
              <article className={`rounded-2xl p-5 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
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
      <Footer />
    </div>
  );
}
