type ChatHeaderProps = {
  roomId?: string;
  username: string;
  isDark: boolean;
  headerClass: string;
  setIsDark: (updater: (current: boolean) => boolean) => void;
  copyRoomCode: () => void;
};

export function ChatHeader({
  roomId,
  username,
  isDark,
  headerClass,
  setIsDark,
  copyRoomCode,
}: ChatHeaderProps) {
  return (
    <header className={`sticky top-0 z-20 shrink-0 border-b px-3 py-2 backdrop-blur sm:px-5 sm:py-3 ${headerClass}`}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#00a884] text-base font-black text-[#06261f]">
            {(username || 'A').slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">Share-code chat</h1>
            <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs sm:text-sm">
              <span className={isDark ? 'text-[#aebac1]' : 'text-[#667781]'}>As</span>
              <span className="truncate font-medium">{username || 'Anonymous'}</span>
              {roomId && (
                <>
                  <span className={isDark ? 'text-[#8696a0]' : 'text-[#8696a0]'}>|</span>
                  <span className="truncate font-mono text-[#00a884]">{roomId}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDark((current) => !current)}
            className={`grid h-10 w-10 place-items-center rounded-full border text-lg transition focus:outline-none focus:ring-2 focus:ring-[#00a884] ${
              isDark
                ? 'border-[#2a3942] bg-[#111b21] text-[#d1d7db] hover:bg-[#2a3942]'
                : 'border-[#d1d7db] bg-white text-[#54656f] hover:bg-[#f5f6f6]'
            }`}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '\u2600' : '\u263E'}
          </button>
          <button
            type="button"
            onClick={copyRoomCode}
            className="shrink-0 rounded-full bg-[#00a884] px-4 py-2 text-sm font-semibold text-[#06261f] transition hover:bg-[#06cf9c] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
            aria-label="Copy room ID"
            title="Copy room ID"
          >
            Share
          </button>
        </div>
      </div>
    </header>
  );
}
