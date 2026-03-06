import { useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { KaguyaSky } from './KaguyaSky';
import { SakuraParticles } from './SakuraParticles';
import { SoftLandscape } from './SoftLandscape';
import { GhibliLighting } from './GhibliLighting';


export const GhibliEnvironment = () => {

  const controlsRef = useRef<any>(null);

  return (
    <group>
      <KaguyaSky />
      <GhibliLighting />
      <SoftLandscape />
      <SakuraParticles />
      
  
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        // ★ Human standing in a field turning their head
        minPolarAngle={1.35}       // ~77° — slight upward glance at treetops
        maxPolarAngle={1.52}       // ~87° — natural horizon, can't look at feet
        rotateSpeed={0.35}         // slow, deliberate — like turning your head
        target={[0, 1.5, -8]}
      />
      <fog attach="fog" args={['#c8d8b0', 80, 500]} />
    </group>
  );
};