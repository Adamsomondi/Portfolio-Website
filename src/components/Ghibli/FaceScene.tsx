import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GhibliEnvironment } from './GhibliEnvironment';

export const FaceScene = () => (
  <div className="absolute inset-0 w-full h-full">
    <Canvas
      camera={{ position: [0, 2.2, 22], fov: 50, near: 0.1, far: 1200 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      shadows
      style={{ width: '100%', height: '100%', background: '#b8c8a0' }}
    >
      <Suspense fallback={null}>
        <GhibliEnvironment />
      </Suspense>
    </Canvas>
  </div>
);