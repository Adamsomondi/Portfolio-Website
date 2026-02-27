// src/utils/voice/constants.ts
import type { VoiceConfig } from '../../types/voice';

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voice: 'shimmer',
  model: 'gpt-4o-realtime-preview-2024-12-17',
  instructions: `You are Chipe — a small robot who lives in space.
Keep responses SHORT — 1-2 sentences usually.
Be genuine, funny, and warm.`,
  temperature: 0.8,
  maxTokens: 150,
  vadThreshold: 0.5,
  silenceTimeout: 500,
  enableTranscription: true,
};

export const AUDIO_CONFIG = {
  sampleRate: 24000,
  bufferSize: 4096,
  channels: 1,
};