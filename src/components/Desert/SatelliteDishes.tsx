import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════
// TERRAIN — same noise stack as DuneField & MarsRover
// ═══════════════════════════════════════════════════════
function mod289(x: number) { return x - Math.floor(x * (1 / 289)) * 289; }
function permute(x: number) { return mod289(((x * 34) + 1) * x); }
function fract(x: number) { return x - Math.floor(x); }

function snoise(vx: number, vy: number): number {
  const C0 = 0.211324865405187, C1 = 0.366025403784439;
  const C2 = -0.577350269189626, C3 = 0.024390243902439;
  const s = (vx + vy) * C1;
  let ix = Math.floor(vx + s), iy = Math.floor(vy + s);
  const t = (ix + iy) * C0;
  const x0x = vx - ix + t, x0y = vy - iy + t;
  const i1x = x0x > x0y ? 1 : 0, i1y = x0x > x0y ? 0 : 1;
  const x1x = x0x + C0 - i1x, x1y = x0y + C0 - i1y;
  const x2x = x0x + C2, x2y = x0y + C2;
  ix = mod289(ix); iy = mod289(iy);
  const p0 = permute(permute(iy) + ix);
  const p1 = permute(permute(iy + i1y) + ix + i1x);
  const p2 = permute(permute(iy + 1) + ix + 1);
  let m0 = Math.max(0.5 - (x0x * x0x + x0y * x0y), 0);
  let m1 = Math.max(0.5 - (x1x * x1x + x1y * x1y), 0);
  let m2 = Math.max(0.5 - (x2x * x2x + x2y * x2y), 0);
  m0 *= m0; m0 *= m0; m1 *= m1; m1 *= m1; m2 *= m2; m2 *= m2;
  const xx0 = 2 * fract(p0 * C3) - 1, xx1 = 2 * fract(p1 * C3) - 1, xx2 = 2 * fract(p2 * C3) - 1;
  const hh0 = Math.abs(xx0) - 0.5, hh1 = Math.abs(xx1) - 0.5, hh2 = Math.abs(xx2) - 0.5;
  const a0 = xx0 - Math.floor(xx0 + 0.5), a1 = xx1 - Math.floor(xx1 + 0.5), a2 = xx2 - Math.floor(xx2 + 0.5);
  m0 *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + hh0 * hh0);
  m1 *= 1.79284291400159 - 0.85373472095314 * (a1 * a1 + hh1 * hh1);
  m2 *= 1.79284291400159 - 0.85373472095314 * (a2 * a2 + hh2 * hh2);
  return 130 * (m0 * (a0 * x0x + hh0 * x0y) + m1 * (a1 * x1x + hh1 * x1y) + m2 * (a2 * x2x + hh2 * x2y));
}

function fbm(px: number, py: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < 5; i++) { v += a * snoise(px * f, py * f); a *= 0.5; f *= 2; }
  return v;
}

function sstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function getTerrainHeight(wx: number, wz: number, t: number): number {
  const px = wx, py = -wz;
  let h = 0;
  h += fbm(px * 0.012 + t * 0.004, py * 0.012 + t * 0.004) * 2.6;
  h += fbm(px * 0.03 + 5.3 + t * 0.002, py * 0.03 + 2.7 + t * 0.002) * 0.85;
  const wl = Math.sqrt(1 + 0.1225), windX = 1 / wl, windY = 0.35 / wl;
  const wMod = sstep(0.25, 0.75, fbm(px * 0.015 + 8, py * 0.015 + 8));
  h += Math.sin((px * windX + py * windY) * 0.4 + fbm(px * 0.05, py * 0.05) * 1.8 + t * 0.02) * 0.22 * wMod;
  h += fbm(px * 0.08 + 1.5, py * 0.08 + 9.2) * 0.10;
  return Math.max(h, -0.3) - 2.2;
}

// ═══════════════════════════════════════════════════════
// STRUT
// ═══════════════════════════════════════════════════════
const Strut = ({ from, to, radius, material }: {
  from: [number, number, number]; to: [number, number, number];
  radius: number; material: THREE.Material;
}) => {
  const d = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a); const len = dir.length(); dir.normalize();
    return { p: [mid.x, mid.y, mid.z] as [number, number, number], q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir), len };
  }, [from, to]);
  return <mesh position={d.p} quaternion={d.q} material={material}><cylinderGeometry args={[radius, radius, d.len, 6]} /></mesh>;
};

