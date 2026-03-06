import { useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════
// ELEVATION
// ═══════════════════════════════════════════════════════
const GROUND_Y = -2;

function worldCurve(wx: number, wz: number): number {
  const dist = Math.sqrt(wx * wx + wz * wz);
  // ★ Much gentler curve — terrain stays visible for miles
  return -dist * dist * 0.00006;
}

export function getElevation(x: number, z: number): number {
  return (
    Math.sin(x * 0.06) * Math.cos(z * 0.05) * 1.5 +
    Math.sin(x * 0.12 + 1.0) * Math.cos(z * 0.1 + 0.5) * 0.7 +
    Math.sin(x * 0.025) * 1.0 +
    Math.cos(z * 0.03) * 0.8 +
    // ★ Rolling hills at large scale
    Math.sin(x * 0.008) * Math.cos(z * 0.01) * 3.0 +
    Math.sin(x * 0.015 + 2.0) * Math.cos(z * 0.012) * 1.8
  );
}

export function getGroundY(wx: number, wz: number): number {
  return getElevation(wx, -wz) + worldCurve(wx, wz) + GROUND_Y;
}

// ═══════════════════════════════════════════════════════
// SEEDED RANDOM
// ═══════════════════════════════════════════════════════
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ═══════════════════════════════════════════════════════
// TAPER UTILITY
// ═══════════════════════════════════════════════════════
function taperTube(
  geo: THREE.TubeGeometry,
  curve: THREE.CatmullRomCurve3,
  tubSegs: number,
  radSegs: number,
  amount: number
) {
  const pos = geo.attributes.position;
  // ★ TubeGeometry has (radSegs + 1) verts per ring, not radSegs
  // The extra vertex duplicates the first to close the UV seam
  const ringSize = radSegs + 1;
  const rings = tubSegs + 1;

  for (let s = 0; s < rings; s++) {
    const t = s / (rings - 1);
    const scale = 1.0 - t * amount;
    const c = curve.getPoint(t);
    for (let r = 0; r < ringSize; r++) {
      const i = s * ringSize + r;
      if (i >= pos.count) break;
      pos.setX(i, c.x + (pos.getX(i) - c.x) * scale);
      pos.setY(i, c.y + (pos.getY(i) - c.y) * scale);
      pos.setZ(i, c.z + (pos.getZ(i) - c.z) * scale);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// ═══════════════════════════════════════════════════════
// GROUND SHADERS
// ═══════════════════════════════════════════════════════
const groundVert = `
uniform float uTime;
varying vec3 vWorldPos;
varying float vElev;
varying vec3 vNorm;

float getElev(float x, float z){
  return sin(x*0.06)*cos(z*0.05)*1.5
       + sin(x*0.12+1.0)*cos(z*0.1+0.5)*0.7
       + sin(x*0.025)*1.0
       + cos(z*0.03)*0.8
       + sin(x*0.008)*cos(z*0.01)*3.0
       + sin(x*0.015+2.0)*cos(z*0.012)*1.8;
}

void main(){
  vec3 pos = position;
  float e = getElev(pos.x, pos.y);
  float dist = length(pos.xy);
  float curve = -dist*dist*0.00006;
  float sway = sin(pos.x*0.4+uTime*0.7)*cos(pos.y*0.25+uTime*0.5)*0.12;
  pos.z = e + curve + sway;

  float eps = 0.5;
  float hL=getElev(pos.x-eps,pos.y), hR=getElev(pos.x+eps,pos.y);
  float hD=getElev(pos.x,pos.y-eps), hU=getElev(pos.x,pos.y+eps);
  vec3 n = normalize(vec3(hL-hR, hD-hU, 2.0*eps));

  vNorm = normalize(normalMatrix * n);
  vElev = e;
  vWorldPos = (modelMatrix * vec4(pos,1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
}`;

const groundFrag = `
varying vec3 vWorldPos;
varying float vElev;
varying vec3 vNorm;

void main(){
  vec3 deepClover = vec3(0.12,0.38,0.10);
  vec3 richGreen  = vec3(0.20,0.52,0.16);
  vec3 meadow     = vec3(0.35,0.62,0.22);
  vec3 warmGreen  = vec3(0.48,0.67,0.28);
  vec3 sunKiss    = vec3(0.55,0.63,0.30);
  vec3 clover     = vec3(0.14,0.40,0.12);

  float e = vElev;
  vec3 col = mix(deepClover, richGreen, smoothstep(-2.0,0.0,e));
  col = mix(col, meadow, smoothstep(0.0,2.0,e));
  col = mix(col, warmGreen, smoothstep(2.0,3.5,e));
  col = mix(col, sunKiss, smoothstep(3.5,5.0,e)*0.3);

  float stripe = sin(vWorldPos.x*1.5+vWorldPos.z*1.2)*0.5+0.5;
  col = mix(col, clover, stripe*0.08);

  vec3 ld = normalize(vec3(0.5,0.8,0.3));
  float diff = max(dot(vNorm,ld),0.0)*0.7+0.3;
  col *= diff;
  col += vec3(0.03,0.04,0.01);

  // ★ Atmospheric perspective — warm haze at distance
  float dist = length(vWorldPos - cameraPosition);
  vec3 nearFog = vec3(0.72, 0.78, 0.62);
  vec3 farHaze = vec3(0.80, 0.82, 0.74);
  vec3 fogCol = mix(nearFog, farHaze, smoothstep(100.0, 400.0, dist));
  float fogAmt = smoothstep(60.0, 500.0, dist);
  col = mix(col, fogCol, fogAmt);

  gl_FragColor = vec4(col, 1.0);
}`;

// ═══════════════════════════════════════════════════════
// CANOPY SHADERS
// ═══════════════════════════════════════════════════════
const canopyVert = `
uniform float uTime;
uniform float uSeed;
varying vec3 vWN;
varying float vFresnel;
varying float vDisp;

vec3 mr3(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mr2(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 pm(vec3 x){return mr3(((x*34.0)+1.0)*x);}

float sn(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1,0):vec2(0,1);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mr2(i);
  vec3 p=pm(pm(i.y+vec3(0,i1.y,1))+i.x+vec3(0,i1.x,1));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m;m=m*m;
  vec3 x3=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x3)-0.5;
  vec3 ox=floor(x3+0.5);
  vec3 a0=x3-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}

void main(){
  vec3 pos=position; vec3 norm=normal;
  float n = sn(pos.xy*1.8+uSeed)*0.4+sn(pos.yz*1.8+uSeed+50.0)*0.3+sn(pos.xz*2.5+uSeed+100.0)*0.3;
  pos += norm*n*0.5;
  float sw = sin(uTime*0.5+uSeed)*0.2+sin(uTime*0.9+uSeed*2.0)*0.1;
  pos.x += sw*(pos.y*0.2+0.5);
  vDisp = n;
  vec4 wp = modelMatrix*vec4(pos,1.0);
  vWN = normalize((modelMatrix*vec4(norm,0.0)).xyz);
  vec3 vd = normalize(cameraPosition-wp.xyz);
  vFresnel = 1.0-abs(dot(vd,vWN));
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;

const canopyFrag = `
varying vec3 vWN;
varying float vFresnel;
varying float vDisp;

void main(){
  vec3 pale  = vec3(0.98,0.85,0.88);
  vec3 sak   = vec3(0.95,0.72,0.78);
  vec3 deep  = vec3(0.90,0.55,0.65);
  vec3 blush = vec3(1.0,0.94,0.95);

  float d = vDisp*0.5+0.5;
  vec3 col = mix(sak,pale,smoothstep(0.3,0.7,d));
  col = mix(col,deep,smoothstep(0.6,0.9,d)*0.4);
  col = mix(col,blush,smoothstep(0.0,0.3,d)*0.3);

  float top = vWN.y*0.5+0.5;
  col *= 0.55+top*0.55;
  vec3 sun = normalize(vec3(0.5,0.7,0.3));
  col += vec3(1.0,0.95,0.85)*pow(max(dot(vWN,sun),0.0),3.0)*0.2;
  col += vec3(1.0,0.8,0.85)*pow(max(dot(-vWN,sun),0.0),2.0)*0.15;

  float alpha = smoothstep(0.0,0.45,1.0-vFresnel)*0.92;
  gl_FragColor = vec4(col,alpha);
}`;

// ═══════════════════════════════════════════════════════
// SAKURA TREE
// ═══════════════════════════════════════════════════════
interface TreeProps {
  position: [number, number, number];
  scale: number;
  lean: number;
  canopyMat: THREE.ShaderMaterial;
  trunkMat: THREE.MeshStandardMaterial;
}

const SakuraTree = memo(({ position, scale, lean, canopyMat, trunkMat }: TreeProps) => {
  const { trunkGeo, branchGeos, blobs } = useMemo(() => {
    const L = lean;
    const trunkPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(L * 0.15, 2.0, 0),
      new THREE.Vector3(L * 0.3, 4.0, 0.05),
      new THREE.Vector3(L * 0.5, 5.8, 0.08),
      new THREE.Vector3(L * 0.6, 7.0, 0.1),
    ];
    const trunkCurve = new THREE.CatmullRomCurve3(trunkPts);
    const tSegs = 16, rSegs = 8;
    const trunk = new THREE.TubeGeometry(trunkCurve, tSegs, 0.22, rSegs, false);
    taperTube(trunk, trunkCurve, tSegs, rSegs, 0.75);

    const blobData = [
      { pos: [L * 0.6, 7.0, 0.1] as [number, number, number], r: 2.5 },
      { pos: [L * 0.15 - 1.8, 6.3, 0.9] as [number, number, number], r: 1.8 },
      { pos: [L * 1.0 + 1.6, 6.6, -0.6] as [number, number, number], r: 1.9 },
      { pos: [L * 0.55, 8.8, 0.2] as [number, number, number], r: 1.5 },
      { pos: [L * 0.4, 5.5, 0.2] as [number, number, number], r: 1.6 },
      { pos: [L * 0.3, 7.5, -1.0] as [number, number, number], r: 1.4 },
    ];

    const branches: THREE.TubeGeometry[] = [];
    if (scale > 0.15) {
      const b1S = trunkCurve.getPoint(0.5);
      const b1E = new THREE.Vector3(blobData[1].pos[0] + 0.4, blobData[1].pos[1] - 0.3, blobData[1].pos[2] - 0.2);
      const b1M = new THREE.Vector3((b1S.x + b1E.x) * 0.5 - 0.3, (b1S.y + b1E.y) * 0.5 + 0.4, (b1S.z + b1E.z) * 0.5);
      const b1C = new THREE.CatmullRomCurve3([b1S, b1M, b1E]);
      const b1 = new THREE.TubeGeometry(b1C, 7, 0.1, 6, false);
      taperTube(b1, b1C, 7, 6, 0.72);
      branches.push(b1);

      const b2S = trunkCurve.getPoint(0.58);
      const b2E = new THREE.Vector3(blobData[2].pos[0] - 0.4, blobData[2].pos[1] - 0.3, blobData[2].pos[2] + 0.2);
      const b2M = new THREE.Vector3((b2S.x + b2E.x) * 0.5 + 0.3, (b2S.y + b2E.y) * 0.5 + 0.3, (b2S.z + b2E.z) * 0.5);
      const b2C = new THREE.CatmullRomCurve3([b2S, b2M, b2E]);
      const b2 = new THREE.TubeGeometry(b2C, 7, 0.1, 6, false);
      taperTube(b2, b2C, 7, 6, 0.72);
      branches.push(b2);

      const b3S = trunkCurve.getPoint(0.65);
      const b3E = new THREE.Vector3(blobData[5].pos[0], blobData[5].pos[1] - 0.2, blobData[5].pos[2] + 0.2);
      const b3C = new THREE.CatmullRomCurve3([
        b3S,
        new THREE.Vector3((b3S.x + b3E.x) * 0.5, (b3S.y + b3E.y) * 0.5 + 0.2, (b3S.z + b3E.z) * 0.5),
        b3E,
      ]);
      const b3 = new THREE.TubeGeometry(b3C, 5, 0.07, 5, false);
      taperTube(b3, b3C, 5, 5, 0.75);
      branches.push(b3);
    }

    return { trunkGeo: trunk, branchGeos: branches, blobs: blobData };
  }, [lean, scale]);

  return (
    <group position={position} scale={scale}>
      <mesh geometry={trunkGeo} material={trunkMat} />
      {branchGeos.map((bg, i) => (
        <mesh key={`b${i}`} geometry={bg} material={trunkMat} />
      ))}
      {blobs.map((b, i) => (
        <mesh key={`c${i}`} position={b.pos} material={canopyMat}>
          <icosahedronGeometry args={[b.r, 4]} />
        </mesh>
      ))}
    </group>
  );
});

// ═══════════════════════════════════════════════════════
// TREE PLACEMENT — acres and acres
// ═══════════════════════════════════════════════════════
interface TreeSeed { wx: number; wz: number; s: number; lean: number; }

function generateTrees(): TreeSeed[] {
  const rng = mulberry32(7);
  const trees: TreeSeed[] = [];

  // ── Foreground frame ──
  trees.push(
    { wx: -8, wz: 12, s: 2.0, lean: 0.3 },
    { wx: -12, wz: 16, s: 1.8, lean: 0.4 },
    { wx: -6, wz: 18, s: 1.6, lean: 0.2 },
    { wx: 10, wz: 11, s: 1.9, lean: -0.3 },
    { wx: 13, wz: 15, s: 1.7, lean: -0.35 },
    { wx: 7, wz: 19, s: 1.5, lean: -0.2 },
  );

  // ── Avenue lining ──
  for (let i = 0; i < 8; i++) {
    const z = -3 - i * 5 + (rng() - 0.5) * 2;
    const offset = 5 + rng() * 3;
    const s = 1.6 + rng() * 0.5;
    trees.push(
      { wx: -offset - rng() * 2, wz: z, s, lean: 0.2 + rng() * 0.3 },
      { wx: offset + rng() * 2, wz: z, s, lean: -0.2 - rng() * 0.3 },
    );
  }

  // ── Scattered middle (near) ──
  for (let i = 0; i < 10; i++) {
    const z = -10 - rng() * 25;
    const x = (rng() - 0.5) * 30 + (rng() > 0.5 ? 10 : -10);
    trees.push({ wx: x, wz: z, s: 1.0 + rng() * 0.6, lean: (rng() - 0.5) * 0.5 });
  }

  // ── Background layer 1: 35–60 ──
  for (let i = 0; i < 25; i++) {
    const z = -35 - rng() * 25;
    const spread = 50 + rng() * 25;
    trees.push({ wx: (rng() - 0.5) * spread, wz: z, s: 0.5 + rng() * 0.4, lean: (rng() - 0.5) * 0.4 });
  }

  // ── Background layer 2: 60–120 ──
  for (let i = 0; i < 35; i++) {
    const z = -60 - rng() * 60;
    const spread = 80 + rng() * 40;
    trees.push({ wx: (rng() - 0.5) * spread, wz: z, s: 0.3 + rng() * 0.3, lean: (rng() - 0.5) * 0.3 });
  }

  // ── Deep field: 120–220 ──
  for (let i = 0; i < 50; i++) {
    const z = -120 - rng() * 100;
    const spread = 120 + rng() * 60;
    trees.push({ wx: (rng() - 0.5) * spread, wz: z, s: 0.15 + rng() * 0.2, lean: (rng() - 0.5) * 0.3 });
  }

  // ── Distant groves: 220–350 (clusters) ──
  for (let g = 0; g < 12; g++) {
    const cx = (rng() - 0.5) * 200;
    const cz = -220 - rng() * 130;
    const count = 3 + Math.floor(rng() * 5);
    for (let j = 0; j < count; j++) {
      trees.push({
        wx: cx + (rng() - 0.5) * 15,
        wz: cz + (rng() - 0.5) * 15,
        s: 0.08 + rng() * 0.12,
        lean: (rng() - 0.5) * 0.3,
      });
    }
  }

  // ── Horizon haze trees: 350–450 ──
  for (let i = 0; i < 40; i++) {
    const angle = rng() * Math.PI * 0.8 + Math.PI * 0.6;
    const dist = 300 + rng() * 150;
    trees.push({
      wx: Math.sin(angle) * dist,
      wz: Math.cos(angle) * dist,
      s: 0.04 + rng() * 0.06,
      lean: (rng() - 0.5) * 0.2,
    });
  }

  // ── 360° fill (behind & sides) ──
  for (let i = 0; i < 15; i++) {
    const z = 20 + rng() * 40;
    trees.push({ wx: (rng() - 0.5) * 60, wz: z, s: 0.6 + rng() * 0.8, lean: (rng() - 0.5) * 0.5 });
  }
  for (let i = 0; i < 18; i++) {
    const side = rng() > 0.5 ? 1 : -1;
    const x = side * (20 + rng() * 50);
    const z = (rng() - 0.5) * 80;
    trees.push({ wx: x, wz: z, s: 0.3 + rng() * 0.6, lean: (rng() - 0.5) * 0.5 });
  }

  // ── Wide flanks: far left and right ──
  for (let i = 0; i < 25; i++) {
    const side = rng() > 0.5 ? 1 : -1;
    const x = side * (60 + rng() * 120);
    const z = -rng() * 200;
    trees.push({ wx: x, wz: z, s: 0.1 + rng() * 0.2, lean: (rng() - 0.5) * 0.4 });
  }

  // ── Behind camera fill ──
  for (let i = 0; i < 12; i++) {
    const z = 40 + rng() * 80;
    const x = (rng() - 0.5) * 120;
    trees.push({ wx: x, wz: z, s: 0.15 + rng() * 0.3, lean: (rng() - 0.5) * 0.4 });
  }

  return trees;
}

// ═══════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════
export const SoftLandscape = () => {
  const timeUniform = useMemo(() => ({ value: 0 }), []);

  const groundMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: groundVert,
    fragmentShader: groundFrag,
  }), []);

  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#5c3a1e', roughness: 0.92, metalness: 0,
  }), []);

  const canopyMats = useMemo(() =>
    Array.from({ length: 10 }, (_, i) =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: timeUniform, uSeed: { value: i * 31.3 + 5.7 } },
        vertexShader: canopyVert,
        fragmentShader: canopyFrag,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      })
    ), [timeUniform]);

  const trees = useMemo(() => {
    const data = generateTrees();
    return data.map((t, i) => ({
      position: [t.wx, getGroundY(t.wx, t.wz), t.wz] as [number, number, number],
      scale: t.s,
      lean: t.lean,
      matIdx: i % 10,
    }));
  }, []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    timeUniform.value = t;
    groundMat.uniforms.uTime.value = t;
  });

  return (
    <group>
      {/* ★ Ground: 700×700 — vast rolling meadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]} material={groundMat}>
        <planeGeometry args={[700, 700, 400, 400]} />
      </mesh>
      {trees.map((t, i) => (
        <SakuraTree
          key={i}
          position={t.position}
          scale={t.scale}
          lean={t.lean}
          canopyMat={canopyMats[t.matIdx]}
          trunkMat={trunkMat}
        />
      ))}
    </group>
  );
};