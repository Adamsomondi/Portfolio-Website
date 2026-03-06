import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props { isDark: boolean; }

export const DesertLighting = ({ isDark }: Props) => {
  const sunRef   = useRef<THREE.DirectionalLight>(null);
  const hemiRef  = useRef<THREE.HemisphereLight>(null);
  const warmRef  = useRef<THREE.PointLight>(null);
  const backRef  = useRef<THREE.PointLight>(null);

  const sunTarget     = useMemo(() => new THREE.Color(), []);
  const hemiSkyTarget = useMemo(() => new THREE.Color(), []);
  const hemiGndTarget = useMemo(() => new THREE.Color(), []);
  const warmTarget    = useMemo(() => new THREE.Color(), []);
  const backTarget    = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const lr = 0.025;
    const cam = state.camera.position;

    // sun — golden afternoon / cool moonlight
    sunTarget.set(isDark ? '#6068a8' : '#fff1d4');
    if (sunRef.current) {
      sunRef.current.color.lerp(sunTarget, lr);
      const tI = isDark ? 0.6 : 1.8;
      sunRef.current.intensity += (tI - sunRef.current.intensity) * lr;
      sunRef.current.intensity += Math.sin(t * 0.15) * 0.04;

      // ── INFINITE: sun rides with camera ──
      sunRef.current.position.set(cam.x + 15, cam.y + 20, cam.z + 10);
      if (sunRef.current.target) {
        sunRef.current.target.position.set(cam.x, cam.y - 5, cam.z);
        sunRef.current.target.updateMatrixWorld();
      }
    }

    // hemisphere — sky/ground bounce
    hemiSkyTarget.set(isDark ? '#1a1a40' : '#87CEEB');
    hemiGndTarget.set(isDark ? '#0a0808' : '#c2a66b');
    if (hemiRef.current) {
      hemiRef.current.color.lerp(hemiSkyTarget, lr);
      hemiRef.current.groundColor.lerp(hemiGndTarget, lr);
      const tI = isDark ? 0.12 : 0.4;
      hemiRef.current.intensity += (tI - hemiRef.current.intensity) * lr;
    }

    // warm bounce from sand
    warmTarget.set(isDark ? '#221a30' : '#ffe0b2');
    if (warmRef.current) {
      warmRef.current.color.lerp(warmTarget, lr);
      const tI = isDark ? 0.15 : 0.6;
      warmRef.current.intensity += (tI - warmRef.current.intensity) * lr;
      warmRef.current.intensity += Math.sin(t * 0.2 + 1.0) * 0.03;

      // ── INFINITE: warm light rides with camera ──
      warmRef.current.position.set(cam.x, cam.y - 4, cam.z + 5);
    }

    // backlight rim
    backTarget.set(isDark ? '#443366' : '#c8b4e0');
    if (backRef.current) {
      backRef.current.color.lerp(backTarget, lr);
      const tI = isDark ? 0.2 : 0.4;
      backRef.current.intensity += (tI - backRef.current.intensity) * lr;

      // ── INFINITE: rim light rides with camera ──
      backRef.current.position.set(cam.x - 10, cam.y + 6, cam.z - 15);
    }
  });

  return (
    <>
      <directionalLight
        ref={sunRef}
        position={[15, 20, 10]}
        intensity={1.2}
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

      <hemisphereLight ref={hemiRef} args={['#87CEEB', '#c2a66b', 0.4]} />

      <pointLight
        ref={warmRef}
        position={[0, -2, 5]}
        intensity={0.6}
        color="#ffe0b2"
        distance={60}
        decay={2}
      />

      <pointLight
        ref={backRef}
        position={[-10, 8, -15]}
        intensity={0.4}
        color="#c8b4e0"
        distance={70}
        decay={2}
      />

      <ambientLight intensity={isDark ? 0.06 : 0.1} color={isDark ? '#0e0e22' : '#fdf6ec'} />
    </>
  );
};