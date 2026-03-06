import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Deep Dream Sky — Bioluminescent Consciousness ────────────
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
  float t = uTime * 0.01;

  // Triple domain warping — the dream breath
  float warp1 = fbm(uv * 2.5 + t * 0.8);
  float warp2 = fbm(uv * 3.0 + warp1 * 0.9 + t * 0.4);
  float warp3 = fbm(uv * 2.0 - warp2 * 0.7 + t * 0.2);

  // Layered noise fields
  float n1 = fbm(uv * 2.0 + warp2 * 0.5) * 0.5 + 0.5;
  float n2 = fbm(uv * 3.5 - t * 0.25 + warp1 * 0.4) * 0.5 + 0.5;
  float n3 = fbm(uv * 5.0 + t * 0.15 + warp3 * 0.3) * 0.5 + 0.5;
  float w  = warp3 * 0.5 + 0.5;

  // Palette — the colors you see behind closed eyes
  vec3 voidBlack    = vec3(0.02, 0.008, 0.05);
  vec3 deepPlum     = vec3(0.06, 0.015, 0.12);
  vec3 midnightBlue = vec3(0.02, 0.04, 0.15);
  vec3 bioTeal      = vec3(0.0, 0.35, 0.38);
  vec3 biolumCyan   = vec3(0.02, 0.55, 0.65);
  vec3 auroraPurple = vec3(0.28, 0.05, 0.42);
  vec3 synapsePink  = vec3(0.55, 0.05, 0.35);
  vec3 warmAmber    = vec3(0.6, 0.35, 0.05);
  vec3 brightCore   = vec3(0.4, 0.85, 0.9);

  // Void gradient — darker at poles, slightly warmer at equator
  float grad = uv.y;
  vec3 base = mix(deepPlum, voidBlack, smoothstep(0.0, 0.3, grad));
  base = mix(base, midnightBlue, smoothstep(0.4, 0.7, grad) * 0.3);

  vec3 col = base;

  // Aurora ribbons — Gaussian bands warped by noise
  float band1Y = 0.5 + warp1 * 0.15;
  float ribbon1 = exp(-pow((uv.y - band1Y) * 5.0, 2.0));
  ribbon1 *= smoothstep(0.3, 0.6, n1);

  float band2Y = 0.35 + warp2 * 0.12;
  float ribbon2 = exp(-pow((uv.y - band2Y) * 6.0, 2.0));
  ribbon2 *= smoothstep(0.35, 0.65, n2);

  float band3Y = 0.65 + warp3 * 0.1;
  float ribbon3 = exp(-pow((uv.y - band3Y) * 7.0, 2.0));
  ribbon3 *= smoothstep(0.4, 0.7, w);

  // Paint the ribbons
  col = mix(col, biolumCyan,   ribbon1 * 0.7);
  col = mix(col, bioTeal,      ribbon1 * smoothstep(0.5, 0.8, n2) * 0.4);
  col = mix(col, auroraPurple, ribbon2 * 0.6);
  col = mix(col, synapsePink,  ribbon3 * 0.35);

  // Synapse convergence — where ribbons overlap, bright flare
  float convergence = ribbon1 * ribbon2;
  col += brightCore * pow(convergence, 2.0) * 1.2;

  // Warm amber veins threading through the void
  float veins = smoothstep(0.55, 0.75, n1 * n3) * smoothstep(0.4, 0.7, w);
  col = mix(col, warmAmber, veins * 0.2);

  // Deep glow hotspots
  col += auroraPurple * pow(max(n1 * n2 * w, 0.0), 4.0) * 0.5;
  col += biolumCyan * pow(max(n2 * n3, 0.0), 5.0) * 0.3;

  // Breathing pulse — whole sky gently throbs
  float breath = sin(uTime * 0.08) * 0.5 + 0.5;
  col *= 0.9 + breath * 0.15;

  // Vignette — dream narrows at edges
  float vig = 1.0 - smoothstep(0.3, 0.95, length(uv - 0.5) * 1.2);
  col *= 0.7 + vig * 0.3;

  col = clamp(col, 0.0, 1.0);
  col = pow(col, vec3(0.92));

  gl_FragColor = vec4(col, 1.0);
}`;

// ─── Component ─────────────────────────────────────────────────
export const DeepDream = () => {
  const wispsRef = useRef<THREE.Points>(null);
  const orbsRef = useRef<THREE.Points>(null);
  const synapsesRef = useRef<THREE.Points>(null);

  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  // ── Bioluminescent wisps — deep-sea plankton rising through the void
  const wispData = useMemo(() => {
    const count = 400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#00e5ff'),
      new THREE.Color('#06d6a0'),
      new THREE.Color('#00b4d8'),
      new THREE.Color('#7b2ff7'),
      new THREE.Color('#c77dff'),
      new THREE.Color('#48bfe3'),
      new THREE.Color('#0096c7'),
      new THREE.Color('#80ffdb'),
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      velocities[i * 3]     = (Math.random() - 0.5) * 0.002;
      velocities[i * 3 + 1] = Math.random() * 0.004 + 0.001;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors, velocities };
  }, []);

  // ── Memory orbs — large translucent spheres that breathe gently
  const orbData = useMemo(() => {
    const count = 50;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#7c3aed'),
      new THREE.Color('#a855f7'),
      new THREE.Color('#6366f1'),
      new THREE.Color('#2dd4bf'),
      new THREE.Color('#c084fc'),
      new THREE.Color('#818cf8'),
      new THREE.Color('#f0abfc'),
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = -3 - Math.random() * 25;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, []);

  // ── Synapse sparkles — tiny bright points on a distant shell
  const synapseData = useMemo(() => {
    const count = 250;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#e0f7fa'),
      new THREE.Color('#f3e8ff'),
      new THREE.Color('#ccfbf1'),
      new THREE.Color('#fce7f3'),
    ];

    for (let i = 0; i < count; i++) {
      const r = 20 + Math.random() * 40;
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

  // ── Animation loop ───────────────────────────────────────────
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    skyMat.uniforms.uTime.value = t;

    // Wisps — rising through the void like bioluminescent plankton
    if (wispsRef.current) {
      const arr = wispsRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3] +=
          wispData.velocities[i * 3] +
          Math.sin(t * 0.3 + i * 2.1) * 0.001;
        arr[i * 3 + 1] += wispData.velocities[i * 3 + 1];
        arr[i * 3 + 2] +=
          wispData.velocities[i * 3 + 2] +
          Math.cos(t * 0.25 + i * 1.3) * 0.001;
        // Wrap vertically
        if (arr[i * 3 + 1] > 20) {
          arr[i * 3 + 1] = -20;
          arr[i * 3]     = (Math.random() - 0.5) * 40;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
      }
      wispsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Memory orbs — barely perceptible breathing
    if (orbsRef.current) {
      const arr = orbsRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3]     += Math.sin(t * 0.15 + i * 1.7) * 0.0015;
        arr[i * 3 + 1] += Math.cos(t * 0.12 + i * 0.9) * 0.001;
      }
      orbsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Synapses — glacial rotation
    if (synapsesRef.current) {
      synapsesRef.current.rotation.y = t * 0.002;
      synapsesRef.current.rotation.x = Math.sin(t * 0.008) * 0.015;
    }
  });

  // ── Scene graph ──────────────────────────────────────────────
  return (
    <>
      {/* Bioluminescent void sky */}
      <mesh>
        <sphereGeometry args={[110, 64, 64]} />
        <primitive object={skyMat} attach="material" />
      </mesh>

      {/* Rising wisps */}
      <points ref={wispsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[wispData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[wispData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.0}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.0}
          toneMapped={false}
        />
      </points>

      {/* Memory orbs */}
      <points ref={orbsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[orbData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[orbData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.0}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.0}
          toneMapped={false}
        />
      </points>

      {/* Synapse sparkles */}
      <points ref={synapsesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[synapseData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[synapseData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.10}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.75}
        />
      </points>
    </>
  );
};