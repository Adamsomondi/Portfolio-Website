import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════
// TERRAIN
// ═══════════════════════════════════════════════════════
function mod289(x:number){return x-Math.floor(x/289)*289}
function permute(x:number){return mod289(((x*34)+1)*x)}
function fr(x:number){return x-Math.floor(x)}
function sn(vx:number,vy:number):number{
  const C0=.211324865405187,C1=.366025403784439,C2=-.577350269189626,C3=.024390243902439;
  const s=(vx+vy)*C1;let ix=Math.floor(vx+s),iy=Math.floor(vy+s);const t=(ix+iy)*C0;
  const x0x=vx-ix+t,x0y=vy-iy+t,i1x=x0x>x0y?1:0,i1y=x0x>x0y?0:1;
  const x1x=x0x+C0-i1x,x1y=x0y+C0-i1y,x2x=x0x+C2,x2y=x0y+C2;
  ix=mod289(ix);iy=mod289(iy);
  const p0=permute(permute(iy)+ix),p1=permute(permute(iy+i1y)+ix+i1x),p2=permute(permute(iy+1)+ix+1);
  let m0=Math.max(.5-(x0x*x0x+x0y*x0y),0),m1=Math.max(.5-(x1x*x1x+x1y*x1y),0),m2=Math.max(.5-(x2x*x2x+x2y*x2y),0);
  m0*=m0;m0*=m0;m1*=m1;m1*=m1;m2*=m2;m2*=m2;
  const xx0=2*fr(p0*C3)-1,xx1=2*fr(p1*C3)-1,xx2=2*fr(p2*C3)-1;
  const hh0=Math.abs(xx0)-.5,hh1=Math.abs(xx1)-.5,hh2=Math.abs(xx2)-.5;
  const a0=xx0-Math.floor(xx0+.5),a1=xx1-Math.floor(xx1+.5),a2=xx2-Math.floor(xx2+.5);
  m0*=1.79284291400159-.85373472095314*(a0*a0+hh0*hh0);
  m1*=1.79284291400159-.85373472095314*(a1*a1+hh1*hh1);
  m2*=1.79284291400159-.85373472095314*(a2*a2+hh2*hh2);
  return 130*(m0*(a0*x0x+hh0*x0y)+m1*(a1*x1x+hh1*x1y)+m2*(a2*x2x+hh2*x2y));
}
function fbm(px:number,py:number){let v=0,a=.5,f=1;for(let i=0;i<5;i++){v+=a*sn(px*f,py*f);a*=.5;f*=2}return v}
function ss(e0:number,e1:number,x:number){const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t)}
function gth(wx:number,wz:number,t:number){
  const px=wx,py=-wz;let h=0;
  h+=fbm(px*.012+t*.004,py*.012+t*.004)*2.6;
  h+=fbm(px*.03+5.3+t*.002,py*.03+2.7+t*.002)*.85;
  const wl=Math.sqrt(1.1225),wX=1/wl,wY=.35/wl;
  h+=Math.sin((px*wX+py*wY)*.4+fbm(px*.05,py*.05)*1.8+t*.02)*.22*ss(.25,.75,fbm(px*.015+8,py*.015+8));
  h+=fbm(px*.08+1.5,py*.08+9.2)*.10;
  return Math.max(h,-.3)-2.2;
}

// ═══════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════
type Missile = {
  id: number;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  age: number;
  active: boolean;
  impactTime: number;
};

type FS = 'IDLE'|'TAKEOFF'|'FLY'|'LAND';
const PX = -25, PZ = -10;
const LR = THREE.MathUtils.lerp;
const CL = THREE.MathUtils.clamp;
const MAX_AMMO = 16;
const MISSILE_COOLDOWN = 0.5;
const EXPLOSION_DURATION = 1.5;

const tmpObj = new THREE.Object3D();
const _up  = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();

// ═══════════════════════════════════════════════════════
// MISSILE VISUAL
// ═══════════════════════════════════════════════════════
interface MissileVisualProps {
  missilesRef: React.MutableRefObject<Missile[]>;
  isDark: boolean;
}

