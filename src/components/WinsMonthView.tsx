import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MonthPicker } from '@/src/components/MonthPicker';
import { ErrorState, LoadingState } from '@/src/components/StateViews';
import { WinDayEntry } from '@/src/components/WinDayEntry';
import { colors, spacing } from '@/src/constants/theme';
import { useDailyWinsForMonth } from '@/src/hooks/useDailyWins';
import type { DailyWin } from '@/src/types';
import {
  getMonthDateStringsThrough,
  sortDateStringsDesc,
  toDateString,
  toYearMonthKey,
} from '@/src/utils/display';

interface WinsMonthViewProps {
  year: number;
  month: number;
}

function sortCompletedWinDates(dates: string[], winsByDate: Map<string, DailyWin>) {
  return [...dates].sort((a, b) => {
    const aStarred = winsByDate.get(a)?.starred ?? false;
    const bStarred = winsByDate.get(b)?.starred ?? false;
    if (aStarred !== bStarred) {
      return aStarred ? -1 : 1;
    }
    return b.localeCompare(a);
  });
}

export function WinsMonthView({ year, month }: WinsMonthViewProps) {
  const now = new Date();
  const today = toDateString(now);
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const throughDate = isCurrentMonth
    ? today
    : `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

  const { data: wins, isLoading, error, refetch } = useDailyWinsForMonth(year, month);

  const winsByDate = useMemo(() => {
    const map = new Map<string, DailyWin>();
    wins?.forEach((win) => map.set(win.win_date, win));
    return map;
  }, [wins]);

  const { completedDates, unfilledDates } = useMemo(() => {
    const allDates = getMonthDateStringsThrough(year, month, throughDate);
    const otherDates = isCurrentMonth ? allDates.filter((date) => date !== today) : allDates;
    const completed = sortCompletedWinDates(
      otherDates.filter((date) => (winsByDate.get(date)?.content ?? '').trim().length > 0),
      winsByDate
    );
    const unfilled = sortDateStringsDesc(
      otherDates.filter((date) => !(winsByDate.get(date)?.content ?? '').trim())
    );
    return { completedDates: completed, unfilledDates: unfilled };
  }, [isCurrentMonth, month, throughDate, today, winsByDate, year]);

  const todayWin = winsByDate.get(today);

  const handleMonthChange = (nextYear: number, nextMonth: number) => {
    router.replace(`/(tabs)/wins/${toYearMonthKey(nextYear, nextMonth)}`);
  };

  if (isLoading && wins === undefined) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MonthPicker
        year={year}
        month={month}
        onChange={handleMonthChange}
        maxYear={now.getFullYear()}
        maxMonth={now.getMonth() + 1}
      />

      {isCurrentMonth ? (
        <WinDayEntry
          winDate={today}
          initialContent={todayWin?.content ?? ''}
          initialStarred={todayWin?.starred ?? false}
          highlighted
          isToday
        />
      ) : null}

      {completedDates.length > 0 ? (
        <View style={styles.list}>
          <Text style={styles.sectionTitle}>Recorded wins</Text>
          {completedDates.map((winDate) => {
            const win = winsByDate.get(winDate);
            return (
              <WinDayEntry
                key={winDate}
                winDate={winDate}
                initialContent={win?.content ?? ''}
                initialStarred={win?.starred ?? false}
                isToday={false}
              />
            );
          })}
        </View>
      ) : null}

      {unfilledDates.length > 0 ? (
        <View style={styles.list}>
          <Text style={styles.sectionTitle}>
            {completedDates.length > 0 ? 'Days without a win yet' : 'Add a win'}
          </Text>
          {unfilledDates.map((winDate) => (
            <WinDayEntry key={winDate} winDate={winDate} initialContent="" initialStarred={false} isToday={false} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: 32,
    gap: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
