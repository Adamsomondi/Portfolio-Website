import { useRef, useCallback, useEffect } from 'react';
import {
  FaceLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import { useFaceTrackingStore } from '../../stores/faceTrackingStore';
import type { FaceTrackingData } from '../../stores/faceTrackingStore';

export const useFaceTracking = () => {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(-1);

  const {
    setIsTracking, setIsLoading, setError,
    setFaceDetected, setTrackingData, setCvMode,
  } = useFaceTrackingStore();

  const getBS = (
    blendshapes: { categories: { categoryName: string; score: number }[] }[],
    name: string
  ): number => {
    if (!blendshapes[0]?.categories) return 0;
    return blendshapes[0].categories.find((c) => c.categoryName === name)?.score ?? 0;
  };

  const extractHeadPose = (matrix: { data: number[] }) => {
    const m = matrix.data;
    const sy = Math.sqrt(m[0] * m[0] + m[4] * m[4]);
    if (sy > 1e-6) {
      return {
        pitch: Math.atan2(m[9], m[10]),
        yaw: Math.atan2(-m[8], sy),
        roll: Math.atan2(m[4], m[0]),
      };
    }
    return {
      pitch: Math.atan2(-m[6], m[5]),
      yaw: Math.atan2(-m[8], sy),
      roll: 0,
    };
  };

  const detect = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    const now = performance.now();
    if (now === lastTimeRef.current) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }
    lastTimeRef.current = now;

    try {
      const result = landmarker.detectForVideo(video, now);

      if (
        result.faceBlendshapes?.length > 0 &&
        result.facialTransformationMatrixes?.length > 0
      ) {
        setFaceDetected(true);
        const bs = result.faceBlendshapes;
        const head = extractHeadPose(result.facialTransformationMatrixes[0]);

        const data: FaceTrackingData = {
          headRotation: head,
          eyeBlinkLeft: getBS(bs, 'eyeBlinkLeft'),
          eyeBlinkRight: getBS(bs, 'eyeBlinkRight'),
          eyeLookInLeft: getBS(bs, 'eyeLookInLeft'),
          eyeLookOutLeft: getBS(bs, 'eyeLookOutLeft'),
          eyeLookUpLeft: getBS(bs, 'eyeLookUpLeft'),
          eyeLookDownLeft: getBS(bs, 'eyeLookDownLeft'),
          eyeLookInRight: getBS(bs, 'eyeLookInRight'),
          eyeLookOutRight: getBS(bs, 'eyeLookOutRight'),
          eyeLookUpRight: getBS(bs, 'eyeLookUpRight'),
          eyeLookDownRight: getBS(bs, 'eyeLookDownRight'),
          jawOpen: getBS(bs, 'jawOpen'),
          mouthSmileLeft: getBS(bs, 'mouthSmileLeft'),
          mouthSmileRight: getBS(bs, 'mouthSmileRight'),
          mouthFunnel: getBS(bs, 'mouthFunnel'),
          mouthPucker: getBS(bs, 'mouthPucker'),
          browDownLeft: getBS(bs, 'browDownLeft'),
          browDownRight: getBS(bs, 'browDownRight'),
          browInnerUp: getBS(bs, 'browInnerUp'),
          browOuterUpLeft: getBS(bs, 'browOuterUpLeft'),
          browOuterUpRight: getBS(bs, 'browOuterUpRight'),
        };

        setTrackingData(data);
      } else {
        setFaceDetected(false);
      }
    } catch {
      // skip bad frames
    }

    rafRef.current = requestAnimationFrame(detect);
  }, [setFaceDetected, setTrackingData]);

  const startTracking = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;

      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.cssText = 'position:fixed;top:-9999px;';
      document.body.appendChild(video);
      videoRef.current = video;

      await video.play();

      setIsTracking(true);
      setCvMode(true);
      setIsLoading(false);
      detect();
    } catch (err: any) {
      console.error('Face tracking error:', err);
      setError(err.message || 'Failed to start face tracking');
      setIsLoading(false);
    }
  }, [detect, setIsTracking, setIsLoading, setError, setCvMode]);

  const stopTracking = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    videoRef.current?.remove();
    videoRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;

    setIsTracking(false);
    setCvMode(false);
    setFaceDetected(false);
    setTrackingData(null);
  }, [setIsTracking, setCvMode, setFaceDetected, setTrackingData]);

  useEffect(() => () => stopTracking(), [stopTracking]);

  return { startTracking, stopTracking };
};