// ═══════════════════════════════════════════════════════
// DISH CONSTANTS — Steltzner geometry
//
// Sphere R=1.8, cap θ=0.55 rad
//   rim radius = R·sin(θ) ≈ 0.941
//   dish depth  = R·(1-cos(θ)) ≈ 0.266
//   focal point ≈ 0.65 above dish back
//
// After flip (PI around X) + translate [0, R, 0]:
//   pole (back of dish)  → y = 0
//   rim                  → y = 0.266
// ═══════════════════════════════════════════════════════
const SR = 1.8;
const CAP = 0.55;
const RIM = SR * Math.sin(CAP);       // 0.941
const DEPTH = SR * (1 - Math.cos(CAP)); // 0.266
const FEED = 0.65;

const BASE_H = 0.06;
const PED_H = 1.0;
const MNT_H = 0.10;
const PIVOT = BASE_H + PED_H + MNT_H; // 1.16

// ═══════════════════════════════════════════════════════
// SINGLE DISH — full DSN-grade ground station assembly
// ═══════════════════════════════════════════════════════
interface DishProps {
  wx: number; wz: number;
  tilt: number; azimuth: number;
  s: number; isDark: boolean;
  mats: { dish: THREE.Material; ped: THREE.Material; base: THREE.Material;
    mount: THREE.Material; strut: THREE.Material; feed: THREE.Material;
    warn: THREE.MeshStandardMaterial; cable: THREE.Material; };
}

const SatelliteDish = memo(({ wx, wz, tilt, azimuth, s, isDark, mats }: DishProps) => {
  const ref = useRef<THREE.Group>(null);

  const struts = useMemo(() =>
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].map(a => ({
      from: [RIM * Math.cos(a), DEPTH, RIM * Math.sin(a)] as [number, number, number],
      to: [0, FEED, 0] as [number, number, number],
    })), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!ref.current) return;

    // ── plant on terrain ──
    const y = getTerrainHeight(wx, wz, t);
    ref.current.position.set(wx, y, wz);

    // ── terrain slope ──
    const eps = 0.5;
    const yF = getTerrainHeight(wx, wz - eps, t);
    const yB = getTerrainHeight(wx, wz + eps, t);
    const yL = getTerrainHeight(wx - eps, wz, t);
    const yR = getTerrainHeight(wx + eps, wz, t);
    ref.current.rotation.set(
      Math.atan2(yF - yB, eps * 2) * 0.5,
      0,
      Math.atan2(yR - yL, eps * 2) * 0.5
    );

    // ── warning pulse ──
    mats.warn.emissiveIntensity = isDark ? 1.5 + Math.sin(t * 3) * 0.5 : 0.1;
  });

  return (
    <group ref={ref} scale={s}>

      {/* ── BASE PAD — heavy concrete foundation ── */}
      <mesh position={[0, BASE_H / 2, 0]} material={mats.base}>
        <cylinderGeometry args={[0.45, 0.52, BASE_H, 8]} />
      </mesh>
      {/* anchor bolts */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, i) => (
        <mesh key={`ab${i}`} position={[Math.cos(a) * 0.38, BASE_H, Math.sin(a) * 0.38]} material={mats.mount}>
          <cylinderGeometry args={[0.015, 0.015, 0.03, 4]} />
        </mesh>
      ))}

      {/* ── PEDESTAL — tapered steel column ── */}
      <mesh position={[0, BASE_H + PED_H / 2, 0]} material={mats.ped}>
        <cylinderGeometry args={[0.10, 0.16, PED_H, 8]} />
      </mesh>
      {/* reinforcement collar */}
      <mesh position={[0, BASE_H + 0.08, 0]} material={mats.strut}>
        <cylinderGeometry args={[0.17, 0.18, 0.04, 8]} />
      </mesh>

      {/* ── MOUNT HEAD — azimuth / elevation box ── */}
      <mesh position={[0, BASE_H + PED_H + MNT_H / 2, 0]} material={mats.mount}>
        <boxGeometry args={[0.22, MNT_H, 0.16]} />
      </mesh>
      {/* elevation pivot */}
      <mesh position={[0, PIVOT, 0]} material={mats.mount}>
        <sphereGeometry args={[0.06, 8, 8]} />
      </mesh>

      {/* ══════════════════════════════════════
          DISH ASSEMBLY — tilted toward sky
      ══════════════════════════════════════ */}
      <group position={[0, PIVOT, 0]} rotation={[tilt, azimuth, 0]}>

        {/* dish reflector — sphere cap, flipped concave-up */}
        <mesh position={[0, SR, 0]} rotation={[Math.PI, 0, 0]} material={mats.dish}>
          <sphereGeometry args={[SR, 24, 12, 0, Math.PI * 2, 0, CAP]} />
        </mesh>

        {/* rim reinforcement ring */}
        <mesh position={[0, DEPTH, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.strut}>
          <torusGeometry args={[RIM, 0.015, 6, 24]} />
        </mesh>

        {/* back hub — where pedestal attaches */}
        <mesh position={[0, -0.02, 0]} material={mats.mount}>
          <cylinderGeometry args={[0.08, 0.10, 0.05, 8]} />
        </mesh>

        {/* back structural ribs — cross pattern */}
        {[0, Math.PI / 2].map((a, i) => (
          <mesh key={`rib${i}`} position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, a]} material={mats.strut}>
            <boxGeometry args={[RIM * 1.7, 0.015, 0.02]} />
          </mesh>
        ))}
        {/* back ring midway */}
        <mesh position={[0, DEPTH * 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.strut}>
          <torusGeometry args={[RIM * 0.55, 0.01, 4, 16]} />
        </mesh>

        {/* feed horn struts — 4 from rim to focal point */}
        {struts.map((st, i) => (
          <Strut key={`fs${i}`} from={st.from} to={st.to} radius={0.012} material={mats.strut} />
        ))}

        {/* feed horn — tapered cylinder at focal point */}
        <mesh position={[0, FEED, 0]} material={mats.feed}>
          <cylinderGeometry args={[0.035, 0.055, 0.12, 8]} />
        </mesh>
        {/* feed horn flange */}
        <mesh position={[0, FEED - 0.07, 0]} material={mats.feed}>
          <cylinderGeometry args={[0.06, 0.06, 0.015, 8]} />
        </mesh>
        {/* LNB receiver box */}
        <mesh position={[0.07, FEED + 0.01, 0]} material={mats.feed}>
          <boxGeometry args={[0.05, 0.07, 0.04]} />
        </mesh>
        {/* waveguide */}
        <mesh position={[0.07, FEED - 0.04, 0]} material={mats.cable}>
          <cylinderGeometry args={[0.008, 0.008, 0.08, 4]} />
        </mesh>
      </group>

      {/* ── WARNING LIGHT — red beacon, pulses at night ── */}
      <mesh position={[0.12, BASE_H + PED_H + 0.02, 0]} material={mats.warn}>
        <sphereGeometry args={[0.022, 6, 6]} />
      </mesh>

      {/* ── CABLE TRAY — runs down pedestal ── */}
      <mesh position={[0.13, BASE_H + PED_H * 0.5, 0]} material={mats.cable}>
        <boxGeometry args={[0.025, PED_H * 0.7, 0.025]} />
      </mesh>

      {/* ── JUNCTION BOX — base of pedestal ── */}
      <mesh position={[0.18, BASE_H + 0.06, 0]} material={mats.feed}>
        <boxGeometry args={[0.08, 0.10, 0.06]} />
      </mesh>
    </group>
  );
});

