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

import { StoryTagList } from '@/src/components/StoryTagList';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useStories } from '@/src/hooks/useStories';
import { useStoryTags } from '@/src/hooks/useStoryTags';
import { storyDisplayName } from '@/src/utils/display';

export default function StoriesListScreen() {
  const { data: stories, isLoading, error, refetch } = useStories();
  const { data: storyTags } = useStoryTags();
  const [search, setSearch] = useState('');
  const [filterTagId, setFilterTagId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!stories) return [];

    let result = stories;

    if (filterTagId) {
      result = result.filter((story) =>
        story.story_tags?.some((tag) => tag.id === filterTagId)
      );
    }

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.story_tags?.some((tag) => tag.name.toLowerCase().includes(q)) ?? false)
      );
    }

    return result;
  }, [stories, search, filterTagId]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const listHeader = (
    <View>
      <TextInput
        style={styles.search}
        placeholder="Search stories..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      {storyTags && storyTags.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersBar}
          contentContainerStyle={styles.filters}>
          <Pressable
            style={[styles.filterChip, !filterTagId && styles.filterChipActive]}
            onPress={() => setFilterTagId(null)}>
            <Text style={[styles.filterText, !filterTagId && styles.filterTextActive]}>
              All
            </Text>
          </Pressable>
          {storyTags.map((tag) => {
            const active = filterTagId === tag.id;
            return (
              <Pressable
                key={tag.id}
                style={[
                  styles.filterChip,
                  active
                    ? { backgroundColor: tag.bg_color, borderColor: tag.bg_color }
                    : null,
                ]}
                onPress={() => setFilterTagId(tag.id)}>
                <Text
                  style={[
                    styles.filterText,
                    active ? { color: tag.text_color } : null,
                  ]}>
                  {tag.name}
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
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <EmptyState
          message={
            filterTagId || search.trim()
              ? 'No stories match your filters.'
              : 'No stories yet. Tap + to create one.'
          }
        />
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/(tabs)/stories/${item.id}`)}>
          <Text style={styles.name}>{storyDisplayName(item)}</Text>
          {item.story_tags?.length ? (
            <View style={styles.tagsRow}>
              <StoryTagList tags={item.story_tags} />
            </View>
          ) : null}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  search: {
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.screenPadding,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
  },
  filtersBar: {
    flexGrow: 0,
  },
  filters: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
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
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    gap: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  tagsRow: {
    marginTop: 2,
  },
});
