import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ── Vertex: waves + earth curvature baked in ─────────────────────────────────
// The same worldCurve trick as SoftLandscape — distant water drops away,
// creating the round-earth optical feel at the horizon.
const oceanVertex = `
uniform float uTime;
varying vec3  vWorldPos;
varying float vElevation;
varying vec3  vNormal;

float wY(vec2 p, vec2 d, float fr, float am, float sp, float ph){
  return am * sin(dot(d,p)*fr + uTime*sp + ph);
}
float wDX(vec2 p, vec2 d, float fr, float am, float sp, float ph){
  return am*fr*d.x * cos(dot(d,p)*fr + uTime*sp + ph);
}
float wDZ(vec2 p, vec2 d, float fr, float am, float sp, float ph){
  return am*fr*d.y * cos(dot(d,p)*fr + uTime*sp + ph);
}

void main(){
  // After rotateX(-PI/2): position.xz = horizontal XZ plane, position.y = 0
  vec2  p    = position.xz;
  float dist = length(p);

  // ── Earth curvature — the optical key ─────────────────────────────────────
  // Distant water drops away exactly as the real Earth does.
  // At 500m: drops ~16m. At 1000m: drops ~65m. Matches real horizon geometry.
  float curve = -dist * dist * 0.000065;

  // ── Wave calm: flat mirror at horizon (the round-earth still-water look) ──
  float calm = 1.0 - smoothstep(18.0, 70.0, dist);

  // ── Large ocean swells ────────────────────────────────────────────────────
  float e = 0.0;
  e += wY(p, normalize(vec2( 1.00,  0.65)), 0.12, 0.42, 0.65, 0.00) * calm;
  e += wY(p, normalize(vec2(-0.72,  1.00)), 0.18, 0.28, 0.85, 1.30) * calm;
  e += wY(p, normalize(vec2( 0.45, -0.85)), 0.25, 0.20, 0.55, 2.70) * calm;

  // ── Secondary chop ────────────────────────────────────────────────────────
  e += wY(p, normalize(vec2( 0.90,  0.25)), 0.38, 0.11, 1.15, 0.80) * calm;
  e += wY(p, normalize(vec2(-0.30,  0.90)), 0.55, 0.07, 1.50, 1.90) * calm;

  // ── Micro ripples ─────────────────────────────────────────────────────────
  e += wY(p, normalize(vec2( 1.00,  0.40)), 0.90, 0.03, 2.20, 0.00) * calm;
  e += wY(p, normalize(vec2( 0.60, -1.00)), 1.20, 0.02, 2.80, 1.10) * calm;

  // Total height = waves + curvature
  float totalY = e + curve;

  // ── Analytical normals from wave derivatives (curvature too small to matter)
  float dx = 0.0;
  dx += wDX(p, normalize(vec2( 1.00,  0.65)), 0.12, 0.42, 0.65, 0.00) * calm;
  dx += wDX(p, normalize(vec2(-0.72,  1.00)), 0.18, 0.28, 0.85, 1.30) * calm;
  dx += wDX(p, normalize(vec2( 0.45, -0.85)), 0.25, 0.20, 0.55, 2.70) * calm;
  dx += wDX(p, normalize(vec2( 0.90,  0.25)), 0.38, 0.11, 1.15, 0.80) * calm;
  dx += wDX(p, normalize(vec2(-0.30,  0.90)), 0.55, 0.07, 1.50, 1.90) * calm;

  float dz = 0.0;
  dz += wDZ(p, normalize(vec2( 1.00,  0.65)), 0.12, 0.42, 0.65, 0.00) * calm;
  dz += wDZ(p, normalize(vec2(-0.72,  1.00)), 0.18, 0.28, 0.85, 1.30) * calm;
  dz += wDZ(p, normalize(vec2( 0.45, -0.85)), 0.25, 0.20, 0.55, 2.70) * calm;
  dz += wDZ(p, normalize(vec2( 0.90,  0.25)), 0.38, 0.11, 1.15, 0.80) * calm;
  dz += wDZ(p, normalize(vec2(-0.30,  0.90)), 0.55, 0.07, 1.50, 1.90) * calm;

  vNormal    = normalize(vec3(-dx, 1.0, -dz));
  vElevation = e;

  vec3 displaced = vec3(position.x, position.y + totalY, position.z);
  vWorldPos      = (modelMatrix * vec4(displaced, 1.0)).xyz;
  gl_Position    = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}`;

