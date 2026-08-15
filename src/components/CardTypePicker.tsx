import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardBadge } from '@/src/components/CardBadge';
import { InlineEmptyState } from '@/src/components/StateViews';
import { colors, radii } from '@/src/constants/theme';
import { useCardTypes } from '@/src/hooks/useCardTypes';

interface CardTypePickerProps {
  value: string[];
  onChange: (typeIds: string[]) => void;
}

export function CardTypePicker({ value, onChange }: CardTypePickerProps) {
  const { data: cardTypes } = useCardTypes();

  const toggleType = (typeId: string) => {
    if (value.includes(typeId)) {
      if (value.length === 1) return;
      onChange(value.filter((id) => id !== typeId));
      return;
    }
    onChange([...value, typeId]);
  };

  if (!cardTypes?.length) {
    return (
      <InlineEmptyState
        icon="layers-outline"
        message="Create at least one card type before adding cards."
        actionLabel="Manage card types"
        onAction={() => router.push('/(tabs)/cards/types')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.options}>
        {cardTypes.map((type) => {
          const selected = value.includes(type.id);
          return (
            <Pressable
              key={type.id}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => toggleType(type.id)}>
              <CardBadge cardType={type} />
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.manageLink} onPress={() => router.push('/(tabs)/cards/types')}>
        <Ionicons name="layers-outline" size={14} color={colors.primary} />
        <Text style={styles.manageText}>Manage card types</Text>
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
