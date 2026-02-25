import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SKIN_TONES } from '../../../constants/faceConfig';

export const Head = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = Math.sin(time * 0.15) * 0.02;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color={SKIN_TONES.robot}
        roughness={0.4}
        metalness={0.3}
        envMapIntensity={0.5}
      />
    </mesh>
  );
};