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
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your_key')) {
      const msg = 'OpenAI API key not configured for voice';
      console.error(msg);
      setError(msg);
      onError?.(msg);
      return;
    }
    console.log('API key exists:', OPENAI_API_KEY.substring(0, 10) + '...');

    try {
      setStatus('connecting');
      setError(null);
      console.log('Status set to connecting');

      // Get microphone
      console.log('Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          sampleRate: 24000 
        } 
      });
      streamRef.current = stream;
      startAudioLevelMonitoring(stream);
      console.log('Got microphone stream:', stream.id);

      // Get ephemeral token
      console.log('Fetching session token...');
      const tokenResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: REALTIME_MODEL,
          voice: 'shimmer',
        }),
      });
      
      console.log('Token response status:', tokenResponse.status);
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token error response:', errorText);
        throw new Error(`Failed to get session token: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Got ephemeral token');
      const ephemeralKey = tokenData.client_secret.value;

      // Create peer connection
      console.log('Creating RTCPeerConnection...');
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Set up audio playback
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      pc.ontrack = (e) => {
        console.log('Received audio track from OpenAI');
        audioEl.srcObject = e.streams[0];
      };

      // Add microphone track
      const audioTrack = stream.getTracks()[0];
      pc.addTrack(audioTrack, stream);
      console.log('Added microphone track to peer connection');

      // Set up data channel
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onopen = () => {
        console.log('Data channel opened');
        // Configure the session
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are a helpful AI assistant. Be concise and friendly in your responses.',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            }
          }
        };
        dc.send(JSON.stringify(sessionConfig));
        console.log('Sent session config');
        setStatus('connected');
      };

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log('Received event:', event.type);
          
          switch (event.type) {
            case 'session.created':
              console.log('Session created successfully');
              break;
            case 'session.updated':
              console.log('Session updated');
              break;
            case 'conversation.item.input_audio_transcription.completed':
              console.log('User transcript:', event.transcript);
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
              console.error('OpenAI error event:', event.error);
              setError(event.error?.message || 'Unknown error');
              onError?.(event.error?.message || 'Unknown error');
              break;
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      dc.onerror = (e) => {
        console.error('Data channel error:', e);
      };

      dc.onclose = () => {
        console.log('Data channel closed');
      };

      // Create and set local description
      console.log('Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('Local description set');

      // Connect to OpenAI Realtime API
      console.log('Sending offer to OpenAI...');
      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ephemeralKey}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      );

      console.log('SDP response status:', sdpResponse.status);

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('SDP error:', errorText);
        throw new Error(`Failed to connect: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      console.log('Got SDP answer, setting remote description...');
      
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });
      
      console.log('Remote description set - connection should be established');

    } catch (err) {
      console.error('Connection error:', err);
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
      setStatus('error');
      onError?.(message);
      disconnect();
    }
  }, [onTranscript, onAIResponse, onError, startAudioLevelMonitoring]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting...');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setStatus('disconnected');
    setIsAISpeaking(false);
    setAudioLevel(0);
    setError(null);
    console.log('Disconnected');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    error,
    isAISpeaking,
    audioLevel,
    connect,
    disconnect,
  };
}