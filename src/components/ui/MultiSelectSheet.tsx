import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { InlineEmptyState } from '@/src/components/StateViews';
import { colors, radii, spacing } from '@/src/constants/theme';

export type MultiSelectSheetOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

interface MultiSelectSheetProps<T extends string> {
  visible: boolean;
  title: string;
  options: MultiSelectSheetOption<T>[];
  selectedValues: T[];
  onChange: (values: T[]) => void;
  onClose: () => void;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  emptyIcon?: keyof typeof Ionicons.glyphMap;
}

export function MultiSelectSheet<T extends string>({
  visible,
  title,
  options,
  selectedValues,
  onChange,
  onClose,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  emptyIcon = 'albums-outline',
}: MultiSelectSheetProps<T>) {
  const toggle = (value: T) => {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation?.()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>
                {selectedValues.length
                  ? `${selectedValues.length} selected`
                  : 'Select one or more'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {selectedValues.length ? (
                <Pressable onPress={() => onChange([])} hitSlop={8}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
          </View>
          <ScrollView
            style={styles.optionsScroll}
            contentContainerStyle={[
              styles.optionsContent,
              options.length === 0 && styles.optionsContentEmpty,
            ]}
            keyboardShouldPersistTaps="handled">
            {options.length === 0 && emptyMessage ? (
              <InlineEmptyState
                icon={emptyIcon}
                message={emptyMessage}
                actionLabel={emptyActionLabel}
                onAction={onEmptyAction}
              />
            ) : (
              options.map((option) => {
                const selected = selectedValues.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => toggle(option.value)}>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                        {option.label}
                      </Text>
                      {option.hint ? (
                        <Text style={styles.optionHint}>{option.hint}</Text>
                      ) : null}
                    </View>
                    <Ionicons
                      name={selected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={selected ? colors.primary : colors.borderLight}
                    />
                  </Pressable>
                );
              })
            )}
          </ScrollView>
          <Pressable style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
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
    maxHeight: '78%',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  optionsScroll: {
    flexGrow: 0,
  },
  optionsContent: {
    padding: spacing.sm,
    gap: 6,
  },
  optionsContentEmpty: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionLabelSelected: {
    color: colors.primaryLight,
  },
  optionHint: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  doneButton: {
    margin: spacing.sm,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
