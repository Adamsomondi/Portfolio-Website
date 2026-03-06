import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const GhibliLighting = () => {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const warmRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Sun breathes very subtly — like clouds passing
    if (sunRef.current) {
      sunRef.current.intensity = 1.8 + Math.sin(t * 0.15) * 0.15;
    }

    // Warm fill light drifts gently
    if (warmRef.current) {
      warmRef.current.intensity = 0.6 + Math.sin(t * 0.2 + 1.0) * 0.1;
    }
  });

  return (
    <>
      {/* ── Golden afternoon sun ── */}
      <directionalLight
        ref={sunRef}
        position={[15, 20, 10]}
        intensity={1.8}
        color="#fff1d4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={80}
        shadow-bias={-0.0001}
      />

      {/* ── Sky hemisphere: warm ground, cool sky ── */}
      <hemisphereLight
        args={['#87CEEB', '#c2a66b', 0.4]}
      />

      {/* ── Warm bounce from ground ── */}
      <pointLight
        ref={warmRef}
        position={[0, -2, 5]}
        intensity={0.6}
        color="#ffe0b2"
        distance={40}
        decay={2}
      />

      {/* ── Backlight: subtle rim for depth ── */}
      <pointLight
        position={[-10, 8, -15]}
        intensity={0.4}
        color="#c8b4e0"
        distance={50}
        decay={2}
      />

      {/* ── Soft ambient: never pitch black ── */}
      <ambientLight intensity={0.2} color="#fdf6ec" />
    </>
  );
};