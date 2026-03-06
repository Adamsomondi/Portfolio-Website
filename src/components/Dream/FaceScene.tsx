import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

//import { AvatarFace } from './avatar/AvatarFace';
import { DreamEnvironment } from './DreamEnvironment';
// Update the import path below to the correct file where DreamLighting is exported
import { DreamLighting } from './DreamLighting';

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
          background: isDark ? '#05020e' : '#6b4a9e',
        }}
      >
        <Suspense fallback={null}>
          <DreamEnvironment isDark={isDark} />
          <DreamLighting isDark={isDark} />
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