const MissileVisual = ({ missilesRef, isDark }: MissileVisualProps) => {
  const missileMeshRef = useRef<THREE.InstancedMesh>(null);
  const impactMeshRef  = useRef<THREE.InstancedMesh>(null);
  const ringMeshRef    = useRef<THREE.InstancedMesh>(null);
  const flashRef       = useRef<THREE.PointLight>(null);
  const flatQ = useMemo(
    () => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2), []
  );

  const MAX_INST = 32;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const missiles = missilesRef.current;
    if (!missileMeshRef.current || !impactMeshRef.current) return;

    let mi = 0, ii = 0, ri = 0;
    let flashI = 0, fx = 0, fy = 0, fz = 0;

    for (const m of missiles) {
      if (m.active && mi < MAX_INST) {
        tmpObj.position.set(m.x, m.y, m.z);
        const spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy + m.vz * m.vz);
        if (spd > 0.01) {
          _dir.set(m.vx / spd, m.vy / spd, m.vz / spd);
          tmpObj.quaternion.setFromUnitVectors(_up, _dir);
        }
        tmpObj.scale.setScalar(1);
        tmpObj.updateMatrix();
        missileMeshRef.current.setMatrixAt(mi++, tmpObj.matrix);
      }

      if (!m.active && m.impactTime > 0) {
        const ea = t - m.impactTime;
        if (ea < EXPLOSION_DURATION) {
          const p = ea / EXPLOSION_DURATION;

          if (ii < MAX_INST) {
            const s = 0.5 + p * 5.0;
            tmpObj.position.set(m.x, m.y + p * 2.5, m.z);
            tmpObj.scale.set(s, s * Math.max(0.08, 0.6 - p * 0.5), s);
            tmpObj.quaternion.identity();
            tmpObj.updateMatrix();
            impactMeshRef.current.setMatrixAt(ii++, tmpObj.matrix);
          }

          if (ringMeshRef.current && ri < MAX_INST) {
            const rs = 0.3 + p * 7.0;
            tmpObj.position.set(m.x, m.y + 0.1, m.z);
            tmpObj.quaternion.copy(flatQ);
            tmpObj.scale.set(rs, rs, Math.max(0.05, (1 - p) * 0.8));
            tmpObj.updateMatrix();
            ringMeshRef.current.setMatrixAt(ri++, tmpObj.matrix);
          }

          if (ea < 0.25) {
            const fi = (1 - ea / 0.25) * 12;
            if (fi > flashI) { flashI = fi; fx = m.x; fy = m.y + 1.5; fz = m.z; }
          }
        }
      }
    }

    missileMeshRef.current.count = mi;
    missileMeshRef.current.instanceMatrix.needsUpdate = true;
    impactMeshRef.current.count = ii;
    impactMeshRef.current.instanceMatrix.needsUpdate = true;
    if (ringMeshRef.current) {
      ringMeshRef.current.count = ri;
      ringMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (flashRef.current) {
      flashRef.current.intensity = flashI;
      if (flashI > 0) flashRef.current.position.set(fx, fy, fz);
    }
  });

  return (
    <>
      <instancedMesh ref={missileMeshRef} args={[undefined, undefined, MAX_INST]}>
        <cylinderGeometry args={[0.04, 0.07, 0.65, 6]} />
        <meshStandardMaterial
          color="#ffcc66" emissive="#ff6600" emissiveIntensity={1.5}
          metalness={0.3} roughness={0.4}
        />
      </instancedMesh>

      <instancedMesh ref={impactMeshRef} args={[undefined, undefined, MAX_INST]}>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial
          color={isDark ? '#e8b870' : '#f5c776'}
          emissive={isDark ? '#ff8844' : '#ffaa55'}
          emissiveIntensity={0.9} roughness={1.0}
          transparent opacity={0.55} depthWrite={false}
        />
      </instancedMesh>

      <instancedMesh ref={ringMeshRef} args={[undefined, undefined, MAX_INST]}>
        <torusGeometry args={[1, 0.06, 6, 24]} />
        <meshStandardMaterial
          color={isDark ? '#ffaa66' : '#ffcc88'}
          emissive="#ff6600" emissiveIntensity={0.6}
          transparent opacity={0.4} depthWrite={false}
        />
      </instancedMesh>

      <pointLight ref={flashRef} color="#ff8833" intensity={0} distance={35} decay={2} />
    </>
  );
};

