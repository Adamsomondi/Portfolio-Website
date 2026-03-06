import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════
// NOISE
// ═══════════════════════════════════════════════════════
function mod289(x: number) { return x - Math.floor(x * (1.0 / 289.0)) * 289.0; }
function permute(x: number) { return mod289(((x * 34.0) + 1.0) * x); }
function fract(x: number) { return x - Math.floor(x); }
function snoise(vx: number, vy: number): number {
  const C0 = 0.211324865405187, C1 = 0.366025403784439, C2 = -0.577350269189626, C3 = 0.024390243902439;
  const s = (vx + vy) * C1; let ix = Math.floor(vx + s); let iy = Math.floor(vy + s);
  const t = (ix + iy) * C0;
  const x0x = vx - ix + t, x0y = vy - iy + t;
  const i1x = x0x > x0y ? 1 : 0, i1y = x0x > x0y ? 0 : 1;
  const x1x = x0x + C0 - i1x, x1y = x0y + C0 - i1y, x2x = x0x + C2, x2y = x0y + C2;
  ix = mod289(ix); iy = mod289(iy);
  const p0 = permute(permute(iy) + ix), p1 = permute(permute(iy + i1y) + ix + i1x), p2 = permute(permute(iy + 1) + ix + 1);
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
function fbm(px: number, py: number) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < 5; i++) { v += a * snoise(px * f, py * f); a *= 0.5; f *= 2; } return v; }
function smoothstep(e0: number, e1: number, x: number) { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

function heightAt(px: number, py: number, t: number): number {
  let h = 0;
  h += fbm(px * 0.012 + t * 0.004, py * 0.012 + t * 0.004) * 2.6;
  h += fbm(px * 0.03 + 5.3 + t * 0.002, py * 0.03 + 2.7 + t * 0.002) * 0.85;
  const wl = Math.sqrt(1 + 0.35 * 0.35), wX = 1 / wl, wY = 0.35 / wl;
  h += Math.sin((px * wX + py * wY) * 0.4 + fbm(px * 0.05, py * 0.05) * 1.8 + t * 0.02) * 0.22 * smoothstep(0.25, 0.75, fbm(px * 0.015 + 8, py * 0.015 + 8));
  h += fbm(px * 0.08 + 1.5, py * 0.08 + 9.2) * 0.10;
  return Math.max(h, -0.3);
}
function getTerrainHeight(wx: number, wz: number, t: number) { return heightAt(wx, -wz, t) - 2.2; }

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════
const LR = THREE.MathUtils.lerp;
const tmpObj = new THREE.Object3D();

const MAX_TRACKS = 600;
const TRACK_SAMPLE_DIST = 0.25;
const TRACK_LIFETIME = 60;
const TRACK_HALF_W = 1.0;

type TrackPoint = {
  lx: number; ly: number; lz: number;
  rx: number; ry: number; rz: number;
  yaw: number; time: number;
};

// ═══════════════════════════════════════════════════════
// STRUT
// ═══════════════════════════════════════════════════════
const Strut = ({ from, to, radius, material }: {
  from: [number, number, number]; to: [number, number, number]; radius: number; material: THREE.Material;
}) => {
  const data = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a); const len = dir.length(); dir.normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return { pos: [mid.x, mid.y, mid.z] as [number, number, number], q, len };
  }, [from, to]);
  return (
    <mesh position={data.pos} quaternion={data.q} material={material}>
      <cylinderGeometry args={[radius, radius, data.len, 6]} />
    </mesh>
  );
};

