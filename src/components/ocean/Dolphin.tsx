import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Wave math: mirrors all 7 waves from OceanSurface shader exactly ──────────
// Pre-normalised direction vectors
const WAVES = [
  { dx:  0.8385, dz:  0.5450, fr: 0.12, am: 0.42, sp: 0.65, ph: 0.00 },
  { dx: -0.5845, dz:  0.8118, fr: 0.18, am: 0.28, sp: 0.85, ph: 1.30 },
  { dx:  0.4677, dz: -0.8838, fr: 0.25, am: 0.20, sp: 0.55, ph: 2.70 },
  { dx:  0.9641, dz:  0.2678, fr: 0.38, am: 0.11, sp: 1.15, ph: 0.80 },
  { dx: -0.3162, dz:  0.9487, fr: 0.55, am: 0.07, sp: 1.50, ph: 1.90 },
  { dx:  0.9285, dz:  0.3714, fr: 0.90, am: 0.03, sp: 2.20, ph: 0.00 },
  { dx:  0.5145, dz: -0.8575, fr: 1.20, am: 0.02, sp: 2.80, ph: 1.10 },
];

function getWaveHeight(wx: number, wz: number, t: number): number {
  const dist = Math.sqrt(wx * wx + wz * wz);
  const ss   = Math.max(0, Math.min(1, (dist - 18) / 52));
  const calm = 1 - ss * ss * (3 - 2 * ss); // smoothstep polynomial
  let h = 0;
  for (const w of WAVES) {
    h += w.am * Math.sin((w.dx * wx + w.dz * wz) * w.fr + t * w.sp + w.ph) * calm;
  }
  return h;
}

// ── Materials ─────────────────────────────────────────────────────────────────
// DoubleSide on SKIN so scale={[1,1,-1]} mirrored parts render correctly
const SKIN = new THREE.MeshStandardMaterial({
  color:    '#2b5272',
  roughness: 0.30,
  metalness: 0.12,
  side:      THREE.DoubleSide,
});
const BELLY = new THREE.MeshStandardMaterial({
  color:    '#bdd8e6',
  roughness: 0.44,
  metalness: 0.03,
});

// ── Geometry factory ──────────────────────────────────────────────────────────
// All skin parts share ONE material — the depth buffer makes their
// overlapping edges completely invisible. No seams, no Z-fighting because
// the overlapping volumes are interior and never seen.
function makeDolphinGeo() {

  // ── Body — elongated ellipsoid, the trunk
  const body = new THREE.SphereGeometry(1, 32, 20);
  body.applyMatrix4(new THREE.Matrix4().makeScale(2.60, 0.84, 0.80));

  // ── Head melon — larger in Y than body → natural forehead bulge
  const head = new THREE.SphereGeometry(0.75, 24, 18);
  head.applyMatrix4(new THREE.Matrix4().makeScale(1.0, 1.12, 1.04));
  head.translate(0.88, 0.06, 0);

  // ── Rostrum — tapered cylinder (narrow tip, wider base into head)
  const rostrum = new THREE.CylinderGeometry(0.06, 0.21, 0.76, 18);
  rostrum.applyMatrix4(new THREE.Matrix4().makeRotationZ(-Math.PI / 2));
  rostrum.translate(1.60, -0.06, 0);

  // ── Chin — small ellipsoid giving lower jaw the right depth
  const chin = new THREE.SphereGeometry(0.30, 16, 12);
  chin.applyMatrix4(new THREE.Matrix4().makeScale(1.0, 0.52, 0.78));
  chin.translate(1.22, -0.22, 0);

  // ── Belly — lighter ventral patch, flattened over underside
  const belly = new THREE.SphereGeometry(0.60, 20, 14);
  belly.applyMatrix4(new THREE.Matrix4().makeScale(2.08, 0.50, 0.68));
  belly.translate(0.16, -0.26, 0);

  // ── Dorsal fin — swept-back shape with curved leading edge
  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(0.00, 0.00);
  dorsalShape.quadraticCurveTo(0.08, 0.38, 0.16, 0.64); // curved leading edge
  dorsalShape.lineTo(0.52, 0.00);                        // base, trailing edge
  dorsalShape.closePath();
  const dorsal = new THREE.ExtrudeGeometry(dorsalShape, {
    depth: 0.08, bevelEnabled: false,
  });
  dorsal.translate(-0.08, 0.84, -0.04); // sit on body top, centred on Z

  // ── Pectoral fin — flat ellipsoid, angled down and swept back
  const pect = new THREE.SphereGeometry(1, 16, 10);
  pect.applyMatrix4(new THREE.Matrix4().makeScale(0.54, 0.11, 0.26));
  pect.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.55));  // sweep down ~31°
  pect.applyMatrix4(new THREE.Matrix4().makeRotationY(-0.32)); // swept back ~18°
  pect.translate(0.50, -0.30, 0.46);

  // ── Peduncle — smaller ellipsoid bridging body into tail stock
  // Lives in midRef group so it bends with the tail undulation
  const peduncle = new THREE.SphereGeometry(1, 20, 14);
  peduncle.applyMatrix4(new THREE.Matrix4().makeScale(0.84, 0.36, 0.34));

  // ── Fluke — very flat horizontal wing, one per side
  const fluke = new THREE.SphereGeometry(1, 16, 10);
  fluke.applyMatrix4(new THREE.Matrix4().makeScale(0.56, 0.07, 0.28));

  return { body, head, rostrum, chin, belly, dorsal, pect, peduncle, fluke };
}

