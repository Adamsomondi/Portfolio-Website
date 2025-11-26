import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const SpatialMouseEffect = ({ isDark = false }) => {
  const isHoveringRef = useRef(false);
  const outerCursorRef = useRef(null);
  const innerCursorRef = useRef(null);
  
  // Cursor position tracking
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // ULTRA FAST spring - moves faster than mouse!
  const ultraFastConfig = { damping: 15, stiffness: 600, mass: 0.3 };
  const cursorXSpring = useSpring(cursorX, ultraFastConfig);
  const cursorYSpring = useSpring(cursorY, ultraFastConfig);

  // Mouse move handler - instant updates with smooth enter/leave
  useEffect(() => {
    let isMouseInWindow = true;
    
    const moveCursor = (e) => {
      if (isMouseInWindow) {
        cursorX.set(e.clientX - 16);
        cursorY.set(e.clientY - 16);
      }
    };

    const handleMouseEnter = () => {
      isMouseInWindow = true;
    };

    const handleMouseLeave = () => {
      isMouseInWindow = false;
      // Smoothly move cursor off-screen instead of sticky jump
      cursorX.set(-100);
      cursorY.set(-100);
    };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorX, cursorY]);

  // Optimized hover detection
  useEffect(() => {
    let timeout = null;
    
    const handleMouseOver = (e) => {
      const target = e.target;
      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') ||
        target.getAttribute('role') === 'button';
      
      if (isInteractive && !isHoveringRef.current) {
        isHoveringRef.current = true;
        if (outerCursorRef.current && innerCursorRef.current) {
          outerCursorRef.current.style.transform = 'scale(1.8)';
          outerCursorRef.current.style.opacity = '0.4';
          innerCursorRef.current.style.transform = 'translate(13px, 13px) scale(0)';
        }
      }
    };

    const handleMouseOut = (e) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        const target = e.relatedTarget || e.toElement;
        if (!target || (!target.closest('a') && !target.closest('button') && target.tagName !== 'A' && target.tagName !== 'BUTTON')) {
          isHoveringRef.current = false;
          if (outerCursorRef.current && innerCursorRef.current) {
            outerCursorRef.current.style.transform = 'scale(1)';
            outerCursorRef.current.style.opacity = '1';
            innerCursorRef.current.style.transform = 'translate(13px, 13px) scale(1)';
          }
        }
      }, 10);
    };

    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // Keep default cursor visible - no hiding!
  // The dot and circle will follow alongside your normal cursor

  return (
    <>
      {/* Custom Cursor - Outer Circle */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block will-change-transform"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      >
        <div 
          ref={outerCursorRef}
          className={`w-8 h-8 rounded-full border-2 transition-all duration-100 ease-out ${
            isDark ? 'border-white/40' : 'border-blue-500/50'
          }`}
          style={{ 
            transform: 'scale(1)',
            willChange: 'transform, opacity'
          }}
        />
      </motion.div>

      {/* Custom Cursor - Center Dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block will-change-transform"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      >
        <div 
          ref={innerCursorRef}
          className={`w-1.5 h-1.5 rounded-full transition-all duration-100 ease-out ${
            isDark ? 'bg-white' : 'bg-blue-600'
          }`}
          style={{ 
            transform: 'translate(13px, 13px) scale(1)',
            willChange: 'transform'
          }}
        />
      </motion.div>

      {/* Subtle magnetic effect */}
      <style>{`
        @media (min-width: 768px) {
          a, button, [role="button"] {
            transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          
          a:hover, button:hover, [role="button"]:hover {
            transform: scale(1.02);
          }
        }
      `}</style>
    </>
  );
};

export default SpatialMouseEffect;