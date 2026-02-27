import { DeepDream } from './DeepDream';
import { LucidDream } from './LucidDream';

interface DreamEnvironmentProps {
  isDark: boolean;
}

export const DreamEnvironment = ({ isDark }: DreamEnvironmentProps) => {
  return (
    <group>
      {isDark ? (
        <>
          <DeepDream />
          <fog attach="fog" args={['#05020e', 25, 140]} />
        </>
      ) : (
        <>
          <LucidDream  />
          <fog attach="fog" args={['#1a1030', 18, 85]} />
        </>
      )}
    </group>
  );
};