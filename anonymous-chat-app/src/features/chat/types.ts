import type { MutableRefObject } from 'react';
import type { Socket } from 'socket.io-client';

export type Attachment = {
  data: string;
  name: string;
  type: string;
  size: number;
};

export type ChatMessage = {
  id: string;
  senderId?: string;
  user: string;
  text?: string;
  image?: string;
  imageName?: string;
  attachment?: Attachment;
  timestamp: string;
  readBy?: ReadReceipt[];
};

export type ReadReceipt = {
  userId: string;
  username: string;
  readAt: string;
};

export type VoiceSignal = {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

export type VoiceStats = {
  quality?: 'Good' | 'Fair' | 'Poor' | 'Unknown';
  latency?: number | null;
  connection?: string;
};

export type VoiceParticipant = {
  id: string;
  name: string;
  stats?: VoiceStats;
};

export type SocketRef = MutableRefObject<Socket | null>;

export type ImagePreview = {
  src: string;
  alt: string;
};
