import { StyleSheet, View } from 'react-native';

import { CardSubcategoryBadge } from '@/src/components/CardSubcategoryBadge';
import type { CardSubcategory } from '@/src/types';

interface CardSubcategoryListProps {
  subcategories?: CardSubcategory[];
}

export function CardSubcategoryList({ subcategories }: CardSubcategoryListProps) {
  if (!subcategories?.length) return null;

  return (
    <View style={styles.list}>
      {subcategories.map((subcategory) => (
        <CardSubcategoryBadge key={subcategory.id} subcategory={subcategory} />
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
