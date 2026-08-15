import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, surfaceShadow } from '@/src/constants/theme';
import {
  CARD_POOL_SORT_FIELDS,
  cardTableSortLabel,
  cycleSortLevels,
  getSortLevelForField,
  type CardTableSettings,
  type CardTableSortField,
} from '@/src/utils/cardTable';

interface CardPoolSortSheetProps {
  visible: boolean;
  sortLevels: CardTableSettings['sortLevels'];
  onClose: () => void;
  onSortLevelsChange: (sortLevels: CardTableSettings['sortLevels']) => void;
}

function SortOption({
  field,
  sortLevels,
  onPress,
}: {
  field: CardTableSortField;
  sortLevels: CardTableSettings['sortLevels'];
  onPress: () => void;
}) {
  const level = getSortLevelForField(sortLevels, field);

  return (
    <Pressable style={[styles.option, level && styles.optionActive]} onPress={onPress}>
      <Text style={[styles.optionLabel, level && styles.optionLabelActive]}>
        {cardTableSortLabel(field)}
      </Text>
      <View style={styles.optionMeta}>
        {level ? (
          <>
            <Ionicons
              name={level.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={16}
              color={level.order === 1 ? colors.primaryLight : colors.textSecondary}
            />
            <Text style={styles.orderBadge}>{level.order}</Text>
          </>
        ) : (
          <Text style={styles.offLabel}>Off</Text>
        )}
      </View>
    </Pressable>
  );
}

export function CardPoolSortSheet({
  visible,
  sortLevels,
  onClose,
  onSortLevelsChange,
}: CardPoolSortSheetProps) {
  const handleFieldPress = (field: CardTableSortField) => {
    onSortLevelsChange(cycleSortLevels(sortLevels, field));
  };

  const clearSort = () => onSortLevelsChange([]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation?.()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Sort</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <Text style={styles.hint}>Tap a field to sort. Tap again to reverse. Up to 2 levels.</Text>

          <View style={styles.options}>
            {CARD_POOL_SORT_FIELDS.map((field) => (
              <SortOption
                key={field}
                field={field}
                sortLevels={sortLevels}
                onPress={() => handleFieldPress(field)}
              />
            ))}
          </View>

          {sortLevels.length > 0 ? (
            <Pressable style={styles.clearBtn} onPress={clearSort}>
              <Text style={styles.clearBtnText}>Clear sort</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  options: {
    paddingHorizontal: spacing.screenPadding,
    gap: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    borderRadius: radii.sm,
  },
  optionActive: {
    backgroundColor: colors.selected,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  optionLabelActive: {
    color: colors.primaryLight,
    fontWeight: '600',
  },
  optionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 48,
    justifyContent: 'flex-end',
  },
  orderBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  offLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  clearBtn: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
