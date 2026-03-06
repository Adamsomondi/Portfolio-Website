import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props { isDark: boolean; }

export const DesertParticles = ({ isDark }: Props) => {
  const dustRef  = useRef<THREE.Points>(null);
  const sparkRef = useRef<THREE.Points>(null);

  const dust = useMemo(() => {
    const count = 600;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const dayCol   = new Float32Array(count * 3);
    const nightCol = new Float32Array(count * 3);

    const dayPal = [
      new THREE.Color('#f5c77e'), new THREE.Color('#e8b96a'),
      new THREE.Color('#d4a35a'), new THREE.Color('#f0ddb8'),
      new THREE.Color('#c89050'), new THREE.Color('#f7e0b0'),
    ];
    const nightPal = [
      new THREE.Color('#8888aa'), new THREE.Color('#7777a0'),
      new THREE.Color('#9595b8'), new THREE.Color('#6a6a8e'),
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = -1 + Math.random() * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
      vel[i * 3]     = (Math.random() - 0.5) * 0.004;
      vel[i * 3 + 1] = Math.random() * 0.003 + 0.0008;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.004;

      const dc = dayPal[Math.floor(Math.random() * dayPal.length)];
      dayCol[i * 3] = dc.r; dayCol[i * 3 + 1] = dc.g; dayCol[i * 3 + 2] = dc.b;

      const nc = nightPal[Math.floor(Math.random() * nightPal.length)];
      nightCol[i * 3] = nc.r; nightCol[i * 3 + 1] = nc.g; nightCol[i * 3 + 2] = nc.b;

      col[i * 3] = dc.r; col[i * 3 + 1] = dc.g; col[i * 3 + 2] = dc.b;
    }
    return { pos, col, vel, dayCol, nightCol };
  }, []);

  const sparks = useMemo(() => {
    const count = 250;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const dayCol   = new Float32Array(count * 3);
    const nightCol = new Float32Array(count * 3);

    const dayPal   = [new THREE.Color('#ffffff'), new THREE.Color('#fff5d6'), new THREE.Color('#ffe8b0')];
    const nightPal = [new THREE.Color('#c8c8e8'), new THREE.Color('#b0b0d0')];

    for (let i = 0; i < count; i++) {
      const r = 30 + Math.random() * 90;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.35 - 0.5;
      pos[i * 3 + 2] = r * Math.cos(phi);

      const dc = dayPal[Math.floor(Math.random() * dayPal.length)];
      dayCol[i * 3] = dc.r; dayCol[i * 3 + 1] = dc.g; dayCol[i * 3 + 2] = dc.b;

      const nc = nightPal[Math.floor(Math.random() * nightPal.length)];
      nightCol[i * 3] = nc.r; nightCol[i * 3 + 1] = nc.g; nightCol[i * 3 + 2] = nc.b;

      col[i * 3] = dc.r; col[i * 3 + 1] = dc.g; col[i * 3 + 2] = dc.b;
    }
    return { pos, col, dayCol, nightCol };
  }, []);

  const dustOpacity  = useRef(0.55);
  const sparkOpacity = useRef(0.65);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cam = state.camera.position;

    dustOpacity.current  += ((isDark ? 0.28 : 0.55) - dustOpacity.current)  * 0.025;
    sparkOpacity.current += ((isDark ? 0.38 : 0.65) - sparkOpacity.current) * 0.025;

    // lerp dust colors
    const dtgt = isDark ? dust.nightCol : dust.dayCol;
    for (let i = 0; i < dust.col.length; i++) dust.col[i] += (dtgt[i] - dust.col[i]) * 0.02;

    if (dustRef.current) {
      // ── INFINITE: lock dust cloud to camera ──
      dustRef.current.position.set(cam.x, 0, cam.z);

      const a = dustRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < a.length / 3; i++) {
        a[i * 3]     += dust.vel[i * 3]     + Math.sin(t * 0.12 + i * 0.7) * 0.001;
        a[i * 3 + 1] += dust.vel[i * 3 + 1];
        a[i * 3 + 2] += dust.vel[i * 3 + 2];
        if (a[i * 3 + 1] > 13) {
          a[i * 3 + 1] = -1;
          a[i * 3]     = (Math.random() - 0.5) * 100;
          a[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;
      dustRef.current.geometry.attributes.color.needsUpdate = true;
      (dustRef.current.material as THREE.PointsMaterial).opacity = dustOpacity.current;
    }

    // lerp spark colors
    const stgt = isDark ? sparks.nightCol : sparks.dayCol;
    for (let i = 0; i < sparks.col.length; i++) sparks.col[i] += (stgt[i] - sparks.col[i]) * 0.02;

    if (sparkRef.current) {
      // ── INFINITE: lock spark sphere to camera ──
      sparkRef.current.position.set(cam.x, cam.y, cam.z);

      sparkRef.current.rotation.y = t * 0.001;
      sparkRef.current.geometry.attributes.color.needsUpdate = true;
      (sparkRef.current.material as THREE.PointsMaterial).opacity = sparkOpacity.current;
    }
  });

  return (
    <>
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust.pos, 3]} />
          <bufferAttribute attach="attributes-color"    args={[dust.col, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.09} vertexColors sizeAttenuation transparent opacity={0.55} toneMapped={false} />
      </points>

      <points ref={sparkRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparks.pos, 3]} />
          <bufferAttribute attach="attributes-color"    args={[sparks.col, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.12} vertexColors sizeAttenuation transparent opacity={0.65} toneMapped={false} />
      </points>
    </>
  );
};