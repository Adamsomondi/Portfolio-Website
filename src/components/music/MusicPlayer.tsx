import { useEffect, useRef, useState } from 'react';
import { useMusicStore } from '../../stores/musicStore';

// Helper function for media query checks, though CSS media queries are often preferred
// for styling, this is useful for conditional inline styles or logic.
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    checkMobile(); // Check on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
};

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export const MusicPlayer = () => {
  const {
    isVisible,
    isPlaying,
    isBuffering,
    currentTrack,
    queue,
    progress,
    currentTime,
    duration,
    toggle,
    skipNext,
    skipPrev,
    hidePlayer,
    setProgress,
  } = useMusicStore();

  const progressRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [artLoaded, setArtLoaded] = useState(false);
  const isMobile = useIsMobile(); // Check if we're on a mobile viewport

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isVisible) return;
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isVisible, toggle]);

  useEffect(() => {
    setArtLoaded(false);
  }, [currentTrack?.id]);

  if (!isVisible || !currentTrack) return null;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setProgress(Math.max(0, Math.min(100, pct)));
  };

  const currentIdx = queue.findIndex((t) => t.id === currentTrack.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < queue.length - 1;

  // Dynamic positioning based on mobile state
const playerPositionStyles = isMobile
    ? { top: 20, left: 20, right: 20, bottom: 'auto' }
    : { bottom: 20, right: 20, left: 'auto', top: 'auto', width: 400 };

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 99999,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        ...playerPositionStyles, // Apply dynamic position
      }}
    >
      {/* Removed the nebula ambient glow for a truly colorless, transparent look */}

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          maxWidth: isMobile ? 'calc(100vw - 40px)' : '400px', // Responsive max-width
          padding: '10px 16px 10px 10px',
          borderRadius: 18,
          // Fluid, colorless background
          background: 'rgba(255, 255, 255, 0.08)', // Very light, low-opacity white
          backdropFilter: 'blur(30px)', // Increased blur for more fluid effect
          WebkitBackdropFilter: 'blur(30px)',
          // Subtle, almost invisible border
          border: `1px solid ${
            hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'
          }`,
          // Soft, neutral shadow
          boxShadow: hovered
            ? '0 0 24px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)'
            : '0 0 16px rgba(255,255,255,0.02), 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.02)',
          transition: 'all 0.35s ease',
          overflow: 'hidden',
          // Adjust width for mobile to span the space
          width: isMobile ? 'auto' : '100%',
        }}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'rgba(255,255,255,0.05)', // Subtle background
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              // Subtle white gradient for progress
              background: 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.6))',
              borderRadius: '0 2px 2px 0',
              transition: 'width 0.3s linear',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: -1,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.8)', // White thumb
                boxShadow: '0 0 8px rgba(255,255,255,0.4)', // Soft glow
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            />
          </div>
        </div>

        {/* Album art */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: '50%',
              // Colorless conic gradient for the ring
              background: isPlaying
                ? 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.1) 15%, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 65%, rgba(255,255,255,0.1) 80%, transparent 100%)'
                : 'none',
              animation: isPlaying ? 'spin-ring 3s linear infinite' : 'none',
              WebkitMask: 'radial-gradient(transparent 58%, black 60%)',
              mask: 'radial-gradient(transparent 58%, black 60%)',
            }}
          />
          <img
            src={currentTrack.artwork}
            alt=""
            onLoad={() => setArtLoaded(true)}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(255,255,255,0.15)', // Subtle white border
              animation: isPlaying ? 'spin-vinyl 6s linear infinite' : 'none',
              opacity: artLoaded ? 1 : 0.3,
              transition: 'opacity 0.3s',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', // Translucent white center
              border: '1px solid rgba(255,255,255,0.1)', // Subtle border
            }}
          />
        </div>

        {/* Track info */}
        <div style={{ flex: 1, minWidth: 0, padding: '2px 0' }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.9)', // Bright white for readability
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}
          >
            {currentTrack.name}
          </div>
          <div
            style={{
              // Subtle transparent white for artist name
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
              marginTop: 2,
            }}
          >
            {currentTrack.artist}
          </div>
          {hasNext && (
            <div
              style={{
                color: 'rgba(255,255,255,0.3)', // Very subtle for next track
                fontSize: 9,
                marginTop: 3,
                letterSpacing: '0.03em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Next · {queue[currentIdx + 1]?.name}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            onClick={skipPrev}
            disabled={!hasPrev}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: `1px solid ${hasPrev ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
              background: hasPrev ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              color: hasPrev ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)',
              fontSize: 11,
              cursor: hasPrev ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              outline: 'none',
            }}
          >
            ⏮
          </button>

          <button
            onClick={toggle}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.2)',
              background: isPlaying
                ? 'radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.05) 100%)'
                : 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.9)', // White play/pause icon
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.25s ease',
              boxShadow: isPlaying
                ? '0 0 16px rgba(255,255,255,0.08), 0 0 8px rgba(255,255,255,0.04)' // Soft white glow
                : 'none',
              position: 'relative',
              outline: 'none',
            }}
          >
            {isPlaying && (
              <div
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.1)', // Subtle white pulse ring
                  animation: 'pulse-ring 2s ease-out infinite',
                }}
              />
            )}
            <span style={{ position: 'relative', marginLeft: isPlaying ? 0 : 2 }}>
              {isBuffering ? '⏳' : isPlaying ? '⏸' : '▶'}
            </span>
          </button>

          <button
            onClick={skipNext}
            disabled={!hasNext}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: `1px solid ${hasNext ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
              background: hasNext ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              color: hasNext ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)',
              fontSize: 11,
              cursor: hasNext ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              outline: 'none',
            }}
          >
            ⏭
          </button>

          <button
            onClick={hidePlayer}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.2)',
              fontSize: 9,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              outline: 'none',
              marginLeft: 2,
            }}
          >
            ✕
          </button>
        </div>

        {/* Time */}
        <div
          style={{
            position: 'absolute',
            bottom: 3,
            right: 16,
            fontSize: 9,
            color: 'rgba(255,255,255,0.4)', // Subtle white for time
            letterSpacing: '0.03em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fmt(currentTime)} / {fmt(duration)}
        </div>
      </div>

      <style>{`
        @keyframes spin-vinyl {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};