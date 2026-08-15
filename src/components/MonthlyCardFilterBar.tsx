import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import {
  type CompletedFilterValue,
  type DifficultyFilterValue,
  toggleFilterValue,
} from '@/src/utils/cardFilters';

interface MonthlyCardFilterBarProps {
  filterCompleted: CompletedFilterValue[];
  filterDifficulties: DifficultyFilterValue[];
  onToggleCompleted: (value: CompletedFilterValue) => void;
  onToggleDifficulty: (value: DifficultyFilterValue) => void;
  onClear: () => void;
}

const COMPLETED_OPTIONS: { value: CompletedFilterValue; label: string }[] = [
  { value: 'done', label: 'Done' },
  { value: 'not_done', label: 'Open' },
];

const DIFFICULTY_OPTIONS: { value: DifficultyFilterValue; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Med' },
  { value: 'hard', label: 'Hard' },
];

export function MonthlyCardFilterBar({
  filterCompleted,
  filterDifficulties,
  onToggleCompleted,
  onToggleDifficulty,
  onClear,
}: MonthlyCardFilterBarProps) {
  const hasFilters = filterCompleted.length > 0 || filterDifficulties.length > 0;

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {COMPLETED_OPTIONS.map((option) => {
          const active = filterCompleted.includes(option.value);
          return (
            <Pressable
              key={option.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onToggleCompleted(option.value)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
        <View style={styles.divider} />
        {DIFFICULTY_OPTIONS.map((option) => {
          const active = filterDifficulties.includes(option.value);
          return (
            <Pressable
              key={option.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onToggleDifficulty(option.value)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
        {hasFilters ? (
          <Pressable style={styles.clearChip} onPress={onClear}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  row: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },
  clearChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
