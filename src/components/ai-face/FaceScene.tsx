import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

import { AvatarFace } from './avatar/AvatarFace';
import { Lighting } from './environment/Lighting';
import { SpaceEnvironment } from './environment/SpaceEnvironment';

interface FaceSceneProps {
  isDark: boolean;
}

export const FaceScene = ({ isDark }: FaceSceneProps) => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{
          width: '100%',
          height: '100%',
          background: isDark ? '#070710' : '#4a2c8a',
        }}
      >
        <Suspense fallback={null}>
          <SpaceEnvironment isDark={isDark} />
          <Lighting isDark={isDark} />
          <AvatarFace />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 2.5}
            maxAzimuthAngle={Math.PI / 6}
            minAzimuthAngle={-Math.PI / 6}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};