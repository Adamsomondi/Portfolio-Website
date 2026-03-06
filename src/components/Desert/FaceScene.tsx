import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { DesertEnvironment } from './DesertEnvironment';

interface Props { isDark: boolean; }

export const FaceScene = ({ isDark }: Props) => (
  <div className="absolute inset-0 w-full h-full">
    <Canvas
      camera={{ position: [0, 2.2, 22], fov: 50, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      shadows
      style={{
        width: '100%',
        height: '100%',
        background: isDark ? '#0e0c18' : '#c8a870',
        transition: 'background 1.5s ease',
      }}
    >
      <Suspense fallback={null}>
        <DesertEnvironment isDark={isDark} />
      </Suspense>
    </Canvas>
  </div>
);