import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  stop: () => void;
  warmUp: () => void;
  isSpeaking: boolean;
  currentWord: string;
  progress: number;
  isSupported: boolean;
}

export const useSpeechSynthesis = (
  onStart?: () => void,
  onEnd?: () => void,
  onWord?: (word: string) => void
): UseSpeechSynthesisReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  const onWordRef = useRef(onWord);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warmedUpRef = useRef(false);

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => { onStartRef.current = onStart; }, [onStart]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => { onWordRef.current = onWord; }, [onWord]);

  // Load voices — Chrome fires voiceschanged async
  useEffect(() => {
    if (!isSupported) return;

    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    };

    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
      if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    };
  }, [isSupported]);

  // Warm up synthesis — MUST be called from a user gesture (click)
  const warmUp = useCallback(() => {
    if (!isSupported || warmedUpRef.current) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0.01;
    u.rate = 10;
    window.speechSynthesis.speak(u);
    warmedUpRef.current = true;
  }, [isSupported]);

  const clearResume = useCallback(() => {
    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      // Cancel + small delay for Chrome to clean up
      window.speechSynthesis.cancel();
      clearResume();

      // Delay needed after cancel() for Chrome
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance; // Prevent garbage collection

        // Voice selection — prefer natural-sounding English voices
        const pick =
          voices.find(
            (v) =>
              v.name.includes('Samantha') ||
              v.name.includes('Google UK English Female') ||
              v.name.includes('Google US English') ||
              (v.name.includes('Natural') && v.lang.startsWith('en'))
          ) ||
          voices.find((v) => v.lang.startsWith('en') && !v.localService) ||
          voices.find((v) => v.lang.startsWith('en'));

        if (pick) utterance.voice = pick;

        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setProgress(0);
          onStartRef.current?.();
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setCurrentWord('');
          setProgress(100);
          clearResume();
          onEndRef.current?.();
        };

        utterance.onerror = (e) => {
          console.warn('Speech synthesis error:', e);
          setIsSpeaking(false);
          setCurrentWord('');
          clearResume();
          onEndRef.current?.();
        };

        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            const word = text.substring(
              event.charIndex,
              event.charIndex + (event.charLength || 5)
            );
            setCurrentWord(word.trim());
            setProgress((event.charIndex / text.length) * 100);
            onWordRef.current?.(word);
          }
        };

        window.speechSynthesis.speak(utterance);

        // Chrome bug: speech stops after ~15s. Pause/resume keeps it alive.
        resumeIntervalRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          } else {
            clearResume();
          }
        }, 10000);
      }, 100); // 100ms delay after cancel
    },
    [isSupported, voices, clearResume]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    clearResume();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setCurrentWord('');
    onEndRef.current?.();
  }, [isSupported, clearResume]);

  return { speak, stop, warmUp, isSpeaking, currentWord, progress, isSupported };
};