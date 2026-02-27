import { create } from 'zustand';

export interface FaceTrackingData {
  headRotation: { pitch: number; yaw: number; roll: number };
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyeLookInLeft: number;
  eyeLookOutLeft: number;
  eyeLookUpLeft: number;
  eyeLookDownLeft: number;
  eyeLookInRight: number;
  eyeLookOutRight: number;
  eyeLookUpRight: number;
  eyeLookDownRight: number;
  jawOpen: number;
  mouthSmileLeft: number;
  mouthSmileRight: number;
  mouthFunnel: number;
  mouthPucker: number;
  browDownLeft: number;
  browDownRight: number;
  browInnerUp: number;
  browOuterUpLeft: number;
  browOuterUpRight: number;
}

interface FaceTrackingStore {
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;
  faceDetected: boolean;
  trackingData: FaceTrackingData | null;
  cvMode: boolean;

  setIsTracking: (v: boolean) => void;
  setIsLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setFaceDetected: (v: boolean) => void;
  setTrackingData: (data: FaceTrackingData | null) => void;
  setCvMode: (v: boolean) => void;
}

export const useFaceTrackingStore = create<FaceTrackingStore>((set) => ({
  isTracking: false,
  isLoading: false,
  error: null,
  faceDetected: false,
  trackingData: null,
  cvMode: false,

  setIsTracking: (v) => set({ isTracking: v }),
  setIsLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  setFaceDetected: (v) => set({ faceDetected: v }),
  setTrackingData: (data) => set({ trackingData: data }),
  setCvMode: (v) => set({ cvMode: v }),
}));