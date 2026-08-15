import type { Card, CardSubcategory, CardType } from '@/src/types';
import {
  type CardFilterState,
  cardMatchesColumnFilters,
  DEFAULT_CARD_FILTER_STATE,
  filterCards,
} from '@/src/utils/cardFilters';
import { forEachCardTypeId, getCardTypeIds, getCardTypes, primaryCardTypeName } from '@/src/utils/cardTypes';

export type CardTableGroupBy = 'none' | 'type' | 'subcategory';
export type CardTableSubgroupBy = 'none' | 'type' | 'subcategory';
export type CardTableSortField =
  | 'action'
  | 'difficulty'
  | 'type'
  | 'subcategory'
  | 'updated_at'
  | 'completed_once';

export type CardTableColumnKey = 'action' | 'type' | 'subcategory' | 'difficulty' | 'done';

export type CardTableSortLevel = {
  field: CardTableSortField;
  direction: 'asc' | 'desc';
};

export type CardTableColumnWidths = Record<CardTableColumnKey, number>;

export const CARD_TABLE_PAGE_SIZES = [25, 50, 100] as const;
export type CardTablePageSize = (typeof CARD_TABLE_PAGE_SIZES)[number];

export type CardPoolViewMode = 'list' | 'table';

export type CardTableSettings = {
  poolViewMode: CardPoolViewMode;
  groupBy: CardTableGroupBy;
  subgroupBy: CardTableSubgroupBy;
  sortLevels: CardTableSortLevel[];
  columnFilters: CardFilterState;
  columnWidths: CardTableColumnWidths;
  pageSize: CardTablePageSize;
};

export const DEFAULT_CARD_TABLE_COLUMN_WIDTHS: CardTableColumnWidths = {
  action: 260,
  type: 136,
  subcategory: 160,
  difficulty: 88,
  done: 80,
};

export const CARD_TABLE_COLUMN_MIN_WIDTHS: CardTableColumnWidths = {
  action: 140,
  type: 88,
  subcategory: 104,
  difficulty: 64,
  done: 56,
};

export const DEFAULT_CARD_TABLE_SETTINGS: CardTableSettings = {
  poolViewMode: 'list',
  groupBy: 'none',
  subgroupBy: 'none',
  sortLevels: [],
  columnFilters: DEFAULT_CARD_FILTER_STATE,
  columnWidths: DEFAULT_CARD_TABLE_COLUMN_WIDTHS,
  pageSize: 25,
};

export const CARD_TABLE_SETTINGS_KEY = 'ucm_tracker_card_table_settings_v2';

/** @deprecated use settings.columnWidths */
export const CARD_TABLE_COLUMNS = DEFAULT_CARD_TABLE_COLUMN_WIDTHS;

export type CardTableRowItem =
  | { kind: 'header' }
  | {
      kind: 'group';
      key: string;
      label: string;
      count: number;
      bgColor?: string;
      textColor?: string;
    }
  | {
      kind: 'subgroup';
      key: string;
      label: string;
      count: number;
      bgColor?: string;
      textColor?: string;
    }
  | { kind: 'card'; key: string; card: Card };

const GROUP_LABELS: Record<CardTableGroupBy, string> = {
  none: 'Off',
  type: 'Type',
  subcategory: 'Subcategory',
};

const SUBGROUP_LABELS: Record<CardTableSubgroupBy, string> = {
  none: 'Off',
  type: 'Type',
  subcategory: 'Subcategory',
};

const NO_SUBCATEGORY_LABEL = 'No subcategory';
const NO_TYPE_LABEL = 'No type';

const SORT_LABELS: Record<CardTableSortField, string> = {
  action: 'Card',
  difficulty: 'Diff',
  type: 'Type',
  subcategory: 'Sub',
  updated_at: 'Updated',
  completed_once: 'Done',
};

function typeAccent(type: CardType) {
  return { bgColor: type.bg_color, textColor: type.text_color };
}

export function cardTableGroupLabel(value: CardTableGroupBy) {
  return GROUP_LABELS[value];
}

export function cardTableSubgroupLabel(value: CardTableSubgroupBy) {
  return SUBGROUP_LABELS[value];
}

export const CARD_POOL_SORT_FIELDS: CardTableSortField[] = [
  'action',
  'difficulty',
  'type',
  'subcategory',
  'updated_at',
  'completed_once',
];

export function cardTableSortLabel(value: CardTableSortField) {
  return SORT_LABELS[value];
}

