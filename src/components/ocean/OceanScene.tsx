import { Suspense } from 'react';
import { Canvas }   from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OceanEnvironment } from './OceanEnvironment';

interface OceanSceneProps {
  showRain?: boolean;
}

export const OceanScene = ({ showRain = true }: OceanSceneProps) => (
  <div className="absolute inset-0 w-full h-full">
    <Canvas
      // Camera: standing on the boat deck, 2.8m above water
      // fov 50 = natural human vision — same as Ghibli scene
      // far 2000 = matches the ocean plane size
      camera={{ position: [0, 2.8, 12], fov: 50, near: 0.1, far: 2000 }}
      gl={{
        antialias:           true,
        powerPreference:     'high-performance',
        toneMapping:         3,     // ACESFilmicToneMapping — warm, filmic
        toneMappingExposure: 0.90,
      }}
      shadows
      style={{ width: '100%', height: '100%', background: '#c5bdb0' }}
    >
      <Suspense fallback={null}>
        <OceanEnvironment showRain={showRain} />

        {/*
          Orbit constraints match the Ghibli standing-in-a-field model:
          — You are on the boat. You can turn your head left/right.
          — You can glance slightly upward (at clouds) or level (horizon).
          — You cannot look down at the water or spin freely.
          — target is 72 units in front of the camera, at eye level:
            camera z=12, target z=−60 → 72 units of ocean depth in view.
        */}
        <OrbitControls
          target={[0, 0.5, -60]}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={1.35}          // ~77° — can glance at clouds
          maxPolarAngle={1.55}          // ~89° — eye at the horizon, no lower
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={ Math.PI / 4}
          rotateSpeed={0.30}            // slow head turn
          dampingFactor={0.05}
          enableDamping
        />
      </Suspense>
    </Canvas>
  </div>
);