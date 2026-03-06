import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Petal {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  spin: THREE.Vector3;
  drift: number;
  phase: number;
  size: number;
}

const PETAL_COUNT = 500;
const SPREAD_X = 40;
const SPREAD_Y = 30;
const SPREAD_Z = 40;
const RESPAWN_Y = 18;
const FLOOR_Y = -4;

// Build a petal shape — a soft rounded leaf
function createPetalGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.04, 0.06, 0.08, 0.12, 0.03, 0.18);
  shape.bezierCurveTo(0.0, 0.22, -0.03, 0.18, -0.03, 0.18);
  shape.bezierCurveTo(-0.08, 0.12, -0.04, 0.06, 0, 0);

  const geo = new THREE.ShapeGeometry(shape, 4);
  geo.center();
  return geo;
}

export const SakuraParticles = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const petalGeo = useMemo(() => createPetalGeometry(), []);

  const petalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        roughness: 0.9,
        metalness: 0.0,
        depthWrite: false,
      }),
    []
  );

  const palette = useMemo(
    () => [
      new THREE.Color('#fbb5c8'), // soft sakura
      new THREE.Color('#f9a8c2'), // medium pink
      new THREE.Color('#fcc8d8'), // pale blush
      new THREE.Color('#fde2e8'), // almost white
      new THREE.Color('#f48fb1'), // deeper pink
      new THREE.Color('#ffffff'), // pure white
      new THREE.Color('#f8c4d4'), // warm pink
    ],
    []
  );

  const petals = useMemo<Petal[]>(() => {
    const arr: Petal[] = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * SPREAD_X,
          Math.random() * SPREAD_Y - 2,
          (Math.random() - 0.5) * SPREAD_Z
        ),
        vel: new THREE.Vector3(0, 0, 0),
        rot: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.02
        ),
        drift: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        size: 0.7 + Math.random() * 0.6,
      });
    }
    return arr;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Set per-instance colors
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < PETAL_COUNT; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)];
      meshRef.current.setColorAt(i, c);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [palette]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Wind: gentle base + gusts
    const windX = Math.sin(t * 0.3) * 0.008 + Math.sin(t * 0.73) * 0.004;
    const windZ = Math.cos(t * 0.2) * 0.004;
    const gustStrength = Math.max(0, Math.sin(t * 0.15)) * 0.012;

    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = petals[i];

      // Gravity — very gentle
      p.vel.y -= 0.0004;

      // Wind
      p.vel.x += windX + gustStrength * Math.sin(t * 0.5 + p.phase);
      p.vel.z += windZ + gustStrength * 0.3 * Math.cos(t * 0.4 + p.drift);

      // Air resistance
      p.vel.x *= 0.985;
      p.vel.y *= 0.99;
      p.vel.z *= 0.985;

      // Apply velocity
      p.pos.add(p.vel);

      // Flutter: side-to-side oscillation
      p.pos.x += Math.sin(t * 1.8 + p.drift) * 0.008;
      p.pos.z += Math.cos(t * 1.3 + p.phase) * 0.006;

      // Tumble rotation
      p.rot.x += p.spin.x + Math.sin(t * 0.7 + p.phase) * 0.005;
      p.rot.y += p.spin.y;
      p.rot.z += p.spin.z + Math.cos(t * 0.9 + p.drift) * 0.004;

      // Respawn at top
      if (p.pos.y < FLOOR_Y) {
        p.pos.y = RESPAWN_Y + Math.random() * 5;
        p.pos.x = (Math.random() - 0.5) * SPREAD_X;
        p.pos.z = (Math.random() - 0.5) * SPREAD_Z;
        p.vel.set(0, 0, 0);
      }

      // Update matrix
      dummy.position.copy(p.pos);
      dummy.rotation.copy(p.rot);
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[petalGeo, petalMat, PETAL_COUNT]}
      frustumCulled={false}
    />
  );
};