const SORT_FIELDS = new Set<CardTableSortField>([
  'action',
  'difficulty',
  'type',
  'subcategory',
  'updated_at',
  'completed_once',
]);

function isSortField(value: unknown): value is CardTableSortField {
  return typeof value === 'string' && SORT_FIELDS.has(value as CardTableSortField);
}

export function mergeSortLevels(
  raw: unknown,
  legacy?: { sortField?: unknown; sortDirection?: unknown }
): CardTableSortLevel[] {
  if (Array.isArray(raw)) {
    const levels: CardTableSortLevel[] = [];
    const seen = new Set<CardTableSortField>();

    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const field = (item as CardTableSortLevel).field;
      const direction = (item as CardTableSortLevel).direction;
      if (!isSortField(field) || (direction !== 'asc' && direction !== 'desc')) continue;
      if (seen.has(field)) continue;
      seen.add(field);
      levels.push({ field, direction });
      if (levels.length >= 2) break;
    }

    return levels;
  }

  if (legacy?.sortField && isSortField(legacy.sortField)) {
    return [
      {
        field: legacy.sortField,
        direction: legacy.sortDirection === 'desc' ? 'desc' : 'asc',
      },
    ];
  }

  return [];
}

export function cycleSortLevels(
  levels: CardTableSortLevel[],
  field: CardTableSortField
): CardTableSortLevel[] {
  const index = levels.findIndex((level) => level.field === field);

  if (index === 0) {
    return [
      { ...levels[0], direction: levels[0].direction === 'asc' ? 'desc' : 'asc' },
      ...levels.slice(1),
    ];
  }

  if (index === 1) {
    return [
      levels[0],
      { ...levels[1], direction: levels[1].direction === 'asc' ? 'desc' : 'asc' },
    ];
  }

  const next: CardTableSortLevel[] = [{ field, direction: 'asc' }];
  if (levels[0]?.field !== field) {
    next.push(levels[0]);
  }
  return next.slice(0, 2);
}

export function getSortLevelForField(
  levels: CardTableSortLevel[],
  field: CardTableSortField
): { order: 1 | 2; direction: 'asc' | 'desc' } | null {
  const index = levels.findIndex((level) => level.field === field);
  if (index < 0) return null;
  return { order: (index + 1) as 1 | 2, direction: levels[index].direction };
}

export function normalizePageSize(value: unknown): CardTablePageSize {
  if (value === 50 || value === 100) return value;
  return 25;
}

function sortLevelsEqual(a: CardTableSortLevel[], b: CardTableSortLevel[]) {
  if (a.length !== b.length) return false;
  return a.every(
    (level, index) =>
      level.field === b[index]?.field && level.direction === b[index]?.direction
  );
}

function columnWidthsEqual(a: CardTableColumnWidths, b: CardTableColumnWidths) {
  return (Object.keys(a) as CardTableColumnKey[]).every((key) => a[key] === b[key]);
}

function filtersEqual(a: CardFilterState, b: CardFilterState) {
  return (
    a.search === b.search &&
    a.filterStoryId === b.filterStoryId &&
    a.filterTypeIds.length === b.filterTypeIds.length &&
    a.filterTypeIds.every((id, index) => id === b.filterTypeIds[index]) &&
    a.filterSubcategoryIds.length === b.filterSubcategoryIds.length &&
    a.filterSubcategoryIds.every((id, index) => id === b.filterSubcategoryIds[index]) &&
    a.filterCompleted.length === b.filterCompleted.length &&
    a.filterCompleted.every((value, index) => value === b.filterCompleted[index]) &&
    a.filterDifficulties.length === b.filterDifficulties.length &&
    a.filterDifficulties.every((value, index) => value === b.filterDifficulties[index])
  );
}

export function hasCustomCardTableSettings(settings: CardTableSettings) {
  const defaults = DEFAULT_CARD_TABLE_SETTINGS;
  if (settings.poolViewMode !== defaults.poolViewMode) return true;
  if (settings.groupBy !== defaults.groupBy || settings.subgroupBy !== defaults.subgroupBy) {
    return true;
  }
  if (!sortLevelsEqual(settings.sortLevels, defaults.sortLevels)) return true;
  if (settings.pageSize !== defaults.pageSize) return true;
  if (!columnWidthsEqual(settings.columnWidths, defaults.columnWidths)) return true;
  if (!filtersEqual(settings.columnFilters, defaults.columnFilters)) return true;
  return false;
}

