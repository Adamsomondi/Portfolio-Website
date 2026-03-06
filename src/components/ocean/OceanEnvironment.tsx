import { OceanSky }     from './OceanSky';
import { OceanSurface } from './OceanSurface';
//import { Dolphin }       from './Dolphin';
import { OldBoat }       from './OldBoat';
import { OceanLighting } from './OceanLighting';

interface OceanEnvironmentProps {
  showRain?: boolean;
}

export const OceanEnvironment = ({
  showRain = true,
}: OceanEnvironmentProps) => {
  return (
    <group>
      {/* ── Miyazaki fog: warm cream-gray at horizon ── */}
      <fog attach="fog" args={['#d4c4a0', 5900, 5900]} />

      <OceanSky />
      <OceanLighting />
      <OceanSurface />

      {/* Boat — camera sits at deck level */}
      <OldBoat />

      {/* Dolphin orbits wide, 11m radius 
      <Dolphin /> */}
    </group>
  );
};