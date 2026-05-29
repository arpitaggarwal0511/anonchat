import type { FormEvent } from 'react';

type ChatHeaderProps = {
  roomId?: string;
  username: string;
  draftUsername: string;
  isEditingName: boolean;
  isDark: boolean;
  headerClass: string;
  softClass: string;
  setDraftUsername: (value: string) => void;
  setIsEditingName: (value: boolean) => void;
  setIsDark: (updater: (current: boolean) => boolean) => void;
  saveUsername: (event: FormEvent<HTMLFormElement>) => void;
  copyRoomCode: () => void;
};

export function ChatHeader({
  roomId,
  username,
  draftUsername,
  isEditingName,
  isDark,
  headerClass,
  softClass,
  setDraftUsername,
  setIsEditingName,
  setIsDark,
  saveUsername,
  copyRoomCode,
}: ChatHeaderProps) {
  return (
    <header className={`sticky top-0 z-20 shrink-0 border-b px-4 py-3 backdrop-blur sm:px-6 ${headerClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Anonymous room</p>
          <h1 className="truncate text-xl font-bold sm:text-2xl">Share-code chat</h1>
          {!isEditingName ? (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Chatting as</span>
              <span className="font-semibold">{username}</span>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="rounded-full px-3 py-1 text-xs font-semibold text-blue-500 transition hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Change
              </button>
            </div>
          ) : (
            <form onSubmit={saveUsername} className="mt-2 flex max-w-sm gap-2">
              <input
                value={draftUsername}
                onChange={(event) => setDraftUsername(event.target.value)}
                className={`min-w-0 flex-1 rounded-full border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'border-slate-700 bg-slate-950 text-white'
                    : 'border-slate-300 bg-slate-50 text-slate-950'
                }`}
                placeholder="Choose a username"
              />
              <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                Save
              </button>
            </form>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDark((current) => !current)}
            className={`grid h-10 w-10 place-items-center rounded-full border text-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              isDark ? 'border-[#2a3942] bg-[#202c33] text-[#d1d7db]' : 'border-slate-200 bg-white'
            }`}
            aria-label={isDark ? 'Switch to white mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to white mode' : 'Switch to dark mode'}
          >
            {isDark ? '\u2600' : '\u263E'}
          </button>
          <button
            type="button"
            onClick={copyRoomCode}
            className="shrink-0 rounded-full border border-blue-300 bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="Copy room code"
          >
            Share
          </button>
        </div>
      </div>
      <div className={`mt-3 rounded-xl px-3 py-2 text-sm ${softClass}`}>
        <span className="font-medium">Room code:</span> <span className="break-all font-mono">{roomId}</span>
      </div>
    </header>
  );
}
