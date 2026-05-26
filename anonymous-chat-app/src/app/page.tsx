'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Footer from './Footer';

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

  return (
    <div className={`flex min-h-screen flex-col ${shellClass}`}>
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-10">
        <section className={`w-full rounded-3xl border p-5 shadow-2xl sm:p-8 ${panelClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">
                Anonymous Chat
              </p>
              <h1 className="mt-2 max-w-2xl text-3xl font-bold sm:text-5xl">
                Create a room, share the code, chat freely.
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setIsDark((current) => !current)}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border text-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
              }`}
              aria-label={isDark ? 'Switch to white mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to white mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀' : '☾'}
            </button>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <form onSubmit={joinRoom} className="flex min-w-0 gap-2">
                <input
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value)}
                  className={`min-w-0 flex-1 rounded-full border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                  placeholder="Paste room code"
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
                Create new room
              </button>
            </div>

            <div className={`grid gap-3 rounded-2xl p-4 text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-blue-50 text-slate-700'}`}>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white">
                  1
                </span>
                <span>Share only the room code with the person you want to chat with.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white">
                  2
                </span>
                <span>Use emoji, pasted images, and file attachments inside the room.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white">
                  3
                </span>
                <span>Change your anonymous name anytime before sending the next message.</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
