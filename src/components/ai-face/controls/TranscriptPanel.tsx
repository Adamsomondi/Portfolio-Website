import { AnimatePresence, motion } from 'framer-motion';

interface TranscriptPanelProps {
  show: boolean;
  transcript: string;
  interimTranscript: string;
  aiResponse: string;
  isDark: boolean;
}

export const TranscriptPanel = ({
  show,
  transcript,
  interimTranscript,
  aiResponse,
  isDark,
}: TranscriptPanelProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`absolute bottom-28 left-1/2 -translate-x-1/2 w-[90%] max-w-md p-4 rounded-2xl backdrop-blur-xl pointer-events-auto ${
            isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-900'
          }`}
        >
          {(transcript || interimTranscript) && (
            <div className="mb-2">
              <span className="text-xs font-semibold opacity-50">YOU</span>
              <p className="text-sm mt-1">
                {transcript}
                {interimTranscript && (
                  <span className="opacity-50"> {interimTranscript}</span>
                )}
              </p>
            </div>
          )}
          {aiResponse && (
            <div>
              <span className="text-xs font-semibold opacity-50">AI</span>
              <p className="text-sm mt-1">{aiResponse}</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};