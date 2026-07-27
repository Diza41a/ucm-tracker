import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, surfaceShadow } from '@/src/constants/theme';
import {
  cardTableGroupLabel,
  cardTableSubgroupLabel,
  normalizeGroupSettings,
  type CardTableGroupBy,
  type CardTableSubgroupBy,
} from '@/src/utils/cardTable';

interface CardTableLayoutBarProps {
  groupBy: CardTableGroupBy;
  subgroupBy: CardTableSubgroupBy;
  showReset: boolean;
  onGroupByChange: (groupBy: CardTableGroupBy) => void;
  onSubgroupByChange: (subgroupBy: CardTableSubgroupBy) => void;
  onReset: () => void;
}

function PopoverOption({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.option, selected && styles.optionSelected, disabled && styles.optionDisabled]}
      disabled={disabled}
      onPress={onPress}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      {selected ? (
        <Ionicons name="checkmark" size={18} color={colors.primaryLight} />
      ) : (
        <View style={styles.optionCheckPlaceholder} />
      )}
    </Pressable>
  );
}

export function CardTableLayoutBar({
  groupBy,
  subgroupBy,
  showReset,
  onGroupByChange,
  onSubgroupByChange,
  onReset,
}: CardTableLayoutBarProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const groupingActive = groupBy !== 'none';

  const groupOptions: { value: CardTableGroupBy; label: string }[] = [
    { value: 'none', label: 'Flat' },
    { value: 'type', label: cardTableGroupLabel('type') },
    { value: 'subcategory', label: cardTableGroupLabel('subcategory') },
  ];

  const subgroupOptions: { value: CardTableSubgroupBy; label: string; disabled?: boolean }[] = [
    { value: 'none', label: 'Off' },
    {
      value: 'type',
      label: cardTableGroupLabel('type'),
      disabled: groupBy === 'type',
    },
    {
      value: 'subcategory',
      label: cardTableGroupLabel('subcategory'),
      disabled: groupBy === 'subcategory',
    },
  ];

  return (
    <>
      <View style={styles.toolbar}>
        <View style={styles.actions}>
          {showReset ? (
            <Pressable
              style={styles.iconBtn}
              onPress={onReset}
              hitSlop={8}
              accessibilityLabel="Reset table settings"
              accessibilityRole="button">
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            </Pressable>
          ) : null}

          <Pressable
            style={[styles.iconBtn, groupingActive && styles.iconBtnActive]}
            onPress={() => setPopoverOpen(true)}
            hitSlop={8}
            accessibilityLabel="Grouping options"
            accessibilityRole="button">
            <Ionicons
              name="layers-outline"
              size={20}
              color={groupingActive ? colors.primaryLight : colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <Modal visible={popoverOpen} animationType="fade" transparent onRequestClose={() => setPopoverOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPopoverOpen(false)}>
          <Pressable style={styles.popover} onPress={(event) => event.stopPropagation?.()}>
            <Text style={styles.popoverTitle}>Grouping</Text>

            <Text style={styles.sectionLabel}>Group by</Text>
            <View style={styles.optionGroup}>
              {groupOptions.map((option) => (
                <PopoverOption
                  key={option.value}
                  label={option.label}
                  selected={groupBy === option.value}
                  onPress={() => {
                    const next = normalizeGroupSettings(option.value, subgroupBy);
                    onGroupByChange(next.groupBy);
                    onSubgroupByChange(next.subgroupBy);
                  }}
                />
              ))}
            </View>

            {groupBy !== 'none' ? (
              <>
                <Text style={styles.sectionLabel}>Then</Text>
                <View style={styles.optionGroup}>
                  {subgroupOptions.map((option) => (
                    <PopoverOption
                      key={option.value}
                      label={option.label}
                      selected={subgroupBy === option.value}
                      disabled={option.disabled}
                      onPress={() => {
                        const next = normalizeGroupSettings(groupBy, option.value);
                        onSubgroupByChange(next.subgroupBy);
                      }}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: colors.selected,
    borderColor: colors.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingTop: 96,
    paddingHorizontal: spacing.lg,
    alignItems: 'flex-start',
  },
  popover: {
    width: 260,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...surfaceShadow('md'),
  },
  popoverTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  optionGroup: {
    gap: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radii.sm,
  },
  optionSelected: {
    backgroundColor: colors.selected,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.primaryLight,
    fontWeight: '600',
  },
  optionCheckPlaceholder: {
    width: 18,
  },
});
