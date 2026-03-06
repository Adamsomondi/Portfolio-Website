import { useCallback, useEffect, useState, useRef } from 'react';
import { useVoiceStore } from '../../stores/voiceStore';
import { useFaceStore } from '../../stores/faceStore';
import { useRealtimeVoice } from './useRealtimeVoice';
import { useNeuralTTS } from './useNeuralTTS';
import { useStreamingChat } from './useStreamingChat';
import { useAudioCapture } from './useAudioCapture';
import { useSpeechRecognition } from '../ai-face/useSpeechRecognition';
import { useSpeechSynthesis } from '../ai-face/useSpeechSynthesis';
import {
  generateResponse,
  type ChatMessage,
} from '../../utils/ai-face/generateResponse';
import type { VoiceConfig, ConversationMessage } from '../../types/voice';
import { DEFAULT_VOICE_CONFIG } from '../../utils/voice/constants';

const BROWSER_SILENCE_AFTER_FINAL = 1800;
const BROWSER_SILENCE_AFTER_INTERIM = 3000;

interface UseVoiceAssistantOptions {
  openaiApiKey?: string;
  elevenlabsApiKey?: string;
  mode?: 'realtime' | 'streaming' | 'browser';
  config?: Partial<VoiceConfig>;
  chatEndpoint?: string;
  onMessage?: (message: ConversationMessage) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: string) => void;
}

interface UseVoiceAssistantReturn {
  state: string;
  emotion: string;
  audioLevel: number;
  transcript: string;
  response: string;
  messages: ConversationMessage[];
  isReady: boolean;
  start: () => Promise<void>;
  stop: () => void;
  interrupt: () => void;
  sendText: (text: string) => void;
  activeMode: 'realtime' | 'streaming' | 'browser';
}

