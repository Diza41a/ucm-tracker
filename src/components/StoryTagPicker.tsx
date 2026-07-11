import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StoryTagBadge } from '@/src/components/StoryTagBadge';
import { InlineEmptyState } from '@/src/components/StateViews';
import { colors, radii } from '@/src/constants/theme';
import { useStoryTags } from '@/src/hooks/useStoryTags';

interface StoryTagPickerProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
}

export function StoryTagPicker({ value, onChange }: StoryTagPickerProps) {
  const { data: tags } = useStoryTags();

  const toggleTag = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
      return;
    }
    onChange([...value, tagId]);
  };

  if (!tags?.length) {
    return (
      <InlineEmptyState
        icon="pricetag-outline"
        message="No story tags yet. Tags are optional — create one to label stories."
        actionLabel="Manage tags"
        onAction={() => router.push('/(tabs)/stories/tags')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.options}>
        {tags.map((tag) => {
          const selected = value.includes(tag.id);
          return (
            <Pressable
              key={tag.id}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => toggleTag(tag.id)}>
              <StoryTagBadge tag={tag} />
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.manageLink} onPress={() => router.push('/(tabs)/stories/tags')}>
        <Ionicons name="pricetags-outline" size={14} color={colors.primary} />
        <Text style={styles.manageText}>Manage tags</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  manageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  manageText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
