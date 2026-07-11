import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/src/constants/theme';
import { useCardTypes } from '@/src/hooks/useCardTypes';
import type { Story } from '@/src/types';
import {
  type CardFilterState,
  type CompletedFilter,
  type DifficultyFilter,
} from '@/src/utils/cardFilters';
import { storyDisplayName } from '@/src/utils/display';

type CardFilterBarProps = {
  filters: CardFilterState;
  linkedStories: Story[];
  onChange: (patch: Partial<CardFilterState>) => void;
  showSearch?: boolean;
};

export function CardFilterBar({
  filters,
  linkedStories,
  onChange,
  showSearch = true,
}: CardFilterBarProps) {
  const { data: cardTypes } = useCardTypes();

  return (
    <View style={styles.wrap}>
      {showSearch ? (
        <TextInput
          style={styles.search}
          placeholder="Search cards..."
          placeholderTextColor={colors.textSecondary}
          value={filters.search}
          onChangeText={(search) => onChange({ search })}
        />
      ) : null}

      {cardTypes && cardTypes.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          <Text style={styles.filterLabel}>Type</Text>
          <Pressable
            style={[styles.filterChip, !filters.filterTypeId && styles.filterChipActive]}
            onPress={() => onChange({ filterTypeId: null })}>
            <Text
              style={[styles.filterText, !filters.filterTypeId && styles.filterTextActive]}>
              All
            </Text>
          </Pressable>
          {cardTypes.map((type) => {
            const active = filters.filterTypeId === type.id;
            return (
              <Pressable
                key={type.id}
                style={[
                  styles.filterChip,
                  active
                    ? { backgroundColor: type.bg_color, borderColor: type.bg_color }
                    : null,
                ]}
                onPress={() => onChange({ filterTypeId: type.id })}>
                <Text style={[styles.filterText, active ? { color: type.text_color } : null]}>
                  {type.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

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
          const active = filters.filterCompleted === value;
          return (
            <Pressable
              key={value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => onChange({ filterCompleted: value as CompletedFilter })}>
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
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
          const active = filters.filterDifficulty === value;
          return (
            <Pressable
              key={value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => onChange({ filterDifficulty: value as DifficultyFilter })}>
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
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
            style={[styles.filterChip, !filters.filterStoryId && styles.filterChipActive]}
            onPress={() => onChange({ filterStoryId: null })}>
            <Text
              style={[styles.filterText, !filters.filterStoryId && styles.filterTextActive]}>
              All
            </Text>
          </Pressable>
          {linkedStories.map((story) => {
            const active = filters.filterStoryId === story.id;
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
                onPress={() => onChange({ filterStoryId: story.id })}>
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
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
  },
  filters: {
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
});