// ── Path constants ────────────────────────────────────────────────────────────
// Camera at [0, 2.8, 12] looking toward [0, 0.5, -60].
// Lissajous keeps dolphin always in the centre third of the frame.
// At z=-14, camera distance=26 units → body subtends ~7° (14% screen height).
// x ±8 at that depth → max angular offset = atan(8/26) = 17° < 25° half-FOV.
const X_AMP  =  8.0;
const X_FREQ =  0.14;   // ~44s to sweep left-right once
const Z_MID  = -14.0;
const Z_AMP  =  5.5;
const Z_FREQ =  0.28;   // 2× X_FREQ → figure-8 feel, never repetitive

const BREACH_PERIOD = 9.0;   // seconds between breaches
const BREACH_ARC    = 2.4;   // peak height above wave surface

export const Dolphin = () => {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const midRef  = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

  const geo = useMemo(makeDolphinGeo, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!rootRef.current || !bodyRef.current ||
        !midRef.current  || !tailRef.current) return;

    // ── World XZ position along Lissajous path ──────────────────────────
    const px = X_AMP * Math.sin(t * X_FREQ);
    const pz = Z_MID + Z_AMP * Math.sin(t * Z_FREQ);

    // ── True wave height at dolphin's feet ──────────────────────────────
    const wh = getWaveHeight(px, pz, t);

    // ── Breach arc — parabolic sine arch every BREACH_PERIOD seconds ────
    const phase     = t % BREACH_PERIOD;
    const breaching = phase < 2.6;
    const arc       = breaching
      ? Math.sin((phase / 2.6) * Math.PI) * BREACH_ARC
      : 0;

    // Swimming: belly sits 0.28 units below surface (realistic draft).
    // Breaching: launch straight off the surface.
    const py = wh + arc - (breaching ? 0 : 0.28);
    rootRef.current.position.set(px, py, pz);

    // ── Heading — numerical tangent of path, 0.08s look-ahead ───────────
    const dt = 0.08;
    const nx = X_AMP * Math.sin((t + dt) * X_FREQ);
    const nz = Z_MID + Z_AMP * Math.sin((t + dt) * Z_FREQ);
    const dx = nx - px;
    const dz = nz - pz;
    // Local +X = dolphin nose. atan2(-dz, dx) maps travel direction → Y rotation.
    rootRef.current.rotation.y = Math.atan2(-dz, dx);

    // ── Pitch — nose up on ascent, down on descent + wave slope ─────────
    const vy = breaching
      ? Math.cos((phase / 2.6) * Math.PI) * BREACH_ARC * (Math.PI / 2.6)
      : 0;
    const whAhead = getWaveHeight(nx, nz, t);
    rootRef.current.rotation.x = -vy * 0.22 + (whAhead - wh) * 0.14;

    // ── Roll — dolphins always roll slightly through turns ───────────────
    rootRef.current.rotation.z = Math.sin(t * X_FREQ * 2.1) * 0.10;

    // ── S-curve undulation: traveling wave from nose → flukes ────────────
    // Phase offset of 0.85 rad per segment = wave travels tail-ward.
    // Amplitude increases toward the tail (body barely moves, flukes sweep).
    const freq = breaching ? 2.8 : 1.75;
    bodyRef.current.rotation.x = Math.sin(t * freq)          * 0.04;
    midRef.current.rotation.x  = Math.sin(t * freq + 0.85)   * 0.22;
    tailRef.current.rotation.x = Math.sin(t * freq + 1.72)   * 0.38;
  });

  // Scale 0.62 → body ≈ 3.22 units long (matches boat length visually)
  return (
    <group scale={0.62}>
      <group ref={rootRef}>
        <group ref={bodyRef}>

          {/* Trunk */}
          <mesh geometry={geo.body}    material={SKIN}  castShadow />

          {/* Head melon — overlaps trunk front, same material = no seam */}
          <mesh geometry={geo.head}    material={SKIN}  castShadow />

          {/* Beak */}
          <mesh geometry={geo.rostrum} material={SKIN}  castShadow />

          {/* Chin */}
          <mesh geometry={geo.chin}    material={SKIN}  castShadow />

          {/* Ventral belly — lighter patch */}
          <mesh geometry={geo.belly}   material={BELLY} castShadow />

          {/* Dorsal fin */}
          <mesh geometry={geo.dorsal}  material={SKIN}  castShadow />

          {/* Port pectoral */}
          <mesh geometry={geo.pect}    material={SKIN}  castShadow />

          {/* Starboard pectoral — Z mirror. DoubleSide on SKIN handles winding. */}
          <mesh
            geometry={geo.pect}
            material={SKIN}
            scale={[1, 1, -1]}
            castShadow
          />

          {/* Peduncle pivot — bends most during tail stroke */}
          <group ref={midRef} position={[-2.10, 0, 0]}>

            {/* Peduncle ellipsoid bridges body → flukes */}
            <mesh geometry={geo.peduncle} material={SKIN} castShadow />

            {/* Fluke pivot — maximum amplitude of S-curve */}
            <group ref={tailRef} position={[-0.64, 0, 0]}>
              <mesh
                geometry={geo.fluke}
                material={SKIN}
                position={[0, 0,  0.34]}
                castShadow
              />
              <mesh
                geometry={geo.fluke}
                material={SKIN}
                position={[0, 0, -0.34]}
                castShadow
              />
            </group>

          </group>

        </group>
      </group>
    </group>
  );
};