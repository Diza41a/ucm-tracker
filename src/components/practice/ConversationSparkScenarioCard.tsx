import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';
import type { ConversationSparkScenario } from '@/src/types/conversationSpark';

interface ConversationSparkScenarioCardProps {
  scenario: ConversationSparkScenario;
  startingWord?: string;
  stepLabel?: string;
}

export function ConversationSparkScenarioCard({
  scenario,
  startingWord,
  stepLabel = 'Step 1 · The scene',
}: ConversationSparkScenarioCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.stepLabel}>{stepLabel}</Text>
      <View style={styles.headerRow}>
        <Ionicons name="location-outline" size={16} color={colors.primary} />
        <Text style={styles.setting}>{scenario.setting}</Text>
      </View>
      <Text style={styles.context}>{scenario.context}</Text>
      <View style={styles.lineBox}>
        <Text style={styles.lineLabel}>Imagine they say</Text>
        <Text style={styles.lineText}>"{scenario.theirLine}"</Text>
      </View>
      <View style={styles.goalBox}>
        <Text style={styles.lineLabel}>Your practice goal</Text>
        <Text style={styles.goalText}>{scenario.yourGoal}</Text>
      </View>
      {startingWord ? (
        <View style={styles.seedRow}>
          <Ionicons name="play-outline" size={14} color={colors.primary} />
          <Text style={styles.seedText}>
            First word of your path:{' '}
            <Text style={styles.seedWord}>{startingWord}</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  setting: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  context: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  lineBox: {
    backgroundColor: colors.accentSubtle,
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: 4,
  },
  goalBox: {
    borderRadius: radii.sm,
    padding: spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  lineLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  lineText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontStyle: 'italic',
  },
  goalText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  seedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  seedText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  seedWord: {
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
