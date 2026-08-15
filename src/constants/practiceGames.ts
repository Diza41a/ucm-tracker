import type { Ionicons } from '@expo/vector-icons';

export type PracticeGameId = 'word-association' | 'feared-fantasy';

export interface PracticeGameDefinition {
  id: PracticeGameId;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const PRACTICE_GAME_ROUTES: Record<PracticeGameId, string> = {
  'word-association': '/(tabs)/practice/word-association',
  'feared-fantasy': '/(tabs)/practice/feared-fantasy',
};

export const PRACTICE_GAMES: PracticeGameDefinition[] = [
  {
    id: 'word-association',
    title: 'Word Association',
    subtitle: 'Conversation agility',
    description:
      'Chain words in free, timed, or conversation-spark modes. Build agility and practice turning word paths into natural dialogue.',
    icon: 'git-network-outline',
  },
  {
    id: 'feared-fantasy',
    title: 'Feared Fantasy',
    subtitle: 'Fear rewiring',
    description:
      'Name an action you avoid, write the specific judgments you fear, and practice curiosity, challenge, or acceptance replies — then go do the thing.',
    icon: 'flash-outline',
  },
];
