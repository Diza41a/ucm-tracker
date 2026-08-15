import { StyleSheet, View } from 'react-native';

import { CardBadge } from '@/src/components/CardBadge';
import { CardSubcategoryBadge } from '@/src/components/CardSubcategoryBadge';
import type { Card } from '@/src/types';
import { getCardTypes } from '@/src/utils/cardTypes';

interface CardMetaChipsProps {
  card: Pick<Card, 'card_type' | 'card_types' | 'subcategories'>;
  compact?: boolean;
  /** When true (default), subcategories sit on their own row under the card type. */
  stacked?: boolean;
}

export function CardMetaChips({ card, compact, stacked = true }: CardMetaChipsProps) {
  const cardTypes = getCardTypes(card);
  const hasTypes = cardTypes.length > 0;
  const hasSubcategories = !!card.subcategories?.length;

  if (!hasTypes && !hasSubcategories) {
    return null;
  }

  const typeBadges = cardTypes.map((type) => (
    <CardBadge key={type.id} cardType={type} compact={compact} />
  ));

  const subcategoryBadges = hasSubcategories
    ? card.subcategories!.map((subcategory) => (
        <CardSubcategoryBadge key={subcategory.id} subcategory={subcategory} compact={compact} />
      ))
    : null;

  if (stacked) {
    return (
      <View style={styles.stack}>
        {hasTypes ? <View style={styles.typeRow}>{typeBadges}</View> : null}
        {hasSubcategories ? <View style={styles.subcategoryRow}>{subcategoryBadges}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {typeBadges}
      {subcategoryBadges}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 4,
    alignSelf: 'stretch',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  subcategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
});
