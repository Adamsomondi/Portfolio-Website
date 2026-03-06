import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════
// TERRAIN
// ═══════════════════════════════════════════════════════
function mod289(x: number) { return x - Math.floor(x / 289) * 289; }
function permute(x: number) { return mod289(((x * 34) + 1) * x); }
function fr(x: number) { return x - Math.floor(x); }

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
  const xx0 = 2 * fr(p0 * C3) - 1, xx1 = 2 * fr(p1 * C3) - 1, xx2 = 2 * fr(p2 * C3) - 1;
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
  const wl = Math.sqrt(1.1225), windX = 1 / wl, windY = 0.35 / wl;
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
// DISH GEOMETRY
//
// Sphere R=7, cap θ=0.58 rad
//   rim radius  = R·sin(θ) ≈ 3.83
//   dish depth  = R·(1−cos(θ)) ≈ 1.14
//   focal point ≈ 3.0 above dish back
//
// After flip (π around X) + translate [0,R,0]:
//   back of dish → y = 0
//   rim           → y = 1.14
// ═══════════════════════════════════════════════════════
const SR = 7;
const CAP = 0.58;
const RIM_R = SR * Math.sin(CAP);          // 3.83
const DEPTH = SR * (1 - Math.cos(CAP));    // 1.14
const FOCAL = 3.0;

const TOWER_H = 8;
const MOUNT_H = 0.5;
const DISH_Y = TOWER_H + MOUNT_H;

const WX = 30, WZ = -30;

// ═══════════════════════════════════════════════════════
// SINGLE TALL TRACKING DISH — right horizon
// ═══════════════════════════════════════════════════════
interface Props { isDark: boolean; }

