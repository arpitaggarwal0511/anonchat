'use client';

import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useParams } from 'next/navigation';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

type Attachment = {
  data: string;
  name: string;
  type: string;
  size: number;
};

type ChatMessage = {
  user: string;
  text?: string;
  image?: string;
  imageName?: string;
  attachment?: Attachment;
  timestamp: string;
};

const EMOJI_OPTIONS = ['😀', '😂', '😍', '😎', '😭', '😡', '👍', '🙏', '🔥', '🎉', '❤️', '✨'];
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ChatRoom() {
  const params = useParams();
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
  const [username, setUsername] = useState('');
  const [draftUsername, setDraftUsername] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeImage, setActiveImage] = useState<{ src: string; alt: string } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIsDark(localStorage.getItem('anon-theme') === 'dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('anon-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    if (!roomId) return;

    let stored = localStorage.getItem('anon-username');
    if (!stored) {
      const animals = ['Tiger', 'Fox', 'Panda', 'Wolf'];
      const colors = ['Blue', 'Red', 'Green', 'Purple'];
      stored =
        colors[Math.floor(Math.random() * colors.length)] +
        animals[Math.floor(Math.random() * animals.length)] +
        Math.floor(Math.random() * 100);
      localStorage.setItem('anon-username', stored);
    }
    setUsername(stored);
    setDraftUsername(stored);

    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      socket.emit('join-room', roomId, stored);
    };

    const handleReceive = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    if (socket.connected) {
      socket.emit('join-room', roomId, stored);
    } else {
      socket.on('connect', handleConnect);
    }

    socket.on('receive-message', handleReceive);

    return () => {
      socket.off('receive-message', handleReceive);
      socket.off('connect', handleConnect);
    };
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendChatMessage = (
    payload: Pick<ChatMessage, 'text' | 'image' | 'imageName' | 'attachment'>
  ) => {
    if (!payload.text?.trim() && !payload.image && !payload.attachment) return;

    socketRef.current?.emit('send-message', roomId, {
      user: username,
      text: payload.text?.trim(),
      image: payload.image,
      imageName: payload.imageName,
      attachment: payload.attachment,
      timestamp: new Date().toISOString(),
    });
  };

  const sendMessage = () => {
    sendChatMessage({ text: message });
    setMessage('');
    setShowEmojiPicker(false);
  };

  const sendFile = (file: File) => {
    setStatusMessage('');

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setStatusMessage('Attachment is too large. Choose a file under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;

      sendChatMessage({
        attachment: {
          data: reader.result,
          name: file.name || 'Attachment',
          type: file.type || 'application/octet-stream',
          size: file.size,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const sendPastedImage = (file: File) => {
    setStatusMessage('');

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setStatusMessage('Image is too large. Paste an image under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;

      sendChatMessage({
        image: reader.result,
        imageName: file.name || 'Pasted image',
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const imageItem = Array.from(event.clipboardData.items).find((item) =>
      item.type.startsWith('image/')
    );

    if (!imageItem) {
      setStatusMessage('');
      return;
    }

    const file = imageItem.getAsFile();
    if (!file) return;

    event.preventDefault();
    sendPastedImage(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) sendFile(file);
    event.target.value = '';
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage((current) => `${current}${emoji}`);
    inputRef.current?.focus();
  };

  const copyRoomCode = async () => {
    if (!roomId) return;
    await navigator.clipboard.writeText(roomId);
    setStatusMessage('Room code copied.');
  };

  const saveUsername = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = draftUsername.trim();
    if (!nextName) return;
    setUsername(nextName);
    localStorage.setItem('anon-username', nextName);
    setIsEditingName(false);
    setStatusMessage('Username updated for new messages.');
  };

  const shellClass = isDark
    ? 'bg-slate-950 text-slate-100'
    : 'bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),#f8fafc] text-slate-950';
  const panelClass = isDark ? 'bg-slate-900 shadow-blue-950/30' : 'bg-white shadow-slate-300/70';
  const headerClass = isDark ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white/95';
  const softClass = isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600';

  return (
    <div className={`min-h-screen ${shellClass}`}>
      <div className={`mx-auto flex min-h-screen max-w-4xl flex-col shadow-2xl ${panelClass}`}>
        <header className={`border-b px-4 py-3 backdrop-blur sm:px-6 ${headerClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                Anonymous room
              </p>
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
                  isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                }`}
                aria-label={isDark ? 'Switch to white mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to white mode' : 'Switch to dark mode'}
              >
                {isDark ? '☀' : '☾'}
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
            <span className="font-medium">Room code:</span>{' '}
            <span className="break-all font-mono">{roomId}</span>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto px-4 py-5 sm:px-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
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
              <>
                {messages.map((msg, idx) => {
                  const isOwn = msg.user === username;
                  const imageSource = msg.attachment?.type.startsWith('image/')
                    ? msg.attachment.data
                    : msg.image;
                  const attachment = msg.attachment;

                  return (
                    <div
                      key={`${msg.timestamp}-${idx}`}
                      className={`flex w-fit max-w-[84%] flex-col ${
                        isOwn ? 'ml-auto items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`overflow-hidden rounded-3xl px-3 py-2 text-sm shadow-sm ${
                          isOwn
                            ? 'rounded-br-md bg-blue-600 text-white'
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
                          {isOwn ? 'You' : msg.user}
                        </p>
                        {imageSource && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveImage({
                                src: imageSource,
                                alt: attachment?.name || msg.imageName || 'Shared image',
                              })
                            }
                            className="mb-2 block w-full overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/80"
                            title="Open image"
                          >
                            <img
                              src={imageSource}
                              alt={attachment?.name || msg.imageName || 'Shared image'}
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
                              ⤓
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">{attachment.name}</span>
                              <span className="text-xs opacity-80">{formatBytes(attachment.size)}</span>
                            </span>
                          </a>
                        )}
                        {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                      </div>
                      <span className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </>
            )}
          </div>
        </main>

        <footer className={`border-t px-4 py-3 sm:px-6 ${headerClass}`}>
          {statusMessage && (
            <p className={`mb-2 text-sm ${statusMessage.includes('large') ? 'text-red-500' : 'text-blue-500'}`}>
              {statusMessage}
            </p>
          )}
          {showEmojiPicker && (
            <div
              className={`mb-3 grid grid-cols-6 gap-2 rounded-2xl border p-3 sm:grid-cols-12 ${
                isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
              }`}
            >
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className={`rounded-xl p-2 text-xl shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    isDark ? 'bg-slate-900 hover:bg-slate-700' : 'bg-white hover:bg-blue-50'
                  }`}
                  title={`Add ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {EMOJI_OPTIONS.slice(0, 6).map((emoji) => (
              <button
                type="button"
                key={`quick-${emoji}`}
                onClick={() => addEmoji(emoji)}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-blue-50'
                }`}
                title={`Add ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((open) => !open)}
              className={`grid h-11 w-11 place-items-center rounded-full border text-xl transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
              }`}
              aria-label="Add emoji"
              title="Add emoji"
            >
              ☺
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`grid h-11 w-11 place-items-center rounded-full border text-xl transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
              }`}
              aria-label="Attach file"
              title="Attach file"
            >
              +
            </button>
            <input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              className={`min-w-0 flex-1 rounded-full border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'border-slate-700 bg-slate-950 text-white placeholder-slate-500'
                  : 'border-slate-300 bg-slate-50 text-slate-950 placeholder-slate-500'
              }`}
              placeholder="Message, paste image, or attach file"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="rounded-full bg-blue-600 px-5 py-3 font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={!message.trim()}
            >
              Send
            </button>
          </div>
        </footer>
      </div>

      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setActiveImage(null)}
        >
          <button
            type="button"
            onClick={() => setActiveImage(null)}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close image preview"
          >
            ×
          </button>
          <img
            src={activeImage.src}
            alt={activeImage.alt}
            className="max-h-[92vh] max-w-[96vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
