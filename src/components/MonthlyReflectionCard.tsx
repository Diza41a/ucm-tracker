import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';
import { useMonthlyReflection } from '@/src/hooks/useMonthlyReflection';
import { formatMonthYear } from '@/src/utils/display';
import {
  daysUntilReflectionUnlock,
  isReflectionUnlocked,
} from '@/src/utils/monthReflection';

interface MonthlyReflectionCardProps {
  year: number;
  month: number;
}

export function MonthlyReflectionCard({ year, month }: MonthlyReflectionCardProps) {
  const unlocked = isReflectionUnlocked(year, month);
  const daysLeft = daysUntilReflectionUnlock(year, month);
  const { data: reflection } = useMonthlyReflection(year, month);

  const hasContent = (reflection?.content_html?.trim().length ?? 0) > 0;

  const handlePress = () => {
    if (!unlocked) return;
    router.push(`/(tabs)/tracker/reflection?year=${year}&month=${month}`);
  };

  return (
    <Pressable
      style={[styles.card, !unlocked && styles.cardDisabled]}
      onPress={handlePress}
      disabled={!unlocked}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={unlocked ? 'journal-outline' : 'lock-closed-outline'}
          size={22}
          color={unlocked ? colors.primary : colors.textMuted}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !unlocked && styles.titleDisabled]}>
          Monthly reflection
        </Text>
        <Text style={styles.subtitle}>
          {formatMonthYear(year, month)}
          {hasContent && unlocked ? ' · Saved' : ''}
        </Text>
        {!unlocked ? (
          <Text style={styles.hint}>
            Unlocks on the last day of the month
            {daysLeft > 0 ? ` (${daysLeft} day${daysLeft === 1 ? '' : 's'} left)` : ''}
          </Text>
        ) : (
          <Text style={styles.hintOpen}>
            {hasContent ? 'Tap to review or edit' : 'Tap to write your monthly reflection'}
          </Text>
        )}
      </View>
      {unlocked ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  cardDisabled: {
    opacity: 0.72,
    backgroundColor: colors.surfaceElevated,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  titleDisabled: {
    color: colors.textSecondary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  hintOpen: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
});
