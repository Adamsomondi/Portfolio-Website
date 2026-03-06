import { useMemo } from 'react';
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

// ── Simplex 2D ────────────────────────────────────────────────────────────────
vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec2 mod289(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v,C.yy));
  vec2 x0 = v - i + dot(i,C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x3 = 2.0*fract(p * C.www) - 1.0;
  vec3 h  = abs(x3) - 0.5;
  vec3 ox = floor(x3 + 0.5);
  vec3 a0 = x3 - ox;
  m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x  = a0.x*x0.x  + h.x*x0.y;
  g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0*dot(m,g);
}

float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for(int i = 0; i < 6; i++){
    v += a * snoise(p);
    p  = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}
// ─────────────────────────────────────────────────────────────────────────────

void main(){
  vec2  uv = vUv;
  float t  = uTime * 0.005;

  // ── Domain warp — more aggressive than before, heavy cloud turbulence ─────
  float w1   = fbm(uv * 2.2 + vec2(t, t * 0.5));
  float w2   = fbm(uv * 2.8 + w1 * 0.8 + vec2(t * 0.4, -t * 0.3));
  float w3   = fbm(uv * 1.8 - w2 * 0.6 + vec2(t * 0.2, t * 0.15));
  float warp = w2 * 0.5 + 0.5;   // 0–1 range for shadow pockets

  // Three noise layers: large masses, medium detail, fine wispy edges
  float n1 = fbm(uv * 2.2 + w2 * 0.5 + vec2(t * 0.08, 0.0)) * 0.5 + 0.5;
  float n2 = fbm(uv * 4.0 - t * 0.15 + w1 * 0.35)           * 0.5 + 0.5;
  float n3 = fbm(uv * 7.5 + t * 0.08  + w3 * 0.25)           * 0.5 + 0.5;

  // ── European sky palette — deep saturated blue, not washed out ────────────
  // Think BBC Planet Earth, not a travel brochure
  vec3 horizonCream   = vec3(0.918, 0.858, 0.740);  // warm cream at sea level
  vec3 horizonGold    = vec3(0.968, 0.840, 0.620);  // golden horizon band
  vec3 midBlue        = vec3(0.200, 0.520, 0.860);  // rich European cornflower
  vec3 deepBlue       = vec3(0.075, 0.240, 0.700);  // deep zenith — almost indigo
  vec3 sunGold        = vec3(1.000, 0.880, 0.540);  // sun colour

  // ── Cloud palette — dramatic cumulus contrast ─────────────────────────────
  // This is the key to the European sky look:
  // tops = brilliant white, undersides = dark blue-gray
  vec3 cloudBrilliant = vec3(0.980, 0.975, 0.958);  // sun-drenched towers
  vec3 cloudGoldRim   = vec3(0.965, 0.900, 0.730);  // golden afternoon rim
  vec3 cloudMidGray   = vec3(0.652, 0.658, 0.675);  // mid-tone cloud body
  vec3 cloudShadow    = vec3(0.418, 0.438, 0.478);  // heavy underside
  vec3 cloudCore      = vec3(0.302, 0.320, 0.365);  // dark core within mass

  // ── Sky gradient ──────────────────────────────────────────────────────────
  vec3 sky = mix(horizonCream, midBlue,  smoothstep(0.38, 0.65, uv.y));
  sky      = mix(sky,          deepBlue, smoothstep(0.65, 1.00, uv.y));

  // Golden horizon band — optical anchor, must match fog colour
  float hBand = exp(-pow(abs(uv.y - 0.47) / 0.050, 2.0));
  sky += horizonGold * hBand * 0.58;

  // Warm blush below horizon (ocean reflected into sky base)
  sky = mix(sky, vec3(0.80, 0.73, 0.62), smoothstep(0.47, 0.27, uv.y) * 0.38);

  // Atmospheric scatter around sun position — brighter zone in that quadrant
  vec2 sunPos   = vec2(0.63, 0.54);
  float sunDist = length(uv - sunPos);
  sky += sunGold * exp(-sunDist * 3.2) * 0.12;   // soft atmospheric scatter

  // ── Heavy cumulus clouds ──────────────────────────────────────────────────
  // cloudBase: clouds only appear above horizon, wider band for more sky coverage
  float cloudBase = smoothstep(0.33, 0.53, uv.y);

  float cRaw     = n1 * 0.55 + n2 * 0.28 + n3 * 0.17;
  // Lower threshold = more cloud coverage (European overcast tendency)
  float cDensity = smoothstep(0.04, 0.58, cRaw) * cloudBase;

  // ── Cumulus shading: vertical structure via noise ─────────────────────────
  // n1 encodes the "height" of the cloud tower:
  //   high n1 → cloud tower top → directly lit by sun → brilliant white
  //   mid  n1 → cloud body      → partially lit       → warm gray
  //   low  n1 → cloud underside → in shadow            → dark blue-gray
  float isTop    = smoothstep(0.50, 0.78, n1);
  float isMid    = smoothstep(0.28, 0.52, n1) * (1.0 - smoothstep(0.52, 0.78, n1));
  float isBottom = 1.0 - smoothstep(0.15, 0.50, n1);

  // Shadow pockets — darker cores within thick cloud masses (domain warp tells us density)
  float shadowPocket = (1.0 - smoothstep(0.30, 0.55, warp))
                      * smoothstep(0.38, 0.78, cDensity);

  // Build cloud colour bottom-up
  vec3 cloudCol = cloudCore;
  cloudCol = mix(cloudCol, cloudShadow,    isBottom    * 2.0);
  cloudCol = mix(cloudCol, cloudMidGray,   isMid       * 1.6);
  cloudCol = mix(cloudCol, cloudGoldRim,   isTop       * 0.9);   // gold rim first
  cloudCol = mix(cloudCol, cloudBrilliant, isTop       * 1.5);   // then brilliant top
  cloudCol = mix(cloudCol, cloudCore * 0.7, shadowPocket * 0.42);

  // ── Sun-side rim lighting ─────────────────────────────────────────────────
  // Clouds facing the sun catch warm golden light on their edges
  vec2  toSun     = normalize(sunPos - uv);
  float sunFacing = dot(normalize(uv - vec2(0.5, 0.5)), -toSun) * 0.5 + 0.5;
  cloudCol += sunGold * sunFacing * 0.22 * cDensity;

  // Cloud edge rim — thin golden halo at the boundary of cloud masses
  float cloudEdge = smoothstep(0.0, 0.28, cDensity) - smoothstep(0.28, 0.70, cDensity);
  cloudCol += sunGold * cloudEdge * 0.40;

  // Blend clouds into sky
  vec3 col = mix(sky, cloudCol, cDensity);

  // ── Sun disc + halo ───────────────────────────────────────────────────────
  float sunOcc = 1.0 - cDensity * 0.78;   // clouds partially hide sun
  col += sunGold * exp(-sunDist * 6.0) * 0.52 * sunOcc;
  col += vec3(1.0, 0.97, 0.92) * smoothstep(0.040, 0.022, sunDist) * 0.80 * sunOcc;

  // ── God rays through cloud gaps ───────────────────────────────────────────
  // Rays visible only where cloud density is low (the gaps between masses)
  float angle   = atan(uv.y - sunPos.y, uv.x - sunPos.x);
  float rays    = snoise(vec2(angle * 9.0, sunDist * 4.5 - t * 3.0));
  rays = smoothstep(0.30, 0.88, rays * 0.5 + 0.5);
  float cGap    = 1.0 - cDensity;
  col += sunGold * rays * exp(-sunDist * 3.5) * 0.16 * cGap;

  // Gamma — slightly more contrast than before (0.95 vs 0.97)
  col = pow(clamp(col, 0.0, 1.0), vec3(0.95));
  gl_FragColor = vec4(col, 1.0);
}`;

export const OceanSky = () => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms:       { uTime: { value: 0 } },
        vertexShader:   skyVertex,
        fragmentShader: skyFragment,
        side:           THREE.BackSide,
        depthWrite:     false,
      }),
    []
  );

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[1200, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};