// ═══════════════════════════════════════════════════════
// SATELLITE DISHES — 4 ground stations across the desert
//
// 1 near-field (visible alongside rover)
// 3 at horizon (DSN array silhouettes)
// ═══════════════════════════════════════════════════════
interface Props { isDark: boolean; }

export const SatelliteDishes = ({ isDark }: Props) => {
  const mats = useMemo(() => ({
    dish:  new THREE.MeshStandardMaterial({ color: '#e8e4e0', metalness: 0.3, roughness: 0.3, side: THREE.DoubleSide }),
    ped:   new THREE.MeshStandardMaterial({ color: '#7a7a7a', metalness: 0.2, roughness: 0.55 }),
    base:  new THREE.MeshStandardMaterial({ color: '#5a5a5a', metalness: 0.1, roughness: 0.8 }),
    mount: new THREE.MeshStandardMaterial({ color: '#6e6e6e', metalness: 0.3, roughness: 0.5 }),
    strut: new THREE.MeshStandardMaterial({ color: '#a0a0a0', metalness: 0.5, roughness: 0.3 }),
    feed:  new THREE.MeshStandardMaterial({ color: '#333333', metalness: 0.4, roughness: 0.5 }),
    warn:  new THREE.MeshStandardMaterial({ color: '#ff2200', emissive: new THREE.Color('#ff0000'), emissiveIntensity: 0.1 }),
    cable: new THREE.MeshStandardMaterial({ color: '#444444', metalness: 0.2, roughness: 0.6 }),
  }), []);

  const dishes = useMemo(() => [
    { wx: -8,  wz: 6,   s: 1.0, tilt: 0.5,  azimuth: 0.3  },   // near — left of rover
    { wx: -38, wz: -25, s: 1.3, tilt: 0.6,  azimuth: -0.4 },   // horizon left
    { wx: 5,   wz: -50, s: 1.4, tilt: 0.45, azimuth: 0.1  },   // horizon center
    { wx: 35,  wz: -18, s: 1.3, tilt: 0.55, azimuth: 0.7  },   // horizon right
  ], []);

  return (
    <>
      {dishes.map((d, i) => (
        <SatelliteDish key={i} {...d} isDark={isDark} mats={mats} />
      ))}
    </>
  );
};