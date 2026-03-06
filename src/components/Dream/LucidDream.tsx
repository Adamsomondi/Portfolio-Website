import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const skyVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const skyFragment = `
uniform float uTime;
varying vec2 vUv;

vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec2 mod289(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187,0.366025403784439,
                     -0.577350269189626,0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0,i1.y,1.0))
                           + i.x + vec3(0.0,i1.x,1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0),dot(x12.xy,x12.xy),
                           dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0*fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x  = a0.x*x0.x  + h.x*x0.y;
  g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0*dot(m, g);
}

float fbm(vec2 p){
  float v = 0.0, a = 0.5, f = 1.0;
  for(int i=0; i<6; i++){
    v += a * snoise(p * f);
    a *= 0.5; f *= 2.0;
  }
  return v;
}

void main(){
  vec2 uv = vUv;
  float t = uTime * 0.008;

  // Stronger warping — more visual texture
  float warp1 = fbm(uv * 2.5 + t * 0.8);
  float warp2 = fbm(uv * 3.0 + warp1 * 0.9 + t * 0.4);
  float warp3 = fbm(uv * 2.0 - warp2 * 0.7 + t * 0.2);

  float n1 = fbm(uv * 2.0 + warp2 * 0.5) * 0.5 + 0.5;
  float n2 = fbm(uv * 3.5 - t * 0.25 + warp1 * 0.4) * 0.5 + 0.5;
  float n3 = fbm(uv * 5.0 + t * 0.15 + warp3 * 0.3) * 0.5 + 0.5;
  float w  = warp3 * 0.5 + 0.5;

  // ═══════════════════════════════════════════════════════════
  // SATURATED PALETTE — pushed dark, pure hues, wide dynamic range
  //
  // The old palette had everything in the 0.62–0.98 brightness range.
  // ACES tone mapping crushes that to grey mush.
  // Dark mode works because its 0.02–0.65 range sits in
  // the linear part of ACES.
  //
  // Fix: push our darks to 0.10, mids to 0.45, accents to 0.95.
  // That gives the same dynamic range as dark mode.
  // Also: toneMapped = false on the material. Belt AND suspenders.
  // ═══════════════════════════════════════════════════════════

  // PRIMARY — rich, saturated, medium-dark
  vec3 tranquilBlue   = vec3(0.18, 0.48, 0.82);
  vec3 neoMint        = vec3(0.22, 0.72, 0.48);
  vec3 futureDusk     = vec3(0.20, 0.08, 0.42);

  // SECONDARY — clearly tinted, NOT pastel, NOT grey
  vec3 peachFuzz      = vec3(0.94, 0.58, 0.30);
  vec3 digiLavender   = vec3(0.62, 0.48, 0.88);
  vec3 mushroomGrey   = vec3(0.42, 0.38, 0.34);

  // ACCENT — maximum saturation, full power
  vec3 vivaMagenta    = vec3(0.92, 0.06, 0.28);
  vec3 cyberLime      = vec3(0.52, 0.95, 0.10);
  vec3 sunsetCoral    = vec3(0.96, 0.32, 0.18);
  vec3 aiAqua         = vec3(0.00, 0.85, 0.70);

  // ══ BASE GRADIENT — dark ground → rich mid → deep zenith ══
  // NOT pastel → white. This is toned paper, not printer paper.
  float grad = uv.y;
  vec3 base = mushroomGrey;
  base = mix(base, peachFuzz * 0.7,  smoothstep(0.0, 0.12, grad) * 0.5);
  base = mix(base, neoMint * 0.8,    smoothstep(0.05, 0.25, grad) * 0.65);
  base = mix(base, tranquilBlue,     smoothstep(0.2, 0.5, grad) * 0.85);
  base = mix(base, digiLavender,     smoothstep(0.4, 0.65, grad) * 0.5);
  base = mix(base, futureDusk,       smoothstep(0.6, 0.88, grad) * 0.8);
  base = mix(base, futureDusk * 0.6, smoothstep(0.85, 1.0, grad) * 0.5);

  vec3 col = base;

  // ══ COLOUR RIBBONS — same structure as dark mode auroras ═══
  // These are the MAIN visual feature. Strong, visible, flowing.
  // Dark mode uses 0.7, 0.6, 0.35 mix. We match that intensity.

  // Ribbon 1: Sunset Coral + Peach Fuzz — warm emotional band
  float band1Y = 0.3 + warp1 * 0.14;
  float ribbon1 = exp(-pow((uv.y - band1Y) * 4.5, 2.0));
  ribbon1 *= smoothstep(0.3, 0.6, n1);
  col = mix(col, sunsetCoral, ribbon1 * 0.6);
  col = mix(col, peachFuzz,   ribbon1 * smoothstep(0.5, 0.8, n2) * 0.3);

  // Ribbon 2: Digital Lavender + Tranquil Blue — dreamy calm band
  float band2Y = 0.55 + warp2 * 0.12;
  float ribbon2 = exp(-pow((uv.y - band2Y) * 5.0, 2.0));
  ribbon2 *= smoothstep(0.35, 0.65, n2);
  col = mix(col, digiLavender, ribbon2 * 0.55);
  col = mix(col, tranquilBlue, ribbon2 * smoothstep(0.4, 0.7, n1) * 0.25);

  // Ribbon 3: Neo Mint — life flowing through the lower sky
  float band3Y = 0.2 + warp3 * 0.1;
  float ribbon3 = exp(-pow((uv.y - band3Y) * 5.5, 2.0));
  ribbon3 *= smoothstep(0.4, 0.7, w);
  col = mix(col, neoMint, ribbon3 * 0.45);

  // ══ RIBBON CONVERGENCE — where bands overlap, magic happens ═
  // Same as dark mode's synapse convergence with brightCore.
  float conv12 = ribbon1 * ribbon2;
  col += vivaMagenta * pow(conv12, 1.5) * 0.8;

  float conv23 = ribbon2 * ribbon3;
  col += aiAqua * pow(conv23, 1.5) * 0.5;

  float conv13 = ribbon1 * ribbon3;
  col += peachFuzz * pow(conv13, 2.0) * 0.4;

  // ══ THICK WASHES — noise-driven, no triple multiplication ══
  col = mix(col, sunsetCoral,  smoothstep(0.35, 0.6, n1) * 0.25);
  col = mix(col, neoMint,      smoothstep(0.3, 0.58, n2) * 0.22);
  col = mix(col, digiLavender, smoothstep(0.3, 0.6, w) * 0.25);
  col = mix(col, vivaMagenta,  smoothstep(0.65, 0.88, n1 * n3) * 0.15);

  // ══ CLOUDS — TINTED, not white. No cream. ═════════════════
  float cloud1 = smoothstep(0.2, 0.55, n1 * 0.55 + n2 * 0.45);
  float cloud2 = smoothstep(0.28, 0.6, n2 * 0.5 + n3 * 0.5);

  // Lavender clouds in upper sky
  col = mix(col, digiLavender * 1.15, cloud1 * 0.28 * smoothstep(0.3, 0.7, grad));
  // Peach clouds in lower sky
  col = mix(col, peachFuzz * 0.95,    cloud2 * 0.22 * smoothstep(0.6, 0.2, grad));
  // Cloud undersides: bold sunset coral
  float cloudWarm = smoothstep(0.45, 0.12, uv.y) * cloud1;
  col = mix(col, sunsetCoral, cloudWarm * 0.25);

  // ══ LIGHT SOURCE — warm glow, upper-left ══════════════════
  float lightDir = (1.0 - uv.x) * 0.35 + (1.0 - uv.y) * 0.65;
  float windowLight = smoothstep(0.1, 0.8, lightDir + n1 * 0.2);
  col = mix(col, sunsetCoral,  windowLight * 0.15);
  col = mix(col, vivaMagenta,  pow(windowLight, 3.0) * 0.06);
  col += peachFuzz * pow(windowLight, 5.0) * 0.08;

  // Cool shadow side — Tranquil Blue + Future Dusk
  float coolSide = smoothstep(0.75, 0.15, lightDir);
  col = mix(col, tranquilBlue, coolSide * 0.12);
  col = mix(col, futureDusk,   coolSide * pow(grad, 1.5) * 0.1);

  // ══ ACCENT HOTSPOTS — same intensity as dark mode ══════════
  col += aiAqua      * pow(max(n1 * n2, 0.0), 2.5) * 0.25;
  col += vivaMagenta * pow(max(n2 * n3 * w, 0.0), 3.0) * 0.22;
  col += sunsetCoral * pow(max(cloud1 * windowLight * n1, 0.0), 2.0) * 0.18;
  col += cyberLime   * pow(max(n1 * n2 * n3, 0.0), 5.0) * 0.14;

  // Complementary pop zone — Aqua vs Magenta mid-sky
  float popZone = smoothstep(0.3, 0.5, grad) * smoothstep(0.7, 0.5, grad);
  col += mix(aiAqua, vivaMagenta, n1) * popZone * pow(max(n1 * n2, 0.0), 2.0) * 0.15;

  // ══ BREATHING ══════════════════════════════════════════════
  float breath = sin(uTime * 0.018) * 0.5 + 0.5;
  col = mix(col, col + vec3(0.03, 0.0, -0.025), breath * 0.25);

  // ══ VIGNETTE — Future Dusk pulls edges deep ════════════════
  float vig = 1.0 - smoothstep(0.2, 0.82, length(uv - 0.5) * 1.15);
  col = mix(col * 0.75 + futureDusk * 0.18, col, vig);

  // NO gamma lift. Raw clamp only.
  col = clamp(col, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}`;

