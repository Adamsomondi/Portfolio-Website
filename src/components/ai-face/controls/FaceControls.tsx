import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaceStore } from '../../../stores/faceStore';
import { useConversation } from '../../../hooks/ai-face/useConversation';
 import { MicButton } from './MicButton';

interface FaceControlsProps {
  isDark: boolean;
}

export const FaceControls = ({ isDark }: FaceControlsProps) => {
  const { conversationState, aiResponse, isMuted, setIsMuted } = useFaceStore();
  const {
    transcript,
    interimTranscript,
    isListening,
    isSpeaking,
    startConversation,
    endConversation,
    interrupt,
  } = useConversation();

  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (transcript || interimTranscript || aiResponse) {
      setShowTranscript(true);
    }
    const timeout = setTimeout(() => {
      if (conversationState === 'idle' && !isListening) {
        setShowTranscript(false);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [transcript, interimTranscript, aiResponse, conversationState, isListening]);

  const handleMicClick = () => {
    if (isListening) endConversation();
    else if (isSpeaking) interrupt();
    else startConversation();
  };

  const btnClass = isDark
    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
    : 'bg-gray-800 hover:bg-gray-700 text-white shadow-lg shadow-gray-900/20 border border-gray-700';

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      
     {/*<TranscriptPanel
        show={showTranscript}
        transcript={transcript}
        interimTranscript={interimTranscript}
        aiResponse={aiResponse}
        isDark={isDark}
      /> */}

      <div className="absolute bottom-14 left-0 right-0 flex justify-center items-center space-x-4 pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMuted(!isMuted)}
          className={`p-3 rounded-full backdrop-blur-xl transition-all duration-300 ${btnClass}`}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </motion.button>
          
       
       
       <MicButton
  isDark={isDark}
  onTranscript={(text) => console.log('User said:', text)}
  onResponse={(text) => console.log('AI responded:', text)}
/> 

      </div> 
      

      <AnimatePresence>
        {conversationState === 'idle' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute bottom-5 left-0 right-0 text-center text-xs font-medium ${
              isDark ? 'text-white/30' : 'text-gray-600'
            }`}
          >
            Tap the microphone to start a conversation
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};