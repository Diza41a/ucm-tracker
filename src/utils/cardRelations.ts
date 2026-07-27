import { fetchCardSubcategories } from '@/src/hooks/useCards';
import type { Card } from '@/src/types';

export function mergeCardsWithCatalog(cards: Card[], catalog: Card[]): Card[] {
  if (cards.length === 0) return cards;
  if (catalog.length === 0) return cards;

  const byId = new Map(catalog.map((card) => [card.id, card]));

  return cards.map((card) => {
    const full = byId.get(card.id);
    if (!full) return card;

    const catalogSubcategories = full.subcategories ?? [];
    const cardSubcategories = card.subcategories ?? [];
    const subcategories =
      catalogSubcategories.length > 0
        ? catalogSubcategories
        : cardSubcategories.length > 0
          ? cardSubcategories
          : catalogSubcategories;

    return {
      ...card,
      card_type: card.card_type ?? full.card_type,
      subcategories,
      stories: full.stories?.length ? full.stories : card.stories,
    };
  });
}

export async function enrichCardsWithSubcategories(cards: Card[]): Promise<Card[]> {
  if (cards.length === 0) return cards;

  const subcategoriesByCardId = await fetchCardSubcategories(cards.map((card) => card.id));

  return cards.map((card) => ({
    ...card,
    subcategories: subcategoriesByCardId.get(card.id) ?? card.subcategories ?? [],
  }));
}
