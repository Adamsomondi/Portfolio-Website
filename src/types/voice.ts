// src/types/voice.ts


export type VoiceEmotion = 'neutral' | 'happy' | 'sad' | 'surprised' | 'thinking' | 'listening' | 'talking' | 'excited' | 'concerned';
export type VoiceStatus = 'idle' | 'listening' | 'speaking' | 'connecting' | 'connected' | 'processing' | 'error';

export interface VoiceConfig {
  voice: string;
  model: string;
  instructions: string;
  temperature: number;
  maxTokens: number;
  vadThreshold: number;
  silenceTimeout: number;
  enableTranscription: boolean;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';  // Removed 'system' to match voiceStore
  content: string;
  timestamp: number;
}

export interface AudioConfig {
  sampleRate: number;
  bufferSize: number;
  channels: number;
}