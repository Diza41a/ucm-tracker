import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable as RNPressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  NestableDraggableFlatList,
  RenderItemParams,
  ScaleDecorator,
  ShadowDecorator,
} from 'react-native-draggable-flatlist';

import { CardMetaChips } from '@/src/components/CardMetaChips';
import { CardPreviewModal } from '@/src/components/CardPreviewModal';
import { MonthlyCardFilterBar } from '@/src/components/MonthlyCardFilterBar';
import { MonthlyCardSelectionModal } from '@/src/components/MonthlyCardSelectionModal';
import { InlineEmptyState } from '@/src/components/StateViews';
import { CollapsibleFormField } from '@/src/components/ui/CollapsibleFormField';
import { supportsNativeDragAndDrop } from '@/src/constants/platform';
import { colors, radii, spacing, surfaceShadow } from '@/src/constants/theme';
import { SAVE_DEBOUNCE_MS } from '@/src/constants/timing';
import { useCardTypes } from '@/src/hooks/useCardTypes';
import { useCards, useToggleCardCompletedOnce } from '@/src/hooks/useCards';
import {
  useMonthlyPriorities,
  useSaveMonthlyPriorities,
} from '@/src/hooks/useMonthlyPriorities';
import { useEnrichedCards } from '@/src/hooks/useEnrichedCards';
import type { Card } from '@/src/types';
import {
  DEFAULT_CARD_FILTER_STATE,
  filterCards,
  toggleFilterValue,
  type CompletedFilterValue,
  type DifficultyFilterValue,
} from '@/src/utils/cardFilters';
import { formatMonthYear } from '@/src/utils/display';
import { mergeCardsWithCatalog } from '@/src/utils/cardRelations';
import { moveListItem } from '@/src/utils/reorderList';

interface MonthlyCardPrioritiesProps {
  year: number;
  month: number;
}

function cardIdsKey(cards: Card[]) {
  return cards.map((card) => card.id).join(',');
}

function applyCompletionToggle(cards: Card[], cardId: string, completed: boolean): Card[] {
  const patched = cards.map((item) =>
    item.id === cardId ? { ...item, completed_once: completed } : item
  );

  if (!completed) {
    return patched;
  }

  const index = patched.findIndex((item) => item.id === cardId);
  if (index < 0 || index === patched.length - 1) {
    return patched;
  }

  const reordered = [...patched];
  const [completedCard] = reordered.splice(index, 1);
  reordered.push(completedCard);
  return reordered;
}

