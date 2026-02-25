export interface ParsedAction {
  type: 'music_play' | 'music_stop' | 'none';
  query?: string;
}

export function parseAction(input: string): ParsedAction {
  const raw = input.trim();
  const l = raw.toLowerCase();

  console.log('🎵 parseAction input:', l);

  // ── Stop / Pause ─────────────────────────────────────────
  if (/^(stop|pause|mute|stop it|shut up|quiet)$/i.test(l)) {
    console.log('🎵 → music_stop');
    return { type: 'music_stop' };
  }

  if (/\b(stop|pause|turn off|kill|end)\b.{0,10}\b(music|song|track|audio|playing)\b/i.test(l)) {
    console.log('🎵 → music_stop');
    return { type: 'music_stop' };
  }

  // ── Play music ───────────────────────────────────────────
  const playMatch = raw.match(
    /^(?:can you |could you |please |yo |hey |chip )?\s*play\s+(?:me\s+|some\s+|something\s+(?:by|from)\s+)?(.+)/i
  );
  if (playMatch) {
    const query = playMatch[1]
      .replace(/\s*(please|thanks|thank you|for me|on youtube|now)\.?\s*$/i, '')
      .trim();
    if (query.length > 0) {
      console.log('🎵 → music_play:', query);
      return { type: 'music_play', query };
    }
  }

  const putOnMatch = raw.match(
    /^(?:can you |could you |please )?\s*put\s+on\s+(.+)/i
  );
  if (putOnMatch) {
    const query = putOnMatch[1].replace(/\s*(please|thanks)\.?\s*$/i, '').trim();
    if (query.length > 0) {
      console.log('🎵 → music_play (put on):', query);
      return { type: 'music_play', query };
    }
  }

  const listenMatch = raw.match(
    /(?:i\s+(?:want|wanna)\s+(?:to\s+)?(?:listen\s+to|hear)|let(?:'s| me)\s+(?:listen\s+to|hear))\s+(.+)/i
  );
  if (listenMatch) {
    const query = listenMatch[1].replace(/\s*(please|thanks)\.?\s*$/i, '').trim();
    if (query.length > 0) {
      console.log('🎵 → music_play (listen):', query);
      return { type: 'music_play', query };
    }
  }

  console.log('🎵 → none');
  return { type: 'none' };
}