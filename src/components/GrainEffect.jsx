import React, { useEffect, useRef } from 'react';

const GrainEffect = ({ isDark = false, intensity = 0.15 }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true // Better performance
    });
    
    let frame = 0;

    // Set canvas size to window size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Optimized grain pattern with flowing motion
    const createGrain = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      ctx.clearRect(0, 0, width, height);
      
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      frame += 0.3; // Slower, more subtle animation

      // Sample every 2nd pixel for performance (still looks continuous)
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const index = (y * width + x) * 4;

          // Create subtle flowing waves
          const wave1 = Math.sin((x * 0.006 + frame * 0.02)) * 0.5 + 0.5;
          const wave2 = Math.cos((y * 0.006 + frame * 0.015)) * 0.5 + 0.5;
          const wave3 = Math.sin((x * 0.002 + y * 0.002 + frame * 0.01)) * 0.5 + 0.5;
          
          // Combine waves
          const waveIntensity = (wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.3);

          // Random grain influenced by waves
          const randomValue = Math.random();
          const grainValue = randomValue * waveIntensity;

          // Only render visible grain
          if (grainValue > (1 - intensity * 2)) {
            if (isDark) {
              // Subtle blue-tinted grain for dark mode
              data[index] = Math.floor(grainValue * 80);     // R
              data[index + 1] = Math.floor(grainValue * 120); // G
              data[index + 2] = Math.floor(120 + grainValue * 135); // B
              data[index + 3] = Math.floor(grainValue * 100); // A - more transparent
            } else {
              // Warm subtle grain for light mode
              data[index] = Math.floor(180 + grainValue * 75);     // R
              data[index + 1] = Math.floor(160 + grainValue * 95); // G
              data[index + 2] = Math.floor(80 + grainValue * 120);  // B
              data[index + 3] = Math.floor(grainValue * 80);  // A - more transparent
            }
            
            // Fill adjacent pixel for continuity
            const nextIndex = index + 4;
            if (x + 1 < width) {
              data[nextIndex] = data[index];
              data[nextIndex + 1] = data[index + 1];
              data[nextIndex + 2] = data[index + 2];
              data[nextIndex + 3] = data[index + 3];
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    // Throttled animation loop (30fps instead of 60fps for performance)
    let lastTime = 0;
    const throttle = 1000 / 30; // 30fps

    const animate = (currentTime) => {
      if (currentTime - lastTime >= throttle) {
        createGrain();
        lastTime = currentTime;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate(0);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDark, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 1, // Behind everything except the background
        mixBlendMode: isDark ? 'screen' : 'multiply',
        opacity: 0.4,
        willChange: 'contents',
      }}
      aria-hidden="true"
    />
  );
};

export default GrainEffect;