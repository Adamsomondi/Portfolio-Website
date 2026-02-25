import { StarField } from './StarField';
import { AmbientParticles } from './AmbientParticles';

interface SpaceEnvironmentProps {
  isDark: boolean;
}

export const SpaceEnvironment = ({ isDark }: SpaceEnvironmentProps) => {
  return (
    <group>
      {isDark ? (
        <>
          <StarField />
          <fog attach="fog" args={['#070710', 40, 180]} />
        </>
      ) : (
        <>
          <AmbientParticles />
          <fog attach="fog" args={['#a78bfa', 30, 100]} />
        </>
      )}
    </group>
  );
};