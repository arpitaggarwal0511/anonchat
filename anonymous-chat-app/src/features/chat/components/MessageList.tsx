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
      className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-5 ${
        isDark ? 'wa-chat-bg-dark' : 'wa-chat-bg-light'
      }`}
    >
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-[55vh] items-center justify-center text-center">
            <div className={isDark ? 'text-[#8696a0]' : 'text-[#667781]'}>
              <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full ${isDark ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
                <span className="text-2xl text-[#00a884]">S</span>
              </div>
              <p className={`text-lg font-semibold ${isDark ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>
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
                className={`flex w-fit max-w-[88%] flex-col sm:max-w-[76%] ${isOwn ? 'ml-auto items-end' : 'items-start'}`}
              >
                <div
                  className={`overflow-hidden rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    isOwn
                      ? isDark
                        ? 'rounded-br-md bg-[#005c4b] text-[#e9edef] shadow-black/30'
                        : 'rounded-br-md bg-[#d9fdd3] text-[#111b21]'
                      : isDark
                        ? 'rounded-bl-md bg-[#202c33] text-[#f0f2f5]'
                        : 'rounded-bl-md bg-white text-[#111b21]'
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-semibold ${
                      isOwn
                        ? isDark
                          ? 'text-[#b8e6dc]'
                          : 'text-[#008069]'
                        : isDark
                          ? 'text-[#aebac1]'
                          : 'text-[#667781]'
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
                          ? isDark
                            ? 'bg-[#0b6b58] hover:bg-[#0a8068]'
                            : 'bg-[#c5f2c2] hover:bg-[#b7eeb3]'
                          : isDark
                            ? 'bg-[#2a3942] hover:bg-[#33444d]'
                            : 'bg-[#f0f2f5] hover:bg-[#e9edef]'
                      }`}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#00a884]/20 text-sm font-bold text-[#00a884]">
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
                            ? 'font-bold text-[#53bdeb]'
                            : isDark
                              ? 'font-semibold text-[#aebac1]'
                              : 'font-semibold text-[#667781]'
                        }
                        title={hasBeenRead ? 'Seen' : 'Delivered'}
                      >
                        {'\u2713\u2713'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInfoMessageId((current) => (current === message.id ? null : message.id))}
                        className={`rounded-full px-2 py-0.5 font-semibold transition ${
                          isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-[#008069]/10 text-[#008069] hover:bg-[#008069]/20'
                        }`}
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
                        ? 'border-[#222e35] bg-[#111b21] text-[#e9edef]'
                        : 'border-[#d1d7db] bg-white text-[#3b4a54]'
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
                      <p className={isDark ? 'text-[#8696a0]' : 'text-[#667781]'}>
                        No one has seen this yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {readBy.map((reader) => (
                          <div key={reader.userId} className="flex items-center justify-between gap-2">
                            <span className="truncate font-semibold">{reader.username}</span>
                            <span className={isDark ? 'text-[#8696a0]' : 'text-[#667781]'}>
                              {new Date(reader.readAt).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <span className={`mt-1 text-xs ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
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
