// src/hooks/ai-face/useAudioAnalyzer.ts
import { useRef, useCallback, useState, useEffect } from 'react';

interface UseAudioAnalyzerReturn {
  audioLevel: number;
  frequencies: Uint8Array | null;
  startAnalyzing: (stream?: MediaStream) => void;
  stopAnalyzing: () => void;
  isAnalyzing: boolean;
}

export const useAudioAnalyzer = (): UseAudioAnalyzerReturn => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencies, setFrequencies] = useState<Uint8Array | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  const analyze = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255);
    setFrequencies(dataArray);
    
    animationFrameRef.current = requestAnimationFrame(analyze);
  }, []);

  const startAnalyzing = useCallback(async (stream?: MediaStream) => {
    try {
      const audioStream = stream || await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(audioStream);
      sourceRef.current.connect(analyserRef.current);
      
      setIsAnalyzing(true);
      analyze();
    } catch (error) {
      console.error('Error starting audio analysis:', error);
    }
  }, [analyze]);

  const stopAnalyzing = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsAnalyzing(false);
    setAudioLevel(0);
    setFrequencies(null);
  }, []);

  useEffect(() => {
    return () => {
      stopAnalyzing();
    };
  }, [stopAnalyzing]);

  return {
    audioLevel,
    frequencies,
    startAnalyzing,
    stopAnalyzing,
    isAnalyzing,
  };
};