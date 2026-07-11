import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CardBadge } from '@/src/components/CardBadge';
import { CardFilterBar } from '@/src/components/CardFilterBar';
import { InlineEmptyState } from '@/src/components/StateViews';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useMonthlyPriorities } from '@/src/hooks/useMonthlyPriorities';
import type { Card } from '@/src/types';
import {
  type CardFilterState,
  filterCards,
  getLinkedStoriesFromCards,
} from '@/src/utils/cardFilters';
import { formatMonthYear } from '@/src/utils/display';

type PickerTab = 'month' | 'all';

const EMPTY_FILTERS: CardFilterState = {
  search: '',
  filterTypeId: null,
  filterCompleted: 'all',
  filterDifficulty: 'all',
  filterStoryId: null,
};

interface CardPickerModalProps {
  visible: boolean;
  year: number;
  month: number;
  allCards?: Card[];
  selectedIds: string[];
  onClose: () => void;
  onToggle: (cardId: string) => void;
  onCreateCard?: () => void;
  onManageMonthPool?: () => void;
}

function CardPickerRow({
  card,
  selected,
  onPress,
}: {
  card: Card;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.row, selected && styles.rowSelected]}
      onPress={onPress}>
      <View style={styles.rowInfo}>
        {card.card_type ? <CardBadge cardType={card.card_type} /> : null}
        <Text style={styles.rowText} numberOfLines={2}>
          {card.action}
        </Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      ) : (
        <Ionicons name="ellipse-outline" size={22} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

export function CardPickerModal({
  visible,
  year,
  month,
  allCards,
  selectedIds,
  onClose,
  onToggle,
  onCreateCard,
  onManageMonthPool,
}: CardPickerModalProps) {
  const { data: priorities } = useMonthlyPriorities(year, month);
  const [tab, setTab] = useState<PickerTab>('month');
  const [filters, setFilters] = useState<CardFilterState>(EMPTY_FILTERS);

  const monthPoolCards = useMemo(() => {
    if (!priorities?.length) return [] as Card[];

    return priorities
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((priority) => priority.card)
      .filter((card): card is Card => !!card);
  }, [priorities]);

  const linkedStories = useMemo(
    () => getLinkedStoriesFromCards(allCards ?? []),
    [allCards]
  );

  const filteredAllCards = useMemo(
    () => filterCards(allCards ?? [], filters),
    [allCards, filters]
  );

  const handleClose = () => {
    setTab('month');
    setFilters(EMPTY_FILTERS);
    onClose();
  };

  const monthLabel = formatMonthYear(year, month);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cards worked on</Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabChip, tab === 'month' && styles.tabChipActive]}
            onPress={() => setTab('month')}>
            <Text style={[styles.tabText, tab === 'month' && styles.tabTextActive]}>
              {monthLabel} pool
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabChip, tab === 'all' && styles.tabChipActive]}
            onPress={() => setTab('all')}>
            <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>
              All cards
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {tab === 'month' ? (
            monthPoolCards.length === 0 ? (
              <InlineEmptyState
                icon="albums-outline"
                message={`No cards in your ${monthLabel} focus pool yet.`}
                actionLabel={onManageMonthPool ? 'Pick cards on tracker' : undefined}
                onAction={onManageMonthPool}
                compact
              />
            ) : (
              monthPoolCards.map((card) => (
                <CardPickerRow
                  key={card.id}
                  card={card}
                  selected={selectedIds.includes(card.id)}
                  onPress={() => onToggle(card.id)}
                />
              ))
            )
          ) : (
            <>
              <CardFilterBar
                filters={filters}
                linkedStories={linkedStories}
                onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
              />

              {!allCards?.length ? (
                <InlineEmptyState
                  icon="albums-outline"
                  message="No cards yet. Create one to tag it on this log."
                  actionLabel={onCreateCard ? 'Create card' : undefined}
                  onAction={onCreateCard}
                />
              ) : filteredAllCards.length === 0 ? (
                <InlineEmptyState
                  icon="search-outline"
                  message="No cards match your filters."
                  compact
                />
              ) : (
                filteredAllCards.map((card) => (
                  <CardPickerRow
                    key={card.id}
                    card={card}
                    selected={selectedIds.includes(card.id)}
                    onPress={() => onToggle(card.id)}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.onPrimary,
  },
  list: {
    padding: spacing.screenPadding,
    gap: spacing.sm,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  rowText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
});
