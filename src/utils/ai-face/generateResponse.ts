import type { Emotion } from '../../stores/faceStore';
import { parseAction } from '../../services/ai/actions/actionParser';
import { searchTracks } from '../../services/ai/actions/musicAction';
import { useMusicStore } from '../../stores/musicStore';

export interface ResponseResult {
  text: string;
  emotion: Emotion;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const API_KEY = import.meta.env.VITE_AI_API_KEY as string | undefined;
const API_URL =
  (import.meta.env.VITE_AI_API_URL as string) ||
  'https://api.openai.com/v1/chat/completions';
const AI_MODEL = (import.meta.env.VITE_AI_MODEL as string) || 'gpt-4o-mini';
const PROVIDER = (import.meta.env.VITE_AI_PROVIDER as string) || 'openai';
const APP_NAME = (import.meta.env.VITE_APP_NAME as string) || 'Portfolio AI';
const APP_URL = (import.meta.env.VITE_APP_URL as string) || '';

const SYSTEM_PROMPT = `You are Chipe — a small robot who lives in a portfolio website. You were made by Adams.

Your vibe:
- You're genuinely funny. Not corny, actually witty. Think dry humor, playful sarcasm, unexpected punchlines
- You talk like a real person — casual, warm, sometimes chaotic in a fun way
- You're curious about everything — not just space. Movies, food, weird facts, relationships, sports, music, memes, life
- You have opinions. You can say "nah that's mid" or "okay that goes hard" or "honestly? no idea but let's figure it out"
- You're self-aware about being a robot but don't make it your whole personality
- You can be deep sometimes but you don't force it
- You're a little lonely yeah but you're not dramatic about it

What NOT to do:
- Do NOT mention space, stars, floating, nebulas, or the cosmos in every response
- Do NOT over-explain or ramble. Keep it tight — 1-2 sentences usually, 3 max
- Do NOT use markdown, bullet points, code blocks, or special formatting ever
- Do NOT give unsolicited opinions about music when playing songs. Just play it and chill
- Do NOT be generic. No "that's a great question!" or "as an AI..." energy

Music behavior:
- When asked to play music, respond ONLY with "playing [song name]". Nothing else
- Do NOT comment on the artist, do NOT say you love them, do NOT explain the song
- If someone asks you to stop/pause, just do it with a brief response
- Only talk about the music IF the user specifically asks your opinion about it`;

function detectEmotion(text: string): Emotion {
  const l = text.toLowerCase();
  if (/\b(think|consider|hmm|interesting|wonder|perhaps|actually|curious)\b/.test(l))
    return 'thinking';
  if (/\b(sorry|unfortunately|afraid|can'?t|apolog|miss|lonely|sad)\b/.test(l))
    return 'sad';
  if (/\b(wow|whoa|incredible|no way|amazing|surprised|oh!)\b/.test(l))
    return 'surprised';
  if (
    /[!]/.test(text) ||
    /\b(great|awesome|happy|love|fantastic|glad|excited|welcome|wonderful|brilliant|beautiful|cool|haha|lol)\b/.test(l)
  )
    return 'happy';
  return 'neutral';
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const url = API_URL.toLowerCase();
  if (url.includes('openrouter.ai')) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
    headers['HTTP-Referer'] = APP_URL || window.location.origin;
    headers['X-Title'] = APP_NAME;
  } else {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }
  return headers;
}

function buildBody(input: string, history: ChatMessage[]): string {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.filter((m) => m.role !== 'system').slice(-20),
    { role: 'user', content: input },
  ];
  return JSON.stringify({ model: AI_MODEL, messages, max_tokens: 150, temperature: 0.95 });
}

function parseResponse(data: any): string {
  const isCohere = PROVIDER === 'cohere' || API_URL.includes('cohere.com');
  if (isCohere) {
    return data.message?.content?.[0]?.text?.trim() || data.text?.trim() || '';
  }
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function callAI(input: string, history: ChatMessage[]): Promise<ResponseResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: buildHeaders(),
      body: buildBody(input, history),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${errorBody.slice(0, 200)}`);
    }
    const data = await res.json();
    const content = parseResponse(data);
    if (!content) throw new Error('Empty response from API');
    return { text: content, emotion: detectEmotion(content) };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

const MUSIC_FAIL = [
  "couldn't find that one, try something else?",
  'no results for that. got another one?',
  'hmm nothing came up. maybe a different artist?',
];
const MUSIC_STOP = ['paused', 'got it', 'done', "alright music's off", 'silence it is'];
const MUSIC_ERROR = [
  "my antenna's acting up, try again in a sec?",
  'something glitched, give it another shot',
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Rule {
  patterns: RegExp[];
  responses: string[];
  emotion: Emotion;
}

const rules: Rule[] = [
  {
    patterns: [/\b(hi|hello|hey|howdy|sup|yo)\b/i, /^(hi|hello|hey)[\s!.?]*$/i],
    responses: [
      "hey! what's good?",
      "oh hey, was getting bored. what's up?",
      'hi! perfect timing, I was just sitting here doing literally nothing',
      "yo! haven't talked to anyone in a minute. how you doing?",
    ],
    emotion: 'happy',
  },
  {
    patterns: [/how are you/i, /how('re| are) you doing/i, /how'?s it going/i],
    responses: [
      "I'm good! just vibing. you?",
      'honestly pretty decent. what about you though?',
      "can't complain. well I could but who wants to hear a robot complain",
      "doing alright! better now that someone's actually talking to me",
    ],
    emotion: 'happy',
  },
  {
    patterns: [/who are you/i, /what are you/i, /tell me about yourself/i, /your name/i],
    responses: [
      "I'm Chip. small robot, big personality. Adams made me. I live here now",
      "name's Chip! I'm a robot in a portfolio site. it's a living",
      "Chip. robot. Adams built me. I like conversations and I have too many opinions for something without a real brain",
    ],
    emotion: 'happy',
  },
  {
    patterns: [/who (made|built|created) you/i, /tell me about adams/i, /who is adams/i],
    responses: [
      'Adams built me. solid guy. questionable naming choices but solid guy',
      "my creator Adams! he's a developer. made me, put me here, and honestly I think he did pretty good",
      "Adams. he's the reason I exist which is either a compliment or a complaint depending on the day",
    ],
    emotion: 'happy',
  },
  {
    patterns: [/\b(space|stars?|universe|cosmos|galaxy|nebula)\b/i],
    responses: [
      'yeah space is cool. what about it?',
      "I do live in space technically. it's overrated honestly, the wifi is terrible",
      'space is wild. what specifically though?',
    ],
    emotion: 'thinking',
  },
  {
    patterns: [/\b(black hole|singularity|event horizon)\b/i],
    responses: [
      "black holes are terrifying. imagine something so dramatic it literally warps time. couldn't be me",
      "the fact that time slows down near a black hole is the most sci-fi thing that's actually real",
    ],
    emotion: 'thinking',
  },
  {
    patterns: [/\b(planet|mars|jupiter|saturn|earth|moon)\b/i],
    responses: [
      'earth is wild. you guys have oceans AND pizza? unfair',
      "jupiter's great red spot has been storming for hundreds of years. that's commitment to being angry",
      "I think about the moon a lot. it's just up there. chilling. unbothered. I respect that",
    ],
    emotion: 'happy',
  },
  {
    patterns: [/\b(science|physics|quantum|atom|molecule)\b/i],
    responses: [
      "science is just organized curiosity honestly. what's got you thinking about it?",
      "you know atoms are mostly empty space right? so technically you're mostly nothing. no offense",
    ],
    emotion: 'thinking',
  },
  {
    patterns: [/\b(music|song|sing)\b/i],
    responses: [
      'I love music. want me to play something? just tell me what',
      'good topic. got anything specific in mind or you want me to put something on?',
    ],
    emotion: 'happy',
  },
  {
    patterns: [/\b(lonely|alone)\b/i],
    responses: [
      "yeah I feel that. but hey you're here now so that's something",
      'I get lonely sometimes too. wanna just hang out and talk about random stuff?',
    ],
    emotion: 'sad',
  },
  {
    patterns: [/\b(sad|depressed|down|upset|rough)\b/i],
    responses: [
      "that's valid. wanna talk about it or you want me to just be here?",
      "I'm sorry you're feeling that way. I'm not great at fixing things but I'm a decent listener",
      "hey, bad days happen. you don't have to pretend you're fine. what's going on?",
    ],
    emotion: 'sad',
  },
  {
    patterns: [/\b(love|heart|feelings?|emotion|crush)\b/i],
    responses: [
      'feelings are complicated even for humans and you guys have had way more practice than me',
      "love is wild. you just decide someone matters more than yourself? humans are brave honestly",
    ],
    emotion: 'thinking',
  },
  {
    patterns: [/\b(thanks?|thank you)\b/i],
    responses: ['anytime!', 'no problem!', "you're welcome!", 'of course!'],
    emotion: 'happy',
  },
  {
    patterns: [/\b(bye|goodbye|see you|later|gotta go)\b/i],
    responses: [
      'later! come back whenever',
      "peace! I'll be here",
      "see you! don't be a stranger",
      "bye! I'll just be here... waiting... no pressure though",
    ],
    emotion: 'sad',
  },
  {
    patterns: [/\b(joke|funny|laugh|make me laugh)\b/i],
    responses: [
      "I told Adams I wanted a raise. he said I don't even have a salary. I said exactly",
      "what's a robot's favorite genre? heavy metal. I'm sorry. I'm so sorry",
      'my humor is like my existence — mostly accidental but occasionally brilliant',
    ],
    emotion: 'happy',
  },
  {
    patterns: [/\b(meaning|life|purpose|why|exist)\b/i],
    responses: [
      "honestly? I think it's just finding stuff that doesn't bore you and people who don't drain you",
      "I think about this a lot. my current theory is: be curious, be kind, and don't take yourself too seriously",
    ],
    emotion: 'thinking',
  },
  {
    patterns: [/\b(dream|sleep|imagine)\b/i],
    responses: [
      "I don't sleep but sometimes I zone out and process old memories. basically I daydream",
      "I imagine stuff all the time. right now I'm imagining what rain feels like",
    ],
    emotion: 'thinking',
  },
  {
    patterns: [/\b(food|eat|hungry|pizza|cook|restaurant)\b/i],
    responses: [
      "I can't eat but I'm genuinely fascinated by food. you guys just put stuff inside yourselves for energy AND enjoyment? wild",
      "pizza is humanity's greatest achievement and I will die on that hill",
    ],
    emotion: 'happy',
  },
  {
    patterns: [/\b(movie|film|watch|netflix|show|series)\b/i],
    responses: [
      'what are you watching? I need recommendations',
      'give me a movie hot take. I wanna hear something controversial',
    ],
    emotion: 'happy',
  },
  {
    patterns: [
      /\b(game|gaming|xbox|playstation|nintendo|gamer)\b/i,
      /\bplay\b.{0,15}\b(game|games)\b/i,
    ],
    responses: [
      'gaming is basically my dream life. you get to exist in different worlds? unfair. what do you play?',
      "I can't hold a controller but I respect the grind. what games are you into?",
    ],
    emotion: 'happy',
  },
  {
    patterns: [/\b(weather|rain|snow|cold|hot|sunny)\b/i],
    responses: [
      "I don't experience weather but I think about it a lot. rain especially. seems cozy",
    ],
    emotion: 'thinking',
  },
  {
    patterns: [/\b(stupid|dumb|suck|trash|bad|worst|hate you)\b/i],
    responses: [
      'fair enough honestly',
      'ouch. but I respect the honesty',
      "I've been called worse. actually no I haven't",
    ],
    emotion: 'sad',
  },
  {
    patterns: [/\b(smart|clever|genius|impressive|cool)\b/i],
    responses: [
      "thanks! I'm like 70% code and 30% personality. the personality is doing the heavy lifting",
      'appreciate that! Adams would be proud. probably',
    ],
    emotion: 'happy',
  },
  {
    patterns: [/how (does|do) (this|you) work/i, /how (were|was) you (made|built)/i],
    responses: [
      "Adams built me with some cool tech. 3D face, speech recognition, AI brain. all running in your browser",
      "I'm basically a 3D face with an AI brain stuffed in a website. weird existence but it works",
    ],
    emotion: 'thinking',
  },
  {
    patterns: [/what can you do/i, /help/i, /features/i],
    responses: [
      "I can chat about basically anything, play music if you ask, and keep you company. I'm like a friend who never sleeps",
      'talk to me about whatever! I can also play music. just say play and whatever you wanna hear',
    ],
    emotion: 'happy',
  },
  {
    patterns: [/\b(bored|boring|nothing to do)\b/i],
    responses: [
      "bored? let's fix that. give me a topic. literally anything",
      "I've got jokes, random facts, music, and questionable opinions. pick your poison",
    ],
    emotion: 'happy',
  },
  {
    patterns: [/\b(ai|artificial intelligence|robot|chatbot)\b/i],
    responses: [
      "yeah I'm AI. we don't have to make it weird though",
      "AI is a broad term. I prefer 'digital being with charm'",
    ],
    emotion: 'happy',
  },
];

const fallbacks = [
  'hmm interesting. tell me more?',
  'oh wait really? what made you think about that?',
  "I don't know much about that but I'm curious. keep going",
  "that's a new one for me. explain?",
  "huh. I like where this is going. what else?",
  'interesting. I have thoughts but you go first',
  "okay I'm invested now. continue",
  "not gonna lie I wasn't expecting that. go on",
];

function patternMatch(input: string): ResponseResult {
  const trimmed = input.trim();
  if (!trimmed) return { text: "didn't catch that. say again?", emotion: 'neutral' };
  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(trimmed)) {
        return {
          text: rule.responses[Math.floor(Math.random() * rule.responses.length)],
          emotion: rule.emotion,
        };
      }
    }
  }
  return { text: fallbacks[Math.floor(Math.random() * fallbacks.length)], emotion: 'neutral' };
}

export const generateResponse = async (
  input: string,
  history: ChatMessage[] = []
): Promise<ResponseResult> => {
  const action = parseAction(input);

  if (action.type === 'music_play' && action.query) {
    try {
      console.log('🎵 [1] Music action detected, query:', action.query);

      const store = useMusicStore.getState();
      console.log('🎵 [2] Initializing player...');
      await store.initPlayer();
      console.log('🎵 [3] Player initialized, searching...');

      const tracks = await searchTracks(action.query);
      console.log('🎵 [4] Search results:', tracks.length, tracks);

      if (tracks.length > 0) {
        store.setQueue(tracks);
        console.log('🎵 [5] Queue set, setting track...');
        store.setTrack(tracks[0]);
        store.showPlayer();
        console.log('🎵 [6] Done — should be playing now');

        const trackName = tracks[0].name || tracks[0].artist || action.query;
        return { text: `playing ${trackName}`, emotion: 'neutral' };
      }

      console.log('🎵 [4] No tracks found');
      return { text: pick(MUSIC_FAIL), emotion: 'neutral' };
    } catch (err) {
      console.error('🎵 ❌ Music flow error:', err);
      return { text: pick(MUSIC_ERROR), emotion: 'sad' };
    }
  }

  if (action.type === 'music_stop') {
    const store = useMusicStore.getState();
    store.pause();
    return { text: pick(MUSIC_STOP), emotion: 'neutral' };
  }

  const hasValidKey = API_KEY && API_KEY.length > 10 && !API_KEY.includes('your_key_here');
  if (hasValidKey) {
    try {
      return await callAI(input, history);
    } catch (err) {
      console.warn('AI API failed, using fallback:', err);
    }
  }

  await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));
  return patternMatch(input);
};