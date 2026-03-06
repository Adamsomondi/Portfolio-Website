import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const noise = `
vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec2 mod289(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187,0.366025403784439,
                     -0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5;
  vec3 ox=floor(x+0.5); vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}
float fbm(vec2 p){
  float v=0.0,a=0.5,f=1.0;
  for(int i=0;i<5;i++){v+=a*snoise(p*f);a*=0.5;f*=2.0;}
  return v;
}`;

const duneVertex = `${noise}
uniform float uTime;
uniform vec2  uOffset;
varying vec3  vWorldNormal;
varying vec3  vWorldPos;
varying vec2  vTerrain;
varying float vHeight;

float heightAt(vec2 p, float t){
  float h = 0.0;
  h += fbm(p * 0.012 + t * 0.004) * 2.6;
  h += fbm(p * 0.03 + vec2(5.3, 2.7) + t * 0.002) * 0.85;
  vec2 wind = normalize(vec2(1.0, 0.35));
  float wMod = smoothstep(0.25, 0.75, fbm(p * 0.015 + vec2(8.0)));
  h += sin(dot(p, wind) * 0.4 + fbm(p * 0.05) * 1.8 + t * 0.02) * 0.22 * wMod;
  h += fbm(p * 0.08 + vec2(1.5, 9.2)) * 0.10;
  return max(h, -0.3);
}

void main(){
  vec3 pos = position;

  // ── INFINITE: offset local coords into world-space terrain coords ──
  vec2 tp = pos.xy + uOffset;

  float t = uTime;
  float h = heightAt(tp, t);
  pos.z = h;

  float e = 0.6;
  float hx = heightAt(tp + vec2(e, 0.0), t);
  float hy = heightAt(tp + vec2(0.0, e), t);
  vec3 localN = normalize(vec3(-(hx - h) / e, -(hy - h) / e, 1.0));

  vWorldNormal = normalize((modelMatrix * vec4(localN, 0.0)).xyz);
  vWorldPos    = (modelMatrix * vec4(pos, 1.0)).xyz;
  vTerrain     = tp;
  vHeight      = h;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const duneFragment = `${noise}
uniform float uTime;
uniform float uDark;
uniform vec3  uSunDir;
varying vec3  vWorldNormal;
varying vec3  vWorldPos;
varying vec2  vTerrain;
varying float vHeight;

void main(){
  vec3 N = normalize(vWorldNormal);
  vec3 L = normalize(uSunDir);
  vec3 V = normalize(cameraPosition - vWorldPos);

  vec3 sandBright = mix(vec3(0.94, 0.84, 0.60), vec3(0.40, 0.38, 0.50), uDark);
  vec3 sandMid    = mix(vec3(0.86, 0.72, 0.48), vec3(0.22, 0.20, 0.32), uDark);
  vec3 sandDeep   = mix(vec3(0.60, 0.46, 0.30), vec3(0.10, 0.08, 0.15), uDark);
  vec3 sandWarm   = mix(vec3(0.92, 0.68, 0.38), vec3(0.18, 0.12, 0.20), uDark);

  float hN = smoothstep(-0.3, 2.8, vHeight);
  vec3 sand = mix(sandDeep, sandMid, smoothstep(0.0, 0.45, hN));
  sand      = mix(sand, sandBright, smoothstep(0.45, 0.9, hN));

  float slope = 1.0 - N.y;
  sand = mix(sand, sandDeep, slope * 0.45);

  float pocket = fbm(vTerrain * 0.04 + uTime * 0.001) * 0.5 + 0.5;
  sand = mix(sand, sandWarm, smoothstep(0.4, 0.8, pocket) * 0.15);

  float wrap = max(dot(N, L) * 0.5 + 0.5, 0.0);
  float diff = max(dot(N, L), 0.0);

  vec3 sunCol = mix(vec3(1.0, 0.92, 0.74), vec3(0.35, 0.40, 0.62), uDark);
  vec3 skyCol = mix(vec3(0.48, 0.58, 0.78), vec3(0.06, 0.06, 0.12), uDark);
  float sunI  = mix(1.5, 0.35, uDark);

  vec3 lit = sand * (wrap * sunCol * sunI + skyCol * 0.30);

  float sss = max(-dot(N, L), 0.0);
  lit += vec3(0.88, 0.55, 0.25) * sss * 0.12 * (1.0 - uDark * 0.8);

  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.5);
  vec3 rimCol = mix(vec3(1.0, 0.90, 0.68), vec3(0.28, 0.30, 0.52), uDark);
  lit += rimCol * rim * 0.18;

  vec3 H = normalize(L + V);
  float NdotH = max(dot(N, H), 0.0);
  float sparkle = pow(NdotH, 48.0) * (snoise(vTerrain * 60.0) * 0.5 + 0.5);
  lit += sunCol * sparkle * 0.22 * (1.0 - uDark * 0.7);

  lit += snoise(vTerrain * 18.0 + uTime * 0.008) * 0.018;

  gl_FragColor = vec4(clamp(lit, 0.0, 1.0), 1.0);
}`;

interface Props {
  isDark: boolean;
  isFlying?: boolean;
  dronePosRef?: { current: THREE.Vector3 };
}

export const DuneField = ({ isDark, isFlying, dronePosRef }: Props) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime:   { value: 0 },
          uDark:   { value: 0 },
          uSunDir: { value: new THREE.Vector3(0.6, 0.8, 0.4).normalize() },
          uOffset: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: duneVertex,
        fragmentShader: duneFragment,
      }),
    []
  );

  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uDark.value += ((isDark ? 1 : 0) - mat.uniforms.uDark.value) * 0.025;

    if (meshRef.current) {
      // ── INFINITE: slide terrain mesh under the drone ──
      let tx = 0, tz = 0;
      if (isFlying && dronePosRef?.current) {
        tx = dronePosRef.current.x;
        tz = dronePosRef.current.z;
      }
      meshRef.current.position.x += (tx - meshRef.current.position.x) * 0.08;
      meshRef.current.position.z += (tz - meshRef.current.position.z) * 0.08;

      // Sync offset so noise stays in world coords
      // (plane local X → world X, plane local Y → world −Z due to rotation)
      mat.uniforms.uOffset.value.set(
        meshRef.current.position.x,
       -meshRef.current.position.z
      );
    }
  });

  return (
    <group position={[0, -2.2, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500, 256, 256]} />
        <primitive object={mat} attach="material" />
      </mesh>
    </group>
  );
};