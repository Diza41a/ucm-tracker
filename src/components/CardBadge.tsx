import { StyleSheet, Text, View } from 'react-native';

import type { CardType } from '@/src/types';

interface CardBadgeProps {
  cardType: Pick<CardType, 'name' | 'bg_color' | 'text_color'>;
}

export function CardBadge({ cardType }: CardBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: cardType.bg_color }]}>
      <Text style={[styles.text, { color: cardType.text_color }]} numberOfLines={1}>
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
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