export const LucidDream = () => {
  const petalsRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const pollenRef = useRef<THREE.Points>(null);

  // ══ THE FIX: toneMapped: false ═════════════════════════════
  // Without this, Three.js ACES tone mapping compresses every
  // color in the 0.5-1.0 range into desaturated mush.
  // Dark mode survives because its colors are 0.02-0.4 (linear zone).
  // Light mode dies because its colors are 0.4-0.95 (compression zone).
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  // ── Petals: accent colours — bold, visible, falling ────────
  const petalData = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#d01848'), // viva magenta
      new THREE.Color('#e83020'), // sunset coral
      new THREE.Color('#c02058'), // magenta-rose
      new THREE.Color('#f05030'), // bright coral
      new THREE.Color('#a01848'), // deep magenta
      new THREE.Color('#e84030'), // warm coral
      new THREE.Color('#08c8b8'), // ai aqua pop
      new THREE.Color('#b81850'), // rich magenta
      new THREE.Color('#f06828'), // hot coral
      new THREE.Color('#00a890'), // aqua deep
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 34 - 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      velocities[i * 3]     = (Math.random() - 0.5) * 0.0015;
      velocities[i * 3 + 1] = -(Math.random() * 0.0022 + 0.0008);
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0013;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors, velocities };
  }, []);

  // ── Dust motes: AI Aqua + Cyber Lime — luminous clarity ───
  const dustMoteData = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#00d8c8'), // ai aqua bold
      new THREE.Color('#78e030'), // cyber lime
      new THREE.Color('#10d0b8'), // bright aqua
      new THREE.Color('#90f020'), // vivid lime
      new THREE.Color('#20b8a0'), // deep aqua
      new THREE.Color('#68d838'), // lime-green
      new THREE.Color('#00c8a8'), // aqua-mint
      new THREE.Color('#80e828'), // cyber bright
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.3) * 22;
      positions[i * 3 + 2] = -2 - Math.random() * 24;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, []);

  // ── Pollen: Future Dusk + Lavender + Blue — deep atmosphere ─
  const pollenData = useMemo(() => {
    const count = 280;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#4830a0'), // future dusk deep
      new THREE.Color('#9870e0'), // digital lavender bold
      new THREE.Color('#3068c0'), // tranquil blue rich
      new THREE.Color('#5838b8'), // purple strong
      new THREE.Color('#7850d0'), // lavender vivid
      new THREE.Color('#2858b0'), // blue deep
      new THREE.Color('#6840c8'), // purple-blue
      new THREE.Color('#8860d8'), // bright lavender
    ];

    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    skyMat.uniforms.uTime.value = t;

    if (petalsRef.current) {
      const arr = petalsRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3] +=
          petalData.velocities[i * 3] +
          Math.sin(t * 0.35 + i * 2.7) * 0.001;
        arr[i * 3 + 1] += petalData.velocities[i * 3 + 1];
        arr[i * 3 + 2] +=
          petalData.velocities[i * 3 + 2] +
          Math.cos(t * 0.3 + i * 1.9) * 0.0007;

        if (arr[i * 3 + 1] < -9) {
          arr[i * 3 + 1] = 25 + Math.random() * 6;
          arr[i * 3]     = (Math.random() - 0.5) * 40;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
      }
      petalsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (dustRef.current) {
      const arr = dustRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3]     += Math.sin(t * 0.07 + i * 3.1) * 0.0006;
        arr[i * 3 + 1] += Math.cos(t * 0.05 + i * 1.7) * 0.0005;
        arr[i * 3 + 2] += Math.sin(t * 0.06 + i * 2.3) * 0.0004;
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (pollenRef.current) {
      pollenRef.current.rotation.y = t * 0.002;
      pollenRef.current.rotation.x = Math.sin(t * 0.005) * 0.012;
    }
  });

  return (
    <>
      <mesh>
        <sphereGeometry args={[110, 64, 64]} />
        <primitive object={skyMat} attach="material" />
      </mesh>

      <points ref={petalsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[petalData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[petalData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.18}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.78}
          toneMapped={false}
        />
      </points>

      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustMoteData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[dustMoteData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.22}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      </points>

      <points ref={pollenRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[pollenData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[pollenData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.7}
          toneMapped={false}
        />
      </points>
    </>
  );
};