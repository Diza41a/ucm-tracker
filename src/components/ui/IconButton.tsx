import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radii } from '@/src/constants/theme';

type IconButtonVariant = 'ghost' | 'primary' | 'danger' | 'surface';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label?: string;
  size?: number;
  color?: string;
  variant?: IconButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  label,
  size = 20,
  color,
  variant = 'ghost',
  disabled,
  style,
}: IconButtonProps) {
  const iconColor =
    color ??
    (variant === 'primary'
      ? colors.onPrimary
      : variant === 'danger'
        ? colors.danger
        : colors.textSecondary);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        variant === 'surface' && styles.surface,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Ionicons name={icon} size={size} color={iconColor} />
      {label ? <Text style={[styles.label, { color: iconColor }]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  primary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
  },
  danger: {
    backgroundColor: colors.dangerSubtle,
    paddingHorizontal: 10,
  },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
