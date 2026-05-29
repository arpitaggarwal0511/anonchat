import type { Dispatch, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';
import type { VoiceParticipant } from '../types';

type VoiceRoomMenuProps = {
  isDark: boolean;
  isVoiceOn: boolean;
  participants: VoiceParticipant[];
  socket: Socket | null;
  showVoiceMenu: boolean;
  setShowVoiceMenu: Dispatch<SetStateAction<boolean>>;
};

export function VoiceRoomMenu({
  isDark,
  isVoiceOn,
  participants,
  socket,
  showVoiceMenu,
  setShowVoiceMenu,
}: VoiceRoomMenuProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => setShowVoiceMenu((open) => !open)}
        className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
          isVoiceOn
            ? 'bg-emerald-500 text-white'
            : isDark
              ? 'bg-slate-800 text-slate-200'
              : 'bg-slate-100 text-slate-700'
        }`}
      >
        Voice room ({participants.length})
      </button>
      {showVoiceMenu && (
        <div
          className={`absolute bottom-12 left-0 z-30 w-72 rounded-2xl border p-3 shadow-2xl ${
            isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold">Voice chat</p>
            <button
              type="button"
              onClick={() => setShowVoiceMenu(false)}
              className="rounded-full px-2 text-sm opacity-70 hover:opacity-100"
            >
              x
            </button>
          </div>
          <div className="space-y-2">
            {participants.length === 0 ? (
              <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>
                No one is in voice chat yet.
              </p>
            ) : (
              participants.map((member) => {
                const quality = member.stats?.quality || 'Unknown';
                const qualityClass =
                  quality === 'Good'
                    ? 'bg-emerald-500'
                    : quality === 'Fair'
                      ? 'bg-yellow-500'
                      : quality === 'Poor'
                        ? 'bg-red-500'
                        : 'bg-slate-400';

                return (
                  <div key={member.id} className={`rounded-xl p-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {member.id === socket?.id ? 'You' : member.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <span className={`h-2 w-2 rounded-full ${qualityClass}`} />
                        {quality}
                      </span>
                    </div>
                    <p className={isDark ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-slate-500'}>
                      {member.stats?.latency === null || member.stats?.latency === undefined
                        ? 'Latency linking'
                        : `${member.stats.latency}ms`}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
