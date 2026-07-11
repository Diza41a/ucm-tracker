import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StoryPickerModal } from '@/src/components/StoryPickerModal';
import { StoryPreviewModal } from '@/src/components/StoryPreviewModal';
import { InlineEmptyState } from '@/src/components/StateViews';
import { RemovablePill } from '@/src/components/ui/RemovablePill';
import { colors, spacing } from '@/src/constants/theme';
import type { Story } from '@/src/types';
import { storyDisplayName } from '@/src/utils/display';

interface StorySelectorProps {
  stories?: Story[];
  selectedIds: string[];
  onToggle: (storyId: string) => void;
}

export function StorySelector({ stories, selectedIds, onToggle }: StorySelectorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [previewStory, setPreviewStory] = useState<Story | null>(null);

  const selectedStories = useMemo(
    () =>
      [...(stories?.filter((story) => selectedIds.includes(story.id)) ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [stories, selectedIds]
  );

  if (!stories?.length) {
    return (
      <InlineEmptyState
        icon="book-outline"
        message="No stories yet. Create one to link it to cards and logs."
        actionLabel="Create story"
        onAction={() => router.push('/(tabs)/stories/new')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.count}>
          {selectedStories.length} linked stor{selectedStories.length === 1 ? 'y' : 'ies'}
        </Text>
        <Pressable style={styles.addBtn} onPress={() => setShowPicker(true)}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addBtnText}>Add stories</Text>
        </Pressable>
      </View>

      {selectedStories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {selectedStories.map((story) => {
            const tag = story.story_tags?.[0];
            return (
              <RemovablePill
                key={story.id}
                label={storyDisplayName(story)}
                backgroundColor={tag?.bg_color ?? colors.chip}
                textColor={tag?.text_color ?? colors.primaryLight}
                borderColor={tag?.bg_color ?? colors.chipBorder}
                onPress={() => setPreviewStory(story)}
                onRemove={() => onToggle(story.id)}
              />
            );
          })}
        </ScrollView>
      ) : (
        <InlineEmptyState
          icon="book-outline"
          message="No stories linked to this card yet."
          actionLabel="Add stories"
          onAction={() => setShowPicker(true)}
          compact
        />
      )}

      <StoryPickerModal
        visible={showPicker}
        stories={stories}
        selectedIds={selectedIds}
        onClose={() => setShowPicker(false)}
        onToggle={onToggle}
        title="Link stories"
        availableScopeLabel="Not linked"
        allScopeLabel="All stories"
        onCreateStory={() => {
          setShowPicker(false);
          router.push('/(tabs)/stories/new');
        }}
      />

      <StoryPreviewModal
        story={previewStory}
        visible={!!previewStory}
        onClose={() => setPreviewStory(null)}
        onEdit={(story) => {
          setPreviewStory(null);
          router.push(`/(tabs)/stories/${story.id}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  addBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  chips: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
});
