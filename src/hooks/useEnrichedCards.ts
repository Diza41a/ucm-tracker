import { useQuery } from '@tanstack/react-query';

import type { Card } from '@/src/types';
import { enrichCardsWithSubcategories, mergeCardsWithCatalog } from '@/src/utils/cardRelations';

function cardIdsKey(cards: Card[]) {
  return cards
    .map((card) => card.id)
    .sort()
    .join(',');
}

/** Loads subcategories from the junction table for the given cards (always fresh). */
export function useEnrichedCards(cards: Card[], catalog: Card[] = []) {
  const cardIds = cardIdsKey(cards);
  const catalogIds = cardIdsKey(catalog);

  return useQuery({
    queryKey: ['enrichedCards', cardIds, catalogIds] as const,
    queryFn: async () => {
      const merged = mergeCardsWithCatalog(cards, catalog);
      return enrichCardsWithSubcategories(merged);
    },
    enabled: cards.length > 0,
    placeholderData: (previous) => previous ?? mergeCardsWithCatalog(cards, catalog),
  });
}