export const useVoiceAssistant = (
  options: UseVoiceAssistantOptions = {}
): UseVoiceAssistantReturn => {
  const {
    openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY,
    elevenlabsApiKey,
    mode = 'realtime',
    config = {},
    chatEndpoint = '/api/chat',
    onMessage,
    onError,
    onStateChange,
  } = options;

  const mergedConfig = { ...DEFAULT_VOICE_CONFIG, ...config };
  const [activeMode, setActiveMode] = useState<'realtime' | 'streaming' | 'browser'>(mode);
  const [isReady, setIsReady] = useState(false);

  // ── Stores ───────────────────────────────────────────────
  const status = useVoiceStore((s) => s.status);
  const audioLevel = useVoiceStore((s) => s.audioLevel);
  const transcript = useVoiceStore((s) => s.transcript);
  const response = useVoiceStore((s) => s.response);
  const messages = useVoiceStore((s) => s.messages);
  const reset = useVoiceStore((s) => s.reset);
  const setTranscript = useVoiceStore((s) => s.setTranscript);
  const setResponse = useVoiceStore((s) => s.setResponse);
  const setStatus = useVoiceStore((s) => s.setStatus);
  const addMessage = useVoiceStore((s) => s.addMessage);
  const storeSetAudioLevel = useVoiceStore((s) => s.setAudioLevel);

  const emotion = useFaceStore((s) => s.emotion);
  const setEmotion = useFaceStore((s) => s.setEmotion);
  const setConversationState = useFaceStore((s) => s.setConversationState);
  const faceSetAudioLevel = useFaceStore((s) => s.setAudioLevel);
  const setAiResponse = useFaceStore((s) => s.setAiResponse);

  /* ═══════════════════════════════════════════════════════════
     MODE 1 · REALTIME (OpenAI WebRTC)
     ═══════════════════════════════════════════════════════════ */

  const {
    connect: realtimeConnect,
    disconnect: realtimeDisconnect,
  } = useRealtimeVoice({
    onTranscript: useCallback((text: string, isFinal: boolean) => {
      setTranscript(text);
      if (isFinal && onMessage) {
        const msg: ConversationMessage = { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: Date.now() };
        addMessage(msg);
        onMessage(msg);
      }
    }, [setTranscript, onMessage, addMessage]),
    onAIResponse: useCallback((text: string) => {
      setResponse(text);
      setAiResponse(text);
      if (onMessage) {
        const msg: ConversationMessage = { id: `ai-${Date.now()}`, role: 'assistant', content: text, timestamp: Date.now() };
        addMessage(msg);
        onMessage(msg);
      }
    }, [setResponse, setAiResponse, onMessage, addMessage]),
    onError: useCallback((error: string) => { onError?.(new Error(error)); }, [onError]),
  });

  /* ═══════════════════════════════════════════════════════════
     MODE 2 · STREAMING (STT + LLM stream + Neural TTS)
     ═══════════════════════════════════════════════════════════ */

  const streamingActive = useRef(false);
  const streamingSilenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingTranscriptRef = useRef('');
  const streamingRecognitionRef = useRef<SpeechRecognition | null>(null);

  const { speakStreaming: ttsSpeakStreaming, stop: ttsStop, isSpeaking: ttsIsSpeaking } = useNeuralTTS({
    provider: elevenlabsApiKey ? 'elevenlabs' : 'openai',
    apiKey: elevenlabsApiKey || openaiApiKey || '',
    onStart: () => { setStatus('speaking'); setEmotion('talking'); },
    onEnd: () => {
      if (streamingActive.current) { setStatus('listening'); setEmotion('listening'); startStreamingCapture(); }
      else { setStatus('idle'); setEmotion('neutral'); }
    },
  });

  const { sendMessage: streamingSendMessage, abort: streamingAbort } = useStreamingChat({
    apiEndpoint: chatEndpoint,
    systemPrompt: mergedConfig.instructions,
    onToken: (token) => { setResponse((prev) => prev + token); },
    onComplete: (fullText) => {
      if (onMessage) {
        const msg: ConversationMessage = { id: `ai-${Date.now()}`, role: 'assistant', content: fullText, timestamp: Date.now() };
        addMessage(msg);
        onMessage(msg);
      }
    },
  });

  const { startCapture, stopCapture } = useAudioCapture({
    onAudioLevel: (level) => {
      if (activeMode === 'streaming' && !ttsIsSpeaking) storeSetAudioLevel(level);
    },
  });

  const startStreamingCapture = useCallback(() => {
    if (typeof window === 'undefined') return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      streamingTranscriptRef.current += final;
      setTranscript(streamingTranscriptRef.current + interim);
      if (streamingSilenceRef.current) clearTimeout(streamingSilenceRef.current);
      streamingSilenceRef.current = setTimeout(() => {
        if (streamingTranscriptRef.current.trim()) processStreamingInput(streamingTranscriptRef.current);
      }, mergedConfig.silenceTimeout + 800);
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => { if (e.error !== 'no-speech' && e.error !== 'aborted') console.error(e.error); };
    rec.onend = () => { if (streamingActive.current && !ttsIsSpeaking) try { rec.start(); } catch {} };
    streamingRecognitionRef.current = rec;
    rec.start();
    startCapture().catch(console.error);
  }, [mergedConfig.silenceTimeout, setTranscript, ttsIsSpeaking, startCapture]);

  const stopStreamingCapture = useCallback(() => {
    streamingRecognitionRef.current?.abort(); streamingRecognitionRef.current = null;
    if (streamingSilenceRef.current) clearTimeout(streamingSilenceRef.current);
    streamingTranscriptRef.current = '';
    stopCapture();
  }, [stopCapture]);

  const processStreamingInput = useCallback(async (text: string) => {
    if (!text.trim()) return;
    stopStreamingCapture();
    setStatus('processing'); setEmotion('thinking'); setResponse('');
    streamingTranscriptRef.current = '';
    if (onMessage) { const msg: ConversationMessage = { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: Date.now() }; addMessage(msg); onMessage(msg); }
    try {
      const textStream = streamingSendMessage(text);
      await ttsSpeakStreaming(textStream);
    } catch (error) { onError?.(error as Error); setStatus('idle'); setEmotion('neutral'); }
  }, [stopStreamingCapture, setStatus, setEmotion, setResponse, streamingSendMessage, ttsSpeakStreaming, onMessage, onError, addMessage]);

  /* ═══════════════════════════════════════════════════════════
     MODE 3 · BROWSER FALLBACK
     ★ useSpeechRecognition + generateResponse (BRAIN) + useSpeechSynthesis ★
     This is what useConversation used to do
     ═══════════════════════════════════════════════════════════ */

  const browserActiveRef = useRef(false);
  const browserProcessingRef = useRef(false);
  const browserHistoryRef = useRef<ChatMessage[]>([]);
  const browserSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const browserAudioSimRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio simulation for lip sync
  const startBrowserAudioSim = useCallback(() => {
    if (browserAudioSimRef.current) clearInterval(browserAudioSimRef.current);
    browserAudioSimRef.current = setInterval(() => {
      const t = Date.now() * 0.001;
      const level = Math.max(0.05, Math.min(1, 0.3 + Math.random() * 0.35 + Math.sin(t * 8) * 0.1 + Math.cos(t * 13) * 0.08));
      storeSetAudioLevel(level);
      faceSetAudioLevel(level);
    }, 50);
  }, [storeSetAudioLevel, faceSetAudioLevel]);

  const stopBrowserAudioSim = useCallback(() => {
    if (browserAudioSimRef.current) { clearInterval(browserAudioSimRef.current); browserAudioSimRef.current = null; }
    storeSetAudioLevel(0);
    faceSetAudioLevel(0);
  }, [storeSetAudioLevel, faceSetAudioLevel]);

  // Browser speech recognition
  const {
    transcript: bTranscript, interimTranscript: bInterim,
    isListening: bIsListening, isSupported: bRecogSupported,
    startListening: bStartListening, stopListening: bStopListening,
    resetTranscript: bResetTranscript,
  } = useSpeechRecognition();

  // Refs to avoid stale closures
  const bStartListeningRef = useRef(bStartListening);
  const bStopListeningRef = useRef(bStopListening);
  const bResetTranscriptRef = useRef(bResetTranscript);
  const bTranscriptRef = useRef(bTranscript);
  const bInterimRef = useRef(bInterim);
  useEffect(() => { bStartListeningRef.current = bStartListening; }, [bStartListening]);
  useEffect(() => { bStopListeningRef.current = bStopListening; }, [bStopListening]);
  useEffect(() => { bResetTranscriptRef.current = bResetTranscript; }, [bResetTranscript]);
  useEffect(() => { bTranscriptRef.current = bTranscript; }, [bTranscript]);
  useEffect(() => { bInterimRef.current = bInterim; }, [bInterim]);

  // Sync browser transcript → voice store
  useEffect(() => {
    if (activeMode === 'browser' && browserActiveRef.current) {
      setTranscript((bTranscript + ' ' + bInterim).trim());
    }
  }, [activeMode, bTranscript, bInterim, setTranscript]);

  // Speech synthesis callbacks
  const onBrowserSynthEnd = useCallback(() => {
    stopBrowserAudioSim();
    browserProcessingRef.current = false;
    if (browserActiveRef.current) {
      setTimeout(() => {
        if (!browserActiveRef.current) return;
        setStatus('listening'); setConversationState('listening'); setEmotion('listening');
        bResetTranscriptRef.current?.();
        bStartListeningRef.current?.();
      }, 600);
    } else {
      setStatus('idle'); setConversationState('idle'); setEmotion('neutral');
      setResponse(''); setAiResponse('');
    }
  }, [stopBrowserAudioSim, setStatus, setConversationState, setEmotion, setResponse, setAiResponse]);

  const {
    speak: browserSpeak, stop: browserStopSpeaking, warmUp: browserWarmUp,
    isSupported: bSynthSupported,
  } = useSpeechSynthesis(
    // onStart
    useCallback(() => {
      setStatus('speaking'); setConversationState('speaking'); setEmotion('talking');
      startBrowserAudioSim();
    }, [setStatus, setConversationState, setEmotion, startBrowserAudioSim]),
    // onEnd
    onBrowserSynthEnd,
    // onWord
    useCallback((_w: string) => {
      const lvl = 0.5 + Math.random() * 0.5;
      storeSetAudioLevel(lvl); faceSetAudioLevel(lvl);
    }, [storeSetAudioLevel, faceSetAudioLevel])
  );

  const browserSpeakRef = useRef(browserSpeak);
  useEffect(() => { browserSpeakRef.current = browserSpeak; }, [browserSpeak]);

  // ★★★ THE BRAIN — same generateResponse that useConversation used ★★★
  const browserProcessAndRespond = useCallback(async (text: string) => {
    if (!text.trim() || browserProcessingRef.current) return;
    browserProcessingRef.current = true;

    setResponse(''); setAiResponse('');
    setStatus('processing'); setConversationState('thinking'); setEmotion('thinking');

    try {
      // Add user message
      browserHistoryRef.current.push({ role: 'user', content: text });
      if (onMessage) {
        const msg: ConversationMessage = { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: Date.now() };
        addMessage(msg); onMessage(msg);
      }

      // ★★★ THIS IS THE BRAIN ★★★
      // generateResponse handles: music actions, AI API call, pattern matching fallback
      console.log('[voice] ★ Calling generateResponse (brain):', text);
      const result = await generateResponse(text, browserHistoryRef.current);
      console.log('[voice] ★ Brain responded:', result.text, '| emotion:', result.emotion);

      // Add assistant message
      browserHistoryRef.current.push({ role: 'assistant', content: result.text });
      if (browserHistoryRef.current.length > 30) {
        browserHistoryRef.current = browserHistoryRef.current.slice(-20);
      }

      // Update stores
      setResponse(result.text);
      setAiResponse(result.text);
      setEmotion(result.emotion);

      if (onMessage) {
        const msg: ConversationMessage = { id: `ai-${Date.now()}`, role: 'assistant', content: result.text, timestamp: Date.now() };
        addMessage(msg); onMessage(msg);
      }

      // Speak the response
      const muted = useFaceStore.getState().isMuted;
      if (!muted && bSynthSupported) {
        browserSpeakRef.current(result.text);
      } else {
        setStatus('speaking'); setConversationState('speaking');
        const displayMs = Math.max(2000, result.text.length * 50);
        setTimeout(() => {
          browserProcessingRef.current = false;
          if (browserActiveRef.current) {
            setStatus('listening'); setConversationState('listening'); setEmotion('listening');
            bResetTranscriptRef.current?.(); bStartListeningRef.current?.();
          } else {
            setStatus('idle'); setConversationState('idle'); setEmotion('neutral');
            setResponse(''); setAiResponse('');
          }
        }, displayMs);
      }
    } catch (err) {
      console.error('[voice] Browser brain error:', err);
      onError?.(err as Error);
      setStatus('idle'); setConversationState('idle'); setEmotion('neutral');
      browserProcessingRef.current = false;
    }
  }, [bSynthSupported, setStatus, setConversationState, setEmotion, setResponse, setAiResponse, onMessage, onError, addMessage]);

  // Silence detection → auto-process
  const browserAutoProcess = useCallback(() => {
    const finalText = (bTranscriptRef.current + ' ' + bInterimRef.current).trim();
    bStopListeningRef.current?.();
    if (finalText) browserProcessAndRespond(finalText);
    else { setStatus('idle'); setConversationState('idle'); setEmotion('neutral'); }
  }, [browserProcessAndRespond, setStatus, setConversationState, setEmotion]);

  useEffect(() => {
    if (activeMode !== 'browser' || !bIsListening || browserProcessingRef.current) return;
    if (!bTranscript && !bInterim) return;
    if (browserSilenceTimerRef.current) clearTimeout(browserSilenceTimerRef.current);
    const timeout = bTranscript ? BROWSER_SILENCE_AFTER_FINAL : BROWSER_SILENCE_AFTER_INTERIM;
    browserSilenceTimerRef.current = setTimeout(browserAutoProcess, timeout);
    return () => { if (browserSilenceTimerRef.current) clearTimeout(browserSilenceTimerRef.current); };
  }, [activeMode, bTranscript, bInterim, bIsListening, browserAutoProcess]);

  /* ═══════════════════════════════════════════════════════════
     HELPER — start browser mode
     ═══════════════════════════════════════════════════════════ */
  const startBrowserMode = useCallback(() => {
    console.log('[voice] ★★★ STARTING BROWSER MODE (with generateResponse brain) ★★★');
    setActiveMode('browser');
    browserActiveRef.current = true;
    browserHistoryRef.current = [];
    browserWarmUp();
    bResetTranscript();
    setStatus('listening'); setConversationState('listening'); setEmotion('listening');
    setResponse(''); setAiResponse('');
    setIsReady(true);

    if (bRecogSupported) {
      bStartListening();
    } else {
      console.warn('[voice] No speech recognition, using demo input');
      setTimeout(() => browserProcessAndRespond('Hello, tell me about yourself'), 2000);
    }
  }, [browserWarmUp, bResetTranscript, bStartListening, bRecogSupported, browserProcessAndRespond, setStatus, setConversationState, setEmotion, setResponse, setAiResponse]);

  /* ═══════════════════════════════════════════════════════════
     UNIFIED: START
     ═══════════════════════════════════════════════════════════ */
  const start = useCallback(async () => {
    reset();

    // Explicit browser mode
    if (mode === 'browser') { startBrowserMode(); return; }

    // Explicit streaming mode
    if (mode === 'streaming') {
      setActiveMode('streaming');
      streamingActive.current = true;
      setStatus('listening'); setConversationState('listening'); setEmotion('listening');
      setIsReady(true);
      startStreamingCapture();
      return;
    }

    // Realtime mode — try, then fallback to browser
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const keyValid = apiKey && !apiKey.includes('your_key');

    if (keyValid) {
      try {
        console.log('[voice] Trying realtime mode...');
        setActiveMode('realtime');
        await realtimeConnect();
        const connected = await new Promise<boolean>((resolve) => {
          const check = setInterval(() => {
            const s = useVoiceStore.getState().status;
            if (s === 'connected' || s === 'listening') { clearInterval(check); resolve(true); }
          }, 100);
          setTimeout(() => { clearInterval(check); resolve(false); }, 10000);
        });
        if (connected) { setIsReady(true); console.log('[voice] ✓ Realtime connected'); return; }
        throw new Error('Realtime connection timed out');
      } catch (error) {
        console.warn('[voice] Realtime failed, falling back to browser:', error);
        realtimeDisconnect();
      }
    } else {
      console.warn('[voice] No valid API key, skipping realtime');
    }

    // ★ FALLBACK TO BROWSER MODE WITH BRAIN ★
    startBrowserMode();
  }, [mode, reset, realtimeConnect, realtimeDisconnect, startStreamingCapture, startBrowserMode, setStatus, setConversationState, setEmotion]);

  /* ═══════════════════════════════════════════════════════════
     UNIFIED: STOP
     ═══════════════════════════════════════════════════════════ */
  const stop = useCallback(() => {
    if (activeMode === 'realtime') {
      realtimeDisconnect();
    } else if (activeMode === 'streaming') {
      streamingActive.current = false;
      stopStreamingCapture(); ttsStop(); streamingAbort();
    } else {
      if (browserSilenceTimerRef.current) clearTimeout(browserSilenceTimerRef.current);
      browserActiveRef.current = false;
      bStopListening();
      const finalText = (bTranscriptRef.current + ' ' + bInterimRef.current).trim();
      if (finalText && !browserProcessingRef.current) {
        browserProcessAndRespond(finalText);
      } else if (!browserProcessingRef.current) {
        browserStopSpeaking(); stopBrowserAudioSim();
        setStatus('idle'); setConversationState('idle'); setEmotion('neutral');
        setResponse(''); setAiResponse('');
      }
    }
    setIsReady(false);
  }, [activeMode, realtimeDisconnect, stopStreamingCapture, ttsStop, streamingAbort, bStopListening, browserStopSpeaking, browserProcessAndRespond, stopBrowserAudioSim, setStatus, setConversationState, setEmotion, setResponse, setAiResponse]);

  /* ═══════════════════════════════════════════════════════════
     UNIFIED: INTERRUPT
     ═══════════════════════════════════════════════════════════ */
  const interrupt = useCallback(() => {
    if (activeMode === 'realtime') return;
    if (activeMode === 'streaming') {
      ttsStop(); streamingAbort();
      if (streamingActive.current) { setResponse(''); setStatus('listening'); setConversationState('listening'); setEmotion('listening'); startStreamingCapture(); }
      return;
    }
    if (browserSilenceTimerRef.current) clearTimeout(browserSilenceTimerRef.current);
    bStopListening(); browserStopSpeaking(); stopBrowserAudioSim();
    browserProcessingRef.current = false;
    if (browserActiveRef.current) {
      setResponse(''); setAiResponse('');
      setStatus('listening'); setConversationState('listening'); setEmotion('listening');
      setTimeout(() => { bResetTranscript(); bStartListening(); }, 300);
    } else {
      setStatus('idle'); setConversationState('idle'); setEmotion('neutral');
      storeSetAudioLevel(0); faceSetAudioLevel(0); setResponse(''); setAiResponse('');
    }
  }, [activeMode, ttsStop, streamingAbort, startStreamingCapture, bStopListening, browserStopSpeaking, bResetTranscript, bStartListening, stopBrowserAudioSim, setResponse, setAiResponse, setStatus, setConversationState, setEmotion, storeSetAudioLevel, faceSetAudioLevel]);

  const sendText = useCallback((text: string) => {
    if (activeMode === 'realtime') return;
    if (activeMode === 'streaming') { setTranscript(text); processStreamingInput(text); return; }
    setTranscript(text); bStopListening(); browserProcessAndRespond(text);
  }, [activeMode, setTranscript, processStreamingInput, bStopListening, browserProcessAndRespond]);

  useEffect(() => { onStateChange?.(status); }, [status, onStateChange]);
  useEffect(() => () => {
    if (browserAudioSimRef.current) clearInterval(browserAudioSimRef.current);
    if (browserSilenceTimerRef.current) clearTimeout(browserSilenceTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  return { state: status, emotion, audioLevel, transcript, response, messages, isReady, start, stop, interrupt, sendText, activeMode };
};