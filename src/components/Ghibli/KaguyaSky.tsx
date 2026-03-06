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

// ── Simplex 2D ──────────────────────────────────────────────
vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec2 mod289(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187,0.366025403784439,
                     -0.577350269189626,0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
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
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for(int i = 0; i < 6; i++){
    v += a * snoise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = vUv;
  float t = uTime * 0.008;

  // ── Domain warp for organic Kaguya flow ──
  float w1 = fbm(uv * 2.0 + t);
  float w2 = fbm(uv * 2.5 + w1 * 0.7 + t * 0.3);
  float w3 = fbm(uv * 1.5 - w2 * 0.5 + t * 0.15);

  // ── Noise layers ──
  float n1 = fbm(uv * 1.8 + w2 * 0.4) * 0.5 + 0.5;
  float n2 = fbm(uv * 3.5 - t * 0.2 + w1 * 0.3) * 0.5 + 0.5;
  float n3 = fbm(uv * 5.0 + t * 0.1 + w3 * 0.2) * 0.5 + 0.5;

  // ── Palette: golden summer afternoon ──
  vec3 horizonGold   = vec3(0.98, 0.88, 0.65);
  vec3 warmPeach     = vec3(0.96, 0.82, 0.70);
  vec3 softBlue      = vec3(0.62, 0.76, 0.90);
  vec3 deepSky       = vec3(0.42, 0.58, 0.82);
  vec3 cloudWhite    = vec3(0.98, 0.96, 0.92);
  vec3 cloudCream    = vec3(0.93, 0.89, 0.80);
  vec3 cloudShadow   = vec3(0.78, 0.75, 0.72);
  vec3 nimbus        = vec3(0.83, 0.83, 0.85);
  vec3 sunGlow       = vec3(1.0, 0.92, 0.70);

  // ── Sky gradient: warm bottom → soft blue top ──
  float grad = uv.y;
  vec3 sky = mix(horizonGold, warmPeach, smoothstep(0.0, 0.2, grad));
  sky = mix(sky, softBlue, smoothstep(0.15, 0.55, grad));
  sky = mix(sky, deepSky, smoothstep(0.55, 1.0, grad));

  // ── Dense cumulus clouds ──
  // Layer 1: big puffy masses
  float cloud1 = smoothstep(0.15, 0.65, n1);
  // Layer 2: mid detail
  float cloud2 = smoothstep(0.25, 0.7, n2);
  // Layer 3: wispy detail
  float cloud3 = smoothstep(0.35, 0.75, n3);

  // Combined cloud density
  float density = cloud1 * 0.5 + cloud2 * 0.3 + cloud3 * 0.2;
  density = smoothstep(0.1, 0.7, density);

  // Cloud color: lit tops, shadowed undersides
  float cloudLit = smoothstep(0.3, 0.8, n1 + 0.2 * uv.y);
  vec3 cloudCol = mix(cloudShadow, cloudWhite, cloudLit);
  cloudCol = mix(cloudCol, cloudCream, smoothstep(0.4, 0.7, w3 * 0.5 + 0.5) * 0.4);
  cloudCol = mix(cloudCol, nimbus, smoothstep(0.5, 0.8, n2) * 0.3);

  // Warm light hitting cloud edges
  float rimLight = smoothstep(0.3, 0.6, density) - smoothstep(0.6, 0.9, density);
  cloudCol += sunGlow * rimLight * 0.25;

  // Blend clouds into sky
  vec3 col = mix(sky, cloudCol, density * 0.85);

  // ── Sun: partially hidden, golden ──
  vec2 sunPos = vec2(0.65, 0.35);
  float sunDist = length(uv - sunPos);
  float sunDisc = smoothstep(0.06, 0.04, sunDist);
  float sunHalo = smoothstep(0.35, 0.0, sunDist);

  // Sun occluded by clouds
  float sunOcclusion = 1.0 - density * 0.7;
  col += sunGlow * sunHalo * 0.3 * sunOcclusion;
  col += vec3(1.0, 0.95, 0.85) * sunDisc * 0.5 * sunOcclusion;

  // ── God rays: subtle streaks from sun ──
  float angle = atan(uv.y - sunPos.y, uv.x - sunPos.x);
  float rays = snoise(vec2(angle * 8.0, sunDist * 3.0 - t * 2.0));
  rays = smoothstep(0.2, 0.8, rays * 0.5 + 0.5);
  col += sunGlow * rays * sunHalo * 0.08 * sunOcclusion;

  // ── Warmth and tone ──
  col += vec3(0.02, 0.01, 0.0);
  float vignette = 1.0 - smoothstep(0.4, 1.0, length(uv - 0.5) * 1.1);
  col = mix(col * 0.9, col, vignette);
  col = pow(col, vec3(0.97));
  col = clamp(col, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}`;

export const KaguyaSky = () => {
  const mat = useMemo(
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

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh>
      <sphereGeometry args={[800, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};
