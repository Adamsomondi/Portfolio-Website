import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Materials ─────────────────────────────────────────────────────────────────
const hullPaint = new THREE.MeshStandardMaterial({ color: '#2b4a5e', roughness: 0.85, metalness: 0.0 });
const hullWood  = new THREE.MeshStandardMaterial({ color: '#5c3a1e', roughness: 0.92, metalness: 0.0 });
const darkWood  = new THREE.MeshStandardMaterial({ color: '#3d2510', roughness: 0.95, metalness: 0.0 });
const plankMat  = new THREE.MeshStandardMaterial({ color: '#6b4423', roughness: 0.96, metalness: 0.0 });
const keelMat   = new THREE.MeshStandardMaterial({ color: '#111008', roughness: 0.98, metalness: 0.0 });
const sailMat   = new THREE.MeshStandardMaterial({ color: '#c9b98c', roughness: 0.88, metalness: 0.0, side: THREE.DoubleSide });
const ropeMat   = new THREE.MeshStandardMaterial({ color: '#8b7355', roughness: 0.95, metalness: 0.0 });
const ironMat   = new THREE.MeshStandardMaterial({ color: '#2a2520', roughness: 0.75, metalness: 0.40 });
const netMat    = new THREE.MeshStandardMaterial({ color: '#9b8a6a', roughness: 0.98, metalness: 0.0, transparent: true, opacity: 0.80 });
const waterline = new THREE.MeshStandardMaterial({ color: '#d0c4ae', roughness: 0.90, metalness: 0.0 });

// ── Wave math — exactly mirrors OceanSurface vertex shader ───────────────────
// At world origin p=(0,0): dot(d, p)=0, calm=1, so spatial terms vanish.
// Each wave collapses to: am * sin(t * sp + ph)
function waveHeightAtOrigin(t: number): number {
  return (
    0.42 * Math.sin(t * 0.65 + 0.00) +  // large swell 1
    0.28 * Math.sin(t * 0.85 + 1.30) +  // large swell 2
    0.20 * Math.sin(t * 0.55 + 2.70) +  // large swell 3
    0.11 * Math.sin(t * 1.15 + 0.80) +  // chop 1
    0.07 * Math.sin(t * 1.50 + 1.90)    // chop 2
  );
}

// Normalised wave direction vectors (pre-computed from shader)
const DIR = [
  [ 0.8385,  0.5450],  // normalize( 1.00,  0.65)
  [-0.5845,  0.8118],  // normalize(-0.72,  1.00)
  [ 0.4677, -0.8838],  // normalize( 0.45, -0.85)
  [ 0.9641,  0.2678],  // normalize( 0.90,  0.25)
  [-0.3162,  0.9487],  // normalize(-0.30,  0.90)
];
const WAVES = [
  { fr: 0.12, am: 0.42, sp: 0.65, ph: 0.00 },
  { fr: 0.18, am: 0.28, sp: 0.85, ph: 1.30 },
  { fr: 0.25, am: 0.20, sp: 0.55, ph: 2.70 },
  { fr: 0.38, am: 0.11, sp: 1.15, ph: 0.80 },
  { fr: 0.55, am: 0.07, sp: 1.50, ph: 1.90 },
];

// Surface slope at origin → roll (Z-axis tilt) and pitch (X-axis tilt)
function waveSlopeAtOrigin(t: number): { roll: number; pitch: number } {
  let sx = 0, sz = 0;
  for (let i = 0; i < 5; i++) {
    const { fr, am, sp, ph } = WAVES[i];
    // Derivative of am*sin(dot(d,p)*fr + t*sp + ph) w.r.t x/z at p=(0,0)
    const dFactor = am * fr * Math.cos(t * sp + ph);
    sx += dFactor * DIR[i][0];
    sz += dFactor * DIR[i][1];
  }
  // Scale down — boat doesn't tilt the full wave slope angle
  return { roll: sx * 0.35, pitch: -sz * 0.35 };
}

