import { motion } from 'framer-motion';

interface MicButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isDark: boolean;
  onClick: () => void;
}

export const MicButton = ({ isListening, isSpeaking, isDark, onClick }: MicButtonProps) => {
  const activeClass = isListening
    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
    : isSpeaking
      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
      : isDark
        ? 'bg-white/20 text-white hover:bg-white/30'
        : 'bg-black/10 text-gray-900 hover:bg-black/20';

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={isListening ? { scale: [1, 1.05, 1] } : {}}
      transition={isListening ? { repeat: Infinity, duration: 1.5 } : {}}
      onClick={onClick}
      className={`p-5 rounded-full backdrop-blur-xl transition-all duration-300 ${activeClass}`}
      aria-label={isListening ? 'Stop listening' : isSpeaking ? 'Interrupt' : 'Start listening'}
    >
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z"
        />
      </svg>
    </motion.button>
  );
};