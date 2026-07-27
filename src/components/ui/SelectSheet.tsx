import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';

export type SelectSheetOption<T extends string | null> = {
  value: T;
  label: string;
  hint?: string;
};

interface SelectSheetProps<T extends string | null> {
  visible: boolean;
  title: string;
  options: SelectSheetOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function SelectSheet<T extends string | null>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: SelectSheetProps<T>) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation?.()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsContent}
            keyboardShouldPersistTaps="handled">
            {options.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <Pressable
                  key={option.value ?? '__all__'}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}>
                  <View style={styles.optionTextWrap}>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {option.label}
                    </Text>
                    {option.hint ? (
                      <Text style={styles.optionHint}>{option.hint}</Text>
                    ) : null}
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : (
                    <View style={styles.optionRadio} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
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
    maxHeight: '72%',
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
  optionsScroll: {
    flexGrow: 0,
  },
  optionsContent: {
    padding: spacing.sm,
    paddingBottom: spacing.xl,
    gap: 6,
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
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
});
