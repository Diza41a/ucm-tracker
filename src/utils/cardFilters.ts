import type { Card, CardSubcategory, CardType, Story } from '@/src/types';
import { cardHasType } from '@/src/utils/cardTypes';

export type CompletedFilterValue = 'done' | 'not_done';
export type DifficultyFilterValue = 'easy' | 'medium' | 'hard';

/** @deprecated use CompletedFilterValue[] */
export type CompletedFilter = 'all' | CompletedFilterValue;
/** @deprecated use DifficultyFilterValue[] */
export type DifficultyFilter = 'all' | DifficultyFilterValue;

const DIFFICULTY_RANGES: Record<DifficultyFilterValue, [number, number]> = {
  easy: [1, 3],
  medium: [4, 7],
  hard: [8, 10],
};

export type CardFilterState = {
  search: string;
  filterTypeIds: string[];
  filterSubcategoryIds: string[];
  filterCompleted: CompletedFilterValue[];
  filterDifficulties: DifficultyFilterValue[];
  filterStoryId: string | null;
};

export const DEFAULT_CARD_FILTER_STATE: CardFilterState = {
  search: '',
  filterTypeIds: [],
  filterSubcategoryIds: [],
  filterCompleted: [],
  filterDifficulties: [],
  filterStoryId: null,
};

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is string => typeof value === 'string'))];
}

function uniqueCompleted(values: unknown): CompletedFilterValue[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is CompletedFilterValue => value === 'done' || value === 'not_done'))];
}

function uniqueDifficulties(values: unknown): DifficultyFilterValue[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is DifficultyFilterValue => value === 'easy' || value === 'medium' || value === 'hard'))];
}

export function mergeCardFilterState(raw: unknown): CardFilterState {
  if (!raw || typeof raw !== 'object') return DEFAULT_CARD_FILTER_STATE;

  const parsed = raw as Partial<CardFilterState> & {
    filterTypeId?: string | null;
    filterSubcategoryId?: string | null;
    filterCompleted?: CompletedFilter | CompletedFilterValue[];
    filterDifficulty?: DifficultyFilter | DifficultyFilterValue[];
  };

  let filterTypeIds = uniqueStrings(parsed.filterTypeIds);
  if (parsed.filterTypeId) {
    filterTypeIds = uniqueStrings([...filterTypeIds, parsed.filterTypeId]);
  }

  let filterSubcategoryIds = uniqueStrings(parsed.filterSubcategoryIds);
  if (parsed.filterSubcategoryId) {
    filterSubcategoryIds = uniqueStrings([...filterSubcategoryIds, parsed.filterSubcategoryId]);
  }

  let filterCompleted = uniqueCompleted(parsed.filterCompleted);
  if (parsed.filterCompleted === 'done') filterCompleted = ['done'];
  if (parsed.filterCompleted === 'not_done') filterCompleted = ['not_done'];

  let filterDifficulties = uniqueDifficulties(parsed.filterDifficulties);
  if (
    parsed.filterDifficulty &&
    parsed.filterDifficulty !== 'all' &&
    !Array.isArray(parsed.filterDifficulty)
  ) {
    filterDifficulties = uniqueDifficulties([...filterDifficulties, parsed.filterDifficulty]);
  }

  return {
    search: typeof parsed.search === 'string' ? parsed.search : '',
    filterTypeIds,
    filterSubcategoryIds,
    filterCompleted,
    filterDifficulties,
    filterStoryId: typeof parsed.filterStoryId === 'string' ? parsed.filterStoryId : null,
  };
}

export function matchesDifficultyValues(
  difficulty: number,
  filters: DifficultyFilterValue[]
) {
  if (!filters.length) return true;
  return filters.some((filter) => {
    const [min, max] = DIFFICULTY_RANGES[filter];
    return difficulty >= min && difficulty <= max;
  });
}

/** @deprecated */
export function matchesDifficulty(difficulty: number, filter: DifficultyFilter) {
  if (filter === 'all') return true;
  return matchesDifficultyValues(difficulty, [filter]);
}

