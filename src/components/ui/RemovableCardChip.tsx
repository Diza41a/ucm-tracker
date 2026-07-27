import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardMetaChips } from '@/src/components/CardMetaChips';
import { colors, radii } from '@/src/constants/theme';
import type { Card } from '@/src/types';

interface RemovableCardChipProps {
  card: Card;
  onPress?: () => void;
  onRemove: () => void;
}

export function RemovableCardChip({ card, onPress, onRemove }: RemovableCardChipProps) {
  const type = card.card_type;
  const backgroundColor = type?.bg_color ?? colors.chip;
  const textColor = type?.text_color ?? colors.text;
  const borderColor = type?.bg_color ?? colors.chipBorder;

  return (
    <View style={[styles.chip, { backgroundColor, borderColor }]}>
      <Pressable style={styles.body} onPress={onPress} disabled={!onPress}>
        <CardMetaChips card={card} compact />
        <Text style={[styles.label, { color: textColor }]} numberOfLines={2}>
          {card.action}
        </Text>
      </Pressable>
      <Pressable
        onPress={onRemove}
        hitSlop={6}
        style={[styles.removeBtn, { borderLeftColor: borderColor }]}
        accessibilityLabel={`Remove ${card.action}`}
        accessibilityRole="button">
        <Ionicons name="close" size={14} color={textColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radii.sm,
    borderWidth: 1,
    maxWidth: 280,
    overflow: 'hidden',
  },
  body: {
    flexShrink: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  removeBtn: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
});
