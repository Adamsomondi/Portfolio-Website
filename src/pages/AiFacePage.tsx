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


  const overlayBtn = isDark
    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
    : 'bg-white/80 hover:bg-white text-gray-900 border border-white/50 shadow-lg shadow-purple-900/20';

  return (
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 w-screen h-screen"
    >
      <FaceScene isDark={isDark} />
      <FaceControls isDark={isDark} />
      <MusicPlayer />
   

      {/* Top bar — back + theme toggle */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
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
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDark(!isDark)}
          className={`pointer-events-auto p-2.5 rounded-full backdrop-blur-xl transition-all duration-300 ${overlayBtn}`}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AiFacePage;