// ── Fragment: unchanged Miyazaki palette ─────────────────────────────────────
const oceanFragment = `
uniform vec3  uSunDir;
uniform vec3  uCamPos;
varying vec3  vWorldPos;
varying float vElevation;
varying vec3  vNormal;

void main(){
  vec3  N       = normalize(vNormal);
  vec3  viewDir = normalize(uCamPos - vWorldPos);

  float fresnel = pow(1.0 - max(dot(N, viewDir), 0.0), 3.0);

  // Miyazaki palette — desaturated, nostalgic
  vec3 deepColor    = vec3(0.05, 0.17, 0.30);
  vec3 midColor     = vec3(0.10, 0.40, 0.57);
  vec3 shallowColor = vec3(0.18, 0.57, 0.67);
  vec3 tealScatter  = vec3(0.22, 0.63, 0.60);
  vec3 foamColor    = vec3(0.88, 0.92, 0.90);

  float h    = clamp(vElevation * 0.8 + 0.5, 0.0, 1.0);
  vec3 water = mix(deepColor, midColor, h);
  water      = mix(water, shallowColor, h * h);
  water      = mix(water, tealScatter, smoothstep(0.30, 0.80, h) * 0.38);

  // Sky reflection
  vec3  skyHorizon = vec3(0.93, 0.87, 0.73);
  vec3  skyBlue    = vec3(0.58, 0.77, 0.90);
  float skyGrad    = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
  water = mix(water, mix(skyHorizon, skyBlue, skyGrad), fresnel * 0.72);

  // Sun specular
  vec3  refl   = reflect(-uSunDir, N);
  float facing = max(dot(refl, viewDir), 0.0);
  water += vec3(1.00, 0.93, 0.72) * pow(facing, 300.0) * 2.8;
  water += vec3(0.98, 0.85, 0.60) * pow(facing,  32.0) * 0.07;

  // Foam at crests
  water = mix(water, foamColor, smoothstep(0.28, 0.50, h) * 0.55);

  // Horizon atmospheric — colour matches sky horizon cream
  // This is what locks the water to the sky at the vanishing point
  float hDist = length(vWorldPos.xz);
  water = mix(water, vec3(0.85, 0.80, 0.72),
              smoothstep(30.0, 180.0, hDist) * 0.55);

  water = clamp(water, 0.0, 1.0);
  water = pow(water, vec3(0.97));

  gl_FragColor = vec4(water, 0.97);
}`;

export const OceanSurface = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const sunDir = useMemo(
    () => new THREE.Vector3(0.55, 0.32, -0.77).normalize(),
    []
  );

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime:   { value: 0 },
          uSunDir: { value: sunDir },
          uCamPos: { value: new THREE.Vector3() },
        },
        vertexShader:   oceanVertex,
        fragmentShader: oceanFragment,
        transparent:    true,
      }),
    [sunDir]
  );

  // 2000×2000 — genuinely vast. 350×350 gives ~6 units/cell.
  // Near camera: tight enough for smooth wave detail.
  // At horizon: cells are microscopic, curvature handles the rest.
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2000, 2000, 350, 350);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uCamPos.value.copy(camera.position);
  });

  return (
    <mesh ref={meshRef} geometry={geo} receiveShadow>
      <primitive object={mat} attach="material" />
    </mesh>
  );
};