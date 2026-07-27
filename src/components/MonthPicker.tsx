import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/src/constants/theme';

interface MonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  maxYear?: number;
  maxMonth?: number;
}

function isAfterMonth(
  year: number,
  month: number,
  maxYear: number | undefined,
  maxMonth: number | undefined
) {
  if (maxYear === undefined || maxMonth === undefined) return false;
  return year > maxYear || (year === maxYear && month > maxMonth);
}

export function MonthPicker({ year, month, onChange, maxYear, maxMonth }: MonthPickerProps) {
  const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const goPrev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };

  const goNext = () => {
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    if (isAfterMonth(nextYear, nextMonth, maxYear, maxMonth)) return;
    onChange(nextYear, nextMonth);
  };

  const canGoNext = !isAfterMonth(
    month === 12 ? year + 1 : year,
    month === 12 ? 1 : month + 1,
    maxYear,
    maxMonth
  );

  return (
    <View style={styles.container}>
      <Pressable onPress={goPrev} style={styles.button} hitSlop={8}>
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
      </Pressable>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={goNext}
        style={[styles.button, !canGoNext && styles.buttonDisabled]}
        hitSlop={8}
        disabled={!canGoNext}>
        <Ionicons
          name="chevron-forward"
          size={22}
          color={canGoNext ? colors.primary : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    minWidth: 180,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
