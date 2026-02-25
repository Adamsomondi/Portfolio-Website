import * as THREE from 'three';

// Import the single source of truth from the store
export type { Emotion, ConversationState } from '../stores/faceStore';

export interface VisemeShape {
  jawOpen: number;
  mouthPucker: number;
  mouthSmile: number;
}

export interface EmotionShape {
  browInnerUp: number;
  browOuterUp: number;
  eyeSquint: number;
  mouthSmile: number;
}

export interface EyeRefs {
  eye: React.RefObject<THREE.Mesh>;
  pupil: React.RefObject<THREE.Mesh>;
}

export interface LightConfig {
  position: [number, number, number];
  intensity: number;
  color: string;
}