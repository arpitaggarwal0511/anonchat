'use client';

import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useParams } from 'next/navigation';
import { Socket } from 'socket.io-client';
import { getSocket, getSocketUrl } from '@/lib/socket';

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

type VoiceSignal = {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

type VoiceStats = {
  speed?: string;
  quality?: 'Good' | 'Fair' | 'Poor' | 'Unknown';
  latency?: number | null;
  connection?: string;
};

type VoiceParticipant = {
  id: string;
  name: string;
  stats?: VoiceStats;
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
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [voicePeers, setVoicePeers] = useState(0);
  const [chatLatency, setChatLatency] = useState<number | null>(null);
  const [voiceLatency, setVoiceLatency] = useState<number | null>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceParticipant[]>([]);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [networkSpeed, setNetworkSpeed] = useState('Unknown');
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const [socketUrl] = useState(getSocketUrl);
  const socketRef = useRef<Socket | null>(null);
  const chatScrollRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    setIsDark(localStorage.getItem('anon-theme') === 'dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('anon-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const getLocalVoiceStats = (latency: number | null = voiceLatency): VoiceStats => {
    const connection = (
      navigator as Navigator & {
        connection?: { downlink?: number; effectiveType?: string };
      }
    ).connection;
    const downlink = connection?.downlink;
    const quality =
      latency !== null && latency > 350
        ? 'Poor'
        : latency !== null && latency > 180
          ? 'Fair'
          : downlink !== undefined && downlink < 0.7
            ? 'Poor'
            : downlink !== undefined && downlink < 1.5
              ? 'Fair'
              : 'Good';

    return {
      speed: downlink ? `${downlink.toFixed(1)} Mbps ${connection?.effectiveType || ''}`.trim() : networkSpeed,
      quality,
      latency,
      connection: connectionStatus,
    };
  };

  const upsertVoiceParticipant = (participant: VoiceParticipant) => {
    setVoiceParticipants((current) => {
      const next = current.filter((member) => member.id !== participant.id);
      return [...next, participant];
    });
  };

  const removeVoicePeer = (peerId: string) => {
    peersRef.current.get(peerId)?.close();
    peersRef.current.delete(peerId);

    const audio = remoteAudioRef.current.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
    }
    remoteAudioRef.current.delete(peerId);
    setVoiceParticipants((current) => current.filter((member) => member.id !== peerId));
    setVoicePeers(peersRef.current.size);
  };

  const createVoicePeer = (peerId: string) => {
    const existing = peersRef.current.get(peerId);
    if (existing) return existing;

    const socket = socketRef.current;
    if (!socket || !roomId) return null;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    const localStream = localStreamRef.current;
    localStream?.getTracks().forEach((track) => {
      peer.addTrack(track, localStream);
    });

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      socket.emit('voice-signal', roomId, {
        to: peerId,
        signal: { candidate: event.candidate.toJSON() },
      });
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream || remoteAudioRef.current.has(peerId)) return;

      const audio = new Audio();
      audio.srcObject = stream;
      audio.autoplay = true;
      audio.setAttribute('playsinline', 'true');
      remoteAudioRef.current.set(peerId, audio);
      audio.play().catch(() => {
        setStatusMessage('Tap Voice again if your browser blocks remote audio.');
      });
    };

    peer.onconnectionstatechange = () => {
      if (['closed', 'failed', 'disconnected'].includes(peer.connectionState)) {
        removeVoicePeer(peerId);
      }
    };

    peersRef.current.set(peerId, peer);
    setVoicePeers(peersRef.current.size);
    return peer;
  };

  const stopVoiceChat = () => {
    socketRef.current?.emit('voice-leave', roomId);
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    remoteAudioRef.current.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
    });
    remoteAudioRef.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setIsVoiceOn(false);
    setVoicePeers(0);
    setVoiceLatency(null);
    setVoiceParticipants([]);
  };

  const startVoiceChat = async () => {
    if (!roomId || !socketRef.current) return;

    if (!socketRef.current.connected) {
      setStatusMessage('Chat server is reconnecting. Voice needs the socket connection first.');
      socketRef.current.connect();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;
      setIsVoiceOn(true);
      setStatusMessage('Voice chat is on. Others in this room can join and talk.');
      const self = {
        id: socketRef.current.id || 'you',
        name: username || 'You',
        stats: getLocalVoiceStats(null),
      };
      setVoiceParticipants([self]);
      socketRef.current.emit('voice-join', roomId, {
        name: username,
        stats: self.stats,
      });
    } catch {
      setStatusMessage('Microphone permission was blocked or unavailable.');
    }
  };

  const toggleVoiceChat = () => {
    if (isVoiceOn) {
      stopVoiceChat();
      return;
    }

    startVoiceChat();
  };

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

    const handleVoiceUsers = async (participants: VoiceParticipant[]) => {
      if (!localStreamRef.current) return;

      setVoiceParticipants((current) => [
        ...current.filter((member) => member.id === socket.id),
        ...participants,
      ]);

      for (const participant of participants) {
        const peer = createVoicePeer(participant.id);
        if (!peer) continue;

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('voice-signal', roomId, {
          to: participant.id,
          signal: { offer },
        });
      }
    };

    const handleVoiceUserJoined = (participant: VoiceParticipant) => {
      upsertVoiceParticipant(participant);
    };

    const handleVoiceRoster = (participants: VoiceParticipant[]) => {
      setVoiceParticipants(participants);
    };

    const handleVoiceUserStats = ({ id, stats }: { id: string; stats: VoiceStats }) => {
      setVoiceParticipants((current) =>
        current.map((member) => (member.id === id ? { ...member, stats } : member))
      );
    };

    const handleVoiceSignal = async ({
      from,
      signal,
    }: {
      from: string;
      signal: VoiceSignal;
    }) => {
      if (!localStreamRef.current) return;

      const peer = createVoicePeer(from);
      if (!peer) return;

      if (signal.offer) {
        await peer.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('voice-signal', roomId, {
          to: from,
          signal: { answer },
        });
      }

      if (signal.answer) {
        await peer.setRemoteDescription(new RTCSessionDescription(signal.answer));
      }

      if (signal.candidate) {
        await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    };

    if (socket.connected) {
      socket.emit('join-room', roomId, stored);
    } else {
      socket.on('connect', handleConnect);
    }

    socket.on('receive-message', handleReceive);
    socket.on('voice-users', handleVoiceUsers);
    socket.on('voice-user-joined', handleVoiceUserJoined);
    socket.on('voice-roster', handleVoiceRoster);
    socket.on('voice-user-stats', handleVoiceUserStats);
    socket.on('voice-signal', handleVoiceSignal);
    socket.on('voice-user-left', removeVoicePeer);

    return () => {
      socket.off('receive-message', handleReceive);
      socket.off('connect', handleConnect);
      socket.off('voice-users', handleVoiceUsers);
      socket.off('voice-user-joined', handleVoiceUserJoined);
      socket.off('voice-roster', handleVoiceRoster);
      socket.off('voice-user-stats', handleVoiceUserStats);
      socket.off('voice-signal', handleVoiceSignal);
      socket.off('voice-user-left', removeVoicePeer);
    };
    // Voice helpers intentionally read live refs; listeners only need to reset per room.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    const updateStats = () => {
      const socket = socketRef.current;
      setConnectionStatus(socket?.connected ? 'Online' : navigator.onLine ? 'Reconnecting' : 'Offline');

      const connection = (
        navigator as Navigator & {
          connection?: { downlink?: number; effectiveType?: string };
        }
      ).connection;

      if (connection?.downlink) {
        setNetworkSpeed(`${connection.downlink.toFixed(1)} Mbps ${connection.effectiveType || ''}`.trim());
      }

      if (socket && !socket.connected) {
        const usingLocalhost = socketUrl.includes('localhost') || socketUrl.includes('127.0.0.1');
        setStatusMessage(
          usingLocalhost
            ? 'Socket URL is still localhost. Set NEXT_PUBLIC_SOCKET_URL on Netlify and redeploy.'
            : `Chat server reconnecting: ${socketUrl}`
        );
      }

      if (socket?.connected) {
        const sentAt = performance.now();
        socket.timeout(2000).emit('latency-ping', (error?: Error) => {
          if (error) {
            setChatLatency(null);
            return;
          }

          setChatLatency(Math.round(performance.now() - sentAt));
        });
      }
    };

    updateStats();
    const interval = window.setInterval(updateStats, 3000);
    window.addEventListener('online', updateStats);
    window.addEventListener('offline', updateStats);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', updateStats);
      window.removeEventListener('offline', updateStats);
    };
  }, [socketUrl]);

  useEffect(() => {
    if (!isVoiceOn) {
      setVoiceLatency(null);
      return;
    }

    const interval = window.setInterval(async () => {
      let latestLatency: number | null = null;

      for (const peer of peersRef.current.values()) {
        const stats = await peer.getStats();
        stats.forEach((report) => {
          const candidatePair = report as RTCStats & {
            state?: string;
            currentRoundTripTime?: number;
          };

          if (
            candidatePair.type === 'candidate-pair' &&
            candidatePair.state === 'succeeded' &&
            typeof candidatePair.currentRoundTripTime === 'number'
          ) {
            latestLatency = Math.round(candidatePair.currentRoundTripTime * 1000);
          }
        });
      }

      setVoiceLatency(latestLatency);
      const stats = getLocalVoiceStats(latestLatency);
      const selfId = socketRef.current?.id;
      if (selfId) {
        setVoiceParticipants((current) =>
          current.map((member) => (member.id === selfId ? { ...member, stats } : member))
        );
      }
      socketRef.current?.emit('voice-stats', roomId, stats);
    }, 3000);

    return () => window.clearInterval(interval);
    // This interval reads live refs and room id while voice is enabled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVoiceOn]);

  useEffect(() => {
    return () => stopVoiceChat();
    // Cleanup should only run when this chat page unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const chatPane = chatScrollRef.current;
    if (!chatPane) return;

    chatPane.scrollTop = chatPane.scrollHeight;
  }, [messages]);

  const keepInputFocused = () => {
    window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  };

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
    keepInputFocused();
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
      keepInputFocused();
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
      keepInputFocused();
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
    keepInputFocused();
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
    <div className={`h-[100dvh] overflow-hidden ${shellClass}`}>
      <div className={`mx-auto flex h-[100dvh] max-w-4xl flex-col overflow-hidden shadow-2xl ${panelClass}`}>
        <header className={`sticky top-0 z-20 shrink-0 border-b px-4 py-3 backdrop-blur sm:px-6 ${headerClass}`}>
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

        <main
          ref={chatScrollRef}
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}
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
              </>
            )}
          </div>
        </main>

        <footer className={`shrink-0 border-t px-3 py-2 sm:px-6 sm:py-3 ${headerClass}`}>
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
                  onPointerDown={(event) => event.preventDefault()}
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
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex flex-wrap gap-2 pb-1 sm:pb-0">
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
                Voice room ({voiceParticipants.length})
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
                    {voiceParticipants.length === 0 ? (
                      <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>
                        No one is in voice chat yet.
                      </p>
                    ) : (
                      voiceParticipants.map((member) => {
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
                          <div
                            key={member.id}
                            className={`rounded-xl p-2 ${
                              isDark ? 'bg-slate-800' : 'bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold">
                                {member.id === socketRef.current?.id ? 'You' : member.name}
                              </span>
                              <span className="flex items-center gap-1 text-xs">
                                <span className={`h-2 w-2 rounded-full ${qualityClass}`} />
                                {quality}
                              </span>
                            </div>
                            <p className={isDark ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-slate-500'}>
                              {member.stats?.speed || 'Speed unknown'} ·{' '}
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
              {EMOJI_OPTIONS.slice(0, 6).map((emoji) => (
                <button
                  type="button"
                  key={`quick-${emoji}`}
                  onPointerDown={(event) => event.preventDefault()}
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
            <div
              className={`grid grid-cols-2 gap-x-3 gap-y-1 rounded-2xl px-3 py-2 text-[11px] sm:flex sm:items-center sm:gap-3 ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span>
                <b className={isDark ? 'text-slate-100' : 'text-slate-800'}>Net</b> {connectionStatus}
              </span>
              <span>
                <b className={isDark ? 'text-slate-100' : 'text-slate-800'}>Speed</b> {networkSpeed}
              </span>
              <span>
                <b className={isDark ? 'text-slate-100' : 'text-slate-800'}>Chat</b>{' '}
                {chatLatency === null ? '--' : `${chatLatency}ms`}
              </span>
              <span>
                <b className={isDark ? 'text-slate-100' : 'text-slate-800'}>Voice</b>{' '}
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
            <button
              type="button"
              onClick={toggleVoiceChat}
              className={`grid h-11 w-11 place-items-center rounded-full border text-xl transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isVoiceOn
                  ? 'border-emerald-300 bg-emerald-500 text-white'
                  : isDark
                    ? 'border-slate-700 bg-slate-800'
                    : 'border-slate-200 bg-white'
              }`}
              aria-label={isVoiceOn ? 'Leave voice chat' : 'Join voice chat'}
              title={isVoiceOn ? 'Leave voice chat' : 'Join voice chat'}
            >
              {isVoiceOn ? '●' : '☎'}
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
              onPointerDown={(event) => event.preventDefault()}
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
