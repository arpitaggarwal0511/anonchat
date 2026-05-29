import { useCallback, useEffect, useRef, useState } from 'react';
import { ICE_SERVERS } from '../constants';
import type { SocketRef, VoiceParticipant, VoiceSignal, VoiceStats } from '../types';
import { getVoiceQuality } from '../utils';

type UseVoiceChatArgs = {
  roomId?: string;
  username: string;
  socketRef: SocketRef;
  connectionStatus: string;
  onStatus: (message: string) => void;
};

export function useVoiceChat({
  roomId,
  username,
  socketRef,
  connectionStatus,
  onStatus,
}: UseVoiceChatArgs) {
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [voicePeers, setVoicePeers] = useState(0);
  const [voiceLatency, setVoiceLatency] = useState<number | null>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceParticipant[]>([]);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const getLocalVoiceStats = useCallback(
    (latency: number | null = voiceLatency): VoiceStats => {
      return {
        quality: getVoiceQuality(latency),
        latency,
        connection: connectionStatus,
      };
    },
    [connectionStatus, voiceLatency]
  );

  const upsertVoiceParticipant = useCallback((participant: VoiceParticipant) => {
    setVoiceParticipants((current) => {
      const next = current.filter((member) => member.id !== participant.id);
      return [...next, participant];
    });
  }, []);

  const removeVoicePeer = useCallback((peerId: string) => {
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
  }, []);

  const createVoicePeer = useCallback(
    (peerId: string) => {
      const existing = peersRef.current.get(peerId);
      if (existing) return existing;

      const socket = socketRef.current;
      if (!socket || !roomId) return null;

      const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
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
          onStatus('Tap Voice again if your browser blocks remote audio.');
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
    },
    [onStatus, removeVoicePeer, roomId, socketRef]
  );

  const stopVoiceChat = useCallback(() => {
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
  }, [roomId, socketRef]);

  const startVoiceChat = useCallback(async () => {
    const socket = socketRef.current;
    if (!roomId || !socket) return;

    if (!socket.connected) {
      onStatus('Chat server is reconnecting. Voice needs the socket connection first.');
      socket.connect();
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
      onStatus('Voice chat is on. Others in this room can join and talk.');

      const self = {
        id: socket.id || 'you',
        name: username || 'You',
        stats: getLocalVoiceStats(null),
      };
      setVoiceParticipants([self]);
      socket.emit('voice-join', roomId, {
        name: username,
        stats: self.stats,
      });
    } catch {
      onStatus('Microphone permission was blocked or unavailable.');
    }
  }, [getLocalVoiceStats, onStatus, roomId, socketRef, username]);

  const toggleVoiceChat = () => {
    if (isVoiceOn) {
      stopVoiceChat();
      return;
    }

    startVoiceChat();
  };

  const onVoiceUsers = useCallback(
    async (participants: VoiceParticipant[]) => {
      if (!localStreamRef.current) return;

      setVoiceParticipants((current) => [
        ...current.filter((member) => member.id === socketRef.current?.id),
        ...participants,
      ]);

      for (const participant of participants) {
        const peer = createVoicePeer(participant.id);
        if (!peer || !roomId) continue;

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current?.emit('voice-signal', roomId, {
          to: participant.id,
          signal: { offer },
        });
      }
    },
    [createVoicePeer, roomId, socketRef]
  );

  const onVoiceSignal = useCallback(
    async ({ from, signal }: { from: string; signal: VoiceSignal }) => {
      if (!localStreamRef.current || !roomId) return;

      const peer = createVoicePeer(from);
      if (!peer) return;

      if (signal.offer) {
        await peer.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socketRef.current?.emit('voice-signal', roomId, {
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
    },
    [createVoicePeer, roomId, socketRef]
  );

  const onVoiceRoster = useCallback((participants: VoiceParticipant[]) => {
    setVoiceParticipants(participants);
  }, []);

  const onVoiceUserStats = useCallback(({ id, stats }: { id: string; stats: VoiceStats }) => {
    setVoiceParticipants((current) =>
      current.map((member) => (member.id === id ? { ...member, stats } : member))
    );
  }, []);

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
  }, [getLocalVoiceStats, isVoiceOn, roomId, socketRef]);

  useEffect(() => {
    return () => stopVoiceChat();
  }, [stopVoiceChat]);

  return {
    isVoiceOn,
    voicePeers,
    voiceLatency,
    voiceParticipants,
    showVoiceMenu,
    setShowVoiceMenu,
    toggleVoiceChat,
    handlers: {
      onVoiceUsers,
      onVoiceUserJoined: upsertVoiceParticipant,
      onVoiceRoster,
      onVoiceUserStats,
      onVoiceSignal,
      onVoiceUserLeft: removeVoicePeer,
    },
  };
}
