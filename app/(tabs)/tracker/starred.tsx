import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateRangeFilter } from '@/src/components/DateRangeFilter';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useStarredOutingLogs } from '@/src/hooks/useOutingLogs';
import { parseDateString } from '@/src/utils/display';

type SortOrder = 'newest' | 'oldest';

export default function StarredOutingsScreen() {
  const { data: logs, isLoading, error, refetch } = useStarredOutingLogs();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!logs) return [];

    let result = logs;

    if (startDate) {
      result = result.filter((log) => log.log_date >= startDate);
    }
    if (endDate) {
      result = result.filter((log) => log.log_date <= endDate);
    }

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((log) => {
        const dateLabel = parseDateString(log.log_date)
          .toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
          .toLowerCase();
        const templateName = log.template?.name.toLowerCase() ?? '';
        return (
          log.log_date.includes(q) ||
          dateLabel.includes(q) ||
          templateName.includes(q)
        );
      });
    }

    return [...result].sort((a, b) =>
      sortOrder === 'newest'
        ? b.log_date.localeCompare(a.log_date)
        : a.log_date.localeCompare(b.log_date)
    );
  }, [logs, search, sortOrder, startDate, endDate]);

  const hasActiveFilters =
    search.trim().length > 0 || startDate !== null || endDate !== null;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const listHeader = (
    <View style={styles.header}>
      <TextInput
        style={styles.search}
        placeholder="Search by keyword..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <View style={styles.sortRow}>
        <Pressable
          style={[styles.sortChip, sortOrder === 'newest' && styles.sortChipActive]}
          onPress={() => setSortOrder('newest')}>
          <Ionicons
            name="arrow-down"
            size={14}
            color={sortOrder === 'newest' ? colors.onPrimary : colors.textSecondary}
          />
          <Text
            style={[
              styles.sortText,
              sortOrder === 'newest' && styles.sortTextActive,
            ]}>
            Newest
          </Text>
        </Pressable>
        <Pressable
          style={[styles.sortChip, sortOrder === 'oldest' && styles.sortChipActive]}
          onPress={() => setSortOrder('oldest')}>
          <Ionicons
            name="arrow-up"
            size={14}
            color={sortOrder === 'oldest' ? colors.onPrimary : colors.textSecondary}
          />
          <Text
            style={[
              styles.sortText,
              sortOrder === 'oldest' && styles.sortTextActive,
            ]}>
            Oldest
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <EmptyState
          message={
            hasActiveFilters
              ? 'No starred outings match your filters.'
              : 'No starred outings yet. Star a day log to revisit it here.'
          }
        />
      }
      renderItem={({ item }) => {
        const dateLabel = parseDateString(item.log_date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

        return (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/(tabs)/tracker/log/${item.log_date}`)}>
            <View style={styles.cardHeader}>
              <Ionicons name="star" size={20} color={colors.star} />
              <Text style={styles.date}>{dateLabel}</Text>
              {item.completed ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              ) : null}
            </View>
            {item.template ? (
              <Text style={styles.template}>{item.template.name}</Text>
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
  },
  search: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  sortTextActive: {
    color: colors.onPrimary,
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.screenPadding,
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  completedBadge: {
    backgroundColor: colors.successSubtle,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.completed,
  },
  template: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    marginLeft: 28,
  },
});
