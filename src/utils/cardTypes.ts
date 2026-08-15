import type { Card, CardType } from '@/src/types';

export function getCardTypes(card: Pick<Card, 'card_types' | 'card_type'>): CardType[] {
  if (card.card_types?.length) {
    return card.card_types;
  }
  if (card.card_type) {
    return [card.card_type];
  }
  return [];
}

export function getCardTypeIds(card: Pick<Card, 'card_types' | 'card_type' | 'card_type_id'>): string[] {
  const fromRelations = getCardTypes(card).map((type) => type.id);
  if (fromRelations.length) {
    return fromRelations;
  }
  if (card.card_type_id) {
    return [card.card_type_id];
  }
  return [];
}

export function cardHasType(
  card: Pick<Card, 'card_types' | 'card_type' | 'card_type_id'>,
  typeId: string
) {
  return getCardTypeIds(card).includes(typeId);
}

export function primaryCardTypeName(
  card: Pick<Card, 'card_types' | 'card_type' | 'card_type_id'>,
  cardTypes: CardType[] = []
) {
  const types = getCardTypes(card);
  if (types.length) {
    return [...types]
      .map((type) => type.name)
      .sort((a, b) => a.localeCompare(b))[0];
  }

  const fallback = cardTypes.find((type) => type.id === card.card_type_id);
  return fallback?.name ?? '';
}

export function attachCardTypes(card: Card, cardTypes: CardType[]): Card {
  const sortedTypes = [...cardTypes].sort((a, b) => a.name.localeCompare(b.name));
  return {
    ...card,
    card_types: sortedTypes,
    card_type: sortedTypes[0],
    card_type_id: sortedTypes[0]?.id ?? card.card_type_id,
  };
}

export function forEachCardTypeId(
  card: Pick<Card, 'card_types' | 'card_type' | 'card_type_id'>,
  visit: (typeId: string) => void
) {
  const typeIds = getCardTypeIds(card);
  if (typeIds.length) {
    typeIds.forEach(visit);
    return;
  }
}
