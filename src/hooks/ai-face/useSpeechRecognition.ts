// src/hooks/ai-face/useSpeechRecognition.ts
import { useState, useCallback, useEffect, useRef } from 'react';

// Extend Window interface for Speech Recognition
interface IWindow extends Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

const getSpeechRecognition = (): (new () => ISpeechRecognition) | null => {
  if (typeof window === 'undefined') return null;
  
  const windowWithSpeech = window as IWindow;
  return (windowWithSpeech.SpeechRecognition || 
          windowWithSpeech.webkitSpeechRecognition || 
          null) as (new () => ISpeechRecognition) | null;
};

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  
  const SpeechRecognitionClass = getSpeechRecognition();
  const isSupported = SpeechRecognitionClass !== null;

  useEffect(() => {
    if (!SpeechRecognitionClass) return;
    
    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;
        if (result.isFinal) {
          final += transcriptText;
        } else {
          interim += transcriptText;
        }
      }
      
      if (final) {
        setTranscript((prev) => prev + final);
      }
      setInterimTranscript(interim);
    };
    
    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };
    
    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (isListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Could not restart recognition:', e);
        }
      }
    };
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [SpeechRecognitionClass]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setInterimTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (e) {
        console.error('Error starting speech recognition:', e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      isListeningRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors on stop
      }
      setIsListening(false);
      setInterimTranscript('');
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};