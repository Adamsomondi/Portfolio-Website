import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Nebula Shader ─────────────────────────────────────────────
const nebulaVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const nebulaFragment = `
uniform float uTime;
varying vec2 vUv;

vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec2 mod289(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187,0.366025403784439,
                     -0.577350269189626,0.024390243902439);s
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
  float t = uTime * 0.015;

  // Domain warping — noise feeding into noise for organic flow
  float warp1 = fbm(uv * 3.0 + t);
  float warp2 = fbm(uv * 3.0 + warp1 * 0.8 + t * 0.5);

  // Layered noise
  float n1 = fbm(uv * 2.0 + warp2 * 0.5) * 0.5 + 0.5;
  float n2 = fbm(uv * 4.0 - t * 0.3 + warp1 * 0.3) * 0.5 + 0.5;
  float n3 = fbm(uv * 8.0 + t * 0.2) * 0.5 + 0.5;
  float w  = warp2 * 0.5 + 0.5;

  // Color palette — deep space
  vec3 voidCol    = vec3(0.01, 0.005, 0.03);
  vec3 deepPurple = vec3(0.08, 0.02, 0.18);
  vec3 nebulaBlue = vec3(0.02, 0.06, 0.22);
  vec3 cosmicTeal = vec3(0.01, 0.12, 0.18);
  vec3 warmPink   = vec3(0.18, 0.02, 0.12);
  vec3 highlight  = vec3(0.25, 0.12, 0.45);

  // Build nebula
  vec3 col = voidCol;
  col = mix(col, deepPurple, smoothstep(0.2, 0.5, n1) * 0.8);
  col = mix(col, nebulaBlue, smoothstep(0.3, 0.65, n2) * 0.6);
  col = mix(col, cosmicTeal, smoothstep(0.45, 0.75, w) * 0.5);
  col = mix(col, warmPink,   smoothstep(0.5, 0.85, n1 * n3) * 0.35);

  // Glow hotspots where noise overlaps
  col += highlight * pow(max(n1 * n2, 0.0), 4.0) * 0.6;

  // Star dust sparkle
  col += vec3(0.8, 0.7, 1.0) * pow(n3, 8.0) * 0.15;

  col *= 1.2;
  gl_FragColor = vec4(col, 1.0);
}`;

// ─── Component ─────────────────────────────────────────────────
export const StarField = () => {
  const starsRef = useRef<THREE.Points>(null);

  const nebulaMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: nebulaVertex,
        fragmentShader: nebulaFragment,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  const starData = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#cce5ff'),
      new THREE.Color('#ffe4cc'),
      new THREE.Color('#d4ccff'),
      new THREE.Color('#ccffff'),
    ];

    for (let i = 0; i < count; i++) {
      // Distribute on spherical shell so stars surround you
      const r = 40 + Math.random() * 50;
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
    nebulaMat.uniforms.uTime.value = state.clock.elapsedTime;
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.002;
    }
  });

  return (
    <>
      {/* Nebula sky sphere — shader renders inside */}
      <mesh>
        <sphereGeometry args={[110, 64, 64]} />
        <primitive object={nebulaMat} attach="material" />
      </mesh>

      {/* Stars on spherical shell */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starData.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[starData.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.85}
        />
      </points>
    </>
  );
};