// ═══════════════════════════════════════════════════════
// WHEEL — speed-driven spin
// ═══════════════════════════════════════════════════════
const RoverWheel = ({ pos, drumMat, hubMat, speedRef }: {
  pos: [number, number, number]; drumMat: THREE.Material; hubMat: THREE.Material;
  speedRef: React.MutableRefObject<number>;
}) => {
  const innerRef = useRef<THREE.Group>(null);
  const angleRef = useRef(0);
  const R = 0.22, W = 0.18;

  useFrame((_s, delta) => {
    if (innerRef.current) {
      angleRef.current += (0.03 + Math.abs(speedRef.current) * 1.8) * delta;
      innerRef.current.rotation.y = angleRef.current;
    }
  });

  return (
    <group position={pos} rotation={[0, 0, Math.PI / 2]}>
      <group ref={innerRef}>
        <mesh material={drumMat}><cylinderGeometry args={[R, R, W, 16, 1, true]} /></mesh>
        <mesh position={[0, W / 2, 0]} rotation={[Math.PI / 2, 0, 0]} material={drumMat}><ringGeometry args={[0.055, R, 16]} /></mesh>
        <mesh position={[0, -W / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} material={drumMat}><ringGeometry args={[0.055, R, 16]} /></mesh>
        <mesh material={hubMat}><cylinderGeometry args={[0.055, 0.055, W + 0.02, 8]} /></mesh>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (<group key={`sp${i}`} rotation={[0, a, 0]}>
            <mesh position={[0, 0, 0.06 + (R - 0.075) / 2]} material={hubMat}><boxGeometry args={[0.012, 0.012, R - 0.075]} /></mesh>
          </group>);
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (<group key={`gr${i}`} rotation={[0, a, 0]}>
            <mesh position={[0, 0, R + 0.012]} material={drumMat}><boxGeometry args={[0.02, W * 0.7, 0.025]} /></mesh>
          </group>);
        })}
      </group>
    </group>
  );
};

// ═══════════════════════════════════════════════════════
// WHEEL TRACKS — instanced dark sand marks
// ═══════════════════════════════════════════════════════
const RoverTracks = ({ tracksRef, isDark }: {
  tracksRef: React.MutableRefObject<TrackPoint[]>; isDark: boolean;
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const MAX_INST = MAX_TRACKS * 2;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!meshRef.current) return;

    let idx = 0;
    const tracks = tracksRef.current;

    for (let i = 0; i < tracks.length && idx < MAX_INST - 1; i++) {
      const tp = tracks[i];
      const age = t - tp.time;
      if (age > TRACK_LIFETIME) continue;

      // fade: full for 60%, then shrink to nothing
      const fadeStart = TRACK_LIFETIME * 0.6;
      const fade = age < fadeStart ? 1.0 : 1.0 - smoothstep(fadeStart, TRACK_LIFETIME, age);

      // left track
      tmpObj.position.set(tp.lx, tp.ly, tp.lz);
      tmpObj.rotation.set(0, tp.yaw, 0);
      tmpObj.scale.set(fade, 1, fade);
      tmpObj.updateMatrix();
      meshRef.current.setMatrixAt(idx++, tmpObj.matrix);

      // right track
      tmpObj.position.set(tp.rx, tp.ry, tp.rz);
      tmpObj.rotation.set(0, tp.yaw, 0);
      tmpObj.scale.set(fade, 1, fade);
      tmpObj.updateMatrix();
      meshRef.current.setMatrixAt(idx++, tmpObj.matrix);
    }

    meshRef.current.count = idx;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_INST]} frustumCulled={false}>
      <boxGeometry args={[0.22, 0.006, 0.32]} />
      <meshStandardMaterial
        color={isDark ? '#3a3020' : '#7a6a4a'}
        roughness={1.0} metalness={0.0}
      />
    </instancedMesh>
  );
};

// ═══════════════════════════════════════════════════════
// MARS ROVER
// ═══════════════════════════════════════════════════════
interface Props {
  isDark: boolean;
  onDrivingChange: (v: boolean) => void;
  canDrive: boolean;
}

