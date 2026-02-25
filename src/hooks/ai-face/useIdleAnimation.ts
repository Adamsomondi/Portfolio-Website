// hooks/ai-face/useIdleAnimation.ts
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const useIdleAnimation = (
  groupRef: React.RefObject<THREE.Group | null>,
  isFloating: boolean = false
) => {
  // Smooth blend factor between 0 (idle) and 1 (floating)
  const blendRef = useRef(0);
  

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime * 2.5;

    // ── Smooth transition ──
    const target = isFloating ? 1 : 0;
    blendRef.current = THREE.MathUtils.lerp(blendRef.current, target, 0.025);
    const b = blendRef.current;

    // ── Normal idle (subtle) ──
    const idleRotY = Math.sin(t * 0.3) * 0.05;
    const idleRotX = Math.sin(t * 0.2) * 0.02;
    const idleRotZ = 0;
    const idlePosY = Math.sin(t * 0.5) * 0.03;
    const idlePosX = 0;
    const idleScale = 1;

    // ── Music floating (dreamy, weightless) ──
    const floatRotY = Math.sin(t * 0.4) * 0.12 + Math.cos(t * 0.15) * 0.04;
    const floatRotX = Math.sin(t * 0.3) * 0.06 + Math.cos(t * 0.22) * 0.03;
    const floatRotZ = Math.sin(t * 0.25) * 0.05;
    const floatPosY =
      Math.sin(t * 0.55) * 0.15 +   // main bob
      Math.sin(t * 1.1) * 0.03;      // subtle bounce
    const floatPosX =
      Math.sin(t * 0.2) * 0.08 +     // slow drift
      Math.cos(t * 0.35) * 0.03;     // micro sway
    // Gentle breathing scale pulse
    const floatScale = 1 + Math.sin(t * 0.7) * 0.012 + Math.sin(t * 1.3) * 0.005;

    // ── Blend everything ──
    groupRef.current.rotation.y = THREE.MathUtils.lerp(idleRotY, floatRotY, b);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(idleRotX, floatRotX, b);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(idleRotZ, floatRotZ, b);
    groupRef.current.position.y = THREE.MathUtils.lerp(idlePosY, floatPosY, b);
    groupRef.current.position.x = THREE.MathUtils.lerp(idlePosX, floatPosX, b);

    const s = THREE.MathUtils.lerp(idleScale, floatScale, b);
    groupRef.current.scale.setScalar(s);
  });
};