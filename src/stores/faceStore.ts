import { create } from 'zustand';

export type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';
export type Emotion = 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry' | 'thinking' | 'listening';

interface FaceState {
  emotion: Emotion;
  conversationState: ConversationState;
  audioLevel: number;
  aiResponse: string;
  isMuted: boolean;

  setEmotion: (emotion: Emotion) => void;
  setConversationState: (state: ConversationState) => void;
  setAudioLevel: (level: number) => void;
  setAiResponse: (response: string) => void;
  setIsMuted: (muted: boolean) => void;
}

export const useFaceStore = create<FaceState>((set) => ({
  emotion: 'neutral',
  conversationState: 'idle',
  audioLevel: 0,
  aiResponse: '',
  isMuted: false,

  setEmotion: (emotion) => set({ emotion }),
  setConversationState: (conversationState) => set({ conversationState }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setAiResponse: (aiResponse) => set({ aiResponse }),
  setIsMuted: (isMuted) => set({ isMuted }),
}));