export const MarsRover = ({ isDark, onDrivingChange, canDrive }: Props) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const _v = useMemo(() => new THREE.Vector3(), []);
  const prevT = useRef(0);

  // ── ROVER STATE ──
  const rover = useRef({ x: 4, z: 10, yaw: -0.4, speed: 0, driving: false });
  const mouse = useRef({ x: 0, y: 0 });
  const wheelSpeedRef = useRef(0);
  const canDriveRef = useRef(canDrive);
  canDriveRef.current = canDrive;

  // ── TOGGLE FLAGS ──
  const startFlag = useRef(false);
  const stopFlag  = useRef(false);

  // ── TRACKS ──
  const tracksRef    = useRef<TrackPoint[]>([]);
  const lastTrackPos = useRef({ x: 0, z: 0 });

  const SCALE = 1.5;
  const GROUND_OFFSET = 0.25;
  const MAX_SPEED = 5;

  // ── materials ──
  const goldMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c8a050', metalness: 0.6, roughness: 0.35 }), []);
  const whiteMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8e4dc', metalness: 0.1, roughness: 0.65 }), []);
  const darkMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.3, roughness: 0.55 }), []);
  const hubMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#888888', metalness: 0.5, roughness: 0.4 }), []);
  const armMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#666666', metalness: 0.4, roughness: 0.45 }), []);
  const panelMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f0ece5', metalness: 0.15, roughness: 0.55 }), []);
  const rtgMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#444444', metalness: 0.35, roughness: 0.5 }), []);
  const lensMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111122', metalness: 0.8, roughness: 0.2 }), []);
  const ledMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: '#00ff88', emissive: new THREE.Color('#00ff88'), emissiveIntensity: 0 }), []);
  const rtgGlowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ff6622', emissive: new THREE.Color('#ff4400'), emissiveIntensity: 0.1 }), []);

  const WFL: [number, number, number] = [-0.65, 0, 0.55];
  const WFR: [number, number, number] = [0.65, 0, 0.55];
  const WML: [number, number, number] = [-0.75, 0, -0.10];
  const WMR: [number, number, number] = [0.75, 0, -0.10];
  const WRL: [number, number, number] = [-0.65, 0, -0.55];
  const WRR: [number, number, number] = [0.65, 0, -0.55];
  const RPL: [number, number, number] = [-0.50, 0.35, 0.10];
  const RPR: [number, number, number] = [0.50, 0.35, 0.10];
  const BPL: [number, number, number] = [-0.70, 0.18, -0.30];
  const BPR: [number, number, number] = [0.70, 0.18, -0.30];

  // ── HUD ──
  const hudRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const h = document.createElement('div');
    h.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:998;font-family:"Courier New",monospace;';
    document.body.appendChild(h); hudRef.current = h;
    return () => { h.remove(); hudRef.current = null; };
  }, []);

  // ── INPUT — Ctrl toggle + mouse ──
  useEffect(() => {
    const onM = (e: MouseEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.current.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        const rv = rover.current;
        if (!rv.driving && canDriveRef.current) {
          startFlag.current = true;
        } else if (rv.driving) {
          stopFlag.current = true;
        }
      }
    };
    gl.domElement.addEventListener('mousemove', onM);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      gl.domElement.removeEventListener('mousemove', onM);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [gl]);

  // ── FRAME ──
  useFrame((state) => {
    const t  = state.clock.elapsedTime;
    const dt = Math.min(t - prevT.current, 0.05); prevT.current = t;
    const r  = rover.current;

    // ── CTRL toggle: start ──
    if (startFlag.current) {
      startFlag.current = false;
      r.driving = true;
      onDrivingChange(true);
      lastTrackPos.current = { x: r.x, z: r.z };
    }

    // ── CTRL toggle: stop ──
    if (stopFlag.current) {
      stopFlag.current = false;
      r.driving = false; r.speed = 0;
      onDrivingChange(false);
      camera.position.set(0, 3, 22); camera.lookAt(0, 1.5, -8);
      const pc = camera as THREE.PerspectiveCamera;
      pc.fov = 60; pc.updateProjectionMatrix();
    }

    // ── force-stop if drone takes over ──
    if (r.driving && !canDriveRef.current) {
      r.driving = false; r.speed = 0;
      onDrivingChange(false);
    }

    // ── DRIVING ──
    if (r.driving) {
      const mx = Math.abs(mouse.current.x) < 0.05 ? 0 : mouse.current.x;
      const my = Math.abs(mouse.current.y) < 0.05 ? 0 : mouse.current.y;

      r.yaw += -mx * 1.5 * dt;
      r.speed = LR(r.speed, my * MAX_SPEED, 0.04);

      r.x -= Math.sin(r.yaw) * r.speed * dt;
      r.z -= Math.cos(r.yaw) * r.speed * dt;

      // ── WHEEL TRACKS: sample by distance ──
      const dx = r.x - lastTrackPos.current.x;
      const dz = r.z - lastTrackPos.current.z;
      if (Math.sqrt(dx * dx + dz * dz) > TRACK_SAMPLE_DIST && Math.abs(r.speed) > 0.3) {
        lastTrackPos.current = { x: r.x, z: r.z };

        const cy = Math.cos(r.yaw), sy = Math.sin(r.yaw);
        const lx = r.x - cy * TRACK_HALF_W;
        const lz = r.z + sy * TRACK_HALF_W;
        const rx = r.x + cy * TRACK_HALF_W;
        const rz = r.z - sy * TRACK_HALF_W;

        tracksRef.current.push({
          lx, ly: getTerrainHeight(lx, lz, t) + 0.02, lz,
          rx, ry: getTerrainHeight(rx, rz, t) + 0.02, rz,
          yaw: r.yaw, time: t,
        });

        // trim
        tracksRef.current = tracksRef.current.filter(
          tp => t - tp.time < TRACK_LIFETIME
        ).slice(-MAX_TRACKS);
      }

      // ── chase camera ──
      const sh = Math.sin(r.yaw), ch = Math.cos(r.yaw);
      const ry = getTerrainHeight(r.x, r.z, t) + GROUND_OFFSET;
      _v.set(r.x + sh * 5, ry + 2.8, r.z + ch * 5);
      camera.position.lerp(_v, 0.05);
      _v.set(r.x - sh * 4, ry + 0.8, r.z - ch * 4);
      camera.lookAt(_v);
    }

    wheelSpeedRef.current = r.speed;

    // ── terrain position + slope ──
    const y = getTerrainHeight(r.x, r.z, t) + GROUND_OFFSET;
    if (groupRef.current) {
      groupRef.current.position.set(r.x, y, r.z);
      const eps = 0.8;
      const yF = getTerrainHeight(r.x, r.z - eps, t);
      const yB = getTerrainHeight(r.x, r.z + eps, t);
      const yL = getTerrainHeight(r.x - eps, r.z, t);
      const yR = getTerrainHeight(r.x + eps, r.z, t);
      groupRef.current.rotation.set(
        Math.atan2(yF - yB, eps * 2) * 0.5,
        r.yaw,
        Math.atan2(yR - yL, eps * 2) * 0.5
      );
    }

    // ── emissive ──
    ledMat.emissiveIntensity = isDark ? 1.5 + Math.sin(t * 2) * 0.5 : 0;
    rtgGlowMat.emissiveIntensity = isDark ? 0.8 + Math.sin(t * 0.8) * 0.2 : 0.1;

    // ── HUD ──
    if (hudRef.current) {
      const c = '#ffaa33';
      if (r.driving) {
        const spd = Math.abs(Math.round(r.speed * 10));
        const hdg = Math.round(((r.yaw * 180 / Math.PI) % 360 + 360) % 360);
        const dir = r.speed >= 0 ? 'FWD' : 'REV';
        hudRef.current.innerHTML = `<div style="color:${c}">
<div style="position:absolute;top:15%;left:5%;font-size:12px;line-height:2;text-shadow:0 0 8px ${c}44">
<div style="font-size:10px;letter-spacing:4px;opacity:.6;margin-bottom:4px"></div>
${dir} <b style="font-size:16px">${spd}</b>cm/s<br>
HDG <b style="font-size:16px">${String(hdg).padStart(3, '0')}</b>°
<div style="width:70px;height:4px;background:${c}22;border:1px solid ${c}33;margin-top:6px">
<div style="width:${Math.min(100, Math.abs(r.speed / MAX_SPEED) * 100)}%;height:100%;background:${c}"></div></div>
<div style="margin-top:2px;letter-spacing:1px;opacity:.5;font-size:10px">THR</div></div>
<div style="position:absolute;bottom:6%;left:50%;transform:translateX(-50%);font-size:10px;letter-spacing:2px;opacity:.45">
</div></div>`;
      } else if (canDrive) {
        hudRef.current.innerHTML = `<div style="position:absolute;bottom:21%;left:50%;transform:translateX(-50%);text-align:center;color:${c}">
<div style="font-size:10px;letter-spacing:3px;opacity:${(0.3 + 0.2 * Math.sin(t * 2)).toFixed(2)}">
</div></div>`;
      } else {
        hudRef.current.innerHTML = '';
      }
    }
  });

  return (
    <>
      {/* ── WHEEL TRACKS ── */}
      <RoverTracks tracksRef={tracksRef} isDark={isDark} />

      <group ref={groupRef} scale={SCALE}>

        {/* ── BODY ── */}
        <group position={[0, 0.40, 0]}>
          <mesh material={goldMat}><boxGeometry args={[0.90, 0.30, 0.70]} /></mesh>
          <mesh position={[0, 0.17, 0]} material={panelMat}><boxGeometry args={[0.88, 0.04, 0.68]} /></mesh>
          <mesh position={[0, -0.02, 0.37]} rotation={[0.25, 0, 0]} material={whiteMat}><boxGeometry args={[0.86, 0.26, 0.03]} /></mesh>
          <mesh position={[0, -0.02, -0.37]} rotation={[-0.25, 0, 0]} material={whiteMat}><boxGeometry args={[0.86, 0.26, 0.03]} /></mesh>
          <mesh position={[-0.46, 0, 0]} material={whiteMat}><boxGeometry args={[0.02, 0.28, 0.66]} /></mesh>
          <mesh position={[0.46, 0, 0]} material={whiteMat}><boxGeometry args={[0.02, 0.28, 0.66]} /></mesh>
          <mesh position={[0, -0.18, 0]} material={darkMat}><boxGeometry args={[0.70, 0.06, 0.50]} /></mesh>
          <mesh position={[0, 0.12, 0.35]} material={goldMat}><boxGeometry args={[0.60, 0.04, 0.02]} /></mesh>
          <mesh position={[0, 0.12, -0.35]} material={goldMat}><boxGeometry args={[0.60, 0.04, 0.02]} /></mesh>
        </group>

        {/* ── SUSPENSION ── */}
        <Strut from={RPL} to={WFL} radius={0.018} material={armMat} />
        <Strut from={RPL} to={BPL} radius={0.018} material={armMat} />
        <Strut from={BPL} to={WML} radius={0.015} material={armMat} />
        <Strut from={BPL} to={WRL} radius={0.015} material={armMat} />
        <Strut from={RPR} to={WFR} radius={0.018} material={armMat} />
        <Strut from={RPR} to={BPR} radius={0.018} material={armMat} />
        <Strut from={BPR} to={WMR} radius={0.015} material={armMat} />
        <Strut from={BPR} to={WRR} radius={0.015} material={armMat} />
        <Strut from={RPL} to={RPR} radius={0.012} material={armMat} />

        {/* ── WHEELS ── */}
        <RoverWheel pos={WFL} drumMat={darkMat} hubMat={hubMat} speedRef={wheelSpeedRef} />
        <RoverWheel pos={WFR} drumMat={darkMat} hubMat={hubMat} speedRef={wheelSpeedRef} />
        <RoverWheel pos={WML} drumMat={darkMat} hubMat={hubMat} speedRef={wheelSpeedRef} />
        <RoverWheel pos={WMR} drumMat={darkMat} hubMat={hubMat} speedRef={wheelSpeedRef} />
        <RoverWheel pos={WRL} drumMat={darkMat} hubMat={hubMat} speedRef={wheelSpeedRef} />
        <RoverWheel pos={WRR} drumMat={darkMat} hubMat={hubMat} speedRef={wheelSpeedRef} />

        {/* ── MAST ── */}
        <group position={[0.15, 0.58, 0.25]}>
          <mesh position={[0, 0.40, 0]} material={armMat}><cylinderGeometry args={[0.025, 0.03, 0.80, 8]} /></mesh>
          <mesh position={[0, 0.84, 0]} material={whiteMat}><boxGeometry args={[0.22, 0.12, 0.14]} /></mesh>
          <mesh position={[0, 0.92, 0]} material={darkMat}><boxGeometry args={[0.18, 0.04, 0.12]} /></mesh>
          <mesh position={[-0.055, 0.84, 0.075]} rotation={[Math.PI / 2, 0, 0]} material={lensMat}><cylinderGeometry args={[0.028, 0.028, 0.04, 10]} /></mesh>
          <mesh position={[0.055, 0.84, 0.075]} rotation={[Math.PI / 2, 0, 0]} material={lensMat}><cylinderGeometry args={[0.022, 0.022, 0.04, 10]} /></mesh>
          <mesh position={[0, 0.94, 0.06]} rotation={[Math.PI / 2, 0, 0]} material={lensMat}><cylinderGeometry args={[0.015, 0.015, 0.03, 8]} /></mesh>
          <mesh position={[0, 0.76, 0]} material={hubMat}><sphereGeometry args={[0.04, 8, 8]} /></mesh>
        </group>

        {/* ── HIGH-GAIN ANTENNA ── */}
        <group position={[-0.22, 0.72, -0.18]}>
          <mesh rotation={[0.2, 0, 0.15]} material={whiteMat}><sphereGeometry args={[0.20, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.28]} /></mesh>
          <mesh position={[0, 0.06, 0.02]} material={armMat}><cylinderGeometry args={[0.012, 0.008, 0.12, 6]} /></mesh>
          <Strut from={[0, -0.04, 0]} to={[0.12, -0.18, 0.10]} radius={0.01} material={armMat} />
        </group>

        {/* ── RTG ── */}
        <group position={[0, 0.45, -0.85]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={rtgMat}><cylinderGeometry args={[0.065, 0.075, 0.50, 10]} /></mesh>
          <mesh position={[0, 0, -0.26]} rotation={[Math.PI / 2, 0, 0]} material={rtgGlowMat}><cylinderGeometry args={[0.075, 0.06, 0.04, 10]} /></mesh>
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
              <mesh key={`fin${i}`} position={[Math.sin(angle) * 0.13, Math.cos(angle) * 0.13, 0]} rotation={[0, 0, -angle]} material={rtgMat}>
                <boxGeometry args={[0.01, 0.10, 0.45]} />
              </mesh>
            );
          })}
          <Strut from={[0, 0.08, 0.25]} to={[0, 0.12, 0.48]} radius={0.015} material={armMat} />
          <Strut from={[0.06, 0, 0.25]} to={[0.10, 0.08, 0.48]} radius={0.012} material={armMat} />
          <Strut from={[-0.06, 0, 0.25]} to={[-0.10, 0.08, 0.48]} radius={0.012} material={armMat} />
        </group>

        {/* ── ROBOTIC ARM ── */}
        <group position={[-0.38, 0.30, 0.30]}>
          <mesh material={hubMat}><sphereGeometry args={[0.035, 8, 8]} /></mesh>
          <Strut from={[0, 0, 0]} to={[-0.15, -0.12, 0.30]} radius={0.018} material={armMat} />
          <mesh position={[-0.15, -0.12, 0.30]} material={hubMat}><sphereGeometry args={[0.028, 8, 8]} /></mesh>
          <Strut from={[-0.15, -0.12, 0.30]} to={[-0.08, -0.22, 0.52]} radius={0.015} material={armMat} />
          <mesh position={[-0.08, -0.22, 0.52]} material={darkMat}><boxGeometry args={[0.06, 0.06, 0.06]} /></mesh>
          <mesh position={[-0.08, -0.25, 0.52]} material={hubMat}><cylinderGeometry args={[0.008, 0.002, 0.06, 6]} /></mesh>
        </group>

        {/* ── HAZCAMS ── */}
        <mesh position={[-0.18, 0.34, 0.38]} rotation={[0.4, 0, 0]} material={lensMat}><cylinderGeometry args={[0.018, 0.018, 0.025, 8]} /></mesh>
        <mesh position={[0.18, 0.34, 0.38]} rotation={[0.4, 0, 0]} material={lensMat}><cylinderGeometry args={[0.018, 0.018, 0.025, 8]} /></mesh>
        <mesh position={[-0.18, 0.34, -0.38]} rotation={[-0.4, 0, 0]} material={lensMat}><cylinderGeometry args={[0.015, 0.015, 0.02, 8]} /></mesh>
        <mesh position={[0.18, 0.34, -0.38]} rotation={[-0.4, 0, 0]} material={lensMat}><cylinderGeometry args={[0.015, 0.015, 0.02, 8]} /></mesh>

        {/* ── UHF ANTENNA ── */}
        <mesh position={[0.30, 0.72, -0.10]} material={hubMat}><cylinderGeometry args={[0.005, 0.005, 0.30, 4]} /></mesh>
        <mesh position={[0.30, 0.88, -0.10]} material={hubMat}><sphereGeometry args={[0.012, 6, 6]} /></mesh>

        {/* ── SAMPLE TUBES ── */}
        {Array.from({ length: 4 }, (_, i) => (
          <mesh key={`tube${i}`} position={[0.47, 0.32, 0.15 - i * 0.08]} rotation={[0, 0, Math.PI / 2]} material={whiteMat}>
            <cylinderGeometry args={[0.012, 0.012, 0.04, 6]} />
          </mesh>
        ))}

        {/* ── STATUS LEDs ── */}
        <mesh position={[0, 0.56, 0.35]} material={ledMat}><sphereGeometry args={[0.012, 6, 6]} /></mesh>
        <mesh position={[-0.30, 0.56, 0.10]} material={ledMat}><sphereGeometry args={[0.008, 6, 6]} /></mesh>
        <mesh position={[0.30, 0.56, 0.10]} material={ledMat}><sphereGeometry args={[0.008, 6, 6]} /></mesh>

        {/* ── RTG GLOW (night) ── */}
        {isDark && <pointLight position={[0, 0.45, -1.05]} intensity={0.4} color="#ff6633" distance={4} decay={2} />}
      </group>
    </>
  );
};