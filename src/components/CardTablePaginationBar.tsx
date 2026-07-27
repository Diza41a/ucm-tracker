import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';
import { CARD_TABLE_PAGE_SIZES, type CardTablePageSize } from '@/src/utils/cardTable';

interface CardTablePaginationBarProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: CardTablePageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: CardTablePageSize) => void;
}

function PageSizeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.sizeChip, active && styles.sizeChipActive]} onPress={onPress}>
      <Text style={[styles.sizeChipText, active && styles.sizeChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function CardTablePaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: CardTablePaginationBarProps) {
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  return (
    <View style={styles.wrap}>
      <Text style={styles.rangeText}>
        {totalItems === 0 ? 'No cards' : `${rangeStart}–${rangeEnd} of ${totalItems}`}
      </Text>

      <View style={styles.pageControls}>
        <Pressable
          style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
          disabled={page <= 1}
          onPress={() => onPageChange(page - 1)}
          hitSlop={8}>
          <Ionicons
            name="chevron-back"
            size={18}
            color={page <= 1 ? colors.textMuted : colors.primary}
          />
        </Pressable>
        <Text style={styles.pageLabel}>
          {page} / {totalPages}
        </Text>
        <Pressable
          style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
          disabled={page >= totalPages}
          onPress={() => onPageChange(page + 1)}
          hitSlop={8}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={page >= totalPages ? colors.textMuted : colors.primary}
          />
        </Pressable>
      </View>

      <View style={styles.sizeGroup}>
        <Text style={styles.sizeLabel}>Per page</Text>
        <View style={styles.sizeRow}>
          {CARD_TABLE_PAGE_SIZES.map((size) => (
            <PageSizeChip
              key={size}
              label={String(size)}
              active={pageSize === size}
              onPress={() => onPageSizeChange(size)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rangeText: {
    fontSize: 14,
    color: colors.textSecondary,
    minWidth: 100,
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pageBtn: {
    padding: 4,
  },
  pageBtnDisabled: {
    opacity: 0.45,
  },
  pageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 52,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  sizeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sizeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  sizeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeChipActive: {
    backgroundColor: colors.selected,
    borderColor: colors.primary,
  },
  sizeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  sizeChipTextActive: {
    color: colors.primaryLight,
  },
});
