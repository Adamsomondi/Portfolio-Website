// src/components/ai-face/controls/MicButton.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeVoice } from '../../../hooks/voice/useRealtimeVoice';

interface MicButtonProps {
  isDark: boolean;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
}

export const MicButton = ({ isDark, onTranscript, onResponse }: MicButtonProps) => {
  const { status, isAISpeaking, audioLevel, connect, disconnect } = useRealtimeVoice({
    onTranscript: (text, isFinal) => {
      if (isFinal) onTranscript?.(text);
    },
    onAIResponse: onResponse,
  });

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const isListening = isConnected && !isAISpeaking;
  const isSpeaking = isAISpeaking;

  const handleClick = () => {
    console.log('Button clicked!', { isConnected });
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const getButtonClass = () => {
    if (isConnecting) {
      return 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30';
    }
    if (isListening) {
      return 'bg-red-500 text-white shadow-lg shadow-red-500/30';
    }
    if (isSpeaking) {
      return 'bg-blue-500 text-white shadow-lg shadow-blue-500/30';
    }
    if (isConnected) {
      return 'bg-green-500 text-white shadow-lg shadow-green-500/30';
    }
    return isDark
      ? 'bg-white/20 text-white hover:bg-white/30'
      : 'bg-black/10 text-gray-900 hover:bg-black/20';
  };

  const getStatusLabel = () => {
    if (isSpeaking) return '🔊 Speaking';
    if (isListening) return '🎤 Listening';
    return '✓ Connected';
  };

  const getAriaLabel = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'End voice chat';
    return 'Start voice chat';
  };

  const getAnimateProps = () => {
    if (isListening) return { scale: [1, 1.05, 1] };
    if (isConnecting) return { rotate: [0, 360] };
    return {};
  };

  const getTransitionProps = () => {
    if (isListening) return { repeat: Infinity, duration: 1.5 };
    if (isConnecting) return { repeat: Infinity, duration: 1, ease: 'linear' as const };
    return {};
  };

  const getAudioRingStyle = () => {
    const intensity = 20 + audioLevel * 40;
    const spread = 10 + audioLevel * 20;
    const opacity = 0.2 + audioLevel * 0.3;

    if (isListening) {
      return `0 0 ${intensity}px ${spread}px rgba(239, 68, 68, ${opacity})`;
    }
    if (isSpeaking) {
      return `0 0 ${intensity}px ${spread}px rgba(59, 130, 246, ${opacity})`;
    }
    return 'none';
  };

  return (
    <div className="relative flex flex-col items-center gap-3 pointer-events-auto">
      {/* Status label */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`
              absolute -top-10 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
              ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-gray-900'}
            `}
          >
            {getStatusLabel()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio level ring */}
      {isConnected && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{ boxShadow: getAudioRingStyle() }}
          transition={{ duration: 0.1 }}
        />
      )}

      {/* Main button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={getAnimateProps()}
        transition={getTransitionProps()}
        onClick={handleClick}
        disabled={isConnecting}
        className={`
          relative p-5 rounded-full backdrop-blur-xl transition-all duration-300
          disabled:opacity-70 ${getButtonClass()}
        `}
        aria-label={getAriaLabel()}
      >
        {isConnected ? <HangUpIcon /> : <MicrophoneIcon />}
      </motion.button>

      {/* Error message */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-8 text-red-400 text-xs whitespace-nowrap"
          >
            Connection failed
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

const MicrophoneIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z"
    />
  </svg>
);

const HangUpIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
    />
  </svg>
);