import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { OceanScene } from '../components/ocean/OceanScene';
import { FaceControls } from '../components/ai-face/controls/FaceControls';
import { MusicPlayer } from '../components/music/MusicPlayer';

const OceanFacePage = () => {
  const navigate = useNavigate();
  const isDark = false; // ocean has its own palette

  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.error('Fullscreen API error:', e);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed inset-0 z-50 w-screen h-screen"
    >
      <OceanScene />
      <FaceControls isDark={isDark} />
      <MusicPlayer />

      <AnimatePresence>
        {(transcript || response) && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 max-w-lg w-full px-4">
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-2 p-4 rounded-2xl backdrop-blur-md bg-white/40 text-cyan-900 border border-white/30 shadow-lg"
              >
                <span className="text-xs opacity-50 font-medium">You</span>
                <p className="mt-1">{transcript}</p>
              </motion.div>
            )}
            {response && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl backdrop-blur-md bg-cyan-50/50 text-cyan-900 border border-cyan-200/30 shadow-lg"
              >
                <span className="text-xs opacity-50 font-medium">Chip</span>
                <p className="mt-1">{response}</p>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4 pointer-events-none">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/50 hover:bg-white/70 text-cyan-900 border border-white/40 shadow-lg shadow-cyan-900/10 transition-all duration-300"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      </div>

      <motion.button
        onClick={toggleFullscreen}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.4, ease: 'easeOut' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute bottom-4 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-xl bg-white/50 hover:bg-white/70 text-cyan-900 border border-white/40 shadow-lg shadow-cyan-900/10 transition-all duration-300"
      >
        <span className="text-lg font-medium">{isFullscreen ? '⊡' : '⊞'}</span>
      </motion.button>
    </motion.div>
  );
};

export default OceanFacePage;