export function normalizeGroupSettings(
  groupBy: CardTableGroupBy,
  subgroupBy: CardTableSubgroupBy
): { groupBy: CardTableGroupBy; subgroupBy: CardTableSubgroupBy } {
  if (groupBy === 'none') {
    return { groupBy, subgroupBy: 'none' };
  }
  if (subgroupBy === groupBy) {
    return { groupBy, subgroupBy: 'none' };
  }
  return { groupBy, subgroupBy };
}

export function mergeColumnWidths(raw: unknown): CardTableColumnWidths {
  if (!raw || typeof raw !== 'object') return DEFAULT_CARD_TABLE_COLUMN_WIDTHS;
  const parsed = raw as Partial<CardTableColumnWidths>;
  return {
    action: clampColumnWidth('action', parsed.action ?? DEFAULT_CARD_TABLE_COLUMN_WIDTHS.action),
    type: clampColumnWidth('type', parsed.type ?? DEFAULT_CARD_TABLE_COLUMN_WIDTHS.type),
    subcategory: clampColumnWidth(
      'subcategory',
      parsed.subcategory ?? DEFAULT_CARD_TABLE_COLUMN_WIDTHS.subcategory
    ),
    difficulty: clampColumnWidth(
      'difficulty',
      parsed.difficulty ?? DEFAULT_CARD_TABLE_COLUMN_WIDTHS.difficulty
    ),
    done: clampColumnWidth('done', parsed.done ?? DEFAULT_CARD_TABLE_COLUMN_WIDTHS.done),
  };
}

export function clampColumnWidth(key: CardTableColumnKey, value: number) {
  return Math.max(CARD_TABLE_COLUMN_MIN_WIDTHS[key], Math.round(value));
}

export function getVisibleTableColumns(
  _groupBy?: CardTableGroupBy,
  _subgroupBy?: CardTableSubgroupBy
): CardTableColumnKey[] {
  return ['action', 'type', 'subcategory', 'difficulty', 'done'];
}

export function getTableTotalWidth(
  columnWidths: CardTableColumnWidths,
  visibleColumns: CardTableColumnKey[]
) {
  return visibleColumns.reduce((sum, key) => sum + columnWidths[key], 0);
}

function primarySubcategoryLabel(card: Card) {
  if (!card.subcategories?.length) return '';
  return [...card.subcategories]
    .map((subcategory) => subcategory.name)
    .sort((a, b) => a.localeCompare(b))[0];
}

function compareCards(a: Card, b: Card, field: CardTableSortField, cardTypes: CardType[]) {
  switch (field) {
    case 'action':
      return a.action.localeCompare(b.action);
    case 'difficulty':
      return a.difficulty - b.difficulty;
    case 'type':
      return primaryCardTypeName(a, cardTypes).localeCompare(primaryCardTypeName(b, cardTypes));
    case 'subcategory': {
      const aName = primarySubcategoryLabel(a);
      const bName = primarySubcategoryLabel(b);
      return aName.localeCompare(bName);
    }
    case 'updated_at':
      return a.updated_at.localeCompare(b.updated_at);
    case 'completed_once':
      return Number(a.completed_once) - Number(b.completed_once);
    default:
      return 0;
  }
}

export function sortCardsForTable(
  cards: Card[],
  sortLevels: CardTableSortLevel[],
  cardTypes: CardType[]
) {
  if (!sortLevels.length) return cards;

  return [...cards].sort((a, b) => {
    for (const level of sortLevels) {
      const cmp = compareCards(a, b, level.field, cardTypes);
      if (cmp !== 0) {
        return level.direction === 'asc' ? cmp : -cmp;
      }
    }
    return 0;
  });
}

function addCardToBucket(
  buckets: Map<string, { label: string; cards: Card[] }>,
  key: string,
  label: string,
  card: Card
) {
  const bucket = buckets.get(key) ?? { label, cards: [] };
  if (!bucket.cards.some((item) => item.id === card.id)) {
    bucket.cards.push(card);
  }
  buckets.set(key, bucket);
}

