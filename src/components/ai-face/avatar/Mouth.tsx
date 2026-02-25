import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';

interface MouthProps {
  position: [number, number, number];
}

export const Mouth = forwardRef<THREE.Mesh, MouthProps>(({ position }, ref) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();

    // Left end of smile
    shape.moveTo(-0.35, 0.015);

    // Top curve — wider smile arc
    shape.quadraticCurveTo(0, 0.12, 0.35, 0.015);

    // Right rounded cap
    shape.quadraticCurveTo(0.38, 0, 0.35, -0.015);

    // Bottom curve
    shape.quadraticCurveTo(0, 0.025, -0.35, -0.015);

    // Left rounded cap
    shape.quadraticCurveTo(-0.38, 0, -0.35, 0.015);

    return new THREE.ShapeGeometry(shape, 20);
  }, []);

  return (
    <mesh ref={ref} position={position} geometry={geometry}>
      <meshStandardMaterial
        color="#00E5FF"
        emissive="#00B8D4"
        emissiveIntensity={1.8}
        roughness={0.1}
        metalness={0.5}
        side={THREE.DoubleSide}
        transparent
        opacity={0.95}
        toneMapped={false}
      />
    </mesh>
  );
});

Mouth.displayName = 'Mouth';