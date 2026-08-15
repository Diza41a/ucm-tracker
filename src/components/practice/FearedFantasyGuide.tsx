import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';

export type FearedFantasyGuidePhase = 'setup' | 'judgments' | 'responding' | 'complete';

const STEPS = [
  {
    key: 'action',
    title: 'Name the action',
    body: 'Pick something you want to do but avoid because of fear of judgment — ideally from your Liberation List.',
  },
  {
    key: 'judgments',
    title: 'Get specific',
    body: 'Write the exact negative things you fear someone might think or say — not vague "judgment," but the actual words.',
  },
  {
    key: 'respond',
    title: 'Drain the charge',
    body: 'For each feared thought, respond with curiosity, challenge, or acceptance. Say it out loud if you can.',
  },
] as const;

interface FearedFantasyGuideProps {
  phase: FearedFantasyGuidePhase;
}

function activeStepIndex(phase: FearedFantasyGuidePhase): number {
  if (phase === 'setup') return 0;
  if (phase === 'judgments') return 1;
  if (phase === 'responding') return 2;
  return 2;
}

export function FearedFantasyGuide({ phase }: FearedFantasyGuideProps) {
  const activeIndex = activeStepIndex(phase);
  const allDone = phase === 'complete';

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>How this works</Text>
      {STEPS.map((step, index) => {
        const isActive = !allDone && index === activeIndex;
        const isDone = allDone || index < activeIndex;

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

interface FearedFantasyProgressProps {
  currentIndex: number;
  total: number;
}

export function FearedFantasyProgress({ currentIndex, total }: FearedFantasyProgressProps) {
  const progress = total > 0 ? (currentIndex + 1) / total : 0;

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>
          Thought {currentIndex + 1} of {total}
        </Text>
        <Text style={styles.progressMeta}>Choose how you would respond</Text>
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
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
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
    color: colors.textMuted,
  },
  stepBadgeTextActive: {
    color: colors.onPrimary,
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  stepTitleActive: {
    color: colors.primary,
  },
  stepBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  progressWrap: {
    gap: spacing.sm,
  },
  progressHeader: {
    gap: 2,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  progressMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
});