function appendSubcategorySections(rows: CardTableRowItem[], cards: Card[], keyPrefix: string) {
  const buckets = new Map<string, { label: string; cards: Card[] }>();

  cards.forEach((card) => {
    if (!card.subcategories?.length) {
      addCardToBucket(buckets, 'none', NO_SUBCATEGORY_LABEL, card);
      return;
    }
    card.subcategories.forEach((subcategory) => {
      addCardToBucket(buckets, subcategory.id, subcategory.name, card);
    });
  });

  const ordered = [...buckets.entries()].sort((a, b) => {
    if (a[0] === 'none') return 1;
    if (b[0] === 'none') return -1;
    return a[1].label.localeCompare(b[1].label);
  });

  ordered.forEach(([key, bucket]) => {
    rows.push({
      kind: 'subgroup',
      key: `${keyPrefix}-sub-${key}`,
      label: bucket.label,
      count: bucket.cards.length,
    });
    bucket.cards.forEach((card) => {
      rows.push({
        kind: 'card',
        key: `${keyPrefix}-${key}-${card.id}`,
        card,
      });
    });
  });
}

function appendTypeSections(
  rows: CardTableRowItem[],
  cards: Card[],
  cardTypes: CardType[],
  keyPrefix: string
) {
  const cardsByType = new Map<string, Card[]>();
  cards.forEach((card) => {
    forEachCardTypeId(card, (typeId) => {
      const list = cardsByType.get(typeId) ?? [];
      if (!list.some((item) => item.id === card.id)) {
        list.push(card);
      }
      cardsByType.set(typeId, list);
    });
  });

  const orderedTypes = cardTypes.filter((type) => cardsByType.has(type.id));
  const unassigned = cards.filter((card) => getCardTypeIds(card).length === 0);

  orderedTypes.forEach((type) => {
    const typeCards = cardsByType.get(type.id);
    if (!typeCards?.length) return;
    rows.push({
      kind: 'subgroup',
      key: `${keyPrefix}-type-${type.id}`,
      label: type.name,
      count: typeCards.length,
      ...typeAccent(type),
    });
    typeCards.forEach((card) => {
      rows.push({
        kind: 'card',
        key: `${keyPrefix}-${type.id}-${card.id}`,
        card,
      });
    });
  });

  if (unassigned.length) {
    rows.push({
      kind: 'subgroup',
      key: `${keyPrefix}-type-none`,
      label: NO_TYPE_LABEL,
      count: unassigned.length,
    });
    unassigned.forEach((card) => {
      rows.push({
        kind: 'card',
        key: `${keyPrefix}-none-${card.id}`,
        card,
      });
    });
  }
}

function appendSubcategoryGroups(rows: CardTableRowItem[], cards: Card[]) {
  const buckets = new Map<string, { label: string; cards: Card[] }>();

  cards.forEach((card) => {
    if (!card.subcategories?.length) {
      addCardToBucket(buckets, 'none', NO_SUBCATEGORY_LABEL, card);
      return;
    }
    card.subcategories.forEach((subcategory: CardSubcategory) => {
      addCardToBucket(buckets, subcategory.id, subcategory.name, card);
    });
  });

  const ordered = [...buckets.entries()].sort((a, b) => {
    if (a[0] === 'none') return 1;
    if (b[0] === 'none') return -1;
    return a[1].label.localeCompare(b[1].label);
  });

  ordered.forEach(([key, bucket]) => {
    rows.push({
      kind: 'group',
      key: `sub-${key}`,
      label: bucket.label,
      count: bucket.cards.length,
    });
    bucket.cards.forEach((card) => {
      rows.push({
        kind: 'card',
        key: `sub-${key}-${card.id}`,
        card,
      });
    });
  });
}

export function getTableCards(
  cards: Card[],
  settings: CardTableSettings,
  cardTypes: CardType[]
) {
  const filtered = filterCards(cards, settings.columnFilters);
  return sortCardsForTable(filtered, settings.sortLevels, cardTypes);
}

export function paginateTableCards(cards: Card[], page: number, pageSize: number) {
  const start = Math.max(0, (page - 1) * pageSize);
  return cards.slice(start, start + pageSize);
}

export function filterCollapsedRows(
  rows: CardTableRowItem[],
  collapsedKeys: ReadonlySet<string>
): CardTableRowItem[] {
  if (!collapsedKeys.size) return rows;

  const result: CardTableRowItem[] = [];
  let insideCollapsedGroup = false;
  let insideCollapsedSubgroup = false;

  rows.forEach((row) => {
    if (row.kind === 'header') {
      result.push(row);
      return;
    }

    if (row.kind === 'group') {
      insideCollapsedGroup = collapsedKeys.has(row.key);
      insideCollapsedSubgroup = false;
      result.push(row);
      return;
    }

    if (insideCollapsedGroup) return;

    if (row.kind === 'subgroup') {
      insideCollapsedSubgroup = collapsedKeys.has(row.key);
      result.push(row);
      return;
    }

    if (insideCollapsedSubgroup) return;

    result.push(row);
  });

  return result;
}

