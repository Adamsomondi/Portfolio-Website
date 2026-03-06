import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DesertSky } from './DesertSky';
import { DuneField } from './DuneField';
import { DesertParticles } from './DesertParticles';
import { DesertLighting } from './DesertLighting';
import { MarsRover } from './MarsRover';
import { SatelliteDishes } from './SatelliteDishes';
import { NasaDome } from './NasaDome';
import { SolarArray } from './SolarArray';
import { AndurilDrone } from './AndurilDrone';

interface Props { isDark: boolean; }

export const DesertEnvironment = ({ isDark }: Props) => {
  const controlsRef = useRef<any>(null);
  const scene = useThree((s) => s.scene);
  const fogTarget = useMemo(() => new THREE.Color(), []);
  const [isFlying, setIsFlying] = useState(false);
  const [isDriving, setIsDriving] = useState(false);

  // ── shared drone position for infinite terrain + sky tracking ──
  const dronePosRef = useRef(new THREE.Vector3());


  useEffect(() => {
    scene.fog = new THREE.Fog('#d8c49a', 25, 110);
    return () => { scene.fog = null; };
  }, [scene]);

  useFrame(() => {
    if (scene.fog instanceof THREE.Fog) {
      fogTarget.set(isDark ? '#0e0c18' : '#d8c49a');
      scene.fog.color.lerp(fogTarget, 0.025);

      // ── INFINITE: push fog out when flying ──
      const nearT = isFlying ? 50 : 25;
      const farT  = isFlying ? 240 : 110;
      scene.fog.near += (nearT - scene.fog.near) * 0.03;
      scene.fog.far  += (farT  - scene.fog.far)  * 0.03;
    }
  });

  return (
    <group>
      <DesertSky isDark={isDark} />
      <DesertLighting isDark={isDark} />
      <DuneField isDark={isDark} isFlying={isFlying} dronePosRef={dronePosRef} />
      <DesertParticles isDark={isDark} />
      <MarsRover isDark={isDark} onDrivingChange={setIsDriving} canDrive={!isFlying} />
      <SatelliteDishes isDark={isDark} />
      <NasaDome isDark={isDark} />
      <SolarArray isDark={isDark} />
      <AndurilDrone isDark={isDark} onFlyingChange={setIsFlying} dronePosRef={dronePosRef} />

      {!isFlying && (
        <OrbitControls
          ref={controlsRef}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={1.35}
          maxPolarAngle={1.52}
          rotateSpeed={0.35}
          target={[0, 1.5, -8]}
        />
      )}
    </group>
  );
};