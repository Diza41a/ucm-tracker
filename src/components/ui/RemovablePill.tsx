import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/src/constants/theme';

interface RemovablePillProps {
  label: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  onPress?: () => void;
  onRemove: () => void;
}

export function RemovablePill({
  label,
  backgroundColor = colors.chip,
  textColor = colors.primaryLight,
  borderColor = colors.chipBorder,
  onPress,
  onRemove,
}: RemovablePillProps) {
  return (
    <View style={[styles.pill, { backgroundColor, borderColor }]}>
      <Pressable
        style={styles.labelBtn}
        onPress={onPress}
        disabled={!onPress}>
        <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
      <Pressable
        onPress={onRemove}
        hitSlop={6}
        style={[styles.removeBtn, { borderLeftColor: borderColor }]}
        accessibilityLabel={`Remove ${label}`}
        accessibilityRole="button">
        <Ionicons name="close" size={14} color={textColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: 220,
    overflow: 'hidden',
  },
  labelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderLeftWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
