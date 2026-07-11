import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, radii, spacing } from '@/src/constants/theme';

interface OutingProgressPanelProps {
  weekCompleted: number;
  weekTarget: number;
  monthPercent: number;
  monthCompleted: number;
  monthTarget: number;
  durationMinutes: number;
}

export function OutingProgressPanel({
  weekCompleted,
  weekTarget,
  monthPercent,
  monthCompleted,
  monthTarget,
  durationMinutes,
}: OutingProgressPanelProps) {
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(monthPercent, 100));
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = size / 2;
  const weekRatio = weekTarget > 0 ? Math.min(weekCompleted / weekTarget, 1) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Outing progress</Text>

      <View style={styles.progressRow}>
        <View style={styles.monthBlock}>
          <View style={[styles.ringWrap, { width: size, height: size }]}>
            <Svg width={size} height={size}>
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.track}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.success}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${center} ${center})`}
              />
            </Svg>
            <View style={styles.centerLabel}>
              <Text style={styles.percent}>{progress}%</Text>
            </View>
          </View>
          <Text style={styles.monthLabel}>This month</Text>
          <Text style={styles.monthCount}>
            {monthCompleted}/{monthTarget}
          </Text>
        </View>

        <View style={styles.weekBlock}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekLabel}>This week</Text>
            <Text style={styles.weekCount}>
              {weekCompleted}/{weekTarget}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${weekRatio * 100}%` }]} />
          </View>
          <Text style={styles.weekHint}>Weekly target from your commitment</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.durationHint}>{durationMinutes} min per outing</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  monthBlock: {
    alignItems: 'center',
    width: 108,
    gap: 4,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  monthCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  weekBlock: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  weekCount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  track: {
    height: 10,
    backgroundColor: colors.track,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 5,
  },
  weekHint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  durationHint: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
});
