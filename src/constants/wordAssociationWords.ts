/** Conversation-friendly seed words for association practice. */
export const WORD_ASSOCIATION_SEEDS = [
  'coffee',
  'tea',
  'breakfast',
  'lunch',
  'dinner',
  'restaurant',
  'kitchen',
  'recipe',
  'spice',
  'dessert',
  'travel',
  'airport',
  'hotel',
  'beach',
  'mountain',
  'roadtrip',
  'passport',
  'map',
  'weekend',
  'vacation',
  'holiday',
  'morning',
  'evening',
  'sunset',
  'rain',
  'snow',
  'weather',
  'season',
  'spring',
  'summer',
  'music',
  'concert',
  'playlist',
  'guitar',
  'dance',
  'festival',
  'theater',
  'movie',
  'series',
  'podcast',
  'book',
  'library',
  'magazine',
  'article',
  'poem',
  'childhood',
  'memory',
  'nostalgia',
  'family',
  'parent',
  'sibling',
  'friendship',
  'neighbor',
  'community',
  'city',
  'neighborhood',
  'street',
  'park',
  'museum',
  'market',
  'shop',
  'grocery',
  'farm',
  'hobby',
  'craft',
  'photography',
  'painting',
  'writing',
  'gaming',
  'chess',
  'puzzle',
  'fitness',
  'yoga',
  'running',
  'cycling',
  'swimming',
  'hiking',
  'climbing',
  'sport',
  'team',
  'coach',
  'learning',
  'school',
  'class',
  'teacher',
  'student',
  'language',
  'skill',
  'course',
  'work',
  'office',
  'meeting',
  'project',
  'deadline',
  'career',
  'interview',
  'colleague',
  'startup',
  'dream',
  'goal',
  'plan',
  'habit',
  'routine',
  'challenge',
  'success',
  'failure',
  'mistake',
  'lesson',
  'adventure',
  'explore',
  'journey',
  'discovery',
  'surprise',
  'luck',
  'risk',
  'courage',
  'confidence',
  'anxiety',
  'comfort',
  'patience',
  'humor',
  'laughter',
  'smile',
  'compliment',
  'gratitude',
  'kindness',
  'trust',
  'honesty',
  'curiosity',
  'question',
  'story',
  'secret',
  'rumor',
  'news',
  'trend',
  'culture',
  'tradition',
  'ritual',
  'celebration',
  'birthday',
  'wedding',
  'party',
  'toast',
  'gift',
  'technology',
  'phone',
  'app',
  'internet',
  'camera',
  'robot',
  'future',
  'nature',
  'forest',
  'river',
  'ocean',
  'animal',
  'dog',
  'cat',
  'bird',
  'plant',
  'flower',
  'star',
  'moon',
  'space',
  'science',
  'history',
  'politics',
  'art',
  'design',
  'fashion',
  'color',
  'texture',
  'silence',
  'noise',
  'crowd',
  'queue',
  'stranger',
  'conversation',
  'introduction',
  'handshake',
  'glance',
  'boundary',
  'opinion',
  'debate',
  'advice',
  'mentor',
  'volunteer',
  'charity',
  'volunteering',
] as const;

export const WORD_ASSOCIATION_SPRINT_SECONDS = 60;

export const MIN_WORD_GOAL = 3;
export const MAX_WORD_GOAL = 30;

/** Default total words (including seed) for word chain mode. */
export const DEFAULT_CHAIN_WORD_GOAL = 12;

/** Default total words for conversation spark — shorter path for a believable bridge. */
export const DEFAULT_SPARK_WORD_GOAL = 8;

export type WordAssociationMode = 'chain' | 'sprint' | 'spark';

export interface WordAssociationModeConfig {
  label: string;
  title: string;
  body: string;
  /** Word-count goal, if this mode uses one. */
  wordGoal: {
    defaultValue: number;
    /** End the round automatically when the count is reached. */
    autoComplete: boolean;
    setupHint: string;
  } | null;
  /** Fixed time limit in seconds, if this mode is timed. */
  timeGoalSeconds?: number;
}

export const WORD_ASSOCIATION_MODE_CONFIG: Record<
  WordAssociationMode,
  WordAssociationModeConfig
> = {
  chain: {
    label: 'Word chain',
    title: 'Word chain',
    body:
      'Link whatever comes to mind, one word at a time. No timer — build speed and flexibility at your own pace.',
    wordGoal: {
      defaultValue: DEFAULT_CHAIN_WORD_GOAL,
      autoComplete: false,
      setupHint: 'Soft target for the chain. Finish whenever you like, or tap Done.',
    },
  },
  sprint: {
    label: '60s sprint',
    title: 'Timed sprint',
    body:
      'Race the clock. Pack in as many links as you can in 60 seconds — the same quick-thinking reflex you need mid-conversation.',
    wordGoal: null,
    timeGoalSeconds: WORD_ASSOCIATION_SPRINT_SECONDS,
  },
  spark: {
    label: 'Conversation spark',
    title: 'Conversation spark',
    body:
      'A 3-step drill: read a real scene, chain words that fit that conversation, then speak the transition out loud.',
    wordGoal: {
      defaultValue: DEFAULT_SPARK_WORD_GOAL,
      autoComplete: true,
      setupHint: 'Total words in your path (including the first). Default 8 — adjust if you want longer or shorter.',
    },
  },
};

/** @deprecated use WORD_ASSOCIATION_MODE_CONFIG */
export const WORD_ASSOCIATION_MODE_COPY = Object.fromEntries(
  Object.entries(WORD_ASSOCIATION_MODE_CONFIG).map(([key, config]) => [
    key,
    { label: config.label, title: config.title, body: config.body },
  ])
) as Record<WordAssociationMode, { label: string; title: string; body: string }>;

export function getDefaultWordGoalForMode(mode: WordAssociationMode): number {
  return WORD_ASSOCIATION_MODE_CONFIG[mode].wordGoal?.defaultValue ?? DEFAULT_CHAIN_WORD_GOAL;
}

export function modeUsesWordGoal(mode: WordAssociationMode): boolean {
  return WORD_ASSOCIATION_MODE_CONFIG[mode].wordGoal != null;
}
