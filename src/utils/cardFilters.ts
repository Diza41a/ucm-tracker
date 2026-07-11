import type { Card, Story } from '@/src/types';

export type CompletedFilter = 'all' | 'done' | 'not_done';
export type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

const DIFFICULTY_RANGES: Record<Exclude<DifficultyFilter, 'all'>, [number, number]> = {
  easy: [1, 3],
  medium: [4, 7],
  hard: [8, 10],
};

export function matchesDifficulty(difficulty: number, filter: DifficultyFilter) {
  if (filter === 'all') return true;
  const [min, max] = DIFFICULTY_RANGES[filter];
  return difficulty >= min && difficulty <= max;
}

export type CardFilterState = {
  search: string;
  filterTypeId: string | null;
  filterCompleted: CompletedFilter;
  filterDifficulty: DifficultyFilter;
  filterStoryId: string | null;
};

export function filterCards(cards: Card[], filters: CardFilterState): Card[] {
  let result = cards;

  if (filters.filterTypeId) {
    result = result.filter((card) => card.card_type_id === filters.filterTypeId);
  }

  if (filters.filterCompleted === 'done') {
    result = result.filter((card) => card.completed_once);
  } else if (filters.filterCompleted === 'not_done') {
    result = result.filter((card) => !card.completed_once);
  }

  if (filters.filterDifficulty !== 'all') {
    result = result.filter((card) => matchesDifficulty(card.difficulty, filters.filterDifficulty));
  }

  if (filters.filterStoryId) {
    result = result.filter((card) =>
      card.stories?.some((story) => story.id === filters.filterStoryId)
    );
  }

  const q = filters.search.toLowerCase().trim();
  if (q) {
    result = result.filter(
      (card) =>
        card.action.toLowerCase().includes(q) ||
        card.function_purpose.toLowerCase().includes(q) ||
        (card.practice_location_ideas?.toLowerCase().includes(q) ?? false) ||
        (card.stories?.some((story) => story.name.toLowerCase().includes(q)) ?? false)
    );
  }

  return result;
}

export function getLinkedStoriesFromCards(cards: Card[]): Story[] {
  const byId = new Map<string, Story>();
  cards.forEach((card) => {
    card.stories?.forEach((story) => {
      if (!byId.has(story.id)) byId.set(story.id, story);
    });
  });
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
