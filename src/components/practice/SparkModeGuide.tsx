import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';

export type SparkGuidePhase = 'setup' | 'playing' | 'complete';

const STEPS = [
  {
    key: 'scene',
    title: 'Picture the scene',
    body: 'Read where you are, what they said, and what you want to practice.',
  },
  {
    key: 'chain',
    title: 'Build a word path',
    body: 'Starting from the first word, add one word at a time — whatever comes to mind in that conversation.',
  },
  {
    key: 'speak',
    title: 'Say it out loud',
    body: 'When the path is full, read the speaking prompts aloud like you are really there.',
  },
] as const;

interface SparkModeGuideProps {
  phase: SparkGuidePhase;
}

function activeStepIndex(phase: SparkGuidePhase): number {
  if (phase === 'setup') return 0;
  if (phase === 'playing') return 1;
  return 2;
}

export function SparkModeGuide({ phase }: SparkModeGuideProps) {
  const activeIndex = activeStepIndex(phase);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>How this works</Text>
      {STEPS.map((step, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;

        return (
          <View
            key={step.key}
            style={[styles.stepRow, isActive && styles.stepRowActive, isDone && styles.stepRowDone]}>
            <View style={[styles.stepBadge, isActive && styles.stepBadgeActive]}>
              <Text style={[styles.stepBadgeText, isActive && styles.stepBadgeTextActive]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

interface SparkProgressProps {
  wordCount: number;
  wordGoal: number;
}

export function SparkProgress({ wordCount, wordGoal }: SparkProgressProps) {
  const remaining = Math.max(wordGoal - wordCount, 0);
  const progress = Math.min(wordCount / wordGoal, 1);

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>
          Word {wordCount} of {wordGoal}
        </Text>
        <Text style={styles.progressMeta}>
          {remaining === 0 ? 'Done — moving to speaking prompts' : `${remaining} more to go`}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    opacity: 0.72,
  },
  stepRowActive: {
    opacity: 1,
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  stepRowDone: {
    opacity: 0.55,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepBadgeTextActive: {
    color: colors.onPrimary,
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepTitleActive: {
    color: colors.text,
  },
  stepBody: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  progressWrap: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  progressMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progressTrack: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
});
