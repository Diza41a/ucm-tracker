import { StyleSheet, Text, View } from 'react-native';

import type { CardType } from '@/src/types';

interface CardBadgeProps {
  cardType: Pick<CardType, 'name' | 'bg_color' | 'text_color'>;
  compact?: boolean;
}

export function CardBadge({ cardType, compact }: CardBadgeProps) {
  return (
    <View style={[styles.badge, compact && styles.badgeCompact, { backgroundColor: cardType.bg_color }]}>
      <Text
        style={[styles.text, compact && styles.textCompact, { color: cardType.text_color }]}
        numberOfLines={2}>
        {cardType.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeCompact: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
});