// ── Component ─────────────────────────────────────────────────────────────────
export const OldBoat = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t  = clock.elapsedTime;
    const wh = waveHeightAtOrigin(t);
    const { roll, pitch } = waveSlopeAtOrigin(t);

    // Waterline sits at local y=0.
    // Keel is at local y=-0.32 → submerged below wave surface. Correct.
    groupRef.current.position.y = wh;
    groupRef.current.rotation.z = roll;
    groupRef.current.rotation.x = pitch;
  });

  return (
    // Slightly offset so horizon stays visible behind the boat
    <group ref={groupRef} position={[0.7, 0, -2.0]}>

      {/* ── KEEL — tarred backbone ─────────────────────────────────────── */}
      <mesh material={keelMat} position={[0, -0.32, 0]}>
        <boxGeometry args={[2.65, 0.07, 0.16]} />
      </mesh>

      {/* ── LOWER HULL — painted blue-green below waterline ────────────── */}
      <mesh material={hullPaint} position={[0, -0.14, 0]}>
        <boxGeometry args={[2.60, 0.30, 1.00]} />
      </mesh>
      {/* Bow taper port */}
      <mesh material={hullPaint} position={[-1.12, -0.14, 0.05]}
            rotation={[0,  0.42, 0]} scale={[0.50, 1, 0.74]}>
        <boxGeometry args={[0.62, 0.30, 0.82]} />
      </mesh>
      {/* Bow taper starboard */}
      <mesh material={hullPaint} position={[-1.12, -0.14, -0.05]}
            rotation={[0, -0.42, 0]} scale={[0.50, 1, 0.74]}>
        <boxGeometry args={[0.62, 0.30, 0.82]} />
      </mesh>
      {/* Stern taper */}
      <mesh material={hullPaint} position={[1.05, -0.14, 0]}
            scale={[0.48, 1, 0.86]}>
        <boxGeometry args={[0.58, 0.30, 0.98]} />
      </mesh>

      {/* ── WATERLINE STRIPE — thin pale band ─────────────────────────── */}
      {([-0.51, 0.51] as number[]).map((z, i) => (
        <mesh key={`wl${i}`} material={waterline} position={[0, 0.02, z]}>
          <boxGeometry args={[2.62, 0.035, 0.035]} />
        </mesh>
      ))}

      {/* ── UPPER HULL — aged wood above waterline ─────────────────────── */}
      <mesh material={hullWood} position={[0, 0.17, 0]}>
        <boxGeometry args={[2.58, 0.24, 1.08]} />
      </mesh>
      {/* Upper bow port */}
      <mesh material={hullWood} position={[-1.10, 0.17, 0.04]}
            rotation={[0,  0.40, 0]} scale={[0.48, 1, 0.72]}>
        <boxGeometry args={[0.60, 0.24, 0.88]} />
      </mesh>
      {/* Upper bow starboard */}
      <mesh material={hullWood} position={[-1.10, 0.17, -0.04]}
            rotation={[0, -0.40, 0]} scale={[0.48, 1, 0.72]}>
        <boxGeometry args={[0.60, 0.24, 0.88]} />
      </mesh>
      {/* Upper stern */}
      <mesh material={hullWood} position={[1.03, 0.17, 0]}
            scale={[0.46, 1, 0.88]}>
        <boxGeometry args={[0.56, 0.24, 1.04]} />
      </mesh>

      {/* ── CLINKER PLANKING LINES — overlapping strakes ───────────────── */}
      {([-0.44, -0.50, -0.56] as number[]).map((z, i) => (
        <mesh key={`clP${i}`} material={keelMat} position={[0, 0.04 + i * 0.055, z]}>
          <boxGeometry args={[2.55, 0.016, 0.014]} />
        </mesh>
      ))}
      {([0.44, 0.50, 0.56] as number[]).map((z, i) => (
        <mesh key={`clS${i}`} material={keelMat} position={[0, 0.04 + i * 0.055, z]}>
          <boxGeometry args={[2.55, 0.016, 0.014]} />
        </mesh>
      ))}

      {/* ── RUBBING STRAKE — proud timber strip ────────────────────────── */}
      {([-0.55, 0.55] as number[]).map((z, i) => (
        <mesh key={`rs${i}`} material={darkWood} position={[0, 0.29, z]}>
          <boxGeometry args={[2.60, 0.052, 0.052]} />
        </mesh>
      ))}

      {/* ── GUNWALE CAP — top rail ─────────────────────────────────────── */}
      {([-0.56, 0.56] as number[]).map((z, i) => (
        <mesh key={`gw${i}`} material={darkWood} position={[0, 0.345, z]}>
          <boxGeometry args={[2.56, 0.055, 0.065]} />
        </mesh>
      ))}

      {/* ── STEM POST (bow) ────────────────────────────────────────────── */}
      <mesh material={darkWood} position={[-1.34, 0.08, 0]}
            rotation={[0, 0, 0.20]}>
        <boxGeometry args={[0.07, 0.52, 0.11]} />
      </mesh>

      {/* ── TRANSOM (flat stern board) ─────────────────────────────────── */}
      <mesh material={hullWood} position={[1.33, 0.08, 0]}>
        <boxGeometry args={[0.065, 0.46, 1.02]} />
      </mesh>

      {/* ── DECK PLANKS ────────────────────────────────────────────────── */}
      {([-0.34, -0.17, 0, 0.17, 0.34] as number[]).map((z, i) => (
        <mesh key={`dk${i}`} material={plankMat} position={[0.08, 0.298, z]}>
          <boxGeometry args={[2.26, 0.022, 0.135]} />
        </mesh>
      ))}
      {/* Caulking seams */}
      {([-0.255, -0.085, 0.085, 0.255] as number[]).map((z, i) => (
        <mesh key={`ck${i}`} material={keelMat} position={[0.08, 0.300, z]}>
          <boxGeometry args={[2.28, 0.010, 0.012]} />
        </mesh>
      ))}

      {/* ── MAST ───────────────────────────────────────────────────────── */}
      <mesh material={darkWood} position={[-0.22, 1.42, 0]} castShadow>
        <cylinderGeometry args={[0.036, 0.055, 2.45, 10]} />
      </mesh>

      {/* ── GAFF SPAR — diagonal upper spar (European gaff rig) ────────── */}
      <mesh material={darkWood} position={[-0.38, 2.02, 0]}
            rotation={[0, 0, -0.36]}>
        <cylinderGeometry args={[0.018, 0.025, 1.25, 8]} />
      </mesh>

      {/* ── BOOM — lower horizontal spar ───────────────────────────────── */}
      <mesh material={darkWood} position={[0.12, 0.68, 0]}
            rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.020, 0.028, 1.44, 8]} />
      </mesh>

      {/* ── GAFF SAIL ──────────────────────────────────────────────────── */}
      <mesh material={sailMat} position={[-0.12, 1.38, 0.025]} castShadow>
        <planeGeometry args={[1.32, 1.55, 3, 5]} />
      </mesh>
      {/* Belly — second layer offset for billowing feel */}
      <mesh material={sailMat} position={[-0.10, 1.38, 0.055]}>
        <planeGeometry args={[1.26, 1.48, 2, 4]} />
      </mesh>

      {/* ── FORESTAY ───────────────────────────────────────────────────── */}
      <mesh material={ropeMat} position={[-0.76, 1.14, 0]}
            rotation={[0, 0, 0.65]}>
        <cylinderGeometry args={[0.009, 0.009, 1.52, 5]} />
      </mesh>

      {/* ── SHROUDS — port & starboard ─────────────────────────────────── */}
      {([[-0.52, -0.28], [0.52, 0.28]] as number[][]).map(([z, rX], i) => (
        <mesh key={`sh${i}`} material={ropeMat}
              position={[-0.02, 1.04, z]}
              rotation={[rX * 0.6, 0, 0.14]}>
          <cylinderGeometry args={[0.008, 0.008, 1.34, 5]} />
        </mesh>
      ))}

      {/* ── BOLLARDS — 4 corner posts ──────────────────────────────────── */}
      {([[-0.90, -0.47], [-0.90, 0.47], [0.80, -0.47], [0.80, 0.47]] as number[][]).map(([x, z], i) => (
        <mesh key={`bo${i}`} material={ironMat} position={[x, 0.356, z]}>
          <cylinderGeometry args={[0.032, 0.032, 0.10, 7]} />
        </mesh>
      ))}

      {/* ── ROPE COIL — near mast ──────────────────────────────────────── */}
      <mesh material={ropeMat} position={[0.28, 0.312, 0.26]}
            rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.028, 6, 16]} />
      </mesh>
      <mesh material={ropeMat} position={[0.28, 0.312, 0.26]}
            rotation={[Math.PI / 2, 0, 0.5]}>
        <torusGeometry args={[0.09, 0.022, 6, 14]} />
      </mesh>

      {/* ── FISHING NET PILE — piled at stern ──────────────────────────── */}
      <mesh material={netMat} position={[0.84, 0.352, 0.14]}>
        <boxGeometry args={[0.32, 0.12, 0.40]} />
      </mesh>
      <mesh material={netMat} position={[0.84, 0.418, 0.14]}>
        <boxGeometry args={[0.24, 0.075, 0.28]} />
      </mesh>

      {/* ── WOODEN FISH CRATE ──────────────────────────────────────────── */}
      <mesh material={plankMat} position={[0.52, 0.338, -0.26]}>
        <boxGeometry args={[0.24, 0.12, 0.19]} />
      </mesh>
      {([0, 0.065] as number[]).map((y, i) => (
        <mesh key={`sl${i}`} material={darkWood} position={[0.52, 0.342 + y, -0.26]}>
          <boxGeometry args={[0.25, 0.014, 0.20]} />
        </mesh>
      ))}

      {/* ── TILLER ─────────────────────────────────────────────────────── */}
      <mesh material={darkWood} position={[1.14, 0.385, 0]}
            rotation={[0, -0.28, Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.016, 0.52, 7]} />
      </mesh>

      {/* ── ANCHOR — iron, lashed at bow ───────────────────────────────── */}
      <mesh material={ironMat} position={[-1.02, 0.340, 0.30]}>
        <cylinderGeometry args={[0.020, 0.020, 0.26, 7]} />
      </mesh>
      <mesh material={ironMat} position={[-1.02, 0.260, 0.30]}
            rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.013, 0.20, 6]} />
      </mesh>

    </group>
  );
};