import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CardBadge } from '@/src/components/CardBadge';
import { colors, radii, spacing } from '@/src/constants/theme';
import type { CardType } from '@/src/types';
import type { ReactNode } from 'react';

function SheetFrame({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation?.()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function CardTypePickerSheet({
  visible,
  cardTypes,
  selectedTypeId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  cardTypes: CardType[];
  selectedTypeId: string;
  onSelect: (typeId: string) => void;
  onClose: () => void;
}) {
  return (
    <SheetFrame visible={visible} title="Card type" subtitle="Choose a category" onClose={onClose}>
      <ScrollView
        style={styles.optionsScroll}
        contentContainerStyle={styles.typeOptionsContent}
        keyboardShouldPersistTaps="handled">
        {cardTypes.map((type) => {
          const selected = type.id === selectedTypeId;
          return (
            <Pressable
              key={type.id}
              style={[styles.typeOption, selected && styles.typeOptionSelected]}
              onPress={() => onSelect(type.id)}>
              <CardBadge cardType={type} compact />
              {selected ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primaryLight} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </SheetFrame>
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
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  optionsScroll: {
    flexGrow: 0,
  },
  typeOptionsContent: {
    padding: spacing.sm,
    gap: 8,
    paddingBottom: spacing.xl,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
});
