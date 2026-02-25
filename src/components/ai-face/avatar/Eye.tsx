import { forwardRef } from 'react';
import * as THREE from 'three';

interface EyeProps {
  position: [number, number, number];
}

export const Eye = forwardRef<THREE.Group, EyeProps>(({ position }, ref) => {
  return (
    <group ref={ref} position={position}>
      {/* Eye white */}
      <mesh>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.1} metalness={0} />
      </mesh>

      {/* Iris — fixed to front of sphere */}
      <mesh position={[0, 0, 0.175]}>
        <circleGeometry args={[0.1, 32]} />
        <meshBasicMaterial color="#1976D2" />
      </mesh>

      {/* Pupil — fixed on iris */}
      <mesh position={[0, 0, 0.18]}>
        <circleGeometry args={[0.04, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Highlight */}
      <mesh position={[0.04, 0.04, 0.19]}>
        <circleGeometry args={[0.02, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
    </group>
  );
});

Eye.displayName = 'Eye';

