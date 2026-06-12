import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import type { ChatMessage, ReadReceipt, SocketRef, VoiceParticipant, VoiceSignal, VoiceStats } from '../types';

type VoiceHandlers = {
  onVoiceUsers: (participants: VoiceParticipant[]) => void | Promise<void>;
  onVoiceUserJoined: (participant: VoiceParticipant) => void;
  onVoiceRoster: (participants: VoiceParticipant[]) => void;
  onVoiceUserStats: (payload: { id: string; stats: VoiceStats }) => void;
  onVoiceSignal: (payload: { from: string; signal: VoiceSignal }) => void | Promise<void>;
  onVoiceUserLeft: (peerId: string) => void;
};

type UseChatSocketArgs = {
  roomId?: string;
  username: string;
  socketRef: SocketRef;
  onMessage: (message: ChatMessage) => void;
  onMessageRead: (payload: { messageId: string; receipt: ReadReceipt }) => void;
  voiceHandlers: VoiceHandlers;
};

export function useChatSocket({
  roomId,
  username,
  socketRef,
  onMessage,
  onMessageRead,
  voiceHandlers,
}: UseChatSocketArgs) {
  const onMessageRef = useRef(onMessage);
  const onMessageReadRef = useRef(onMessageRead);
  const voiceHandlersRef = useRef(voiceHandlers);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onMessageReadRef.current = onMessageRead;
    voiceHandlersRef.current = voiceHandlers;
  }, [onMessage, onMessageRead, voiceHandlers]);

  useEffect(() => {
    if (!roomId || !username) return;

    const socket = getSocket();
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit('join-room', roomId, username);
    };

    const handleMessage = (message: ChatMessage) => {
      onMessageRef.current(message);
    };

    const handleMessageRead = (payload: { messageId: string; receipt: ReadReceipt }) => {
      onMessageReadRef.current(payload);
    };

    const handleVoiceUsers = (participants: VoiceParticipant[]) => {
      voiceHandlersRef.current.onVoiceUsers(participants);
    };

    const handleVoiceUserJoined = (participant: VoiceParticipant) => {
      voiceHandlersRef.current.onVoiceUserJoined(participant);
    };

    const handleVoiceRoster = (participants: VoiceParticipant[]) => {
      voiceHandlersRef.current.onVoiceRoster(participants);
    };

    const handleVoiceUserStats = (payload: { id: string; stats: VoiceStats }) => {
      voiceHandlersRef.current.onVoiceUserStats(payload);
    };

    const handleVoiceSignal = (payload: { from: string; signal: VoiceSignal }) => {
      voiceHandlersRef.current.onVoiceSignal(payload);
    };

    const handleVoiceUserLeft = (peerId: string) => {
      voiceHandlersRef.current.onVoiceUserLeft(peerId);
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on('connect', joinRoom);
    }

    socket.on('receive-message', handleMessage);
    socket.on('message-read', handleMessageRead);
    socket.on('voice-users', handleVoiceUsers);
    socket.on('voice-user-joined', handleVoiceUserJoined);
    socket.on('voice-roster', handleVoiceRoster);
    socket.on('voice-user-stats', handleVoiceUserStats);
    socket.on('voice-signal', handleVoiceSignal);
    socket.on('voice-user-left', handleVoiceUserLeft);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive-message', handleMessage);
      socket.off('message-read', handleMessageRead);
      socket.off('voice-users', handleVoiceUsers);
      socket.off('voice-user-joined', handleVoiceUserJoined);
      socket.off('voice-roster', handleVoiceRoster);
      socket.off('voice-user-stats', handleVoiceUserStats);
      socket.off('voice-signal', handleVoiceSignal);
      socket.off('voice-user-left', handleVoiceUserLeft);
    };
  }, [roomId, socketRef, username]);
}