export function toggleFilterValue<T extends string>(current: T[], value: T): T[] {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

export function formatMultiFilterHint(labels: string[], maxVisible = 2) {
  if (!labels.length) return undefined;
  if (labels.length <= maxVisible) return labels.join(', ');
  return `${labels.slice(0, maxVisible).join(', ')} +${labels.length - maxVisible}`;
}

export function completedFilterLabel(value: CompletedFilterValue) {
  return value === 'done' ? 'Done once' : 'Not yet';
}

export function difficultyFilterLabel(value: DifficultyFilterValue) {
  if (value === 'easy') return '1-3';
  if (value === 'medium') return '4-7';
  return '8-10';
}

export function countActiveCardFilters(filters: CardFilterState): number {
  let count = 0;
  if (filters.search.trim()) count += 1;
  count += filters.filterTypeIds.length;
  count += filters.filterSubcategoryIds.length;
  count += filters.filterCompleted.length;
  count += filters.filterDifficulties.length;
  if (filters.filterStoryId) count += 1;
  return count;
}

export function hasActiveCardFilters(filters: CardFilterState): boolean {
  return countActiveCardFilters(filters) > 0;
}

export function pruneStaleCardFilters(
  filters: CardFilterState,
  cardTypes: CardType[],
  subcategories: CardSubcategory[],
  cards: Card[] = []
): CardFilterState | null {
  const validTypeIds = new Set(cardTypes.map((type) => type.id));
  const validSubcategoryIds = new Set(subcategories.map((subcategory) => subcategory.id));
  const filterTypeIds = filters.filterTypeIds.filter((id) => validTypeIds.has(id));
  const filterSubcategoryIds = filters.filterSubcategoryIds.filter((id) =>
    validSubcategoryIds.has(id)
  );
  let filterStoryId = filters.filterStoryId;
  if (
    filterStoryId &&
    cards.length > 0 &&
    !cards.some((card) => card.stories?.some((story) => story.id === filterStoryId))
  ) {
    filterStoryId = null;
  }

  if (
    filterTypeIds.length === filters.filterTypeIds.length &&
    filterSubcategoryIds.length === filters.filterSubcategoryIds.length &&
    filterStoryId === filters.filterStoryId
  ) {
    return null;
  }

  return {
    ...filters,
    filterTypeIds,
    filterSubcategoryIds,
    filterStoryId,
  };
}

export function filterCards(cards: Card[], filters: CardFilterState): Card[] {
  let result = cards;

  if (filters.filterTypeIds.length) {
    result = result.filter((card) =>
      filters.filterTypeIds.some((typeId) => cardHasType(card, typeId))
    );
  }

  if (filters.filterSubcategoryIds.length) {
    result = result.filter((card) =>
      card.subcategories?.some((subcategory) =>
        filters.filterSubcategoryIds.includes(subcategory.id)
      )
    );
  }

  if (filters.filterCompleted.length) {
    result = result.filter((card) => {
      const value: CompletedFilterValue = card.completed_once ? 'done' : 'not_done';
      return filters.filterCompleted.includes(value);
    });
  }

  if (filters.filterDifficulties.length) {
    result = result.filter((card) =>
      matchesDifficultyValues(card.difficulty, filters.filterDifficulties)
    );
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
        (card.function_purpose?.toLowerCase().includes(q) ?? false) ||
        (card.practice_location_ideas?.toLowerCase().includes(q) ?? false) ||
        (card.subcategories?.some((subcategory) =>
          subcategory.name.toLowerCase().includes(q)
        ) ??
          false) ||
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

export function cardMatchesColumnFilters(card: Card, filters: CardFilterState) {
  if (
    filters.filterTypeIds.length &&
    !filters.filterTypeIds.some((typeId) => cardHasType(card, typeId))
  ) {
    return false;
  }
  if (
    filters.filterSubcategoryIds.length &&
    !card.subcategories?.some((subcategory) =>
      filters.filterSubcategoryIds.includes(subcategory.id)
    )
  ) {
    return false;
  }
  if (filters.filterCompleted.length) {
    const value: CompletedFilterValue = card.completed_once ? 'done' : 'not_done';
    if (!filters.filterCompleted.includes(value)) return false;
  }
  if (!matchesDifficultyValues(card.difficulty, filters.filterDifficulties)) return false;
  if (
    filters.filterStoryId &&
    !card.stories?.some((story) => story.id === filters.filterStoryId)
  ) {
    return false;
  }
  const q = filters.search.trim().toLowerCase();
  if (!q) return true;
  return (
    card.action.toLowerCase().includes(q) ||
    (card.function_purpose?.toLowerCase().includes(q) ?? false) ||
    (card.practice_location_ideas?.toLowerCase().includes(q) ?? false) ||
    (card.subcategories?.some((subcategory) => subcategory.name.toLowerCase().includes(q)) ??
      false) ||
    (card.stories?.some((story) => story.name.toLowerCase().includes(q)) ?? false)
  );
}
