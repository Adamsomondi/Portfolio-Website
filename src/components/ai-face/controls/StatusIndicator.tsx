import { motion } from 'framer-motion';
import type { ConversationState } from '../../../stores/faceStore';

interface StatusIndicatorProps {
  conversationState: ConversationState;
  isDark: boolean;
}

const STATUS_MAP: Record<ConversationState, { label: string; color: string }> = {
  idle:      { label: 'Ready', color: 'bg-gray-400' },
  listening: { label: 'Listening…', color: 'bg-green-400' },
  thinking:  { label: 'Thinking…', color: 'bg-yellow-400' },
  speaking:  { label: 'Speaking…', color: 'bg-blue-400' },
};

export const StatusIndicator = ({ conversationState, isDark }: StatusIndicatorProps) => {
  const { label, color } = STATUS_MAP[conversationState];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl pointer-events-auto ${
        isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-gray-900'
      }`}
    >
      <motion.span
        className={`w-2.5 h-2.5 rounded-full ${color}`}
        animate={{ scale: conversationState !== 'idle' ? [1, 1.3, 1] : 1 }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      />
      <span className="text-sm font-medium">{label}</span>
    </motion.div>
  );
};