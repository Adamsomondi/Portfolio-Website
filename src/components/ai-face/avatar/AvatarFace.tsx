import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useFaceStore } from '../../../stores/faceStore';
import { useMusicStore } from '../../../stores/musicStore';
import { EMOTIONS, FACE_POSITIONS } from '../../../constants/faceConfig';

import { Head } from './Head';
import { Eye } from './Eye';
import { Mouth } from './Mouth';

import { useBlinking } from '../../../hooks/ai-face/useBlinking';
import { useEyeTracking } from '../../../hooks/ai-face/useEyeTracking';
import { useLipSync } from '../../../hooks/ai-face/useLipSync';
import { useIdleAnimation } from '../../../hooks/ai-face/useIdleAnimation';

export const AvatarFace = () => {
  const groupRef = useRef<THREE.Group | null>(null);
  const leftEyeRef = useRef<THREE.Group | null>(null);
  const rightEyeRef = useRef<THREE.Group | null>(null);
  const leftPupilRef = useRef<THREE.Mesh | null>(null);
  const rightPupilRef = useRef<THREE.Mesh | null>(null);
  const mouthRef = useRef<THREE.Mesh | null>(null);

  const { emotion, conversationState, audioLevel } = useFaceStore();
  const isMusicPlaying = useMusicStore((s) => s.isPlaying);
  const browHeight = useRef(0);

  const isFloating = isMusicPlaying && conversationState === 'idle';

  useIdleAnimation(groupRef, isFloating);

  useBlinking({
    leftEye: leftEyeRef,
    rightEye: rightEyeRef,
  });

  useEyeTracking({
    leftPupil: leftPupilRef,
    rightPupil: rightPupilRef,
    conversationState,
  });

  useLipSync({
    mouthRef,
    conversationState,
    audioLevel,
  });

  useEffect(() => {
    const emotionData = EMOTIONS[emotion] || EMOTIONS.neutral;
    browHeight.current = emotionData.browInnerUp;
  }, [emotion]);

  const { leftEye, rightEye, mouth } = FACE_POSITIONS;

  return (
    <group ref={groupRef}>
      <Head />

      <Eye
        ref={leftEyeRef}
        position={[leftEye.x, leftEye.y, leftEye.z]}
      />
      <Eye
        ref={rightEyeRef}
        position={[rightEye.x, rightEye.y, rightEye.z]}
      />

      <Mouth ref={mouthRef} position={[mouth.x, mouth.y, mouth.z]} />
    </group>
  );
};