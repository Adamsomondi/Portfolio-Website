import { useState, useRef, useCallback, useEffect } from 'react';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const REALTIME_MODEL = 'gpt-4o-realtime-preview-2024-12-17';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseRealtimeVoiceOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAIResponse?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}) {
  const { onTranscript, onAIResponse, onError } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      console.error('Audio monitoring error:', err);
    }
  }, []);

  const connect = useCallback(async () => {
    console.log('=== CONNECT FUNCTION CALLED ===');

    // ★ THROW instead of return — so useVoiceAssistant can catch and fallback
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your_key')) {
      const msg = 'OpenAI API key not configured for voice';
      console.error(msg);
      setError(msg);
      setStatus('error');
      onError?.(msg);
      throw new Error(msg);
    }
    console.log('API key exists:', OPENAI_API_KEY.substring(0, 10) + '...');

    try {
      setStatus('connecting');
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
        },
      });
      streamRef.current = stream;
      startAudioLevelMonitoring(stream);

      const tokenResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: REALTIME_MODEL,
          voice: 'shimmer',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to get session token: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      const ephemeralKey = tokenData.client_secret.value;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      const audioTrack = stream.getTracks()[0];
      pc.addTrack(audioTrack, stream);

      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onopen = () => {
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are a helpful AI assistant. Be concise and friendly in your responses.',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        };
        dc.send(JSON.stringify(sessionConfig));
        setStatus('connected');
      };

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          switch (event.type) {
            case 'conversation.item.input_audio_transcription.completed':
              onTranscript?.(event.transcript, true);
              break;
            case 'response.audio_transcript.delta':
              onAIResponse?.(event.delta);
              break;
            case 'response.audio.started':
              setIsAISpeaking(true);
              break;
            case 'response.audio.done':
            case 'response.done':
              setIsAISpeaking(false);
              break;
            case 'error':
              setError(event.error?.message || 'Unknown error');
              onError?.(event.error?.message || 'Unknown error');
              break;
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      dc.onerror = () => {};
      dc.onclose = () => {};

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
      setStatus('error');
      onError?.(message);
      disconnect();
      throw err; // ★ RE-THROW so useVoiceAssistant catches it
    }
  }, [onTranscript, onAIResponse, onError, startAudioLevelMonitoring]);

  const disconnect = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (dcRef.current) { dcRef.current.close(); dcRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStatus('disconnected');
    setIsAISpeaking(false);
    setAudioLevel(0);
    setError(null);
  }, []);

  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return { status, error, isAISpeaking, audioLevel, connect, disconnect };
}