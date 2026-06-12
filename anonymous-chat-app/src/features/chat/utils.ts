import type { VoiceStats } from './types';

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getVoiceQuality = (latency: number | null): VoiceStats['quality'] => {
  if (latency === null) return 'Unknown';
  if (latency !== null && latency > 350) return 'Poor';
  if (latency !== null && latency > 180) return 'Fair';
  return 'Good';
};
