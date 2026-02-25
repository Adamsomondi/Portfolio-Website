import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ConversationState } from '../../stores/faceStore';

interface LipSyncConfig {
  mouthRef: React.RefObject<THREE.Mesh | null>;
  conversationState: ConversationState;
  audioLevel: number;
}

export const useLipSync = ({ mouthRef, conversationState, audioLevel }: LipSyncConfig) => {
  const smoothedLevel = useRef(0);
  const visemePhase = useRef(0);

  useFrame((state, delta) => {
    if (!mouthRef.current) return;

    const time = state.clock.elapsedTime;

    if (conversationState === 'speaking') {
      smoothedLevel.current += (audioLevel - smoothedLevel.current) * 0.3;
      visemePhase.current += delta * 12;

      const openAmount = smoothedLevel.current * 0.8;
      const visemeVariation = Math.sin(visemePhase.current) * 0.15
        + Math.sin(visemePhase.current * 1.7) * 0.1;

      mouthRef.current.scale.y = 0.3 + openAmount + visemeVariation;
      mouthRef.current.scale.x = 1 - openAmount * 0.2 + Math.cos(visemePhase.current * 0.8) * 0.05;
    } else if (conversationState === 'listening') {
      mouthRef.current.scale.y = 0.35 + Math.sin(time * 1.5) * 0.03;
      mouthRef.current.scale.x = 1.05 + Math.sin(time * 2) * 0.02;
    } else {
      mouthRef.current.scale.y += (0.3 - mouthRef.current.scale.y) * 0.1;
      mouthRef.current.scale.x += (1 - mouthRef.current.scale.x) * 0.1;
    }
  });
};