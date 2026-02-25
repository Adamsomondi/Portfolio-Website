const YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string;

// ── Load IFrame API ────────────────────────────────────────────
let loaded = false;
let loading: Promise<void> | null = null;

export function loadYouTubeApi(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise((resolve) => {
    if ((window as any).YT?.Player) {
      loaded = true;
      resolve();
      return;
    }
    (window as any).onYouTubeIframeAPIReady = () => {
      loaded = true;
      resolve();
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });

  return loading;
}

// ── Search ─────────────────────────────────────────────────────
export interface YTResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

function clean(raw: string): string {
  return raw
    .replace(/\(Official.*?\)/gi, '')
    .replace(/\[Official.*?\]/gi, '')
    .replace(/\(Lyrics?\)/gi, '')
    .replace(/\[Lyrics?\]/gi, '')
    .replace(/\(Audio\)/gi, '')
    .replace(/\[Audio\]/gi, '')
    .replace(/\(Visuali[sz]er\)/gi, '')
    .replace(/\(Music\s*Video\)/gi, '')
    .replace(/\[Music\s*Video\]/gi, '')
    .replace(/\|.*$/, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Strips a YouTube title down to JUST the core song name.
 * Two different uploads of the same song → same string.
 *
 *  "The Weeknd - Blinding Lights (Official Music Video)"  → "blinding lights"
 *  "Blinding Lights (Official Audio)"                      → "blinding lights"
 *  "Blinding Lights Lyrics | The Weeknd"                   → "blinding lights"
 */
function songFingerprint(title: string, channel: string): string {
  let s = title.toLowerCase();

  // Remove channel/artist name from the title so
  // "Lyric Central" uploads and "ArtistVEVO" uploads match
  const artist = channel
    .toLowerCase()
    .replace(/vevo$/i, '')
    .replace(/\s*-\s*topic$/i, '')
    .trim();

  if (artist.length > 1) {
    // Escape for regex safety
    const escaped = artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp(escaped, 'gi'), '');
  }

  s = s
    // Remove "Artist - " prefix (spaced dash/en-dash/em-dash)
    .replace(/^[^-–—]*\s[-–—]\s+/, '')
    // Remove all parenthetical / bracket content
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    // Remove everything after pipe
    .replace(/\|.*$/, '')
    // Remove qualifier words
    .replace(
      /\b(official|music|video|audio|lyrics?|lyric|hd|hq|4k|1080p|720p|visuali[sz]er|live|acoustic|remix|cover|karaoke|instrumental|ft\.?|feat\.?|vevo|topic|full|version)\b/gi,
      ''
    )
    // Keep only letters, numbers, spaces
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return s;
}

export async function searchYouTube(
  query: string,
  limit = 10 // fetch a few extra so we still have results after dedup
): Promise<YTResult[]> {
  if (!YT_KEY) throw new Error('No YouTube API key');

  const params = new URLSearchParams({
    part: 'snippet',
    q: `${query} audio`,
    type: 'video',
    videoCategoryId: '10',
    maxResults: String(limit),
    key: YT_KEY,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('YouTube search failed:', res.status, body);
    throw new Error(`YouTube ${res.status}`);
  }

  const data = await res.json();

  const results: YTResult[] = (data.items || [])
    .filter((i: any) => {
      const vid = i.id?.videoId;
      return vid && typeof vid === 'string' && /^[\w-]{11}$/.test(vid);
    })
    .map((i: any) => ({
      videoId: i.id.videoId,
      title: clean(i.snippet.title),
      channel: i.snippet.channelTitle.replace(/\s*-\s*Topic$/i, ''),
      thumbnail:
        i.snippet.thumbnails?.medium?.url ||
        i.snippet.thumbnails?.default?.url ||
        '',
    }));

  // ─── Deduplicate: one result per unique song ───────────────
  const seen = new Set<string>();
  const unique = results.filter((r) => {
    const key = songFingerprint(r.title, r.channel);
    if (key.length < 2) return false; // garbage title
    if (seen.has(key)) {
      console.log('🎵 Dedup dropped:', r.title, `(fingerprint: "${key}")`);
      return false;
    }
    seen.add(key);
    return true;
  });

  console.log(
    'YouTube search:',
    results.length,
    'raw →',
    unique.length,
    'unique',
    unique.map((r) => `${r.videoId} — ${r.title}`)
  );

  return unique;
}