export const SolarArray = ({ isDark }: Props) => {
  const groupRef = useRef<THREE.Group>(null);
  const dishRef = useRef<THREE.Group>(null);

  // ── materials ──
  const dishMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#eae6e0', metalness: 0.25, roughness: 0.28, side: THREE.DoubleSide,
  }), []);
  const towerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#6a6a6a', metalness: 0.3, roughness: 0.5,
  }), []);
  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#555555', metalness: 0.15, roughness: 0.7,
  }), []);
  const strutMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#999999', metalness: 0.45, roughness: 0.3,
  }), []);
  const feedMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2a2a2a', metalness: 0.4, roughness: 0.5,
  }), []);
  const cableMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#333333', metalness: 0.2, roughness: 0.6,
  }), []);
  const warnMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ff2200', emissive: new THREE.Color('#ff0000'), emissiveIntensity: 0.1,
  }), []);
  const platMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#777777', metalness: 0.3, roughness: 0.4,
  }), []);

  // ── feed strut endpoints ──
  const struts = useMemo(() =>
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].map(a => ({
      from: [RIM_R * Math.cos(a), DEPTH, RIM_R * Math.sin(a)] as [number, number, number],
      to: [0, FOCAL, 0] as [number, number, number],
    })), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!groupRef.current) return;

    // ── plant on terrain ──
    const y = getTerrainHeight(WX, WZ, t);
    groupRef.current.position.set(WX, y, WZ);

    const eps = 0.8;
    const yF = getTerrainHeight(WX, WZ - eps, t);
    const yB = getTerrainHeight(WX, WZ + eps, t);
    const yL = getTerrainHeight(WX - eps, WZ, t);
    const yR = getTerrainHeight(WX + eps, WZ, t);
    groupRef.current.rotation.set(
      Math.atan2(yF - yB, eps * 2) * 0.3,
      0,
      Math.atan2(yR - yL, eps * 2) * 0.3
    );

    // ── dish visual noise — two-frequency organic scan ──
    if (dishRef.current) {
      dishRef.current.rotation.y =
        Math.sin(t * 0.15) * 0.5 +
        Math.sin(t * 0.07 + 1.3) * 0.2;

      dishRef.current.rotation.x =
        -0.6 + Math.sin(t * 0.1 + 0.8) * 0.15;

      dishRef.current.rotation.z =
        Math.sin(t * 0.08 + 2.1) * 0.04;
    }

    warnMat.emissiveIntensity = isDark ? 1.8 + Math.sin(t * 3) * 0.6 : 0.15;
  });

  return (
    <group ref={groupRef}>

      {/* ══════════════════════════════════════
          FOUNDATION
      ══════════════════════════════════════ */}
      <mesh position={[0, 0.06, 0]} material={baseMat}>
        <cylinderGeometry args={[3.0, 3.4, 0.12, 16]} />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} material={strutMat}>
        <torusGeometry args={[2.2, 0.06, 4, 16]} />
      </mesh>

      {/* ══════════════════════════════════════
          EQUIPMENT ROOM — base structure
      ══════════════════════════════════════ */}
      <mesh position={[1.5, 0.55, 0]} material={baseMat}>
        <boxGeometry args={[1.8, 1.0, 1.4]} />
      </mesh>
      <mesh position={[1.5, 0.55, 0.72]} material={towerMat}>
        <planeGeometry args={[1.2, 0.8]} />
      </mesh>
      {/* ventilation */}
      <mesh position={[1.5, 1.1, 0]} material={towerMat}>
        <boxGeometry args={[0.6, 0.15, 0.5]} />
      </mesh>

      {/* ══════════════════════════════════════
          TOWER — tapered steel column
      ══════════════════════════════════════ */}
      <mesh position={[0, 0.12 + TOWER_H / 2, 0]} material={towerMat}>
        <cylinderGeometry args={[0.3, 0.55, TOWER_H, 8]} />
      </mesh>

      {/* reinforcement rings */}
      {[2, 4, 6].map((h, i) => (
        <mesh key={`ring${i}`} position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} material={strutMat}>
          <torusGeometry args={[0.3 + (TOWER_H - h) * 0.03, 0.04, 4, 12]} />
        </mesh>
      ))}

      {/* ══════════════════════════════════════
          LADDER — rungs + rails
      ══════════════════════════════════════ */}
      {/* rails */}
      <mesh position={[-0.42, TOWER_H / 2, -0.06]} material={strutMat}>
        <boxGeometry args={[0.02, TOWER_H - 0.5, 0.02]} />
      </mesh>
      <mesh position={[-0.42, TOWER_H / 2, 0.06]} material={strutMat}>
        <boxGeometry args={[0.02, TOWER_H - 0.5, 0.02]} />
      </mesh>
      {/* rungs */}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={`rung${i}`} position={[-0.42, 0.5 + i * 0.48, 0]} material={strutMat}>
          <boxGeometry args={[0.14, 0.018, 0.14]} />
        </mesh>
      ))}

      {/* ══════════════════════════════════════
          ACCESS PLATFORM — mid-tower
      ══════════════════════════════════════ */}
      <group position={[0, 6, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={platMat}>
          <ringGeometry args={[0.35, 1.2, 12]} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={strutMat}>
          <torusGeometry args={[1.2, 0.025, 4, 12]} />
        </mesh>
        {/* railing posts */}
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, i) => (
          <mesh key={`rp${i}`} position={[Math.cos(a) * 1.15, 0.35, Math.sin(a) * 1.15]} material={strutMat}>
            <cylinderGeometry args={[0.015, 0.015, 0.7, 4]} />
          </mesh>
        ))}
        {/* railing ring */}
        <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]} material={strutMat}>
          <torusGeometry args={[1.15, 0.018, 4, 12]} />
        </mesh>
        {/* equipment box */}
        <mesh position={[0.7, 0.18, 0]} material={feedMat}>
          <boxGeometry args={[0.35, 0.35, 0.25]} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════
          CABLE TRAY — tower to equipment room
      ══════════════════════════════════════ */}
      <mesh position={[0.38, TOWER_H / 2, 0]} material={cableMat}>
        <boxGeometry args={[0.06, TOWER_H - 1, 0.06]} />
      </mesh>

      {/* ══════════════════════════════════════
          MOUNT BEARING — top of tower
      ══════════════════════════════════════ */}
      <mesh position={[0, TOWER_H + 0.12, 0]} material={platMat}>
        <cylinderGeometry args={[0.55, 0.4, 0.25, 10]} />
      </mesh>
      <mesh position={[0, TOWER_H + 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={strutMat}>
        <torusGeometry args={[0.55, 0.04, 4, 12]} />
      </mesh>

      {/* ══════════════════════════════════════
          DISH ASSEMBLY — rotates with visual noise
      ══════════════════════════════════════ */}
      <group ref={dishRef} position={[0, DISH_Y, 0]}>

        {/* mount stub */}
        <mesh position={[0, 0.2, 0]} material={towerMat}>
          <cylinderGeometry args={[0.18, 0.25, 0.4, 8]} />
        </mesh>

        {/* fork yoke arms */}
        <mesh position={[-0.55, 0.7, 0]} material={towerMat}>
          <boxGeometry args={[0.1, 1.0, 0.12]} />
        </mesh>
        <mesh position={[0.55, 0.7, 0]} material={towerMat}>
          <boxGeometry args={[0.1, 1.0, 0.12]} />
        </mesh>
        {/* yoke crossbar */}
        <mesh position={[0, 1.2, 0]} material={strutMat}>
          <boxGeometry args={[1.2, 0.08, 0.1]} />
        </mesh>
        {/* elevation pivot spheres */}
        <mesh position={[-0.55, 1.2, 0]} material={strutMat}>
          <sphereGeometry args={[0.08, 6, 6]} />
        </mesh>
        <mesh position={[0.55, 1.2, 0]} material={strutMat}>
          <sphereGeometry args={[0.08, 6, 6]} />
        </mesh>

        {/* ── DISH SUB-ASSEMBLY ── */}
        <group position={[0, 1.3, 0]}>

          {/* parabolic reflector — sphere cap, flipped concave-up */}
          <mesh position={[0, SR, 0]} rotation={[Math.PI, 0, 0]} material={dishMat}>
            <sphereGeometry args={[SR, 28, 14, 0, Math.PI * 2, 0, CAP]} />
          </mesh>

          {/* rim reinforcement */}
          <mesh position={[0, DEPTH, 0]} rotation={[Math.PI / 2, 0, 0]} material={strutMat}>
            <torusGeometry args={[RIM_R, 0.03, 4, 28]} />
          </mesh>

          {/* back hub */}
          <mesh position={[0, 0, 0]} material={towerMat}>
            <cylinderGeometry args={[0.25, 0.3, 0.15, 8]} />
          </mesh>

          {/* back structural ribs — cross */}
          {[0, Math.PI / 2].map((a, i) => (
            <mesh key={`rib${i}`} position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, a]} material={strutMat}>
              <boxGeometry args={[RIM_R * 1.7, 0.02, 0.04]} />
            </mesh>
          ))}

          {/* back ring — midway */}
          <mesh position={[0, DEPTH * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={strutMat}>
            <torusGeometry args={[RIM_R * 0.55, 0.018, 4, 16]} />
          </mesh>

          {/* feed horn struts — 4 from rim to focal point */}
          {struts.map((s, i) => (
            <Strut key={`fs${i}`} from={s.from} to={s.to} radius={0.025} material={strutMat} />
          ))}

          {/* feed horn */}
          <mesh position={[0, FOCAL, 0]} material={feedMat}>
            <cylinderGeometry args={[0.06, 0.1, 0.25, 8]} />
          </mesh>
          {/* feed flange */}
          <mesh position={[0, FOCAL - 0.15, 0]} material={feedMat}>
            <cylinderGeometry args={[0.12, 0.12, 0.03, 8]} />
          </mesh>
          {/* LNB box */}
          <mesh position={[0.12, FOCAL + 0.05, 0]} material={feedMat}>
            <boxGeometry args={[0.08, 0.12, 0.06]} />
          </mesh>
        </group>

        {/* counterweight — behind dish */}
        <mesh position={[0, 0.2, 0]} material={towerMat}>
          <boxGeometry args={[0.7, 0.45, 0.5]} />
        </mesh>

        {/* dish warning beacon */}
        <mesh position={[0, 1.3 + DEPTH + 0.08, RIM_R * 0.7]} material={warnMat}>
          <sphereGeometry args={[0.06, 6, 6]} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════
          WARNING LIGHTS
      ══════════════════════════════════════ */}
      {/* tower top */}
      <mesh position={[0, TOWER_H + 0.42, 0]} material={warnMat}>
        <sphereGeometry args={[0.05, 6, 6]} />
      </mesh>
      {/* equipment room */}
      <mesh position={[2.42, 0.95, 0]} material={warnMat}>
        <sphereGeometry args={[0.03, 4, 4]} />
      </mesh>

      {/* ══════════════════════════════════════
          GROUND CABLES — equipment to tower
      ══════════════════════════════════════ */}
      <mesh position={[0.75, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} material={cableMat}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 4]} />
      </mesh>
    </group>
  );
};