import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CardBadge } from '@/src/components/CardBadge';
import { StoryChip } from '@/src/components/StoryChip';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { colors, spacing } from '@/src/constants/theme';
import { useCardTypes } from '@/src/hooks/useCardTypes';
import { useCards } from '@/src/hooks/useCards';
import type { Story } from '@/src/types';
import { storyDisplayName } from '@/src/utils/display';

type CompletedFilter = 'all' | 'done' | 'not_done';
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

const DIFFICULTY_RANGES: Record<Exclude<DifficultyFilter, 'all'>, [number, number]> = {
  easy: [1, 3],
  medium: [4, 7],
  hard: [8, 10],
};

function matchesDifficulty(difficulty: number, filter: DifficultyFilter) {
  if (filter === 'all') return true;
  const [min, max] = DIFFICULTY_RANGES[filter];
  return difficulty >= min && difficulty <= max;
}

export default function CardsListScreen() {
  const { data: cards, isLoading, error, refetch } = useCards();
  const { data: cardTypes } = useCardTypes();

  const [search, setSearch] = useState('');
  const [filterTypeId, setFilterTypeId] = useState<string | null>(null);
  const [filterCompleted, setFilterCompleted] = useState<CompletedFilter>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyFilter>('all');
  const [filterStoryId, setFilterStoryId] = useState<string | null>(null);

  const linkedStories = useMemo(() => {
    if (!cards) return [] as Story[];

    const byId = new Map<string, Story>();
    cards.forEach((card) => {
      card.stories?.forEach((story) => {
        if (!byId.has(story.id)) byId.set(story.id, story);
      });
    });

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [cards]);

  const filtered = useMemo(() => {
    if (!cards) return [];

    let result = cards;

    if (filterTypeId) {
      result = result.filter((card) => card.card_type_id === filterTypeId);
    }

    if (filterCompleted === 'done') {
      result = result.filter((card) => card.completed_once);
    } else if (filterCompleted === 'not_done') {
      result = result.filter((card) => !card.completed_once);
    }

    if (filterDifficulty !== 'all') {
      result = result.filter((card) => matchesDifficulty(card.difficulty, filterDifficulty));
    }

    if (filterStoryId) {
      result = result.filter((card) =>
        card.stories?.some((story) => story.id === filterStoryId)
      );
    }

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (card) =>
          card.action.toLowerCase().includes(q) ||
          card.function_purpose.toLowerCase().includes(q) ||
          (card.practice_location_ideas?.toLowerCase().includes(q) ?? false) ||
          (card.stories?.some((story) => story.name.toLowerCase().includes(q)) ?? false)
      );
    }

    return result;
  }, [
    cards,
    filterTypeId,
    filterCompleted,
    filterDifficulty,
    filterStoryId,
    search,
  ]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const filterHeader = (
    <View style={styles.filtersWrap}>
      <TextInput
        style={styles.search}
        placeholder="Search cards..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        <Text style={styles.filterLabel}>Type</Text>
        <Pressable
          style={[styles.filterChip, !filterTypeId && styles.filterChipActive]}
          onPress={() => setFilterTypeId(null)}>
          <Text style={[styles.filterText, !filterTypeId && styles.filterTextActive]}>
            All
          </Text>
        </Pressable>
        {cardTypes?.map((type) => {
          const active = filterTypeId === type.id;
          return (
            <Pressable
              key={type.id}
              style={[
                styles.filterChip,
                active
                  ? { backgroundColor: type.bg_color, borderColor: type.bg_color }
                  : null,
              ]}
              onPress={() => setFilterTypeId(type.id)}>
              <Text
                style={[styles.filterText, active ? { color: type.text_color } : null]}>
                {type.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        <Text style={styles.filterLabel}>Done</Text>
        {(
          [
            ['all', 'All'],
            ['done', 'Done once'],
            ['not_done', 'Not yet'],
          ] as const
        ).map(([value, label]) => {
          const active = filterCompleted === value;
          return (
            <Pressable
              key={value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilterCompleted(value)}>
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        <Text style={styles.filterLabel}>Difficulty</Text>
        {(
          [
            ['all', 'All'],
            ['easy', '1-3'],
            ['medium', '4-7'],
            ['hard', '8-10'],
          ] as const
        ).map(([value, label]) => {
          const active = filterDifficulty === value;
          return (
            <Pressable
              key={value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilterDifficulty(value)}>
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {linkedStories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          <Text style={styles.filterLabel}>Story</Text>
          <Pressable
            style={[styles.filterChip, !filterStoryId && styles.filterChipActive]}
            onPress={() => setFilterStoryId(null)}>
            <Text style={[styles.filterText, !filterStoryId && styles.filterTextActive]}>
              All
            </Text>
          </Pressable>
          {linkedStories.map((story) => {
            const active = filterStoryId === story.id;
            const tag = story.story_tags?.[0];
            return (
              <Pressable
                key={story.id}
                style={[
                  styles.filterChip,
                  active
                    ? {
                        backgroundColor: tag?.bg_color ?? colors.primary,
                        borderColor: tag?.bg_color ?? colors.primary,
                      }
                    : null,
                ]}
                onPress={() => setFilterStoryId(story.id)}>
                <Text
                  style={[
                    styles.filterText,
                    active ? { color: tag?.text_color ?? colors.onPrimary } : null,
                  ]}>
                  {storyDisplayName(story)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
      ListHeaderComponent={filterHeader}
      ListEmptyComponent={
        <EmptyState
          message={
            cards?.length
              ? 'No cards match your filters.'
              : cardTypes?.length
                ? 'No cards yet. Tap + to create one.'
                : 'Create a card type first, then add cards.'
          }
        />
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.card, item.completed_once && styles.cardCompletedOnce]}
          onPress={() => router.push(`/(tabs)/cards/${item.id}`)}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              {item.card_type ? <CardBadge cardType={item.card_type} /> : null}
              <Text style={styles.difficulty}>{item.difficulty}/10</Text>
            </View>
            {item.completed_once ? (
              <Ionicons name="flag" size={16} color={colors.completed} />
            ) : null}
          </View>
          <Text style={styles.action}>{item.action}</Text>
          {item.function_purpose ? (
            <Text style={styles.purpose} numberOfLines={2}>
              {item.function_purpose}
            </Text>
          ) : null}
          {item.stories && item.stories.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}>
              {item.stories.map((story) => (
                <StoryChip key={story.id} story={story} />
              ))}
            </ScrollView>
          ) : null}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  filtersWrap: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  search: {
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  filters: {
    paddingHorizontal: spacing.screenPadding,
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  filterTextActive: {
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
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardCompletedOnce: {
    backgroundColor: colors.successSubtle,
    borderColor: 'rgba(61, 219, 156, 0.35)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  difficulty: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  action: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  purpose: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chips: {
    gap: 8,
    paddingTop: 4,
  },
});
