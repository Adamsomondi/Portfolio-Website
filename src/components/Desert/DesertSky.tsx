import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
uniform float uTime;
uniform float uDark;
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

  // ── palettes ──
  vec3 dayHorizon  = vec3(0.95, 0.78, 0.52);
  vec3 dayMid      = vec3(0.56, 0.72, 0.88);
  vec3 dayZenith   = vec3(0.36, 0.50, 0.76);

  vec3 nightHorizon = vec3(0.16, 0.10, 0.22);
  vec3 nightMid     = vec3(0.06, 0.05, 0.16);
  vec3 nightZenith  = vec3(0.02, 0.02, 0.07);

  vec3 horizon = mix(dayHorizon, nightHorizon, uDark);
  vec3 mid     = mix(dayMid,     nightMid,     uDark);
  vec3 zenith  = mix(dayZenith,  nightZenith,  uDark);

  float y = uv.y;
  vec3 base = mix(horizon, mid,   smoothstep(0.0, 0.38, y));
  base      = mix(base,  zenith, smoothstep(0.38, 0.92, y));

  // ── domain warp ──
  float w1 = fbm(uv * 2.2 + t * 0.4);
  float w2 = fbm(uv * 1.6 + w1 * 0.55 + t * 0.2);

  // ── cirrus wisps ──
  float cloud = fbm(vec2(uv.x * 5.0 + w2 * 0.3, uv.y * 1.4) + t * 0.7);
  cloud = smoothstep(0.12, 0.52, cloud) * smoothstep(0.82, 0.28, y);
  cloud *= mix(1.0, 0.25, uDark);

  vec3 cloudCol = mix(vec3(1.0, 0.97, 0.90), vec3(0.12, 0.10, 0.20), uDark);
  base = mix(base, cloudCol, cloud * 0.38);

  // ── sun / moon ──
  vec2 lumPos = vec2(0.72, 0.32);
  float d = length(uv - lumPos);
  vec3 glowCol  = mix(vec3(1.0, 0.88, 0.52), vec3(0.55, 0.58, 0.82), uDark);
  float glowAmt = exp(-d * mix(3.0, 5.0, uDark)) * mix(0.35, 0.18, uDark);
  base += glowCol * glowAmt;

  // ── accent washes ──
  vec3 warmWash = mix(vec3(0.96, 0.83, 0.55), vec3(0.12, 0.08, 0.18), uDark);
  vec3 coolWash = mix(vec3(0.58, 0.68, 0.86), vec3(0.05, 0.07, 0.16), uDark);
  base = mix(base, warmWash, smoothstep(0.3, 0.7, w2) * 0.10);
  base = mix(base, coolWash, smoothstep(0.4, 0.8, w1) * 0.08);

  // ── stars ──
  if(uDark > 0.01){
    vec2 sUv = uv * 160.0;
    vec2 sid = floor(sUv);
    vec2 sf  = fract(sUv) - 0.5;
    float rnd = fract(sin(dot(sid, vec2(12.9898,78.233))) * 43758.5453);
    float star = step(0.965, rnd) * smoothstep(0.06, 0.0, length(sf));
    star *= 0.65 + 0.35 * sin(uTime * (1.8 + rnd * 4.0) + rnd * 6.2832);
    base += vec3(0.90, 0.85, 1.0) * star * uDark * 0.9;
  }

  base += vec3(0.02, 0.008, 0.0) * (1.0 - uDark);

  gl_FragColor = vec4(clamp(base, 0.0, 1.0), 1.0);
}`;

interface Props { isDark: boolean; }

export const DesertSky = ({ isDark }: Props) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uDark: { value: 0 } },
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uDark.value += ((isDark ? 1 : 0) - mat.uniforms.uDark.value) * 0.025;

    // ── INFINITE: lock sky sphere to camera ──
    if (meshRef.current) {
      meshRef.current.position.copy(s.camera.position);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[800, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};