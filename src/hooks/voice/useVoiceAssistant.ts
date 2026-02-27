// src/hooks/voice/useVoiceAssistant.ts
import { useCallback, useEffect, useState, useRef } from 'react';
import { useVoiceStore } from '../../stores/voiceStore';
import { useFaceStore } from '../../stores/faceStore';
import { useRealtimeVoice } from './useRealtimeVoice';
import { useNeuralTTS } from './useNeuralTTS';
import { useStreamingChat } from './useStreamingChat';
import { useAudioCapture } from './useAudioCapture';
import type { VoiceConfig, ConversationMessage } from '../../types/voice';
import { DEFAULT_VOICE_CONFIG } from '../../utils/voice/constants';

interface UseVoiceAssistantOptions {
  openaiApiKey?: string;
  elevenlabsApiKey?: string;
  mode?: 'realtime' | 'streaming';
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
  activeMode: 'realtime' | 'streaming';
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
  const [activeMode, setActiveMode] = useState<'realtime' | 'streaming'>(mode);
  const [isReady, setIsReady] = useState(false);

  // Store state
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

  // Face store for emotions
  const emotion = useFaceStore((s) => s.emotion);
  const setEmotion = useFaceStore((s) => s.setEmotion);

  // ═══════════════════════════════════════════════════════════════
  // REALTIME MODE (OpenAI Realtime API)
  // ═══════════════════════════════════════════════════════════════

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    setTranscript(text);
    if (isFinal && onMessage) {
      const msg: ConversationMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      addMessage(msg);
      onMessage(msg);
    }
  }, [setTranscript, onMessage, addMessage]);

  const handleResponse = useCallback((text: string) => {
    setResponse(text);
    if (onMessage) {
      const msg: ConversationMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      };
      addMessage(msg);
      onMessage(msg);
    }
  }, [setResponse, onMessage, addMessage]);

  const handleError = useCallback((error: string) => {
    onError?.(new Error(error));
  }, [onError]);

  const {
    status: realtimeStatus,
    connect: realtimeConnect,
    disconnect: realtimeDisconnect,
  } = useRealtimeVoice({
    onTranscript: handleTranscript,
    onAIResponse: handleResponse,
    onError: handleError,
  });

  // Derive isConnected from status
  const realtimeConnected = realtimeStatus === 'connected';

  // ═══════════════════════════════════════════════════════════════
  // STREAMING MODE (STT + LLM + Neural TTS)
  // ═══════════════════════════════════════════════════════════════

  const streamingActive = useRef(false);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptBufferRef = useRef('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const {
    speak: ttsSpeak,
    speakStreaming: ttsSpeakStreaming,
    stop: ttsStop,
    isSpeaking: ttsIsSpeaking,
  } = useNeuralTTS({
    provider: elevenlabsApiKey ? 'elevenlabs' : 'openai',
    apiKey: elevenlabsApiKey || openaiApiKey,
    onStart: () => {
      setStatus('speaking');
      setEmotion('talking');
    },
    onEnd: () => {
      if (streamingActive.current) {
        setStatus('listening');
        setEmotion('listening');
        startStreamingCapture();
      } else {
        setStatus('idle');
        setEmotion('neutral');
      }
    },
  });

  const {
    sendMessage: streamingSendMessage,
    isGenerating: streamingIsGenerating,
    abort: streamingAbort,
  } = useStreamingChat({
    apiEndpoint: chatEndpoint,
    systemPrompt: mergedConfig.instructions,
    onToken: (token) => {
      setResponse((prev) => prev + token);
    },
    onComplete: (fullText) => {
      if (onMessage) {
        const msg: ConversationMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullText,
          timestamp: Date.now(),
        };
        addMessage(msg);
        onMessage(msg);
      }
    },
  });

  const { startCapture, stopCapture } = useAudioCapture({
    onAudioLevel: (level) => {
      if (activeMode === 'streaming' && !ttsIsSpeaking) {
        useVoiceStore.getState().setAudioLevel(level);
      }
    },
  });

  const startStreamingCapture = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      const currentTranscript = transcriptBufferRef.current + final;
      transcriptBufferRef.current = currentTranscript;
      setTranscript(currentTranscript + interim);

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      silenceTimeoutRef.current = setTimeout(() => {
        if (transcriptBufferRef.current.trim()) {
          processStreamingInput(transcriptBufferRef.current);
        }
      }, mergedConfig.silenceTimeout + 800);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      if (streamingActive.current && !ttsIsSpeaking) {
        try {
          recognition.start();
        } catch (e) {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    startCapture().catch(console.error);
  }, [mergedConfig.silenceTimeout, setTranscript, ttsIsSpeaking, startCapture]);

  const stopStreamingCapture = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    transcriptBufferRef.current = '';
    stopCapture();
  }, [stopCapture]);

  const processStreamingInput = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      stopStreamingCapture();
      setStatus('processing');
      setEmotion('thinking');
      setResponse('');
      transcriptBufferRef.current = '';

      if (onMessage) {
        const msg: ConversationMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: text,
          timestamp: Date.now(),
        };
        addMessage(msg);
        onMessage(msg);
      }

      try {
        const textStream = streamingSendMessage(text);
        await ttsSpeakStreaming(textStream);
      } catch (error) {
        console.error('Processing error:', error);
        onError?.(error as Error);
        setStatus('idle');
        setEmotion('neutral');
      }
    },
    [
      stopStreamingCapture,
      setStatus,
      setEmotion,
      setResponse,
      streamingSendMessage,
      ttsSpeakStreaming,
      onMessage,
      onError,
      addMessage,
    ]
  );

  // ═══════════════════════════════════════════════════════════════
  // UNIFIED INTERFACE
  // ═══════════════════════════════════════════════════════════════

  const start = useCallback(async () => {
    reset();

    if (activeMode === 'realtime') {
      try {
        await realtimeConnect();
        // Wait for connection
        await new Promise<void>((resolve) => {
          const checkConnected = setInterval(() => {
            const currentStatus = useVoiceStore.getState().status;
            if (currentStatus === 'connected' || currentStatus === 'listening') {
              clearInterval(checkConnected);
              setIsReady(true);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(checkConnected);
            resolve();
          }, 10000);
        });
      } catch (error) {
        console.error('Realtime connection failed, falling back to streaming:', error);
        setActiveMode('streaming');
        streamingActive.current = true;
        setStatus('listening');
        setEmotion('listening');
        setIsReady(true);
        startStreamingCapture();
      }
    } else {
      streamingActive.current = true;
      setStatus('listening');
      setEmotion('listening');
      setIsReady(true);
      startStreamingCapture();
    }
  }, [
    activeMode,
    reset,
    realtimeConnect,
    setStatus,
    setEmotion,
    startStreamingCapture,
  ]);

  const stop = useCallback(() => {
    if (activeMode === 'realtime') {
      realtimeDisconnect();
    } else {
      streamingActive.current = false;
      stopStreamingCapture();
      ttsStop();
      streamingAbort();
    }
    setIsReady(false);
    reset();
  }, [
    activeMode,
    realtimeDisconnect,
    stopStreamingCapture,
    ttsStop,
    streamingAbort,
    reset,
  ]);

  const interrupt = useCallback(() => {
    if (activeMode === 'realtime') {
      console.log('Interrupt not implemented for realtime mode');
    } else {
      ttsStop();
      streamingAbort();
      if (streamingActive.current) {
        setResponse('');
        setStatus('listening');
        setEmotion('listening');
        startStreamingCapture();
      }
    }
  }, [
    activeMode,
    ttsStop,
    streamingAbort,
    setResponse,
    setStatus,
    setEmotion,
    startStreamingCapture,
  ]);

  const sendText = useCallback(
    (text: string) => {
      if (activeMode === 'realtime') {
        console.log('sendText not implemented for realtime mode');
      } else {
        setTranscript(text);
        processStreamingInput(text);
      }
    },
    [activeMode, setTranscript, processStreamingInput]
  );

  // Notify state changes
  useEffect(() => {
    onStateChange?.(status);
  }, [status, onStateChange]);

  const state = status;

  return {
    state,
    emotion,
    audioLevel,
    transcript,
    response,
    messages,
    isReady,
    start,
    stop,
    interrupt,
    sendText,
    activeMode,
  };
};