// ═══════════════════════════════════════════════════════
// ANDURIL DRONE
// ═══════════════════════════════════════════════════════
interface Props {
  isDark: boolean;
  onFlyingChange: (v: boolean) => void;
  dronePosRef: { current: THREE.Vector3 };
}

export const AndurilDrone = ({ isDark, onFlyingChange, dronePosRef }: Props) => {
  const padRef   = useRef<THREE.Group>(null);
  const droneRef = useRef<THREE.Group>(null);
  const hudRef   = useRef<HTMLDivElement | null>(null);
  const prevT    = useRef(0);
  const mouse    = useRef({ x: 0, y: 0 });
  const { camera, gl } = useThree();
  const _v = useMemo(() => new THREE.Vector3(), []);

  const s = useRef({ st: 'IDLE' as FS, x: PX, y: 0, z: PZ, hd: 0, pt: 0, rl: 0, spd: 0, padY: 0 });

  const missilesRef     = useRef<Missile[]>([]);
  const nextMissileId   = useRef(1);
  const keyState        = useRef<{ [code: string]: boolean }>({});
  const lastMissileTime = useRef(0);
  const ammoRef         = useRef(MAX_AMMO);
  const missileFlashT   = useRef(0);

  const bodyM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a22', metalness: .4, roughness: .6 }), []);
  const wingM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#222230', metalness: .35, roughness: .55 }), []);
  const canM  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#080818', metalness: .9, roughness: .1 }), []);
  const engM  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ff4400', emissive: new THREE.Color('#ff6600'), emissiveIntensity: 0 }), []);
  const nrM   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ff0000', emissive: new THREE.Color('#ff0000'), emissiveIntensity: .3 }), []);
  const ngM   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#00ff00', emissive: new THREE.Color('#00ff44'), emissiveIntensity: .3 }), []);
  const padM  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a4a4a', metalness: .15, roughness: .75 }), []);
  const mkM   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cccc44', metalness: .1, roughness: .5 }), []);
  const plM   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#00aaff', emissive: new THREE.Color('#0088ff'), emissiveIntensity: .5 }), []);
  const antM  = useMemo(() => new THREE.MeshStandardMaterial({ color: '#888', metalness: .5, roughness: .3 }), []);

  useEffect(() => {
    const h = document.createElement('div');
    h.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999;font-family:"Courier New",monospace;';
    document.body.appendChild(h); hudRef.current = h;
    return () => { h.remove(); hudRef.current = null };
  }, []);

  useEffect(() => {
    const onM = (e: MouseEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.current.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      keyState.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        const d = s.current;
        if (d.st === 'IDLE') { d.st = 'TAKEOFF'; onFlyingChange(true); }
        else if (d.st === 'FLY') { d.st = 'LAND'; }
      }
      if (e.code === 'AltLeft' || e.code === 'AltRight') e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => { keyState.current[e.code] = false; };
    gl.domElement.addEventListener('mousemove', onM);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      gl.domElement.removeEventListener('mousemove', onM);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gl, onFlyingChange]);

  useFrame((state) => {
    const t  = state.clock.elapsedTime;
    const dt = Math.min(t - prevT.current, .05); prevT.current = t;
    const d  = s.current; d.padY = gth(PX, PZ, t);

    if (padRef.current) padRef.current.position.set(PX, d.padY, PZ);

    if (d.st === 'IDLE') {
      d.x = PX; d.z = PZ; d.y = d.padY + .35; d.hd = 0; d.pt = 0; d.rl = 0; d.spd = 0;
      ammoRef.current = MAX_AMMO;
    }

    if (d.st === 'TAKEOFF') {
      d.y += 5 * dt;
      d.spd = LR(d.spd, 10, .02);
      d.x -= Math.sin(d.hd) * d.spd * dt;
      d.z -= Math.cos(d.hd) * d.spd * dt;
      if (d.y > d.padY + 14) { d.st = 'FLY'; d.spd = 20; }
    }

    if (d.st === 'FLY') {
      const mx = Math.abs(mouse.current.x) < .02 ? 0 : mouse.current.x;
      const my = Math.abs(mouse.current.y) < .02 ? 0 : mouse.current.y;

      d.hd += -mx * 2.2 * dt;
      d.pt  = LR(d.pt, CL(my * .7, -1.0, 1.0), .045);
      d.rl  = LR(d.rl, mx * 2.5, .06);

      d.spd = LR(d.spd, 28, .008);
      const cp = Math.cos(d.pt);
      d.x -= Math.sin(d.hd) * cp * d.spd * dt;
      d.y += Math.sin(d.pt) * d.spd * dt;
      d.z -= Math.cos(d.hd) * cp * d.spd * dt;

      const ty = gth(d.x, d.z, t);
      if (d.y < ty + 2.5) { d.y = ty + 2.5; if (d.pt < 0) d.pt *= .9; }
      if (d.y > 80) d.y = 80;
    }

    if (d.st === 'FLY') {
      const altDown = keyState.current['AltLeft'] || keyState.current['AltRight'];
      if (altDown && ammoRef.current > 0 && t - lastMissileTime.current > MISSILE_COOLDOWN) {
        lastMissileTime.current = t;
        missileFlashT.current = t;
        ammoRef.current--;

        const sh = Math.sin(d.hd), ch = Math.cos(d.hd);
        const cp = Math.cos(d.pt), sp = Math.sin(d.pt);
        const fwd = new THREE.Vector3(-sh * cp, sp, -ch * cp).normalize();
        const mSpd = d.spd * 1.2 + 18;

        missilesRef.current.push({
          id: nextMissileId.current++,
          x: d.x, y: d.y - 0.4, z: d.z,
          vx: fwd.x * mSpd, vy: fwd.y * mSpd - 2, vz: fwd.z * mSpd,
          age: 0, active: true, impactTime: -1,
        });
      }
    }

    const missiles = missilesRef.current;
    for (const m of missiles) {
      m.age += dt;
      if (m.active) {
        m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;
        m.vy -= 4.0 * dt;
        const ty = gth(m.x, m.z, t);
        if (m.y <= ty + 0.3) { m.y = ty + 0.3; m.active = false; m.impactTime = t; }
        if (m.age > 8) { m.active = false; m.impactTime = -1; }
      }
    }
    missilesRef.current = missiles.filter(m =>
      m.active || (m.impactTime > 0 && t - m.impactTime < EXPLOSION_DURATION + 0.5)
    );

    if (d.st === 'LAND') {
      d.x = LR(d.x, PX, .018); d.y = LR(d.y, d.padY + .35, .018); d.z = LR(d.z, PZ, .018);
      d.hd = LR(d.hd, 0, .025); d.pt = LR(d.pt, 0, .04); d.rl = LR(d.rl, 0, .04);
      d.spd = LR(d.spd, 0, .02);
      if (Math.sqrt((d.x - PX) ** 2 + (d.y - d.padY - .35) ** 2 + (d.z - PZ) ** 2) < .4) {
        d.st = 'IDLE'; d.x = PX; d.y = d.padY + .35; d.z = PZ; d.hd = 0; d.pt = 0; d.rl = 0; d.spd = 0;
        camera.position.set(0, 3, 22); camera.lookAt(0, 1.5, -8);
        (camera as THREE.PerspectiveCamera).fov = 60;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        onFlyingChange(false);
      }
    }

    if (droneRef.current) {
      droneRef.current.position.set(d.x, d.y, d.z);
      droneRef.current.rotation.order = 'YXZ';
      droneRef.current.rotation.set(d.pt, d.hd, d.rl);
      dronePosRef.current.set(d.x, d.y, d.z);
    }

    if (d.st !== 'IDLE') {
      const sh = Math.sin(d.hd), ch = Math.cos(d.hd);
      const cd = d.st === 'TAKEOFF' ? 5 : 8, chh = d.st === 'TAKEOFF' ? 3 : 2.5;
      _v.set(d.x + sh * cd, d.y + chh, d.z + ch * cd);
      camera.position.lerp(_v, d.st === 'LAND' ? .04 : .06);
      const cp = Math.cos(d.pt);
      _v.set(d.x - sh * cp * 12, d.y + Math.sin(d.pt) * 3, d.z - ch * cp * 12);
      camera.lookAt(_v);
      const pc = camera as THREE.PerspectiveCamera;
      pc.fov = LR(pc.fov, 60 + d.spd * .5, .05); pc.updateProjectionMatrix();
    }

    engM.emissiveIntensity = d.st === 'FLY' ? 2.5 + Math.sin(t * 10) * .4 : d.st === 'TAKEOFF' ? 1.2 : d.st === 'LAND' ? .6 : .02;
    const nl = d.st !== 'IDLE' || isDark ? 1 + Math.sin(t * 2) * .3 : .15;
    nrM.emissiveIntensity = nl; ngM.emissiveIntensity = nl;
    plM.emissiveIntensity = d.st === 'IDLE' ? .4 + Math.sin(t * 1.5) * .2 : 1.2 + Math.sin(t * 4) * .4;

    // ── HUD — theme-aware colors ──
    if (hudRef.current) {
      const c       = isDark ? '#00ff44' : '#000000';
      const glow    = isDark ? `0 0 8px #00ff4444` : 'none';
      const barBg   = isDark ? '#00ff4422' : '#00000015';
      const barBord = isDark ? '#00ff4433' : '#00000030';
      const mslFire = isDark ? '#ff6644' : '#cc3300';
      const mslGlow = isDark ? '0 0 14px #ff440099' : 'none';

      const alt = Math.max(0, Math.round(d.y - d.padY));
      const spd = Math.round(d.spd * 10);
      const hdg = Math.round(((d.hd * 180 / Math.PI) % 360 + 360) % 360);
      const mslFlash = t - missileFlashT.current < 0.5;
      const ammo = ammoRef.current;
      const ammoC = ammo <= 3 ? '#ff4444' : ammo <= 6 ? '#ffaa00' : c;
      const ammoGlow = ammo <= 3
        ? (isDark ? '0 0 8px #ff444444' : 'none')
        : ammo <= 6
          ? (isDark ? '0 0 8px #ffaa0044' : 'none')
          : glow;

      if (d.st === 'IDLE') {
        hudRef.current.innerHTML = `<div style="position:absolute;bottom:14%;left:50%;transform:translateX(-50%);text-align:center;color:${c}">
<div style="font-size:10px;letter-spacing:5px;opacity:.5;margin-bottom:6px;text-shadow:${glow}"></div>
<div style="font-size:14px;letter-spacing:3px;opacity:${(.55 + .45 * Math.sin(t * 3)).toFixed(2)};text-shadow:${glow}">PRESS SPACE TO LAUNCH DRONE</div></div>`;
      } else {
        hudRef.current.innerHTML = `<div style="color:${c}">

<div style="position:absolute;top:7%;right:5%;text-align:right;font-size:12px;line-height:2;text-shadow:${glow}">
ALT <b style="font-size:16px">${alt}</b>m<br>
SPD <b style="font-size:16px">${spd}</b>kts<br>
HDG <b style="font-size:16px">${String(hdg).padStart(3, '0')}</b>°</div>

<div style="position:absolute;top:7%;left:5%;font-size:12px;text-shadow:${ammoGlow}">
<div style="color:${ammoC}">MSL <b style="font-size:16px">${ammo}</b><span style="opacity:.5">/${MAX_AMMO}</span></div>
<div style="width:70px;height:4px;background:${barBg};border:1px solid ${barBord};margin-top:4px">
<div style="width:${(ammo / MAX_AMMO) * 100}%;height:100%;background:${ammoC};transition:width .2s"></div></div>
<div style="margin-top:3px;letter-spacing:1px;opacity:.55;font-size:10px;color:${c}">${ammo > 0 ? 'ALT TO FIRE' : 'NO AMMO'}</div>
</div>

<svg style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)" width="60" height="60" viewBox="0 0 60 60">
<line x1="30" y1="10" x2="30" y2="22" stroke="${c}" stroke-width="1" opacity=".5"/>
<line x1="30" y1="38" x2="30" y2="50" stroke="${c}" stroke-width="1" opacity=".5"/>
<line x1="10" y1="30" x2="22" y2="30" stroke="${c}" stroke-width="1" opacity=".5"/>
<line x1="38" y1="30" x2="50" y2="30" stroke="${c}" stroke-width="1" opacity=".5"/>
<circle cx="30" cy="30" r="5" fill="none" stroke="${c}" stroke-width="1" opacity=".6"/>
${ammo > 0 ? `<circle cx="30" cy="30" r="14" fill="none" stroke="${c}" stroke-width=".5" opacity=".3" stroke-dasharray="3 3"/>` : ''}
</svg>

${mslFlash ? `<div style="position:absolute;top:56%;left:50%;transform:translateX(-50%);font-size:11px;letter-spacing:3px;color:${mslFire};text-shadow:${mslGlow}">▼ MISSILE AWAY ▼</div>` : ''}

<div style="position:absolute;bottom:6%;left:50%;transform:translateX(-50%);font-size:14px;letter-spacing:2px;opacity:${d.st === 'LAND' ? (.5 + .5 * Math.sin(t * 4)).toFixed(2) : '.45'};text-shadow:${glow}">
${d.st === 'FLY' ? 'SPACE TO RETURN TO LANDING' : ' RETURNING '}</div>

<div style="position:absolute;bottom:7%;left:5%;font-size:10px">
<div style="width:70px;height:4px;background:${barBg};border:1px solid ${barBord}">
<div style="width:${Math.min(100, d.spd * 3.6)}%;height:100%;background:${c}"></div></div>
<div style="margin-top:2px;letter-spacing:1px;opacity:.6;text-shadow:${glow}">THR</div></div>

</div>`;
      }
    }
  });

  return (
    <>
      {/* ══════════════════════════════════════
          LANDING PAD
      ══════════════════════════════════════ */}
      <group ref={padRef}>
        <mesh position={[0, .04, 0]} material={padM}>
          <cylinderGeometry args={[3.5, 3.5, .08, 8]} />
        </mesh>
        <mesh position={[0, .09, 0]} rotation={[Math.PI / 2, 0, 0]} material={antM}>
          <torusGeometry args={[3.5, .04, 4, 8]} />
        </mesh>
        <mesh position={[-.5, .09, 0]} material={mkM}><boxGeometry args={[.12, .02, 1.8]} /></mesh>
        <mesh position={[.5, .09, 0]} material={mkM}><boxGeometry args={[.12, .02, 1.8]} /></mesh>
        <mesh position={[0, .09, 0]} material={mkM}><boxGeometry args={[1.12, .02, .12]} /></mesh>
        <mesh position={[0, .09, 0]} rotation={[Math.PI / 2, 0, 0]} material={mkM}>
          <torusGeometry args={[.8, .03, 4, 16]} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = i * Math.PI * 2 / 8;
          return <mesh key={i} position={[Math.cos(a) * 3.2, .14, Math.sin(a) * 3.2]} material={plM}>
            <sphereGeometry args={[.06, 6, 6]} /></mesh>;
        })}
        <mesh position={[0, .09, 3.6]} material={mkM}><boxGeometry args={[1.4, .02, .06]} /></mesh>
        <mesh position={[0, .09, 3.8]} material={mkM}><boxGeometry args={[1.0, .02, .06]} /></mesh>
      </group>

      {/* ══════════════════════════════════════
          ANDURIL FURY-X DRONE
      ══════════════════════════════════════ */}
      <group ref={droneRef} scale={1.5}>
        <mesh position={[0, 0, -.85]} material={bodyM}><boxGeometry args={[.18, .10, .40]} /></mesh>
        <mesh position={[0, 0, -.35]} material={bodyM}><boxGeometry args={[.45, .20, .75]} /></mesh>
        <mesh position={[0, 0, .35]} material={bodyM}><boxGeometry args={[.32, .16, .65]} /></mesh>
        <mesh position={[0, 0, .8]} material={bodyM}><boxGeometry args={[.22, .12, .35]} /></mesh>
        <mesh position={[0, .12, -.55]} material={canM}><boxGeometry args={[.20, .05, .35]} /></mesh>
        <mesh position={[-.82, -.01, .08]} rotation={[0, .15, -.02]} material={wingM}><boxGeometry args={[1.20, .025, .70]} /></mesh>
        <mesh position={[.82, -.01, .08]} rotation={[0, -.15, .02]} material={wingM}><boxGeometry args={[1.20, .025, .70]} /></mesh>
        <mesh position={[-.18, .12, .85]} rotation={[0, 0, -.6]} material={wingM}><boxGeometry args={[.30, .02, .28]} /></mesh>
        <mesh position={[.18, .12, .85]} rotation={[0, 0, .6]} material={wingM}><boxGeometry args={[.30, .02, .28]} /></mesh>
        <mesh position={[0, -.01, .95]} rotation={[Math.PI / 2, 0, 0]} material={bodyM}><cylinderGeometry args={[.06, .08, .12, 8]} /></mesh>
        <mesh position={[0, -.01, 1.02]} material={engM}><sphereGeometry args={[.05, 6, 6]} /></mesh>
        <mesh position={[0, -.10, -.20]} material={bodyM}><boxGeometry args={[.14, .06, .18]} /></mesh>
        <mesh position={[0, .16, -.10]} material={antM}><cylinderGeometry args={[.005, .005, .10, 3]} /></mesh>
        <mesh position={[-1.40, 0, .25]} material={nrM}><sphereGeometry args={[.025, 4, 4]} /></mesh>
        <mesh position={[1.40, 0, .25]} material={ngM}><sphereGeometry args={[.025, 4, 4]} /></mesh>
        <mesh position={[0, 0, 1.0]} material={nrM}><sphereGeometry args={[.018, 4, 4]} /></mesh>
        <mesh position={[-.10, -.105, 0]} material={antM}><boxGeometry args={[.005, .003, .60]} /></mesh>
        <mesh position={[.10, -.105, 0]} material={antM}><boxGeometry args={[.005, .003, .60]} /></mesh>

        {ammoRef.current > 0 && <mesh position={[-.55, -.06, .05]} material={bodyM}><boxGeometry args={[.06, .04, .25]} /></mesh>}
        {ammoRef.current > 0 && <mesh position={[.55, -.06, .05]} material={bodyM}><boxGeometry args={[.06, .04, .25]} /></mesh>}
        {ammoRef.current > 8 && <mesh position={[-.35, -.06, .05]} material={bodyM}><boxGeometry args={[.06, .04, .22]} /></mesh>}
        {ammoRef.current > 8 && <mesh position={[.35, -.06, .05]} material={bodyM}><boxGeometry args={[.06, .04, .22]} /></mesh>}
      </group>

      {/* ══════════════════════════════════════
          MISSILES & SAND EXPLOSIONS
      ══════════════════════════════════════ */}
      <MissileVisual missilesRef={missilesRef} isDark={isDark} />
    </>
  );
};