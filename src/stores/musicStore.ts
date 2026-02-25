import { create } from 'zustand';
import { loadYouTubeApi } from '../services/youtube';

export interface Track {
  id: string;
  name: string;
  artist: string;
  artwork: string;
}

const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;

let ytPlayer: any = null;
let progressTimer: ReturnType<typeof setInterval> | null = null;
let initPromise: Promise<void> | null = null;
let isAdvancing = false;

// ── Helpers ──────────────────────────────────────────────

/** Same fingerprint logic as youtube.ts — strips to core song name */
function songFingerprint(name: string, artist: string): string {
  let s = name.toLowerCase();

  const a = artist
    .toLowerCase()
    .replace(/vevo$/i, '')
    .replace(/\s*-\s*topic$/i, '')
    .trim();

  if (a.length > 1) {
    const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp(escaped, 'gi'), '');
  }

  return s
    .replace(/^[^-–—]*\s[-–—]\s+/, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\|.*$/, '')
    .replace(
      /\b(official|music|video|audio|lyrics?|lyric|hd|hq|4k|1080p|720p|visuali[sz]er|live|acoustic|remix|cover|karaoke|instrumental|ft\.?|feat\.?|vevo|topic|full|version)\b/gi,
      ''
    )
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deduplicateTracks(tracks: Track[]): Track[] {
  const seen = new Map<string, Track>();
  for (const track of tracks) {
    // Key is ONLY the song fingerprint — ignores artist/channel
    const key = songFingerprint(track.name, track.artist);
    if (key.length >= 2 && !seen.has(key)) {
      seen.set(key, track);
    }
  }
  return Array.from(seen.values());
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function startProgress() {
  stopProgress();
  progressTimer = setInterval(() => {
    if (!ytPlayer?.getCurrentTime || !ytPlayer?.getDuration) return;
    const cur = ytPlayer.getCurrentTime() || 0;
    const dur = ytPlayer.getDuration() || 0;
    if (dur > 0) {
      useMusicStore.setState({
        currentTime: cur,
        duration: dur,
        progress: (cur / dur) * 100,
      });
    }
  }, 400);
}

function stopProgress() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function findNextUnplayed(
  queue: Track[],
  fromIdx: number,
  playedIds: Set<string>
): number {
  for (let i = fromIdx; i < queue.length; i++) {
    if (!playedIds.has(queue[i].id)) return i;
  }
  return -1;
}

// ── Store ────────────────────────────────────────────────

interface MusicState {
  isVisible: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  isReady: boolean;
  isShuffled: boolean;
  currentTrack: Track | null;
  queue: Track[];
  originalQueue: Track[];
  playedIds: Set<string>;
  progress: number;
  duration: number;
  currentTime: number;

  showPlayer: () => void;
  hidePlayer: () => void;
  initPlayer: () => Promise<void>;
  setTrack: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  setProgress: (p: number) => void;
  toggleShuffle: () => void;
  cleanup: () => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  isVisible: false,
  isPlaying: false,
  isBuffering: false,
  isReady: false,
  isShuffled: false,
  currentTrack: null,
  queue: [],
  originalQueue: [],
  playedIds: new Set<string>(),
  progress: 0,
  duration: 0,
  currentTime: 0,

  showPlayer: () => set({ isVisible: true }),

  hidePlayer: () => {
    get().cleanup();
    set({
      isVisible: false,
      isPlaying: false,
      isBuffering: false,
      currentTrack: null,
      queue: [],
      originalQueue: [],
      playedIds: new Set(),
      progress: 0,
      duration: 0,
      currentTime: 0,
      isShuffled: false,
    });
  },

  initPlayer: async () => {
    if (get().isReady && ytPlayer) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      await loadYouTubeApi();

      let el = document.getElementById('yt-music-host');
      if (!el) {
        el = document.createElement('div');
        el.id = 'yt-music-host';
        Object.assign(el.style, {
          position: 'fixed',
          bottom: '0',
          left: '0',
          width: '1px',
          height: '1px',
          opacity: '0.01',
          pointerEvents: 'none',
          zIndex: '-1',
          overflow: 'hidden',
        });
        document.body.appendChild(el);
      }

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('YT player init timeout'));
        }, 10000);

        try {
          ytPlayer = new (window as any).YT.Player('yt-music-host', {
            height: '1',
            width: '1',
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
              iv_load_policy: 3,
              enablejsapi: 1,
              loop: 0,
              playlist: '',
            },
            events: {
              onReady: () => {
                clearTimeout(timeout);
                console.log('🎵 ✅ Player READY');
                set({ isReady: true });
                resolve();
              },

              onStateChange: (e: any) => {
                const s = e.data;

                // ─── Block YouTube autoplay hijacking ───
                if (s === YT_PLAYING || s === YT_BUFFERING) {
                  const actualId = ytPlayer?.getVideoData?.()?.video_id;
                  const { currentTrack } = get();

                  if (
                    actualId &&
                    currentTrack &&
                    actualId !== currentTrack.id &&
                    !isAdvancing
                  ) {
                    console.log('🎵 🚫 BLOCKED YT autoplay:', actualId);
                    ytPlayer.stopVideo();

                    const { queue, playedIds } = get();
                    const idx = queue.findIndex(
                      (t) => t.id === currentTrack.id
                    );
                    const nextIdx = findNextUnplayed(
                      queue,
                      idx + 1,
                      playedIds
                    );

                    if (nextIdx !== -1) {
                      isAdvancing = true;
                      setTimeout(() => {
                        get().setTrack(queue[nextIdx]);
                        isAdvancing = false;
                      }, 200);
                    } else {
                      set({ progress: 100 });
                    }
                    return;
                  }
                }

                if (s === YT_PLAYING) {
                  set({ isPlaying: true, isBuffering: false });
                  startProgress();
                } else if (s === YT_PAUSED) {
                  set({ isPlaying: false, isBuffering: false });
                  stopProgress();
                } else if (s === YT_BUFFERING) {
                  set({ isBuffering: true });
                } else if (s === YT_ENDED) {
                  ytPlayer?.stopVideo?.();
                  set({ isPlaying: false, isBuffering: false });
                  stopProgress();

                  const { queue, currentTrack, playedIds } = get();
                  const idx = queue.findIndex(
                    (t) => t.id === currentTrack?.id
                  );

                  const newPlayed = new Set(playedIds);
                  if (currentTrack) newPlayed.add(currentTrack.id);
                  set({ playedIds: newPlayed });

                  const nextIdx = findNextUnplayed(
                    queue,
                    idx + 1,
                    newPlayed
                  );

                  if (nextIdx !== -1) {
                    console.log('🎵 ▶ Next:', queue[nextIdx].name);
                    isAdvancing = true;
                    setTimeout(() => {
                      get().setTrack(queue[nextIdx]);
                      isAdvancing = false;
                    }, 300);
                  } else if (queue.length > 1) {
                    console.log('🎵 🔄 All played — reshuffling');
                    const reshuffled = shuffleArray(queue);
                    set({ queue: reshuffled, playedIds: new Set() });
                    isAdvancing = true;
                    setTimeout(() => {
                      get().setTrack(reshuffled[0]);
                      isAdvancing = false;
                    }, 300);
                  } else {
                    set({ progress: 100 });
                  }
                }
              },

              onError: (e: any) => {
                console.error('🎵 ❌ YT Error:', e.data);
                set({ isBuffering: false });

                const { queue, currentTrack, playedIds } = get();
                const idx = queue.findIndex(
                  (t) => t.id === currentTrack?.id
                );
                const newPlayed = new Set(playedIds);
                if (currentTrack) newPlayed.add(currentTrack.id);
                set({ playedIds: newPlayed });

                const nextIdx = findNextUnplayed(
                  queue,
                  idx + 1,
                  newPlayed
                );
                if (nextIdx !== -1) {
                  isAdvancing = true;
                  setTimeout(() => {
                    get().setTrack(queue[nextIdx]);
                    isAdvancing = false;
                  }, 500);
                }
              },
            },
          });
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });
    })();

    return initPromise;
  },

  setTrack: (track) => {
    console.log('🎵 setTrack:', track?.name);
    if (!track?.id) return;

    set({
      currentTrack: track,
      progress: 0,
      currentTime: 0,
      duration: 0,
      isBuffering: true,
    });

    if (ytPlayer?.loadVideoById) {
      try {
        ytPlayer.loadVideoById({ videoId: track.id, startSeconds: 0 });
      } catch (err) {
        console.error('🎵 ❌ loadVideoById threw:', err);
      }
    }
  },

  setQueue: (tracks) => {
    const unique = deduplicateTracks(tracks);
    console.log('🎵 setQueue:', tracks.length, '→', unique.length, 'unique');
    set({ queue: unique, originalQueue: unique, playedIds: new Set() });
  },

  play: () => ytPlayer?.playVideo?.(),
  pause: () => ytPlayer?.pauseVideo?.(),
  toggle: () => (get().isPlaying ? get().pause() : get().play()),

  skipNext: () => {
    const { queue, currentTrack, playedIds } = get();
    const idx = queue.findIndex((t) => t.id === currentTrack?.id);
    const newPlayed = new Set(playedIds);
    if (currentTrack) newPlayed.add(currentTrack.id);
    set({ playedIds: newPlayed });

    const nextIdx = findNextUnplayed(queue, idx + 1, newPlayed);
    if (nextIdx !== -1) {
      get().setTrack(queue[nextIdx]);
    } else if (queue.length > 1) {
      const reshuffled = shuffleArray(queue);
      set({ queue: reshuffled, playedIds: new Set() });
      get().setTrack(reshuffled[0]);
    }
  },

  skipPrev: () => {
    const { queue, currentTrack, currentTime } = get();
    const idx = queue.findIndex((t) => t.id === currentTrack?.id);

    if (currentTime > 3) {
      ytPlayer?.seekTo?.(0, true);
      set({ progress: 0, currentTime: 0 });
      return;
    }

    if (idx > 0) {
      get().setTrack(queue[idx - 1]);
    } else {
      ytPlayer?.seekTo?.(0, true);
      set({ progress: 0, currentTime: 0 });
    }
  },

  setProgress: (p) => {
    const { duration } = get();
    if (ytPlayer?.seekTo && duration > 0) {
      const t = (p / 100) * duration;
      ytPlayer.seekTo(t, true);
      set({ progress: p, currentTime: t });
    }
  },

  toggleShuffle: () => {
    const { isShuffled, originalQueue, currentTrack } = get();
    if (isShuffled) {
      set({ queue: originalQueue, isShuffled: false });
    } else {
      const rest = originalQueue.filter((t) => t.id !== currentTrack?.id);
      const shuffled = currentTrack
        ? [currentTrack, ...shuffleArray(rest)]
        : shuffleArray(rest);
      set({ queue: shuffled, isShuffled: true });
    }
  },

  cleanup: () => {
    stopProgress();
    isAdvancing = false;
    ytPlayer?.stopVideo?.();
  },
}));