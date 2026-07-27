import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import { CardMetaChips } from '@/src/components/CardMetaChips';
import { InlineEmptyState } from '@/src/components/StateViews';
import { supportsNativeDragAndDrop } from '@/src/constants/platform';
import { colors, radii, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import { useCardTypes } from '@/src/hooks/useCardTypes';
import { useCardSubcategories } from '@/src/hooks/useCardSubcategories';
import { useEnrichedCards } from '@/src/hooks/useEnrichedCards';
import type { Card } from '@/src/types';
import { moveListItem } from '@/src/utils/reorderList';

interface MonthlyCardSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  allCards: Card[];
  selectedCards: Card[];
  onChange: (cards: Card[]) => void;
}

export function MonthlyCardSelectionModal({
  visible,
  onClose,
  allCards,
  selectedCards,
  onChange,
}: MonthlyCardSelectionModalProps) {
  const { data: cardTypes } = useCardTypes();
  const { data: subcategories } = useCardSubcategories();
  const [filterTypeId, setFilterTypeId] = useState<string | null>(null);
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const enrichedAllCards = useEnrichedCards(allCards, allCards).data ?? allCards;
  const enrichedSelectedCards = useEnrichedCards(selectedCards, allCards).data ?? selectedCards;

  const filteredPool = useMemo(() => {
    let pool = enrichedAllCards;
    if (filterTypeId) {
      pool = pool.filter((card) => card.card_type_id === filterTypeId);
    }
    if (filterSubcategoryId) {
      pool = pool.filter((card) =>
        card.subcategories?.some((subcategory) => subcategory.id === filterSubcategoryId)
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      pool = pool.filter(
        (card) =>
          card.action.toLowerCase().includes(q) ||
          card.function_purpose.toLowerCase().includes(q)
      );
    }
    return pool;
  }, [enrichedAllCards, filterSubcategoryId, filterTypeId, search]);

  const toggleCard = (card: Card) => {
    const exists = enrichedSelectedCards.some((item) => item.id === card.id);
    if (exists) {
      onChange(enrichedSelectedCards.filter((item) => item.id !== card.id));
    } else {
      onChange([...enrichedSelectedCards, card]);
    }
  };

  const moveSelectedCard = useCallback(
    (fromIndex: number, toIndex: number) => {
      onChange(moveListItem(enrichedSelectedCards, fromIndex, toIndex));
    },
    [enrichedSelectedCards, onChange]
  );

  const renderSelectedRow = (
    item: Card,
    options: { drag?: () => void; isActive?: boolean; index?: number } = {}
  ) => {
    const { drag, isActive = false, index } = options;

    return (
      <View style={[styles.selectedRow, isActive && styles.selectedRowActive]}>
        {supportsNativeDragAndDrop && drag ? (
          <Pressable onLongPress={drag} style={styles.dragHandle}>
            <Ionicons name="reorder-three" size={20} color={colors.textMuted} />
          </Pressable>
        ) : index !== undefined ? (
          <View style={styles.webReorderControls}>
            <Pressable
              onPress={() => moveSelectedCard(index, index - 1)}
              disabled={index === 0}
              style={[styles.webReorderBtn, index === 0 && styles.webReorderBtnDisabled]}>
              <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={() => moveSelectedCard(index, index + 1)}
              disabled={index === enrichedSelectedCards.length - 1}
              style={[
                styles.webReorderBtn,
                index === enrichedSelectedCards.length - 1 && styles.webReorderBtnDisabled,
              ]}>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}
        <View style={styles.selectedInfo}>
          <CardMetaChips card={item} compact />
          <Text style={styles.selectedAction} numberOfLines={2}>
            {item.action}
          </Text>
        </View>
        <Pressable onPress={() => toggleCard(item)} hitSlop={8}>
          <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>
    );
  };

  const renderSelectedItem = ({ item, drag, isActive }: RenderItemParams<Card>) => (
    <ScaleDecorator>{renderSelectedRow(item, { drag, isActive })}</ScaleDecorator>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Monthly focus cards</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.selectedSection}>
          <Text style={styles.sectionTitle}>Selected ({enrichedSelectedCards.length})</Text>
          {enrichedSelectedCards.length === 0 ? (
            <InlineEmptyState
              icon="albums-outline"
              message="Pick cards below to focus on this month."
              compact
            />
          ) : supportsNativeDragAndDrop ? (
            <DraggableFlatList
              data={enrichedSelectedCards}
              keyExtractor={(item) => item.id}
              onDragEnd={({ data }) => onChange(data)}
              renderItem={renderSelectedItem}
              scrollEnabled={enrichedSelectedCards.length > 3}
              nestedScrollEnabled
              style={styles.selectedList}
              containerStyle={styles.selectedListInner}
            />
          ) : (
            <ScrollView
              style={styles.selectedList}
              contentContainerStyle={styles.selectedListInner}
              nestedScrollEnabled
              showsVerticalScrollIndicator={enrichedSelectedCards.length > 3}>
              {enrichedSelectedCards.map((item, index) => (
                <View key={item.id}>{renderSelectedRow(item, { index })}</View>
              ))}
            </ScrollView>
          )}
        </View>

        <ScrollView
          style={styles.poolScroll}
          contentContainerStyle={styles.poolContent}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Add cards</Text>
          <TextInput
            style={formStyles.input}
            value={search}
            onChangeText={setSearch}
            placeholder="Search cards..."
            placeholderTextColor={colors.textMuted}
          />

          {cardTypes && cardTypes.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersBar}
              contentContainerStyle={styles.filters}>
              <Pressable
                style={[styles.filterChip, !filterTypeId && styles.filterChipActive]}
                onPress={() => setFilterTypeId(null)}>
                <Text style={[styles.filterText, !filterTypeId && styles.filterTextActive]}>
                  All types
                </Text>
              </Pressable>
              {cardTypes.map((type) => {
                const active = filterTypeId === type.id;
                return (
                  <Pressable
                    key={type.id}
                    style={[
                      styles.filterChip,
                      active
                        ? { backgroundColor: type.bg_color, borderColor: type.bg_color }
                        : null,
                    ]}
                    onPress={() => setFilterTypeId(type.id)}>
                    <Text style={[styles.filterText, active ? { color: type.text_color } : null]}>
                      {type.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {subcategories && subcategories.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersBar}
              contentContainerStyle={styles.filters}>
              <Pressable
                style={[styles.filterChip, !filterSubcategoryId && styles.filterChipActive]}
                onPress={() => setFilterSubcategoryId(null)}>
                <Text
                  style={[styles.filterText, !filterSubcategoryId && styles.filterTextActive]}>
                  All subcategories
                </Text>
              </Pressable>
              {subcategories.map((subcategory) => {
                const active = filterSubcategoryId === subcategory.id;
                return (
                  <Pressable
                    key={subcategory.id}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setFilterSubcategoryId(subcategory.id)}>
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {subcategory.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={styles.poolList}>
            {filteredPool.length === 0 ? (
              <InlineEmptyState icon="search-outline" message="No cards match your filters." compact />
            ) : (
              filteredPool.map((card) => {
                const selected = enrichedSelectedCards.some((item) => item.id === card.id);
                return (
                  <Pressable
                    key={card.id}
                    style={[styles.poolRow, selected && styles.poolRowSelected]}
                    onPress={() => toggleCard(card)}>
                    <View style={styles.poolInfo}>
                      <CardMetaChips card={card} compact />
                      <Text style={styles.poolAction} numberOfLines={2}>
                        {card.action}
                      </Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <Ionicons name="add-circle-outline" size={22} color={colors.textSecondary} />
                    )}
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  selectedSection: {
    flexShrink: 0,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selectedList: {
    maxHeight: 220,
    flexGrow: 0,
  },
  selectedListInner: {
    flexGrow: 0,
  },
  poolScroll: {
    flex: 1,
  },
  poolContent: {
    padding: spacing.screenPadding,
    paddingBottom: 24,
    gap: spacing.md,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  selectedRowActive: {
    borderColor: colors.primary,
  },
  dragHandle: {
    paddingVertical: 4,
  },
  webReorderControls: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  webReorderBtn: {
    padding: 2,
  },
  webReorderBtnDisabled: {
    opacity: 0.35,
  },
  selectedInfo: {
    flex: 1,
    gap: 4,
  },
  selectedAction: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  filtersBar: {
    flexGrow: 0,
  },
  filters: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.onPrimary,
  },
  poolList: {
    gap: spacing.sm,
  },
  poolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  poolRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  poolInfo: {
    flex: 1,
    gap: 4,
  },
  poolAction: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.screenPadding,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
});
