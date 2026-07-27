import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardSubcategoryBadge } from '@/src/components/CardSubcategoryBadge';
import { InlineEmptyState } from '@/src/components/StateViews';
import { colors, radii } from '@/src/constants/theme';
import { useCardSubcategories } from '@/src/hooks/useCardSubcategories';

interface CardSubcategoryPickerProps {
  value: string[];
  onChange: (subcategoryIds: string[]) => void;
}

export function CardSubcategoryPicker({ value, onChange }: CardSubcategoryPickerProps) {
  const { data: subcategories } = useCardSubcategories();

  const toggleSubcategory = (subcategoryId: string) => {
    if (value.includes(subcategoryId)) {
      onChange(value.filter((id) => id !== subcategoryId));
      return;
    }
    onChange([...value, subcategoryId]);
  };

  if (!subcategories?.length) {
    return (
      <InlineEmptyState
        icon="albums-outline"
        message="No subcategories yet. They are optional — create one to group related cards."
        actionLabel="Manage subcategories"
        onAction={() => router.push('/(tabs)/cards/subcategories')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.options}>
        {subcategories.map((subcategory) => {
          const selected = value.includes(subcategory.id);
          return (
            <Pressable
              key={subcategory.id}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => toggleSubcategory(subcategory.id)}>
              <CardSubcategoryBadge subcategory={subcategory} />
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={styles.manageLink}
        onPress={() => router.push('/(tabs)/cards/subcategories')}>
        <Ionicons name="albums-outline" size={14} color={colors.primary} />
        <Text style={styles.manageText}>Manage subcategories</Text>
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
