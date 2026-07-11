import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/src/constants/theme';

interface WeekProgressProps {
  completed: number;
  target: number;
}

export function WeekProgress({ completed, target }: WeekProgressProps) {
  const ratio = target > 0 ? Math.min(completed / target, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>This week</Text>
        <Text style={styles.count}>
          {completed}/{target} outings
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  count: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  track: {
    height: 8,
    backgroundColor: colors.track,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
});
