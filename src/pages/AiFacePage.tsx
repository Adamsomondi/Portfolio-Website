// src/pages/AiFacePage.tsx
import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { FaceScene } from '../components/ai-face/FaceScene';
import { FaceControls } from '../components/ai-face/controls/FaceControls';
import { MusicPlayer } from '../components/music/MusicPlayer';

interface LayoutContext {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

const AiFacePage = () => {
  const { isDark, setIsDark } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string>('');

  const overlayBtn = isDark
    ? 'bg-white/8 hover:bg-white/15 text-white/90 border border-white/10 shadow-lg shadow-purple-900/10'
    : 'bg-white/70 hover:bg-white/90 text-gray-800 border border-white/40 shadow-lg shadow-indigo-900/15';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed inset-0 z-50 w-screen h-screen"
    >
      <FaceScene isDark={isDark} />
      <FaceControls isDark={isDark} />
      <MusicPlayer />

      {/* Conversation display */}
      {(transcript || response) && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 max-w-lg w-full px-4">
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-2 p-3 rounded-2xl backdrop-blur-md ${
                isDark
                  ? 'bg-cyan-500/10 text-cyan-100 border border-cyan-400/10'
                  : 'bg-indigo-100/60 text-indigo-900 border border-indigo-200/30'
              }`}
            >
              <span className="text-xs opacity-50">You:</span>
              <p>{transcript}</p>
            </motion.div>
          )}
          {response && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-2xl backdrop-blur-md ${
                isDark
                  ? 'bg-purple-500/10 text-purple-100 border border-purple-400/10'
                  : 'bg-amber-100/60 text-amber-900 border border-amber-200/30'
              }`}
            >
              <span className="text-xs opacity-50">Chip:</span>
              <p>{response}</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/home')}
          className={`pointer-events-auto flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-xl transition-all duration-300 ${overlayBtn}`}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDark(!isDark)}
          className={`pointer-events-auto p-2.5 rounded-full backdrop-blur-xl transition-all duration-300 ${overlayBtn}`}
          aria-label="Toggle dream"
        >
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AiFacePage;