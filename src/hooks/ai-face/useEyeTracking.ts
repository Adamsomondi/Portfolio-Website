import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANIMATION } from '../../constants/faceConfig';
import type { ConversationState } from '../../stores/faceStore';

interface EyeTrackingConfig {
  leftPupil: React.RefObject<THREE.Mesh | null>;
  rightPupil: React.RefObject<THREE.Mesh | null>;
  conversationState: ConversationState;
}

export const useEyeTracking = ({ leftPupil, rightPupil, conversationState }: EyeTrackingConfig) => {
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const saccadeTimer = useRef(0);

  useFrame((state, delta) => {
    if (!leftPupil.current || !rightPupil.current) return;

    saccadeTimer.current += delta;

    if (saccadeTimer.current > 1.5 + Math.random() * 2) {
      saccadeTimer.current = 0;

      if (conversationState === 'listening') {
        targetX.current = (Math.random() - 0.5) * ANIMATION.pupilRange * 0.5;
        targetY.current = (Math.random() - 0.5) * ANIMATION.pupilRange * 0.3;
      } else {
        targetX.current = (Math.random() - 0.5) * ANIMATION.pupilRange;
        targetY.current = (Math.random() - 0.5) * ANIMATION.pupilRange * 0.6;
      }
    }

    const smoothing = ANIMATION.eyeSmoothing;
    currentX.current += (targetX.current - currentX.current) * smoothing;
    currentY.current += (targetY.current - currentY.current) * smoothing;

    leftPupil.current.position.x = currentX.current;
    leftPupil.current.position.y = currentY.current;
    rightPupil.current.position.x = currentX.current;
    rightPupil.current.position.y = currentY.current;
  });
};