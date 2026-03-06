import { motion } from 'framer-motion';
import { useVoiceAssistant } from '../../../hooks/voice/useVoiceAssistant';

interface MicButtonProps {
  isDark: boolean;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
}

export const MicButton = ({ isDark, onTranscript, onResponse }: MicButtonProps) => {
  const {
    state: status,
    audioLevel,
    activeMode,
    isReady,
    start,
    stop,
  } = useVoiceAssistant({
    mode: 'realtime',
    onMessage: (msg) => {
      if (msg.role === 'user') onTranscript?.(msg.content);
      else if (msg.role === 'assistant') onResponse?.(msg.content);
    },
    onError: (err) => console.error('[MicButton]', err.message),
  });

  // Conservative status mapping; adjust if your hook uses different strings.
  const isConnecting = status === 'connecting' || status === 'initializing';
  const isRecording = status === 'listening' || status === 'recording';
  const isSpeaking = status === 'speaking'; // Assistant is speaking

  // "Talking" means the mic is actively recording AND we detect voice energy.
  const talking = isRecording && audioLevel > 0.06;

  const handleClick = async () => {
    // Single-button behavior: if the mic is actively recording or the assistant is speaking, stop.
    // Otherwise, start listening.
    if (isRecording || isSpeaking) {
      stop();
    } else {
      await start();
    }
  };

  const baseGlass = isDark
    ? 'bg-white/12 text-white' // Subtle transparent white for dark mode
    : 'bg-black/10 text-gray-900'; // Subtle transparent black for light mode

  // Determine the primary button class: red if recording, otherwise base glass.
  const buttonMainClass = isRecording
    ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' // Red when recording
    : baseGlass;

  const btnClass = [
    'relative p-5 rounded-full backdrop-blur-xl transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-white/30',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    buttonMainClass, // Apply the determined primary class
  ].join(' ');

  // The glow/ring shadow specifically reacts to active voice (audioLevel).
  const ringShadow = talking
    ? `0 0 ${8 + audioLevel * 32}px ${4 + audioLevel * 16}px rgba(239,68,68,${0.18 + audioLevel * 0.35})`
    : 'none';

  return (
    <div className="relative pointer-events-auto">
      {/* Audio-reactive ring when user is actively talking */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{ boxShadow: ringShadow }}
        transition={{ duration: 0.1 }}
      />

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleClick}
        disabled={isConnecting} // Disable if connecting to prevent multiple starts
        className={btnClass}
        aria-pressed={isRecording}
        aria-label={isRecording || isSpeaking ? 'Stop voice' : 'Start voice'}
        title={isRecording || isSpeaking ? 'Stop voice' : 'Start voice'}
      >
        <MicrophoneIcon />
      </motion.button>
    </div>
  );
};

const MicrophoneIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3zm7-4a7 7 0 01-7 7 7 7 0 01-7-7m7 7v4m0 0H8m4 0h4"
    />
  </svg>
);