import type { Emotion } from '../stores/faceStore';

interface EmotionData {
  browInnerUp: number;
  eyeWide: number;
  mouthSmile: number;
  mouthOpen: number;
}

export const EMOTIONS: Record<Emotion, EmotionData> = {
  neutral:   { browInnerUp: 0,    eyeWide: 0,   mouthSmile: 0,   mouthOpen: 0   },
  happy:     { browInnerUp: 0.3,  eyeWide: 0.2, mouthSmile: 0.8, mouthOpen: 0.2 },
  sad:       { browInnerUp: 0.6,  eyeWide: 0,   mouthSmile: -0.5, mouthOpen: 0  },
  surprised: { browInnerUp: 0.8,  eyeWide: 0.9, mouthSmile: 0,   mouthOpen: 0.7 },
  angry:     { browInnerUp: -0.5, eyeWide: 0.3, mouthSmile: -0.3, mouthOpen: 0.1 },
  thinking:  { browInnerUp: 0.4,  eyeWide: 0.1, mouthSmile: 0,   mouthOpen: 0   },
  listening: { browInnerUp: 0.2,  eyeWide: 0.1, mouthSmile: 0.2, mouthOpen: 0.1 },
  talking:   { browInnerUp: 0.1,  eyeWide: 0.2, mouthSmile: 0.3, mouthOpen: 0.5 },
  
};

export const FACE_POSITIONS = {
  leftEye:  { x: -0.35, y: 0.25, z: 0.9 },
  rightEye: { x: 0.35,  y: 0.25, z: 0.9 },
  mouth:    { x: 0,     y: -0.3, z: 0.96 },
};

export const ANIMATION = {
  blinkInterval: 3,
  blinkDuration: 0.15,
  pupilRange: 0.08,
  eyeSmoothing: 0.08,
  idleSway: 0.05,
};

export const SKIN_TONES = {
  light:  '#FFE0BD',
  medium: '#C68642',
  dark:   '#8D5524',
  pale:   '#FFDFC4',
  robot:  '#B0C4DE',
};

export const LIGHTS = {
  key:      { position: [5, 5, 5] as [number, number, number], intensity: 2.5, color: '#ffffff' },
  fill:     { position: [-3, 2, 4] as [number, number, number], intensity: 0.8, color: '#4a90d9' },
  rimLeft:  { position: [-4, 1, -2] as [number, number, number], intensity: 1.5, color: '#00d4ff' },
  rimRight: { position: [4, 1, -2] as [number, number, number], intensity: 1.5, color: '#7b2dff' },
  bottom:   { position: [0, -3, 3] as [number, number, number], intensity: 0.4, color: '#1a0a2e' },
};
