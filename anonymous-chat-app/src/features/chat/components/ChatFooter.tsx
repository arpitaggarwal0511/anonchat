import type { ChangeEvent, ClipboardEvent, Dispatch, KeyboardEvent, RefObject, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';
import { EMOJI_OPTIONS, QUICK_EMOJI_COUNT } from '../constants';
import type { VoiceParticipant } from '../types';
import { VoiceRoomMenu } from './VoiceRoomMenu';

type ChatFooterProps = {
  isDark: boolean;
  headerClass: string;
  statusMessage: string;
  showEmojiPicker: boolean;
  message: string;
  connectionStatus: string;
  chatLatency: number | null;
  isVoiceOn: boolean;
  voicePeers: number;
  voiceLatency: number | null;
  voiceParticipants: VoiceParticipant[];
  showVoiceMenu: boolean;
  socket: Socket | null;
  inputRef: RefObject<HTMLInputElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  setMessage: (value: string) => void;
  setShowEmojiPicker: (updater: (open: boolean) => boolean) => void;
  setShowVoiceMenu: Dispatch<SetStateAction<boolean>>;
  addEmoji: (emoji: string) => void;
  sendMessage: () => void;
  toggleVoiceChat: () => void;
  handlePaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export function ChatFooter({
  isDark,
  headerClass,
  statusMessage,
  showEmojiPicker,
  message,
  connectionStatus,
  chatLatency,
  isVoiceOn,
  voicePeers,
  voiceLatency,
  voiceParticipants,
  showVoiceMenu,
  socket,
  inputRef,
  fileInputRef,
  setMessage,
  setShowEmojiPicker,
  setShowVoiceMenu,
  addEmoji,
  sendMessage,
  toggleVoiceChat,
  handlePaste,
  handleFileChange,
  handleKeyDown,
}: ChatFooterProps) {
  return (
    <footer className={`shrink-0 border-t px-3 py-2 sm:px-6 sm:py-3 ${headerClass}`}>
      {statusMessage && (
        <p className={`mb-2 text-sm ${statusMessage.includes('large') ? 'text-red-500' : 'text-blue-500'}`}>
          {statusMessage}
        </p>
      )}

      {showEmojiPicker && (
        <div
          className={`mb-3 grid grid-cols-6 gap-2 rounded-2xl border p-3 sm:grid-cols-12 ${
            isDark ? 'border-[#2a3942] bg-[#111b21]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              type="button"
              key={emoji}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => addEmoji(emoji)}
              className={`rounded-xl p-2 text-xl shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isDark ? 'bg-[#202c33] hover:bg-[#2a3942]' : 'bg-white hover:bg-blue-50'
              }`}
              title={`Add ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex flex-wrap gap-2 pb-1 sm:pb-0">
          <VoiceRoomMenu
            isDark={isDark}
            isVoiceOn={isVoiceOn}
            participants={voiceParticipants}
            socket={socket}
            showVoiceMenu={showVoiceMenu}
            setShowVoiceMenu={setShowVoiceMenu}
          />
          {EMOJI_OPTIONS.slice(0, QUICK_EMOJI_COUNT).map((emoji) => (
            <button
              type="button"
              key={`quick-${emoji}`}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => addEmoji(emoji)}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isDark ? 'bg-[#202c33] hover:bg-[#2a3942]' : 'bg-slate-100 hover:bg-blue-50'
              }`}
              title={`Add ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div
          className={`grid grid-cols-3 gap-x-3 gap-y-1 rounded-2xl px-3 py-2 text-[11px] sm:flex sm:items-center sm:gap-3 ${
            isDark ? 'bg-[#202c33] text-[#aebac1]' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <span>
            <b className={isDark ? 'text-[#f0f2f5]' : 'text-slate-800'}>Net</b> {connectionStatus}
          </span>
          <span>
            <b className={isDark ? 'text-[#f0f2f5]' : 'text-slate-800'}>Chat</b>{' '}
            {chatLatency === null ? '--' : `${chatLatency}ms`}
          </span>
          <span>
            <b className={isDark ? 'text-[#f0f2f5]' : 'text-slate-800'}>Voice</b>{' '}
            {isVoiceOn
              ? voicePeers === 0
                ? 'waiting'
                : `${voicePeers} peer${voicePeers === 1 ? '' : 's'} / ${
                    voiceLatency === null ? 'linking' : `${voiceLatency}ms`
                  }`
              : 'off'}
          </span>
        </div>
      </div>

      <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => setShowEmojiPicker((open) => !open)}
          className={`grid h-11 w-11 place-items-center rounded-full border text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            isDark ? 'border-[#2a3942] bg-[#202c33] text-[#d1d7db]' : 'border-slate-200 bg-white'
          }`}
          aria-label="Add emoji"
          title="Add emoji"
        >
          :)
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`grid h-11 w-11 place-items-center rounded-full border text-xl transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            isDark ? 'border-[#2a3942] bg-[#202c33] text-[#d1d7db]' : 'border-slate-200 bg-white'
          }`}
          aria-label="Attach file"
          title="Attach file"
        >
          +
        </button>
        <button
          type="button"
          onClick={toggleVoiceChat}
          className={`grid h-11 w-11 place-items-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            isVoiceOn
              ? 'border-emerald-300 bg-emerald-500 text-white'
              : isDark
                ? 'border-[#2a3942] bg-[#202c33] text-[#d1d7db]'
                : 'border-slate-200 bg-white'
          }`}
          aria-label={isVoiceOn ? 'Leave voice chat' : 'Join voice chat'}
          title={isVoiceOn ? 'Leave voice chat' : 'Join voice chat'}
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <path d="M12 19v3" />
          </svg>
        </button>
        <input
          ref={inputRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          className={`min-w-0 flex-1 rounded-full border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDark
              ? 'border-[#2a3942] bg-[#202c33] text-[#f0f2f5] placeholder-[#8696a0]'
              : 'border-slate-300 bg-white text-slate-950 placeholder-slate-500'
          }`}
          placeholder="Message, paste image, or attach file"
        />
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={sendMessage}
          className="rounded-full bg-blue-600 px-5 py-3 font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </footer>
  );
}
