import { searchYouTube } from '../../../services/youtube';
import type { Track } from '../../../stores/musicStore';

/**
 * Builds a radio-style queue:
 *  1. Search the exact song → grab the #1 result as seed
 *  2. Search the artist name → get their other songs
 *  3. Search "music like [artist]" → get related artists
 */
export async function searchTracks(query: string): Promise<Track[]> {
  console.log('🎵 searchTracks called:', query);

  // ── 1. Find the exact song requested ──────────────────
  const exact = await searchYouTube(query, 5);
  if (exact.length === 0) return [];

  const seed = exact[0];

  // Clean the artist name from the channel
  const artist = seed.channel
    .replace(/VEVO$/i, '')
    .replace(/\s*-\s*Topic$/i, '')
    .trim();

  console.log('🎵 Seed track:', seed.title, '| Artist:', artist);

  // ── 2. Get more songs from the same artist ────────────
  let artistResults: Awaited<ReturnType<typeof searchYouTube>> = [];
  try {
    artistResults = await searchYouTube(`${artist} songs`, 10);
    console.log('🎵 Artist search returned:', artistResults.length);
  } catch (e) {
    console.warn('🎵 Artist search failed:', e);
  }

  // ── 3. Get songs from related / similar artists ───────
  let relatedResults: Awaited<ReturnType<typeof searchYouTube>> = [];
  try {
    relatedResults = await searchYouTube(`${artist} type beat music`, 8);
    console.log('🎵 Related search returned:', relatedResults.length);
  } catch (e) {
    console.warn('🎵 Related search failed:', e);
  }

  // ── Combine: seed first, artist catalog, then related ─
  const seenIds = new Set<string>();
  const combined: typeof exact = [];

  // Seed song is ALWAYS first
  for (const r of [seed, ...exact.slice(1), ...artistResults, ...relatedResults]) {
    if (!seenIds.has(r.videoId)) {
      seenIds.add(r.videoId);
      combined.push(r);
    }
  }

  const tracks = combined.map((r) => ({
    id: r.videoId,
    name: r.title,
    artist: r.channel,
    artwork: r.thumbnail,
  }));

  console.log('🎵 Built radio queue:', tracks.length, 'tracks');
  console.log('🎵 Queue:', tracks.map((t) => `${t.artist} — ${t.name}`));

  return tracks;
}

export function buildMusicResponse(tracks: Track[], query: string): string {
  return tracks.length > 0 ? 'on it' : `nothing for "${query}"`;
}