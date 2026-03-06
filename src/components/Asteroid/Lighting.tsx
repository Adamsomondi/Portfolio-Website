import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFaceStore, ConversationState } from '../../../stores/faceStore';

const DARK_STATES: Record<ConversationState, {
  rim1: string; rim2: string; intensity: number;
}> = {
  idle:      { rim1: '#4a6cf7', rim2: '#7c3aed', intensity: 1.0 },
  listening: { rim1: '#00d4ff', rim2: '#06b6d4', intensity: 1.8 },
  thinking:  { rim1: '#a855f7', rim2: '#f59e0b', intensity: 1.4 },
  speaking:  { rim1: '#00e5ff', rim2: '#3b82f6', intensity: 1.6 },
};

const LIGHT_STATES: Record<ConversationState, {
  rim1: string; rim2: string; intensity: number;
}> = {
  idle:      { rim1: '#6366f1', rim2: '#a78bfa', intensity: 0.8 },
  listening: { rim1: '#0ea5e9', rim2: '#38bdf8', intensity: 1.4 },
  thinking:  { rim1: '#8b5cf6', rim2: '#f59e0b', intensity: 1.0 },
  speaking:  { rim1: '#06b6d4', rim2: '#6366f1', intensity: 1.2 },
};

interface LightingProps {
  isDark: boolean;
}

export const Lighting = ({ isDark }: LightingProps) => {
  const rimLight1Ref = useRef<THREE.PointLight>(null);
  const rimLight2Ref = useRef<THREE.PointLight>(null);

  const { conversationState, audioLevel } = useFaceStore();

  const targetRim1 = useMemo(() => new THREE.Color(), []);
  const targetRim2 = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const states = isDark ? DARK_STATES : LIGHT_STATES;
    const config = states[conversationState] || states.idle;
    const lerp = 0.04;

    targetRim1.set(config.rim1);
    targetRim2.set(config.rim2);

    if (rimLight1Ref.current) {
      rimLight1Ref.current.color.lerp(targetRim1, lerp);
      const audio = conversationState === 'speaking' ? audioLevel * 2 : 0;
      rimLight1Ref.current.intensity = config.intensity + audio + Math.sin(time * 1.5) * 0.15;

      if (conversationState === 'thinking') {
        rimLight1Ref.current.position.x = -3 + Math.sin(time * 0.8) * 1.5;
        rimLight1Ref.current.position.y = 1 + Math.cos(time * 0.6) * 1;
      } else {
        rimLight1Ref.current.position.x += (-3 - rimLight1Ref.current.position.x) * 0.05;
        rimLight1Ref.current.position.y += (1 - rimLight1Ref.current.position.y) * 0.05;
      }
    }

    if (rimLight2Ref.current) {
      rimLight2Ref.current.color.lerp(targetRim2, lerp);
      const audio = conversationState === 'speaking' ? audioLevel * 1.5 : 0;
      rimLight2Ref.current.intensity = config.intensity + audio + Math.cos(time * 1.5) * 0.15;

      if (conversationState === 'thinking') {
        rimLight2Ref.current.position.x = 3 + Math.cos(time * 0.8) * 1.5;
        rimLight2Ref.current.position.y = 1 + Math.sin(time * 0.6) * 1;
      } else {
        rimLight2Ref.current.position.x += (3 - rimLight2Ref.current.position.x) * 0.05;
        rimLight2Ref.current.position.y += (1 - rimLight2Ref.current.position.y) * 0.05;
      }
    }
  });

  return (
    <>
      {/* Key light — same in both modes so face looks identical */}
      <spotLight
        position={[3, 5, 8]}
        intensity={2}
        color="#fff5e6"
        angle={0.5}
        penumbra={0.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Fill — same both modes */}
      <pointLight position={[-5, 2, 5]} intensity={0.5} color="#b3c7e6" />

      {/* Rim lights — these are the only ones that change per mode */}
      <pointLight ref={rimLight1Ref} position={[-3, 1, -2]} intensity={1.0} color="#4a6cf7" />
      <pointLight ref={rimLight2Ref} position={[3, 1, -2]} intensity={1.0} color="#7c3aed" />

      {/* Under fill — same both modes */}
      <pointLight position={[0, -3, 3]} intensity={0.3} color="#ffd4b3" />

      {/* Ambient — kept low in both so face doesn't wash out */}
      <ambientLight intensity={0.15} color="#1a1a2e" />
    </>
  );
};