import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFaceStore, ConversationState } from '../../../stores/faceStore';

// ═══════════════════════════════════════════════════════════════
// PANTONE COTY LIGHTING — tinted, not saturated
//
// A point light at #bb2649 doesn't "add Viva Magenta" — it
// burns everything red. Light colors must be LIFTED versions
// that tint surfaces the way a colored gel tints a stage spot.
//
// Cloud Dancer   2026  → key gel   #f0ebe0  (warm linen)
// Mocha Mousse   2025  → under gel #c8a090  (earth warmth)
// Peach Fuzz     2024  → warm rim  #ffc8a0  (soft nurture)
// Viva Magenta   2023  → accent    #d8608a  (brave, not burn)
// Very Peri      2022  → cool rim  #9090c8  (digital calm)
//
// Supporting: AI Aqua #60d8c8, Sunset Coral #f09070,
// Neo Mint #70c8a0, Digital Lavender #b8a8d0, Future Dusk #483868
// ═══════════════════════════════════════════════════════════════

const DARK_STATES: Record<
  ConversationState,
  { rim1: string; rim2: string; intensity: number }
> = {
  idle:      { rim1: '#0d9488', rim2: '#7c3aed', intensity: 0.8  },
  listening: { rim1: '#06b6d4', rim2: '#2dd4bf', intensity: 1.5  },
  thinking:  { rim1: '#8b5cf6', rim2: '#06b6d4', intensity: 1.2  },
  speaking:  { rim1: '#00e5ff', rim2: '#a855f7', intensity: 1.4  },
};

// ── Light mode rims: LIFTED Pantone gels ──────────────────────
// These are the COTYs raised toward white so they tint, not burn.
// rim1 = warm lineage    rim2 = cool lineage
const LIGHT_STATES: Record<
  ConversationState,
  { rim1: string; rim2: string; intensity: number }
> = {
  idle:      { rim1: '#d8608a', rim2: '#9090c8', intensity: 1.0  },  // Viva Magenta gel + Very Peri gel
  listening: { rim1: '#f09070', rim2: '#60d8c8', intensity: 1.4  },  // Sunset Coral gel + AI Aqua gel
  thinking:  { rim1: '#9090c8', rim2: '#70c8a0', intensity: 1.1  },  // Very Peri gel + Neo Mint gel
  speaking:  { rim1: '#ffc8a0', rim2: '#60d8c8', intensity: 1.6  },  // Peach Fuzz gel + AI Aqua gel
};

interface DreamLightingProps {
  isDark: boolean;
}

export const DreamLighting = ({ isDark }: DreamLightingProps) => {
  const rimLight1Ref = useRef<THREE.PointLight>(null);
  const rimLight2Ref = useRef<THREE.PointLight>(null);

  const { conversationState, audioLevel } = useFaceStore();

  const targetRim1 = useMemo(() => new THREE.Color(), []);
  const targetRim2 = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const states = isDark ? DARK_STATES : LIGHT_STATES;
    const config = states[conversationState] || states.idle;
    const lerp = 0.03;

    targetRim1.set(config.rim1);
    targetRim2.set(config.rim2);

    if (rimLight1Ref.current) {
      rimLight1Ref.current.color.lerp(targetRim1, lerp);
      const audio = conversationState === 'speaking' ? audioLevel * 2 : 0;
      rimLight1Ref.current.intensity =
        config.intensity + audio + Math.sin(time * 1.2) * 0.15;

      if (conversationState === 'thinking') {
        rimLight1Ref.current.position.x = -3 + Math.sin(time * 0.6) * 2;
        rimLight1Ref.current.position.y = 1 + Math.cos(time * 0.45) * 1.2;
      } else {
        rimLight1Ref.current.position.x +=
          (-3 - rimLight1Ref.current.position.x) * 0.04;
        rimLight1Ref.current.position.y +=
          (1 - rimLight1Ref.current.position.y) * 0.04;
      }
    }

    if (rimLight2Ref.current) {
      rimLight2Ref.current.color.lerp(targetRim2, lerp);
      const audio = conversationState === 'speaking' ? audioLevel * 1.5 : 0;
      rimLight2Ref.current.intensity =
        config.intensity + audio + Math.cos(time * 1.2) * 0.15;

      if (conversationState === 'thinking') {
        rimLight2Ref.current.position.x = 3 + Math.cos(time * 0.6) * 2;
        rimLight2Ref.current.position.y = 1 + Math.sin(time * 0.45) * 1.2;
      } else {
        rimLight2Ref.current.position.x +=
          (3 - rimLight2Ref.current.position.x) * 0.04;
        rimLight2Ref.current.position.y +=
          (1 - rimLight2Ref.current.position.y) * 0.04;
      }
    }
  });

  return (
    <>
      {/* ── Key ────────────────────────────────────────────────
           Cloud Dancer gel: warm linen, never sterile white.
           This is the primary illumination on the face. */}
      <spotLight
        position={[3, 5, 8]}
        intensity={isDark ? 1.6 : 1.4}
        color={isDark ? '#d4e0ff' : '#f0ebe0'}
        angle={0.5}
        penumbra={0.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* ── Fill ───────────────────────────────────────────────
           Very Peri gel on shadow side. Digital contemplation.
           Lifted to #b0b0d0 so it fills without purpling. */}
      <pointLight
        position={[-5, 2, 5]}
        intensity={isDark ? 0.4 : 0.55}
        color={isDark ? '#6b7ea8' : '#b0b0d0'}
      />

      {/* ── Rim 1 — warm side, state-reactive ─────────────── */}
      <pointLight
        ref={rimLight1Ref}
        position={[-3, 1, -2]}
        intensity={isDark ? 0.8 : 1.0}
        color={isDark ? '#0d9488' : '#d8608a'}
      />

      {/* ── Rim 2 — cool side, state-reactive ─────────────── */}
      <pointLight
        ref={rimLight2Ref}
        position={[3, 1, -2]}
        intensity={isDark ? 0.8 : 1.0}
        color={isDark ? '#7c3aed' : '#9090c8'}
      />

      {/* ── Under fill ─────────────────────────────────────────
           Mocha Mousse gel: grounding warmth on chin and jaw.
           Lifted to #c8a090 — reads as warm earth, not mud. */}
      <pointLight
        position={[0, -3, 3]}
        intensity={isDark ? 0.2 : 0.35}
        color={isDark ? '#ffd4b3' : '#c8a090'}
      />

      {/* ── Back accent — light mode only ──────────────────────
           Viva Magenta gel from behind. Separates silhouette
           from sky. Softened to #d8608a at low intensity. */}
      {!isDark && (
        <pointLight
          position={[0, 2, -4]}
          intensity={0.45}
          color="#d8608a"
        />
      )}

      {/* ── Ambient ────────────────────────────────────────────
           BARELY tinted. Ambient multiplies everything — if you
           make it purple, the whole face goes purple.
           Light mode: Cloud Dancer with a whisper of lavender.
           This is the air, not the paint. */}
      <ambientLight
        intensity={isDark ? 0.1 : 0.2}
        color={isDark ? '#0a0a1e' : '#e8e0f0'}
      />
    </>
  );
};