// src/stores/voiceStore.ts
import { create } from 'zustand';
import type { ConversationMessage, VoiceStatus, VoiceEmotion } from '../types/voice';

// Re-export for convenience
export type { ConversationMessage, VoiceStatus, VoiceEmotion };

interface VoiceState {
  // State
  state: VoiceStatus;
  status: VoiceStatus;
  emotion: VoiceEmotion;
  transcript: string;
  response: string;
  messages: ConversationMessage[];
  isListening: boolean;
  isSpeaking: boolean;
  isConnected: boolean;
  error: string | null;
  audioLevel: number;

  // Actions
  setState: (state: VoiceStatus) => void;
  setStatus: (status: VoiceStatus) => void;
  setEmotion: (emotion: VoiceEmotion) => void;
  setTranscript: (transcript: string) => void;
  setResponse: (response: string | ((prev: string) => string)) => void;
  addMessage: (message: ConversationMessage) => void;
  setMessages: (messages: ConversationMessage[]) => void;
  setIsListening: (v: boolean) => void;
  setIsSpeaking: (v: boolean) => void;
  setIsConnected: (v: boolean) => void;
  setError: (error: string | null) => void;
  setAudioLevel: (level: number) => void;
  reset: () => void;
}

const initialState = {
  state: 'idle' as VoiceStatus,
  status: 'idle' as VoiceStatus,
  emotion: 'neutral' as VoiceEmotion,
  transcript: '',
  response: '',
  messages: [] as ConversationMessage[],
  isListening: false,
  isSpeaking: false,
  isConnected: false,
  error: null as string | null,
  audioLevel: 0,
};

export const useVoiceStore = create<VoiceState>((set, get) => ({
  ...initialState,

  setState: (state) => set({ state, status: state }),
  setStatus: (status) => set({ status, state: status }),
  setEmotion: (emotion) => set({ emotion }),
  setTranscript: (transcript) => set({ transcript }),
  setResponse: (response) => {
    if (typeof response === 'function') {
      set({ response: response(get().response) });
    } else {
      set({ response });
    }
  },
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setIsListening: (isListening) => set({ isListening }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  reset: () => set(initialState),
}));