import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii } from '@/src/constants/theme';
import type { Story } from '@/src/types';
import { storyDisplayName } from '@/src/utils/display';

interface StoryChipProps {
  story: Pick<Story, 'id' | 'name'>;
  onPreview?: () => void;
  navigable?: boolean;
}

export function StoryChip({ story, onPreview, navigable = true }: StoryChipProps) {
  const label = storyDisplayName(story);

  const handlePress = () => {
    if (navigable) {
      router.push(`/(tabs)/stories/${story.id}`);
    }
  };

  return (
    <Pressable
      onPress={onPreview ?? handlePress}
      onLongPress={onPreview}
      style={styles.chip}
      disabled={!navigable && !onPreview}>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.chip,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    maxWidth: 160,
  },
  text: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
});
