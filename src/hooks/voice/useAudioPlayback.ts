// src/hooks/voice/useAudioPlayback.ts

import { useRef, useCallback, useEffect, useState } from 'react';
import { pcm16ToFloat32, base64ToArrayBuffer, calculateAudioLevel } from '../../utils/voice/audioUtils';
import { AUDIO_CONFIG } from '../../utils/voice/constants';

interface UseAudioPlaybackOptions {
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onAudioLevel?: (level: number) => void;
}

interface UseAudioPlaybackReturn {
  isPlaying: boolean;
  queueAudio: (base64Audio: string) => void;
  queuePCM: (pcmData: ArrayBuffer) => void;
  clearQueue: () => void;
  stop: () => void;
}

export const useAudioPlayback = (
  options: UseAudioPlaybackOptions = {}
): UseAudioPlaybackReturn => {
  const { onPlaybackStart, onPlaybackEnd, onAudioLevel } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isProcessingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  const onPlaybackStartRef = useRef(onPlaybackStart);
  const onPlaybackEndRef = useRef(onPlaybackEnd);
  const onAudioLevelRef = useRef(onAudioLevel);

  useEffect(() => { onPlaybackStartRef.current = onPlaybackStart; }, [onPlaybackStart]);
  useEffect(() => { onPlaybackEndRef.current = onPlaybackEnd; }, [onPlaybackEnd]);
  useEffect(() => { onAudioLevelRef.current = onAudioLevel; }, [onAudioLevel]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext({ sampleRate: AUDIO_CONFIG.sampleRate });
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isPlaying) {
      onAudioLevelRef.current?.(0);
      return;
    }

    const dataArray = new Float32Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getFloatTimeDomainData(dataArray);
    
    const level = calculateAudioLevel(dataArray);
    onAudioLevelRef.current?.(level);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, [isPlaying]);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const audioContext = getAudioContext();

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (!isPlaying) {
      setIsPlaying(true);
      onPlaybackStartRef.current?.();
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }

    while (audioQueueRef.current.length > 0) {
      const pcmData = audioQueueRef.current.shift()!;
      
      try {
        // Convert PCM16 to Float32
        const float32Data = pcm16ToFloat32(pcmData);
        
        // ═══════════════════════════════════════════════════════════
        // FIX: Create new Float32Array with explicit ArrayBuffer type
        // ═══════════════════════════════════════════════════════════
        const safeBuffer = new ArrayBuffer(float32Data.length * Float32Array.BYTES_PER_ELEMENT);
        const float32Array = new Float32Array(safeBuffer);
        float32Array.set(float32Data);
        
        // Create audio buffer
        const audioBuffer = audioContext.createBuffer(
          1,                           // channels
          float32Array.length,         // length
          AUDIO_CONFIG.sampleRate      // sample rate
        );
        
        // This now works - TypeScript knows it's Float32Array<ArrayBuffer>
        audioBuffer.copyToChannel(float32Array, 0);
        
        // Create and play source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        if (analyserRef.current) {
          source.connect(analyserRef.current);
        } else {
          source.connect(audioContext.destination);
        }
        
        currentSourceRef.current = source;
        
        // Wait for this chunk to finish
        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
        
      } catch (error) {
        console.error('Error playing audio chunk:', error);
      }
    }

    isProcessingRef.current = false;
    
    if (audioQueueRef.current.length === 0) {
      setIsPlaying(false);
      cancelAnimationFrame(animationFrameRef.current);
      onAudioLevelRef.current?.(0);
      onPlaybackEndRef.current?.();
    }
  }, [getAudioContext, isPlaying, updateAudioLevel]);

  const queueAudio = useCallback((base64Audio: string) => {
    const pcmData = base64ToArrayBuffer(base64Audio);
    audioQueueRef.current.push(pcmData);
    processQueue();
  }, [processQueue]);

  const queuePCM = useCallback((pcmData: ArrayBuffer) => {
    audioQueueRef.current.push(pcmData);
    processQueue();
  }, [processQueue]);

  const clearQueue = useCallback(() => {
    audioQueueRef.current = [];
  }, []);

  const stop = useCallback(() => {
    clearQueue();
    
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        // Ignore errors if already stopped
      }
      currentSourceRef.current = null;
    }
    
    cancelAnimationFrame(animationFrameRef.current);
    isProcessingRef.current = false;
    setIsPlaying(false);
    onAudioLevelRef.current?.(0);
  }, [clearQueue]);

  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  return {
    isPlaying,
    queueAudio,
    queuePCM,
    clearQueue,
    stop,
  };
};