export function MonthlyCardPriorities({ year, month }: MonthlyCardPrioritiesProps) {
  const monthKey = `${year}-${month}`;
  const { data: cards } = useCards();
  const { data: cardTypes } = useCardTypes();
  const { data: priorities, isFetching } = useMonthlyPriorities(year, month);
  const savePriorities = useSaveMonthlyPriorities();
  const toggleCompletedOnce = useToggleCardCompletedOnce();

  const [orderedCards, setOrderedCards] = useState<Card[]>([]);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [filterCompleted, setFilterCompleted] = useState<CompletedFilterValue[]>([]);
  const [filterDifficulties, setFilterDifficulties] = useState<DifficultyFilterValue[]>([]);
  const lastSavedKey = useRef('');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHydrating = useRef(false);
  const loadedMonthKey = useRef<string | null>(null);

  useEffect(() => {
    isHydrating.current = true;
    loadedMonthKey.current = null;
    lastSavedKey.current = '';
    setOrderedCards([]);
    setFilterCompleted([]);
    setFilterDifficulties([]);
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
  }, [monthKey]);

  useEffect(() => {
    if (isFetching || loadedMonthKey.current === monthKey) return;

    isHydrating.current = true;
    const fromServer =
      priorities
        ?.map((priority) => priority.card)
        .filter((card): card is Card => !!card) ?? [];

    const merged = mergeCardsWithCatalog(fromServer, cards ?? []);
    const nextKey = cardIdsKey(fromServer);
    lastSavedKey.current = nextKey;
    setOrderedCards(merged);
    loadedMonthKey.current = monthKey;

    const frame = requestAnimationFrame(() => {
      isHydrating.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [priorities, isFetching, monthKey, cards]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  const persist = useCallback(
    (nextCards: Card[]) => {
      const nextKey = cardIdsKey(nextCards);
      if (nextKey === lastSavedKey.current) return;

      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      saveTimeout.current = setTimeout(async () => {
        try {
          await savePriorities.mutateAsync({
            year,
            month,
            cardIds: nextCards.map((card) => card.id),
          });
          lastSavedKey.current = nextKey;
        } catch (e) {
          Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save priorities');
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [month, savePriorities, year]
  );

  const updateOrderedCards = useCallback(
    (nextCards: Card[]) => {
      setOrderedCards(nextCards);
      if (!isHydrating.current) {
        persist(nextCards);
      }
    },
    [persist]
  );

  const handleSelectionChange = (nextCards: Card[]) => {
    updateOrderedCards(nextCards);
  };

  const handleToggleComplete = useCallback(
    async (card: Card) => {
      const next = !card.completed_once;
      const previousCards = orderedCards;
      const nextCards = applyCompletionToggle(previousCards, card.id, next);

      updateOrderedCards(nextCards);
      setPreviewCard((prev) => (prev?.id === card.id ? { ...prev, completed_once: next } : prev));

      try {
        await toggleCompletedOnce.mutateAsync({ id: card.id, completed_once: next });
      } catch (e) {
        updateOrderedCards(previousCards);
        setPreviewCard((prev) =>
          prev?.id === card.id ? { ...prev, completed_once: card.completed_once } : prev
        );
        Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update completion status');
      }
    },
    [orderedCards, toggleCompletedOnce, updateOrderedCards]
  );

  const moveCard = useCallback(
    (fromIndex: number, toIndex: number) => {
      updateOrderedCards(moveListItem(orderedCards, fromIndex, toIndex));
    },
    [orderedCards, updateOrderedCards]
  );

  const catalog = cards ?? [];
  const enrichedQuery = useEnrichedCards(orderedCards, catalog);
  const displayCards =
    enrichedQuery.data ?? mergeCardsWithCatalog(orderedCards, catalog);

  const hasActiveFilters = filterCompleted.length > 0 || filterDifficulties.length > 0;
  const visibleCards = useMemo(() => {
    if (!hasActiveFilters) return displayCards;
    return filterCards(displayCards, {
      ...DEFAULT_CARD_FILTER_STATE,
      filterCompleted,
      filterDifficulties,
    });
  }, [displayCards, filterCompleted, filterDifficulties, hasActiveFilters]);

  const monthLabel = formatMonthYear(year, month);

  const previewCardResolved = useMemo(() => {
    if (!previewCard) return null;
    return displayCards.find((card) => card.id === previewCard.id) ?? previewCard;
  }, [displayCards, previewCard]);

  const renderCardTile = (
    item: Card,
    options: {
      isActive?: boolean;
      drag?: () => void;
      index?: number;
    } = {}
  ) => {
    const { isActive = false, drag, index } = options;
    const CardPressable = supportsNativeDragAndDrop ? Pressable : RNPressable;

    return (
      <View style={[styles.cardRow, isActive && styles.cardRowActive]}>
        <View style={[styles.cardTile, isActive && styles.cardTileActive]}>
          <CardPressable style={styles.cardBody} onPress={() => setPreviewCard(item)}>
            <CardMetaChips card={item} compact />
            <Text style={styles.cardAction} numberOfLines={4}>
              {item.action}
            </Text>
            <Text style={styles.cardDifficulty}>{item.difficulty}/10</Text>
          </CardPressable>
          <View style={styles.cardActionsRow}>
            <CardPressable
              onPress={() => handleToggleComplete(item)}
              hitSlop={8}
              accessibilityLabel={
                item.completed_once ? 'Mark as not completed once' : 'Mark as completed once'
              }
              accessibilityRole="button">
              <Ionicons
                name={item.completed_once ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={item.completed_once ? colors.completed : colors.textMuted}
              />
            </CardPressable>
            {supportsNativeDragAndDrop && drag ? (
              <Pressable
                onLongPress={drag}
                delayLongPress={120}
                hitSlop={8}
                style={styles.dragHandle}
                accessibilityLabel="Reorder card"
                accessibilityRole="button">
                <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
              </Pressable>
            ) : index !== undefined ? (
              <View style={styles.webReorderControls}>
                <RNPressable
                  onPress={() => moveCard(index, index - 1)}
                  disabled={index === 0}
                  hitSlop={8}
                  style={[styles.webReorderBtn, index === 0 && styles.webReorderBtnDisabled]}
                  accessibilityLabel="Move card up"
                  accessibilityRole="button">
                  <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
                </RNPressable>
                <RNPressable
                  onPress={() => moveCard(index, index + 1)}
                  disabled={index === displayCards.length - 1}
                  hitSlop={8}
                  style={[
                    styles.webReorderBtn,
                    index === displayCards.length - 1 && styles.webReorderBtnDisabled,
                  ]}
                  accessibilityLabel="Move card down"
                  accessibilityRole="button">
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </RNPressable>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const renderCard = ({ item, drag, isActive }: RenderItemParams<Card>) => (
    <ScaleDecorator activeScale={1.05}>
      <ShadowDecorator>{renderCardTile(item, { isActive, drag })}</ShadowDecorator>
    </ScaleDecorator>
  );

  return (
    <View style={styles.section}>
      <CollapsibleFormField
        icon="reorder-four-outline"
        title={`Monthly focus · ${monthLabel}`}
        defaultExpanded
        style={styles.collapsibleField}
        action={
          <View style={styles.headerActions}>
            {savePriorities.isPending || isFetching ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : null}
            <Pressable
              style={styles.manageBtn}
              onPress={() => setShowSelectionModal(true)}
              hitSlop={8}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
        }>
        {displayCards.length > 0 ? (
          <MonthlyCardFilterBar
            filterCompleted={filterCompleted}
            filterDifficulties={filterDifficulties}
            onToggleCompleted={(value) =>
              setFilterCompleted((prev) => toggleFilterValue(prev, value))
            }
            onToggleDifficulty={(value) =>
              setFilterDifficulties((prev) => toggleFilterValue(prev, value))
            }
            onClear={() => {
              setFilterCompleted([]);
              setFilterDifficulties([]);
            }}
          />
        ) : null}
        {isFetching && displayCards.length === 0 ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loading} />
        ) : displayCards.length === 0 ? (
          <InlineEmptyState
            icon="albums-outline"
            message="Choose which cards to focus on this month."
            actionLabel={cards?.length ? 'Select cards' : cardTypes?.length ? 'Create a card' : 'Create card types'}
            onAction={() => {
              if (!cardTypes?.length) {
                router.push('/(tabs)/cards/types');
              } else if (!cards?.length) {
                router.push('/(tabs)/cards/new');
              } else {
                setShowSelectionModal(true);
              }
            }}
            compact
          />
        ) : hasActiveFilters && visibleCards.length === 0 ? (
          <InlineEmptyState
            icon="filter-outline"
            message="No cards match these filters."
            actionLabel="Clear filters"
            onAction={() => {
              setFilterCompleted([]);
              setFilterDifficulties([]);
            }}
            compact
          />
        ) : hasActiveFilters ? (
          <View style={styles.cardsList}>
            {visibleCards.map((item) => (
              <View key={item.id}>{renderCardTile(item)}</View>
            ))}
          </View>
        ) : supportsNativeDragAndDrop ? (
          <NestableDraggableFlatList
            data={displayCards}
            keyExtractor={(item) => item.id}
            onDragEnd={({ data }) => updateOrderedCards(data)}
            renderItem={renderCard}
            scrollEnabled={false}
            nestedScrollEnabled
            dragItemOverflow
            containerStyle={styles.cardsList}
          />
        ) : (
          <View style={styles.cardsList}>
            {displayCards.map((item, index) => (
              <View key={item.id}>{renderCardTile(item, { index })}</View>
            ))}
          </View>
        )}
      </CollapsibleFormField>

      <MonthlyCardSelectionModal
        visible={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        allCards={catalog}
        selectedCards={displayCards}
        onChange={handleSelectionChange}
        year={year}
        month={month}
      />

      <CardPreviewModal
        card={previewCardResolved}
        visible={!!previewCard}
        onClose={() => setPreviewCard(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: spacing.md,
    marginBottom: 16,
    overflow: 'visible',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  manageBtn: {
    padding: 2,
  },
  loading: {
    alignSelf: 'center',
    marginVertical: spacing.md,
  },
  collapsibleField: {
    overflow: 'visible',
  },
  cardsList: {
    flexGrow: 0,
    overflow: 'visible',
    paddingVertical: 10,
    marginVertical: -4,
  },
  cardRow: {
    marginBottom: spacing.md,
    overflow: 'visible',
  },
  cardRowActive: {
    zIndex: 10,
    overflow: 'visible',
    ...surfaceShadow('lg'),
  },
  cardTile: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardTileActive: {
    borderColor: colors.primary,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  dragHandle: {
    padding: 2,
  },
  webReorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webReorderBtn: {
    padding: 2,
  },
  webReorderBtnDisabled: {
    opacity: 0.35,
  },
  cardAction: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    lineHeight: 22,
  },
  cardDifficulty: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
