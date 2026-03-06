import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════
// TERRAIN — same fbm stack as DuneField / MarsRover
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
// DOME WINDOW — tangent plane on sphere surface
// ═══════════════════════════════════════════════════════
const DomeWindow = ({ theta, phi, w, h, R, CY, material }: {
  theta: number; phi: number; w: number; h: number;
  R: number; CY: number; material: THREE.Material;
}) => {
  const data = useMemo(() => {
    const st = Math.sin(theta), ct = Math.cos(theta);
    const sp = Math.sin(phi), cp = Math.cos(phi);
    const r = R + 0.03;
    const pos: [number, number, number] = [r * st * sp, CY + r * ct, r * st * cp];
    const normal = new THREE.Vector3(st * sp, ct, st * cp).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    return { pos, q };
  }, [theta, phi, R, CY]);

  return (
    <mesh position={data.pos} quaternion={data.q} material={material}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
};

// ═══════════════════════════════════════════════════════
// NASA DOME — white radome operations structure
// ═══════════════════════════════════════════════════════
interface Props { isDark: boolean; }

export const NasaDome = ({ isDark }: Props) => {
  const ref = useRef<THREE.Group>(null);

  const R = 4;
  const CY = R - 0.2;       // 3.8 — slightly embedded in sand
  const WX = -2, WZ = -45;

  // ── materials ──
  const domeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f0ece8', metalness: 0.15, roughness: 0.3,
  }), []);
  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#777777', metalness: 0.2, roughness: 0.65,
  }), []);
  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c0c0c0', metalness: 0.45, roughness: 0.3,
  }), []);
  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2a2a2a', metalness: 0.3, roughness: 0.5,
  }), []);
  const windowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#88aacc', emissive: new THREE.Color('#ffcc44'),
    emissiveIntensity: 0, metalness: 0.7, roughness: 0.15, side: THREE.DoubleSide,
  }), []);
  const warnMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ff2200', emissive: new THREE.Color('#ff0000'), emissiveIntensity: 0.1,
  }), []);
  const solarMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a3a', metalness: 0.6, roughness: 0.2,
  }), []);
  const conduitMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#555555', metalness: 0.3, roughness: 0.5,
  }), []);

  // ── panel line rings ──
  const rings = useMemo(() =>
    [1.0, 2.2, CY, 5.4, 6.6].map(y => ({
      y,
      r: Math.sqrt(R * R - (y - CY) * (y - CY)),
    })), []);

  // ── window layout ──
  const windows = useMemo(() => [
    { theta: Math.PI * 0.35, phi: 0,    w: 0.55, h: 0.38 },
    { theta: Math.PI * 0.35, phi: 0.28, w: 0.55, h: 0.38 },
    { theta: Math.PI * 0.35, phi: -0.28, w: 0.55, h: 0.38 },
    { theta: Math.PI * 0.25, phi: Math.PI * 0.45, w: 0.4, h: 0.3 },
    { theta: Math.PI * 0.25, phi: -Math.PI * 0.45, w: 0.4, h: 0.3 },
    { theta: Math.PI * 0.2,  phi: Math.PI, w: 0.45, h: 0.32 },
  ], []);

  // ── entry tunnel geometry ──
  const entryZ = Math.sqrt(R * R - (0.8 - CY) * (0.8 - CY)); // ~2.65
  const tunnelDepth = 2.0;
  const tunnelMidZ = entryZ + tunnelDepth / 2;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!ref.current) return;

    const y = getTerrainHeight(WX, WZ, t);
    ref.current.position.set(WX, y, WZ);

    const eps = 0.8;
    const yF = getTerrainHeight(WX, WZ - eps, t);
    const yB = getTerrainHeight(WX, WZ + eps, t);
    const yL = getTerrainHeight(WX - eps, WZ, t);
    const yR = getTerrainHeight(WX + eps, WZ, t);
    ref.current.rotation.set(
      Math.atan2(yF - yB, eps * 2) * 0.3,
      0,
      Math.atan2(yR - yL, eps * 2) * 0.3
    );

    windowMat.emissiveIntensity = isDark ? 1.2 + Math.sin(t * 0.5) * 0.15 : 0.03;
    warnMat.emissiveIntensity = isDark ? 1.8 + Math.sin(t * 3.0) * 0.6 : 0.1;
  });

  return (
    <group ref={ref}>

      {/* ══════════════════════════════════════
          FOUNDATION
      ══════════════════════════════════════ */}
      <mesh position={[0, 0.03, 0]} material={baseMat}>
        <cylinderGeometry args={[R + 0.6, R + 0.9, 0.06, 20]} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={accentMat}>
        <torusGeometry args={[R + 0.15, 0.05, 6, 28]} />
      </mesh>
      {/* inner floor */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} material={baseMat}>
        <circleGeometry args={[R - 0.05, 24]} />
      </mesh>

      {/* ══════════════════════════════════════
          MAIN SPHERE — white radome
      ══════════════════════════════════════ */}
      <mesh position={[0, CY, 0]} material={domeMat}>
        <sphereGeometry args={[R, 36, 28]} />
      </mesh>

      {/* ══════════════════════════════════════
          PANEL LINES — horizontal rings
      ══════════════════════════════════════ */}
      {rings.map((ring, i) => (
        <mesh key={`hr${i}`} position={[0, ring.y, 0]} rotation={[Math.PI / 2, 0, 0]} material={accentMat}>
          <torusGeometry args={[ring.r, 0.02, 4, 36]} />
        </mesh>
      ))}

      {/* ══════════════════════════════════════
          PANEL LINES — vertical seam great-circles
      ══════════════════════════════════════ */}
      {[0, Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4].map((phi, i) => (
        <mesh key={`vs${i}`} position={[0, CY, 0]} rotation={[Math.PI / 2, phi, 0]} material={accentMat}>
          <torusGeometry args={[R, 0.015, 4, 36]} />
        </mesh>
      ))}

      {/* ══════════════════════════════════════
          ENTRY TUNNEL — toward camera (+Z)
      ══════════════════════════════════════ */}
      <group position={[0, 0.8, tunnelMidZ]}>
        {/* walls */}
        <mesh position={[-0.7, 0, 0]} material={domeMat}>
          <boxGeometry args={[0.07, 1.6, tunnelDepth]} />
        </mesh>
        <mesh position={[0.7, 0, 0]} material={domeMat}>
          <boxGeometry args={[0.07, 1.6, tunnelDepth]} />
        </mesh>
        {/* roof */}
        <mesh position={[0, 0.8, 0]} material={domeMat}>
          <boxGeometry args={[1.47, 0.07, tunnelDepth]} />
        </mesh>
        {/* floor */}
        <mesh position={[0, -0.8, 0]} material={baseMat}>
          <boxGeometry args={[1.47, 0.06, tunnelDepth]} />
        </mesh>
        {/* door — dark panel at outer end */}
        <mesh position={[0, 0, tunnelDepth / 2 + 0.01]} material={darkMat}>
          <planeGeometry args={[1.25, 1.5]} />
        </mesh>
        {/* door frame accent */}
        <mesh position={[0, 0, tunnelDepth / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]} material={accentMat}>
          <torusGeometry args={[0.65, 0.025, 4, 4]} />
        </mesh>
        {/* interior light strip */}
        <mesh position={[0, 0.74, 0]} material={windowMat}>
          <boxGeometry args={[0.8, 0.03, tunnelDepth * 0.8]} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════
          OBSERVATION WINDOWS
      ══════════════════════════════════════ */}
      {windows.map((w, i) => (
        <DomeWindow key={`win${i}`} {...w} R={R} CY={CY} material={windowMat} />
      ))}

      {/* ══════════════════════════════════════
          TOP ANTENNA MAST
      ══════════════════════════════════════ */}
      <group position={[0, CY + R, 0]}>
        {/* mast */}
        <mesh position={[0, 0.5, 0]} material={accentMat}>
          <cylinderGeometry args={[0.03, 0.05, 1.0, 6]} />
        </mesh>
        {/* cross arms */}
        <mesh position={[0, 0.8, 0]} material={accentMat}>
          <boxGeometry args={[0.6, 0.025, 0.025]} />
        </mesh>
        <mesh position={[0, 0.8, 0]} material={accentMat}>
          <boxGeometry args={[0.025, 0.025, 0.6]} />
        </mesh>
        {/* tip sphere */}
        <mesh position={[0, 1.05, 0]} material={accentMat}>
          <sphereGeometry args={[0.05, 6, 6]} />
        </mesh>
        {/* warning beacon */}
        <mesh position={[0, 1.15, 0]} material={warnMat}>
          <sphereGeometry args={[0.04, 6, 6]} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════
          EQUIPMENT CONTAINERS — around base
      ══════════════════════════════════════ */}
      <mesh position={[-(R + 1.0), 0.28, -0.8]} material={darkMat}>
        <boxGeometry args={[0.65, 0.55, 0.45]} />
      </mesh>
      <mesh position={[-(R + 1.0), 0.22, 0.6]} material={darkMat}>
        <boxGeometry args={[0.55, 0.44, 0.5]} />
      </mesh>
      <mesh position={[(R + 0.8), 0.3, 0.2]} material={darkMat}>
        <boxGeometry args={[0.7, 0.6, 0.5]} />
      </mesh>
      <mesh position={[0.5, 0.2, -(R + 0.9)]} material={darkMat}>
        <boxGeometry args={[0.5, 0.4, 0.55]} />
      </mesh>
      {/* junction box on front container */}
      <mesh position={[(R + 0.8), 0.65, 0.2]} material={accentMat}>
        <boxGeometry args={[0.12, 0.08, 0.12]} />
      </mesh>

      {/* ══════════════════════════════════════
          CONDUIT PIPES — dome to equipment
      ══════════════════════════════════════ */}
      <mesh position={[-(R + 0.2), 0.15, -0.8]} rotation={[0, 0, Math.PI / 2]} material={conduitMat}>
        <cylinderGeometry args={[0.025, 0.025, 0.8, 4]} />
      </mesh>
      <mesh position={[(R + 0.15), 0.15, 0.2]} rotation={[0, 0, Math.PI / 2]} material={conduitMat}>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 4]} />
      </mesh>
      {/* vertical pipe along dome */}
      <mesh position={[-(R + 0.05), 1.0, -0.8]} material={conduitMat}>
        <cylinderGeometry args={[0.02, 0.02, 1.7, 4]} />
      </mesh>

      {/* ══════════════════════════════════════
          SOLAR PANEL ARRAY — nearby
      ══════════════════════════════════════ */}
      <group position={[R + 4, 0, -2]}>
        {[0, 1, 2].map(i => (
          <group key={`sol${i}`} position={[i * 1.8, 0, 0]}>
            {/* stand */}
            <mesh position={[0, 0.45, 0]} material={accentMat}>
              <cylinderGeometry args={[0.025, 0.035, 0.9, 4]} />
            </mesh>
            {/* panel */}
            <mesh position={[0, 1.0, 0.25]} rotation={[-0.5, 0, 0]} material={solarMat}>
              <boxGeometry args={[1.4, 0.03, 0.9]} />
            </mesh>
            {/* panel frame */}
            <mesh position={[0, 1.0, 0.25]} rotation={[-0.5, 0, 0]} material={accentMat}>
              <boxGeometry args={[1.42, 0.015, 0.92]} />
            </mesh>
          </group>
        ))}
        {/* array base rail */}
        <mesh position={[1.8, 0.04, 0]} material={baseMat}>
          <boxGeometry args={[5.8, 0.04, 0.3]} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════
          BASE WARNING LIGHTS — 4 around perimeter
      ══════════════════════════════════════ */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, i) => (
        <mesh key={`bw${i}`} position={[Math.cos(a) * (R + 0.5), 0.15, Math.sin(a) * (R + 0.5)]} material={warnMat}>
          <sphereGeometry args={[0.03, 6, 6]} />
        </mesh>
      ))}

      {/* ══════════════════════════════════════
          NASA ACCENT STRIPE — red band on dome base
      ══════════════════════════════════════ */}
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={warnMat}>
        <torusGeometry args={[Math.sqrt(R * R - (0.35 - CY) * (0.35 - CY)), 0.04, 4, 36]} />
      </mesh>
    </group>
  );
};