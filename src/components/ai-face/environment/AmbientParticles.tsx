import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Painterly Sky Shader — Van Gogh meets Rothko ─────────────
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
  float t = uTime * 0.012;

  // Deep domain warping — swirling Van Gogh energy
  float warp1 = fbm(uv * 2.5 + t);
  float warp2 = fbm(uv * 3.0 + warp1 * 0.9 + t * 0.4);
  float warp3 = fbm(uv * 1.8 - warp2 * 0.6 + t * 0.2);

  // Layered noise fields
  float n1 = fbm(uv * 2.0 + warp2 * 0.5) * 0.5 + 0.5;
  float n2 = fbm(uv * 4.0 - t * 0.3 + warp1 * 0.4) * 0.5 + 0.5;
  float n3 = fbm(uv * 6.0 + t * 0.15 + warp3 * 0.3) * 0.5 + 0.5;
  float w  = warp3 * 0.5 + 0.5;

  // Rothko / Hockney palette — saturated, joyful, alive
  vec3 deepCobalt   = vec3(0.08, 0.18, 0.62);
  vec3 cerulean     = vec3(0.15, 0.42, 0.85);
  vec3 warmGold     = vec3(0.95, 0.78, 0.25);
  vec3 sunsetCoral  = vec3(0.92, 0.45, 0.35);
  vec3 hotMagenta   = vec3(0.85, 0.15, 0.55);
  vec3 electricTeal = vec3(0.05, 0.72, 0.68);
  vec3 softLavender = vec3(0.68, 0.55, 0.92);
  vec3 roseGlow     = vec3(0.95, 0.65, 0.72);
  vec3 creamLight   = vec3(1.0, 0.96, 0.88);

  // Gradient base — warm bottom, deep top
  float grad = uv.y;
  vec3 base = mix(roseGlow, cerulean, smoothstep(0.0, 0.5, grad));
  base = mix(base, deepCobalt, smoothstep(0.5, 1.0, grad));

  // Paint the color fields
  vec3 col = base;
  col = mix(col, warmGold, smoothstep(0.25, 0.55, n1) * 0.4);
  col = mix(col, electricTeal, smoothstep(0.35, 0.7, n2) * 0.35);
  col = mix(col, hotMagenta, smoothstep(0.5, 0.85, w) * 0.25);
  col = mix(col, softLavender, smoothstep(0.3, 0.65, n3) * 0.3);
  col = mix(col, sunsetCoral, smoothstep(0.55, 0.8, n1 * n2) * 0.3);

  // Luminous cloud formations — bright billowing light
  float cloud = smoothstep(0.2, 0.55, n1 * 0.6 + n3 * 0.4);
  col = mix(col, creamLight, cloud * 0.3);
  col = mix(col, warmGold, cloud * smoothstep(0.4, 0.8, w) * 0.2);

  // Golden rim light from upper-right — like Monet's sunlight
  float sunAngle = uv.x * 0.5 + uv.y * 0.5;
  float sunGlow = smoothstep(0.3, 0.9, sunAngle + n1 * 0.2);
  col = mix(col, warmGold, sunGlow * 0.15);
  col += creamLight * pow(sunGlow, 4.0) * 0.1;

  // Colour hotspots where noise converges
  col += softLavender * pow(max(n1 * n2 * n3, 0.0), 3.0) * 0.4;
  col += roseGlow * pow(max(w * n2, 0.0), 4.0) * 0.25;

  // Slight warmth everywhere — never cold
  col += vec3(0.03, 0.01, 0.0);

  // Soft vignette — subtle darkening at edges
  float vignette = 1.0 - smoothstep(0.35, 0.95, length(uv - 0.5) * 1.1);
  col = mix(col * 0.85, col, vignette);

  // Keep it luminous, never muddy
  col = clamp(col, 0.0, 1.0);
  col = pow(col, vec3(0.95));

  gl_FragColor = vec4(col, 1.0);
}`;

// ─── Component ─────────────────────────────────────────────────
export const AmbientParticles = () => {
  const dustRef = useRef<THREE.Points>(null);
  const bokehRef = useRef<THREE.Points>(null);
  const sparkRef = useRef<THREE.Points>(null);

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

  // Colourful floating dust motes
  const dustData = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#f472b6'), // pink
      new THREE.Color('#fb923c'), // orange
      new THREE.Color('#a78bfa'), // purple
      new THREE.Color('#38bdf8'), // sky blue
      new THREE.Color('#34d399'), // emerald
      new THREE.Color('#fbbf24'), // amber
      new THREE.Color('#f87171'), // red
      new THREE.Color('#818cf8'), // indigo
      new THREE.Color('#2dd4bf'), // teal
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      velocities[i * 3]     = (Math.random() - 0.5) * 0.003;
      velocities[i * 3 + 1] = Math.random() * 0.005 + 0.001;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors, velocities };
  }, []);

  // Large dreamy bokeh orbs — Hockney pool colours
  const bokehData = useMemo(() => {
    const count = 80;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#c084fc'), // vivid purple
      new THREE.Color('#fb7185'), // rose
      new THREE.Color('#38bdf8'), // bright blue
      new THREE.Color('#fbbf24'), // golden
      new THREE.Color('#4ade80'), // green
      new THREE.Color('#f97316'), // deep orange
      new THREE.Color('#e879f9'), // magenta
      new THREE.Color('#22d3ee'), // cyan
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = -2 - Math.random() * 18;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, []);

  // Tiny bright sparkles — like sunlight on water
  const sparkData = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#fef08a'), // warm white
      new THREE.Color('#e0f2fe'), // cool white
      new THREE.Color('#fce7f3'), // pink white
    ];

    for (let i = 0; i < count; i++) {
      const r = 15 + Math.random() * 35;
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

    // Animate dust — rising, drifting
    if (dustRef.current) {
      const arr = dustRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3]     += dustData.velocities[i * 3];
        arr[i * 3 + 1] += dustData.velocities[i * 3 + 1];
        arr[i * 3 + 2] += dustData.velocities[i * 3 + 2];
        if (arr[i * 3 + 1] > 15) {
          arr[i * 3 + 1] = -15;
          arr[i * 3]     = (Math.random() - 0.5) * 30;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Animate bokeh — gentle breathing drift
    if (bokehRef.current) {
      const arr = bokehRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3]     += Math.sin(t * 0.25 + i * 1.7) * 0.002;
        arr[i * 3 + 1] += Math.cos(t * 0.18 + i * 0.9) * 0.0015;
      }
      bokehRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Sparkles — slow rotation
    if (sparkRef.current) {
      sparkRef.current.rotation.y = t * 0.003;
      sparkRef.current.rotation.x = Math.sin(t * 0.01) * 0.02;
    }
  });

  return (
    <>
      {/* Painterly sky sphere */}
      <mesh>
        <sphereGeometry args={[110, 64, 64]} />
        <primitive object={skyMat} attach="material" />
      </mesh>

      {/* Colourful dust motes */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dustData.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      </points>

      {/* Large bokeh orbs */}
      <points ref={bokehRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bokehData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[bokehData.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.8}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.22}
          toneMapped={false}
        />
      </points>

      {/* Sparkles — sunlight on water */}
      <points ref={sparkRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[sparkData.colors, 3]} />
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