function collectCardTypesForGrouping(cards: Card[], cardTypes: CardType[]): CardType[] {
  const byId = new Map<string, CardType>();
  cardTypes.forEach((type) => byId.set(type.id, type));
  cards.forEach((card) => {
    getCardTypes(card).forEach((type) => {
      if (!byId.has(type.id)) {
        byId.set(type.id, type);
      }
    });
  });
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function appendCards(rows: CardTableRowItem[], cards: Card[], keyPrefix: string) {
  cards.forEach((card) => {
    rows.push({ kind: 'card', key: `${keyPrefix}-${card.id}`, card });
  });
}

export function buildCardTableRows(
  cards: Card[],
  settings: CardTableSettings,
  cardTypes: CardType[],
  options?: { skipFilterSort?: boolean }
): CardTableRowItem[] {
  const sorted = options?.skipFilterSort
    ? cards
    : getTableCards(cards, settings, cardTypes);

  const rows: CardTableRowItem[] = [{ kind: 'header' }];

  if (settings.groupBy === 'none') {
    rows.push(...sorted.map((card) => ({ kind: 'card' as const, key: card.id, card })));
    return rows;
  }

  if (settings.groupBy === 'type') {
    const cardsByType = new Map<string, Card[]>();
    sorted.forEach((card) => {
      forEachCardTypeId(card, (typeId) => {
        const list = cardsByType.get(typeId) ?? [];
        if (!list.some((item) => item.id === card.id)) {
          list.push(card);
        }
        cardsByType.set(typeId, list);
      });
    });

    const typesForGrouping = collectCardTypesForGrouping(sorted, cardTypes);

    typesForGrouping.forEach((type) => {
      const typeCards = cardsByType.get(type.id);
      if (!typeCards?.length) return;

      rows.push({
        kind: 'group',
        key: `type-${type.id}`,
        label: type.name,
        count: typeCards.length,
        ...typeAccent(type),
      });

      if (settings.subgroupBy === 'subcategory') {
        appendSubcategorySections(rows, typeCards, `type-${type.id}`);
      } else {
        appendCards(rows, typeCards, `type-${type.id}`);
      }
    });

    const unassigned = sorted.filter((card) => getCardTypeIds(card).length === 0);
    if (unassigned.length) {
      rows.push({
        kind: 'group',
        key: 'type-none',
        label: NO_TYPE_LABEL,
        count: unassigned.length,
      });

      if (settings.subgroupBy === 'subcategory') {
        appendSubcategorySections(rows, unassigned, 'type-none');
      } else {
        appendCards(rows, unassigned, 'type-none');
      }
    }

    return rows;
  }

  const buckets = new Map<string, { label: string; cards: Card[] }>();
  sorted.forEach((card) => {
    if (!card.subcategories?.length) {
      addCardToBucket(buckets, 'none', NO_SUBCATEGORY_LABEL, card);
      return;
    }
    card.subcategories.forEach((subcategory) => {
      addCardToBucket(buckets, subcategory.id, subcategory.name, card);
    });
  });

  const ordered = [...buckets.entries()].sort((a, b) => {
    if (a[0] === 'none') return 1;
    if (b[0] === 'none') return -1;
    return a[1].label.localeCompare(b[1].label);
  });

  ordered.forEach(([key, bucket]) => {
    rows.push({
      kind: 'group',
      key: `sub-${key}`,
      label: bucket.label,
      count: bucket.cards.length,
    });

    if (settings.subgroupBy === 'type') {
      appendTypeSections(rows, bucket.cards, collectCardTypesForGrouping(bucket.cards, cardTypes), `sub-${key}`);
    } else {
      appendCards(rows, bucket.cards, `sub-${key}`);
    }
  });

  return rows;
}

export function filterCardsForTable(cards: Card[], filters: CardFilterState) {
  return filterCards(cards, filters);
}

export { cardMatchesColumnFilters };

export const SORT_FIELD_BY_COLUMN: Partial<Record<CardTableColumnKey, CardTableSortField>> = {
  action: 'action',
  type: 'type',
  subcategory: 'subcategory',
  difficulty: 'difficulty',
  done: 'completed_once',
};
