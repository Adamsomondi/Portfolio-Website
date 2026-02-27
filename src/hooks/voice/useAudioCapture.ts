// src/hooks/voice/useAudioCapture.ts

import { useRef, useCallback, useEffect, useState } from 'react';
import { 
  floatTo16BitPCM, 
  resampleAudio, 
  calculateAudioLevel,
  createAudioContext 
} from '../../utils/voice/audioUtils';
import { AUDIO_CONFIG } from '../../utils/voice/constants';

interface UseAudioCaptureOptions {
  onAudioData?: (pcm16: ArrayBuffer) => void;
  onAudioLevel?: (level: number) => void;
  targetSampleRate?: number;
}

interface UseAudioCaptureReturn {
  isCapturing: boolean;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  getMediaStream: () => MediaStream | null;
}

export const useAudioCapture = (
  options: UseAudioCaptureOptions = {}
): UseAudioCaptureReturn => {
  const {
    onAudioData,
    onAudioLevel,
    targetSampleRate = AUDIO_CONFIG.sampleRate,
  } = options;

  const [isCapturing, setIsCapturing] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const onAudioDataRef = useRef(onAudioData);
  const onAudioLevelRef = useRef(onAudioLevel);

  useEffect(() => { onAudioDataRef.current = onAudioData; }, [onAudioData]);
  useEffect(() => { onAudioLevelRef.current = onAudioLevel; }, [onAudioLevel]);

  const processAudioData = useCallback((inputData: Float32Array, inputSampleRate: number) => {
    // Calculate and report audio level
    const level = calculateAudioLevel(inputData);
    onAudioLevelRef.current?.(level);

    // Resample if necessary
    const resampled = resampleAudio(inputData, inputSampleRate, targetSampleRate);
    
    // Convert to PCM16
    const pcm16 = floatTo16BitPCM(resampled);
    
    onAudioDataRef.current?.(pcm16);
  }, [targetSampleRate]);

  const startCapture = useCallback(async () => {
    if (isCapturing) return;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: targetSampleRate },
          channelCount: 1,
        },
      });

      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = createAudioContext();
      audioContextRef.current = audioContext;

      // Create source from microphone
      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Create a ScriptProcessorNode (worklet preferred but simpler for demo)
      // For production, use AudioWorkletNode
      const processor = audioContext.createScriptProcessor(
        AUDIO_CONFIG.bufferSize,
        1, // input channels
        1  // output channels
      );

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        processAudioData(new Float32Array(inputData), audioContext.sampleRate);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsCapturing(true);
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      throw error;
    }
  }, [isCapturing, targetSampleRate, processAudioData]);

  const stopCapture = useCallback(() => {
    // Stop all tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect nodes
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsCapturing(false);
  }, []);

  const getMediaStream = useCallback(() => mediaStreamRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    isCapturing,
    startCapture,
    stopCapture,
    getMediaStream,
  };
};