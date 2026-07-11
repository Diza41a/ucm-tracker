import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { StoryTagList } from '@/src/components/StoryTagList';
import { InlineEmptyState } from '@/src/components/StateViews';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useStoryTags } from '@/src/hooks/useStoryTags';
import type { Story } from '@/src/types';
import { storyDisplayName } from '@/src/utils/display';

type PickerScope = 'available' | 'all';

interface StoryPickerModalProps {
  visible: boolean;
  stories?: Story[];
  selectedIds: string[];
  onClose: () => void;
  onToggle: (storyId: string) => void;
  onCreateStory?: () => void;
  title?: string;
  availableScopeLabel?: string;
  allScopeLabel?: string;
}

export function StoryPickerModal({
  visible,
  stories,
  selectedIds,
  onClose,
  onToggle,
  onCreateStory,
  title = 'Tag stories',
  availableScopeLabel = 'Not on log',
  allScopeLabel = 'All stories',
}: StoryPickerModalProps) {
  const { data: storyTags } = useStoryTags();
  const [search, setSearch] = useState('');
  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const [scope, setScope] = useState<PickerScope>('available');

  const filteredStories = useMemo(() => {
    if (!stories) return [];

    let result = stories;

    if (scope === 'available') {
      result = result.filter((story) => !selectedIds.includes(story.id));
    }

    if (filterTagId) {
      result = result.filter((story) =>
        story.story_tags?.some((tag) => tag.id === filterTagId)
      );
    }

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (story) =>
          story.name.toLowerCase().includes(q) ||
          (story.story_tags?.some((tag) => tag.name.toLowerCase().includes(q)) ?? false)
      );
    }

    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [stories, selectedIds, scope, filterTagId, search]);

  const handleClose = () => {
    setSearch('');
    setFilterTagId(null);
    setScope('available');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.toolbar}>
          <TextInput
            style={styles.search}
            placeholder="Search stories..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.scopeRow}>
            <Pressable
              style={[styles.scopeChip, scope === 'available' && styles.scopeChipActive]}
              onPress={() => setScope('available')}>
              <Text
                style={[
                  styles.scopeText,
                  scope === 'available' && styles.scopeTextActive,
                ]}>
                {availableScopeLabel}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.scopeChip, scope === 'all' && styles.scopeChipActive]}
              onPress={() => setScope('all')}>
              <Text
                style={[styles.scopeText, scope === 'all' && styles.scopeTextActive]}>
                {allScopeLabel}
              </Text>
            </Pressable>
          </View>

          {storyTags && storyTags.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}>
              <Pressable
                style={[styles.filterChip, !filterTagId && styles.filterChipActive]}
                onPress={() => setFilterTagId(null)}>
                <Text style={[styles.filterText, !filterTagId && styles.filterTextActive]}>
                  All tags
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

        <ScrollView contentContainerStyle={styles.list}>
          {!stories?.length ? (
            <InlineEmptyState
              icon="book-outline"
              message="No stories yet. Create one to tag it on this log."
              actionLabel={onCreateStory ? 'Create story' : undefined}
              onAction={onCreateStory}
            />
          ) : filteredStories.length === 0 ? (
            <InlineEmptyState
              icon="search-outline"
              message={
                scope === 'available'
                  ? 'No more stories match your filters.'
                  : 'No stories match your filters.'
              }
            />
          ) : (
            filteredStories.map((story) => {
              const selected = selectedIds.includes(story.id);
              return (
                <Pressable
                  key={story.id}
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => onToggle(story.id)}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>{storyDisplayName(story)}</Text>
                    {story.story_tags?.length ? (
                      <StoryTagList tags={story.story_tags} />
                    ) : null}
                  </View>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'add-circle-outline'}
                    size={22}
                    color={selected ? colors.primary : colors.textSecondary}
                  />
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  toolbar: {
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surfaceElevated,
    color: colors.text,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scopeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scopeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scopeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scopeTextActive: {
    color: colors.onPrimary,
  },
  filters: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
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
    padding: spacing.screenPadding,
    gap: spacing.sm,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  rowInfo: {
    flex: 1,
    gap: 6,
  },
  rowTitle: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
});
