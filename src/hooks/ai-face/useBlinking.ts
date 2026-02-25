import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANIMATION } from '../../constants/faceConfig';

interface BlinkConfig {
  leftEye: React.RefObject<THREE.Group | null>;
  rightEye: React.RefObject<THREE.Group | null>;
}

export const useBlinking = ({ leftEye, rightEye }: BlinkConfig) => {
  const blinkTimer = useRef(0);
  const isBlinking = useRef(false);
  const blinkProgress = useRef(0);

  useFrame((_, delta) => {
    if (!leftEye.current || !rightEye.current) return;

    blinkTimer.current += delta;

    if (!isBlinking.current && blinkTimer.current > ANIMATION.blinkInterval + Math.random() * 2) {
      isBlinking.current = true;
      blinkTimer.current = 0;
      blinkProgress.current = 0;
    }

    if (isBlinking.current) {
      blinkProgress.current += delta / ANIMATION.blinkDuration;

      const t = blinkProgress.current;
      const scaleY = 1 - Math.sin(t * Math.PI) * 0.95;

      leftEye.current.scale.y = Math.max(0.05, scaleY);
      rightEye.current.scale.y = Math.max(0.05, scaleY);

      if (blinkProgress.current >= 1) {
        isBlinking.current = false;
        leftEye.current.scale.y = 1;
        rightEye.current.scale.y = 1;
      }
    }
  });
};