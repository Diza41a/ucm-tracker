import { StyleSheet, View } from 'react-native';

import { StoryTagBadge } from '@/src/components/StoryTagBadge';
import type { StoryTag } from '@/src/types';

interface StoryTagListProps {
  tags?: StoryTag[];
}

export function StoryTagList({ tags }: StoryTagListProps) {
  if (!tags?.length) return null;

  return (
    <View style={styles.list}>
      {tags.map((tag) => (
        <StoryTagBadge key={tag.id} tag={tag} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
