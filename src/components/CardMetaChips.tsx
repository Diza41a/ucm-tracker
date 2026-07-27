import { StyleSheet, View } from 'react-native';

import { CardBadge } from '@/src/components/CardBadge';
import { CardSubcategoryBadge } from '@/src/components/CardSubcategoryBadge';
import type { Card } from '@/src/types';

interface CardMetaChipsProps {
  card: Pick<Card, 'card_type' | 'subcategories'>;
  compact?: boolean;
  /** When true (default), subcategories sit on their own row under the card type. */
  stacked?: boolean;
}

export function CardMetaChips({ card, compact, stacked = true }: CardMetaChipsProps) {
  const hasType = !!card.card_type;
  const hasSubcategories = !!card.subcategories?.length;

  if (!hasType && !hasSubcategories) {
    return null;
  }

  const subcategoryBadges = hasSubcategories
    ? card.subcategories!.map((subcategory) => (
        <CardSubcategoryBadge key={subcategory.id} subcategory={subcategory} compact={compact} />
      ))
    : null;

  if (stacked) {
    return (
      <View style={styles.stack}>
        {hasType ? <CardBadge cardType={card.card_type!} compact={compact} /> : null}
        {hasSubcategories ? <View style={styles.subcategoryRow}>{subcategoryBadges}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {hasType ? <CardBadge cardType={card.card_type!} compact={compact} /> : null}
      {subcategoryBadges}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 4,
    alignSelf: 'stretch',
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
