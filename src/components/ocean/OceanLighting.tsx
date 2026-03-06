import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const OceanLighting = () => {
  const sunRef       = useRef<THREE.DirectionalLight>(null);
  const bounceRef    = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Clouds passing — like GhibliLighting breathing
    if (sunRef.current) {
      sunRef.current.intensity = 2.4 + Math.sin(t * 0.15) * 0.22;
    }
    // Water shimmer
    if (bounceRef.current) {
      bounceRef.current.intensity = 0.45 + Math.sin(t * 0.80) * 0.12;
    }
  });

  return (
    <>
      {/*
        Golden afternoon sun.
        Position matches sky shader sunPos UV(0.63, 0.54):
        slightly right (+X), moderate elevation (+Y), in front (-Z).
      */}
      <directionalLight
        ref={sunRef}
        position={[85, 48, -110]}
        intensity={0.0}
        color="#ffbb38"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-far={400}
        shadow-bias={-0.0001}
      />

      {/*
        Hemisphere: warm gold sky above, deep ocean-teal ground below.
        This is what bathes the whole scene in afternoon colour —
        identical role to the GhibliLighting hemisphereLight.
      */}
      <hemisphereLight args={['#d4a840', '#1c6882', 0.50]} />

      {/* Warm gold shimmer bouncing up from the water surface */}
      <pointLight
        ref={bounceRef}
        position={[0, -0.3, 3]}
        intensity={0.0}
        color="#c89030"
        distance={50}
        decay={2}
      />

      {/* Cool blue back-light from the opposite sky quadrant */}
      <pointLight
        position={[-80, 28, 95]}
        intensity={0.0}
        color="#5888c8"
        distance={350}
        decay={1.5}
      />

      {/* Warm golden haze fill from the sun-side horizon */}
      <pointLight
        position={[60, 4, -160]}
        intensity={0.0}
        color="#ffcc70"
        distance={500}
        decay={1.5}
      />

      {/* Soft warm ambient — golden afternoon air, never cold */}
      <ambientLight intensity={0.4} color="#ffe4a0" />
    </>
  );
};