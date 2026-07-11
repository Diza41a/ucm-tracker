import { StyleSheet, Text, View } from 'react-native';

import type { StoryTag } from '@/src/types';

interface StoryTagBadgeProps {
  tag: Pick<StoryTag, 'name' | 'bg_color' | 'text_color'>;
}

export function StoryTagBadge({ tag }: StoryTagBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: tag.bg_color }]}>
      <Text style={[styles.text, { color: tag.text_color }]} numberOfLines={1}>
        {tag.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
