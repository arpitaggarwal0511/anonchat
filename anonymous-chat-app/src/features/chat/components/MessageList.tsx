import { useState, type RefObject } from 'react';
import type { ChatMessage, ImagePreview } from '../types';
import { formatBytes } from '../utils';

type MessageListProps = {
  messages: ChatMessage[];
  username: string;
  currentUserId?: string;
  isDark: boolean;
  chatScrollRef: RefObject<HTMLElement | null>;
  setActiveImage: (image: ImagePreview) => void;
};

export function MessageList({
  messages,
  username,
  currentUserId,
  isDark,
  chatScrollRef,
  setActiveImage,
}: MessageListProps) {
  const [infoMessageId, setInfoMessageId] = useState<string | null>(null);

  return (
    <main
      ref={chatScrollRef}
      className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 ${
        isDark ? 'bg-slate-950' : 'bg-slate-50'
      }`}
    >
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-[55vh] items-center justify-center text-center">
            <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              <p className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                Your room is ready
              </p>
              <p className="mt-1 text-sm">Share the code, send a message, or attach a file.</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId ? message.senderId === currentUserId : message.user === username;
            const imageSource = message.attachment?.type.startsWith('image/')
              ? message.attachment.data
              : message.image;
            const attachment = message.attachment;
            const readBy = message.readBy || [];
            const hasBeenRead = readBy.length > 0;

            return (
              <div
                key={`${message.timestamp}-${index}`}
                className={`flex w-fit max-w-[84%] flex-col ${isOwn ? 'ml-auto items-end' : 'items-start'}`}
              >
                <div
                  className={`overflow-hidden rounded-3xl px-3 py-2 text-sm shadow-sm ${
                    isOwn
                      ? 'rounded-br-md bg-[#123b8c] text-white shadow-blue-950/30'
                      : isDark
                        ? 'rounded-bl-md bg-slate-800 text-slate-100'
                        : 'rounded-bl-md bg-white text-slate-900'
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-semibold ${
                      isOwn ? 'text-blue-100' : isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {isOwn ? 'You' : message.user}
                  </p>
                  {imageSource && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImage({
                          src: imageSource,
                          alt: attachment?.name || message.imageName || 'Shared image',
                        })
                      }
                      className="mb-2 block w-full overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/80"
                      title="Open image"
                    >
                      <img
                        src={imageSource}
                        alt={attachment?.name || message.imageName || 'Shared image'}
                        className="max-h-80 w-full object-contain transition hover:scale-[1.01]"
                      />
                    </button>
                  )}
                  {attachment && !attachment.type.startsWith('image/') && (
                    <a
                      href={attachment.data}
                      download={attachment.name}
                      className={`mb-2 flex min-w-56 items-center gap-3 rounded-2xl p-3 transition ${
                        isOwn
                          ? 'bg-blue-500 hover:bg-blue-400'
                          : isDark
                            ? 'bg-slate-700 hover:bg-slate-600'
                            : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-lg">
                        DL
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{attachment.name}</span>
                        <span className="text-xs opacity-80">{formatBytes(attachment.size)}</span>
                      </span>
                    </a>
                  )}
                  {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
                  {isOwn && (
                    <div className="mt-2 flex items-center justify-end gap-2 text-[11px]">
                      <span
                        className={
                          hasBeenRead
                            ? 'font-black text-[#22ff66] drop-shadow-[0_0_6px_rgba(34,255,102,0.95)]'
                            : 'font-semibold text-slate-300'
                        }
                        title={hasBeenRead ? 'Seen' : 'Delivered'}
                      >
                        {'\u2713\u2713'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInfoMessageId((current) => (current === message.id ? null : message.id))}
                        className="rounded-full bg-white/10 px-2 py-0.5 font-semibold transition hover:bg-white/20"
                      >
                        Info
                      </button>
                    </div>
                  )}
                </div>
                {isOwn && infoMessageId === message.id && (
                  <div
                    className={`mt-2 w-64 rounded-2xl border p-3 text-xs shadow-xl ${
                      isDark
                        ? 'border-slate-700 bg-slate-900 text-slate-200'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-bold">Seen by</p>
                      <button
                        type="button"
                        onClick={() => setInfoMessageId(null)}
                        className="rounded-full px-2 opacity-70 hover:opacity-100"
                      >
                        x
                      </button>
                    </div>
                    {readBy.length === 0 ? (
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                        No one has seen this yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {readBy.map((reader) => (
                          <div key={reader.userId} className="flex items-center justify-between gap-2">
                            <span className="truncate font-semibold">{reader.username}</span>
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                              {new Date(reader.readAt).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <span className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
