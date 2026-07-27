import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/src/constants/theme';
import type { CardSubcategory } from '@/src/types';

interface CardSubcategoryBadgeProps {
  subcategory: Pick<CardSubcategory, 'name'>;
  compact?: boolean;
}

export function CardSubcategoryBadge({ subcategory, compact }: CardSubcategoryBadgeProps) {
  return (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <Text style={[styles.text, compact && styles.textCompact]} numberOfLines={2}>
        {subcategory.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.chipBorder,
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
    color: colors.textSecondary,
  },
  textCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
});
