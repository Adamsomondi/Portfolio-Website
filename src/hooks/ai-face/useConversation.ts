import { useState, useRef, useCallback, useEffect } from 'react';
import { useFaceStore } from '../../stores/faceStore';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import {
  generateResponse,
  type ChatMessage,
} from '../../utils/ai-face/generateResponse';

const SILENCE_AFTER_FINAL = 1800; // ms silence after final transcript
const SILENCE_AFTER_INTERIM = 3000; // ms if only interim text exists

export const useConversation = () => {
  const setConversationState = useFaceStore((s) => s.setConversationState);
  const setEmotion = useFaceStore((s) => s.setEmotion);
  const setAudioLevel = useFaceStore((s) => s.setAudioLevel);
  const setAiResponse = useFaceStore((s) => s.setAiResponse);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioSimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);
  const activeRef = useRef(false); // conversation loop active
  const historyRef = useRef<ChatMessage[]>([]);

  // ── Audio simulation for lip sync ────────────────────────────
  const startAudioSim = useCallback(() => {
    if (audioSimRef.current) clearInterval(audioSimRef.current);
    audioSimRef.current = setInterval(() => {
      const t = Date.now() * 0.001;
      const level =
        0.3 + Math.random() * 0.35 + Math.sin(t * 8) * 0.1 + Math.cos(t * 13) * 0.08;
      setAudioLevel(Math.max(0.05, Math.min(1, level)));
    }, 50);
  }, [setAudioLevel]);

  const stopAudioSim = useCallback(() => {
    if (audioSimRef.current) {
      clearInterval(audioSimRef.current);
      audioSimRef.current = null;
    }
    setAudioLevel(0);
  }, [setAudioLevel]);

  // ── Speech synthesis callbacks ───────────────────────────────
  const onSynthStart = useCallback(() => {
    setIsSpeaking(true);
    setConversationState('speaking');
    startAudioSim();
  }, [setConversationState, startAudioSim]);

  const onSynthEnd = useCallback(() => {
    setIsSpeaking(false);
    stopAudioSim();
    isProcessingRef.current = false;

    // Continuous conversation — auto-restart listening
    if (activeRef.current) {
      setTimeout(() => {
        if (!activeRef.current) return;
        setConversationState('listening');
        setEmotion('listening');
        startListeningRef.current?.();
      }, 600);
    } else {
      setConversationState('idle');
      setEmotion('neutral');
      setAiResponse('');
    }
  }, [stopAudioSim, setConversationState, setEmotion, setAiResponse]);

  const onSynthWord = useCallback(
    (_word: string) => {
      setAudioLevel(0.5 + Math.random() * 0.5);
    },
    [setAudioLevel]
  );

  // ── Compose browser API hooks ────────────────────────────────
  const {
    speak,
    stop: stopSpeaking,
    warmUp,
    isSupported: synthSupported,
  } = useSpeechSynthesis(onSynthStart, onSynthEnd, onSynthWord);

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported: recognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Refs to avoid stale closures
  const transcriptRef = useRef(transcript);
  const interimRef = useRef(interimTranscript);
  const speakRef = useRef(speak);
  const startListeningRef = useRef(startListening);
  const stopListeningRef = useRef(stopListening);
  const resetTranscriptRef = useRef(resetTranscript);

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { interimRef.current = interimTranscript; }, [interimTranscript]);
  useEffect(() => { speakRef.current = speak; }, [speak]);
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);
  useEffect(() => { stopListeningRef.current = stopListening; }, [stopListening]);
  useEffect(() => { resetTranscriptRef.current = resetTranscript; }, [resetTranscript]);

  // ── Process user input → generate → speak ───────────────────
  const processAndRespond = useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessingRef.current) return;
      isProcessingRef.current = true;

      setAiResponse('');
      setConversationState('thinking');
      setEmotion('thinking');

      try {
        // Add user message to history
        historyRef.current.push({ role: 'user', content: text });

        const result = await generateResponse(text, historyRef.current);

        // Add AI response to history
        historyRef.current.push({ role: 'assistant', content: result.text });

        // Keep history manageable
        if (historyRef.current.length > 30) {
          historyRef.current = historyRef.current.slice(-20);
        }

        setAiResponse(result.text);
        setEmotion(result.emotion);

        const muted = useFaceStore.getState().isMuted;

        if (!muted && synthSupported) {
          speakRef.current(result.text);
        } else {
          // Muted: show text, simulate speaking duration, then continue
          setConversationState('speaking');
          const displayMs = Math.max(2000, result.text.length * 50);
          setTimeout(() => {
            isProcessingRef.current = false;
            if (activeRef.current) {
              setConversationState('listening');
              setEmotion('listening');
              resetTranscriptRef.current?.();
              startListeningRef.current?.();
            } else {
              setConversationState('idle');
              setEmotion('neutral');
              setAiResponse('');
            }
          }, displayMs);
        }
      } catch (err) {
        console.error('Response error:', err);
        setConversationState('idle');
        setEmotion('neutral');
        isProcessingRef.current = false;
      }
    },
    [synthSupported, setConversationState, setEmotion, setAiResponse]
  );

  // ── Auto-end on silence detection ────────────────────────────
  const autoProcess = useCallback(() => {
    const finalText = (
      transcriptRef.current +
      ' ' +
      interimRef.current
    ).trim();

    stopListeningRef.current?.();

    if (finalText) {
      processAndRespond(finalText);
    } else {
      setConversationState('idle');
      setEmotion('neutral');
    }
  }, [processAndRespond, setConversationState, setEmotion]);

  // Silence detection — watches transcript changes
  useEffect(() => {
    if (!isListening || isProcessingRef.current) return;

    const hasContent = transcript || interimTranscript;
    if (!hasContent) return;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    // Use shorter timeout if we have finalized text
    const timeout = transcript ? SILENCE_AFTER_FINAL : SILENCE_AFTER_INTERIM;

    silenceTimerRef.current = setTimeout(autoProcess, timeout);

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [transcript, interimTranscript, isListening, autoProcess]);

  // ── Public API ──────────────────────────────────────────────

  const startConversation = useCallback(() => {
    if (isProcessingRef.current) return;

    // Warm up synthesis on user gesture
    warmUp();

    activeRef.current = true;
    historyRef.current = [];
    resetTranscript();
    setConversationState('listening');
    setEmotion('listening');
    setAiResponse('');

    if (recognitionSupported) {
      startListening();
    } else {
      // Demo fallback
      setTimeout(() => {
        processAndRespond('Hello, tell me about yourself');
      }, 2000);
    }
  }, [
    warmUp,
    resetTranscript,
    setConversationState,
    setEmotion,
    setAiResponse,
    recognitionSupported,
    startListening,
    processAndRespond,
  ]);

  const endConversation = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    stopListening();

    const finalText = (
      transcriptRef.current +
      ' ' +
      interimRef.current
    ).trim();

    if (finalText) {
      processAndRespond(finalText);
    } else {
      // Nothing said → end conversation loop
      activeRef.current = false;
      setConversationState('idle');
      setEmotion('neutral');
    }
  }, [stopListening, processAndRespond, setConversationState, setEmotion]);

  const interrupt = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    activeRef.current = false;

    stopListening();
    stopSpeaking();
    stopAudioSim();

    setIsSpeaking(false);
    setConversationState('idle');
    setEmotion('neutral');
    setAudioLevel(0);
    setAiResponse('');
    isProcessingRef.current = false;
  }, [
    stopListening,
    stopSpeaking,
    stopAudioSim,
    setConversationState,
    setEmotion,
    setAudioLevel,
    setAiResponse,
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioSimRef.current) clearInterval(audioSimRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSpeaking,
    startConversation,
    endConversation,
    interrupt,
  };
};