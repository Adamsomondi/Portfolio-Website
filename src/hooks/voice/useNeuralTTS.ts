// src/hooks/voice/useNeuralTTS.ts
import { useRef, useCallback, useState } from 'react';

interface UseNeuralTTSOptions {
  provider?: 'openai' | 'elevenlabs';
  apiKey: string;
  voice?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export const useNeuralTTS = (options: UseNeuralTTSOptions) => {
  const {
    provider = 'openai',
    apiKey,
    voice = 'alloy',
    onStart,
    onEnd,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      abortControllerRef.current = new AbortController();
      setIsSpeaking(true);
      onStart?.();

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        onError?.(new Error('Audio playback failed'));
      };

      await audio.play();
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      setIsSpeaking(false);
      onError?.(error as Error);
    }
  }, [apiKey, voice, onStart, onEnd, onError]);

  const speakStreaming = useCallback(async (textStream: AsyncIterable<string>) => {
    let fullText = '';
    try {
      for await (const chunk of textStream) {
        fullText += chunk;
      }
      if (fullText.trim()) {
        await speak(fullText);
      } else {
        onEnd?.();
      }
    } catch (error) {
      setIsSpeaking(false);
      onError?.(error as Error);
    }
  }, [speak, onEnd, onError]);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    onEnd?.();
  }, [onEnd]);

  return { speak, speakStreaming, stop, isSpeaking };
};