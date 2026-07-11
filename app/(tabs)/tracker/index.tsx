import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

import { MonthlyCardPriorities } from '@/src/components/MonthlyCardPriorities';
import { OutingProgressPanel } from '@/src/components/OutingProgressPanel';
import { MonthlyReflectionCard } from '@/src/components/MonthlyReflectionCard';
import { MonthPicker } from '@/src/components/MonthPicker';
import { ErrorState, LoadingState } from '@/src/components/StateViews';
import { colors, calendarTheme, radii } from '@/src/constants/theme';
import { useMonthlyCommitment } from '@/src/hooks/useMonthlyCommitment';
import { useOutingLogsForMonth } from '@/src/hooks/useOutingLogs';
import {
  getMonthlyProgressFromCommitment,
} from '@/src/utils/monthProgress';
import { toDateString } from '@/src/utils/display';
import { countCompletedOutingsInWeek } from '@/src/utils/weekCounter';

export default function TrackerScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(toDateString(now));

  const { data: logs, isLoading, error, refetch } = useOutingLogsForMonth(year, month);
  const { data: commitment } = useMonthlyCommitment(year, month);

  const calendarMonth = `${year}-${String(month).padStart(2, '0')}-01`;

  const markedDates = useMemo(() => {
    const marks: Record<
      string,
      {
        dots?: { key: string; color: string }[];
        selected?: boolean;
        selectedColor?: string;
      }
    > = {};

    logs?.forEach((log) => {
      const dots: { key: string; color: string }[] = [];
      if (log.completed) dots.push({ key: 'completed', color: colors.completed });
      else dots.push({ key: 'started', color: colors.inProgress });
      if (log.starred) dots.push({ key: 'starred', color: colors.star });
      marks[log.log_date] = { dots };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        dots: marks[selectedDate]?.dots ?? [],
        selected: true,
        selectedColor: colors.primary,
      };
    }

    return marks;
  }, [logs, selectedDate]);

  const weekCompleted = useMemo(() => {
    if (!logs) return 0;
    return countCompletedOutingsInWeek(logs, new Date(selectedDate));
  }, [logs, selectedDate]);

  const monthProgress = useMemo(() => {
    if (!logs || !commitment) return null;
    return getMonthlyProgressFromCommitment(logs, commitment);
  }, [logs, commitment]);

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);

    const today = new Date();
    if (y === today.getFullYear() && m === today.getMonth() + 1) {
      setSelectedDate(toDateString(today));
    } else {
      setSelectedDate(`${y}-${String(m).padStart(2, '0')}-01`);
    }
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    router.push(`/(tabs)/tracker/log/${day.dateString}`);
  };

  if (isLoading && logs === undefined) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MonthPicker
        year={year}
        month={month}
        onChange={handleMonthChange}
      />

      {commitment && monthProgress ? (
        <OutingProgressPanel
          weekCompleted={weekCompleted}
          weekTarget={commitment.outings_per_week}
          monthPercent={monthProgress.percent}
          monthCompleted={monthProgress.completed}
          monthTarget={monthProgress.target}
          durationMinutes={commitment.outing_duration_minutes}
        />
      ) : (
        <Pressable
          style={styles.commitmentPrompt}
          onPress={() => router.push('/(tabs)/tracker/commitment')}>
          <Ionicons name="flag-outline" size={18} color={colors.primary} />
          <Text style={styles.commitmentPromptText}>Set monthly commitment</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      )}

      <Calendar
        current={calendarMonth}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={calendarTheme}
        style={styles.calendar}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Ionicons name="checkmark-circle" size={14} color={colors.completed} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="ellipse-outline" size={14} color={colors.inProgress} />
          <Text style={styles.legendText}>In progress</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="star" size={14} color={colors.star} />
          <Text style={styles.legendText}>Starred</Text>
        </View>
      </View>

      <MonthlyCardPriorities year={year} month={month} />

      <MonthlyReflectionCard year={year} month={month} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  commitmentPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentSubtle,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commitmentPromptText: {
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
    fontSize: 14,
  },
  calendar: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
