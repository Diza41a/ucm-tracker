import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CardBadge } from '@/src/components/CardBadge';
import { CardPreviewModal } from '@/src/components/CardPreviewModal';
import { MonthlyCardSelectionModal } from '@/src/components/MonthlyCardSelectionModal';
import { InlineEmptyState } from '@/src/components/StateViews';
import { FormField } from '@/src/components/ui/FormField';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useCardTypes } from '@/src/hooks/useCardTypes';
import { useCards } from '@/src/hooks/useCards';
import {
  useMonthlyPriorities,
  useSaveMonthlyPriorities,
} from '@/src/hooks/useMonthlyPriorities';
import type { Card } from '@/src/types';

interface MonthlyCardPrioritiesProps {
  year: number;
  month: number;
}

function cardIdsKey(cards: Card[]) {
  return cards.map((card) => card.id).join(',');
}

export function MonthlyCardPriorities({ year, month }: MonthlyCardPrioritiesProps) {
  const { data: cards } = useCards();
  const { data: cardTypes } = useCardTypes();
  const { data: priorities } = useMonthlyPriorities(year, month);
  const savePriorities = useSaveMonthlyPriorities();

  const [orderedCards, setOrderedCards] = useState<Card[]>([]);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const lastSavedKey = useRef('');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHydrating = useRef(false);

  useEffect(() => {
    isHydrating.current = true;
    const fromServer =
      priorities
        ?.map((priority) => priority.card)
        .filter((card): card is Card => !!card) ?? [];

    const nextKey = cardIdsKey(fromServer);
    lastSavedKey.current = nextKey;
    setOrderedCards(fromServer);

    const frame = requestAnimationFrame(() => {
      isHydrating.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [priorities, year, month]);

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
      }, 500);
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

  return (
    <View style={styles.section}>
      <FormField
        icon="reorder-four-outline"
        title="Monthly focus cards"
        action={
          <View style={styles.headerActions}>
            {savePriorities.isPending ? (
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
        {orderedCards.length === 0 ? (
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
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cardsScroll}
            contentContainerStyle={styles.cardsRow}>
            {orderedCards.map((card) => (
              <Pressable
                key={card.id}
                style={styles.cardTile}
                onPress={() => setPreviewCard(card)}>
                {card.card_type ? <CardBadge cardType={card.card_type} /> : null}
                <Text style={styles.cardAction} numberOfLines={3}>
                  {card.action}
                </Text>
                <Text style={styles.cardDifficulty}>{card.difficulty}/10</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </FormField>

      <MonthlyCardSelectionModal
        visible={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        allCards={cards ?? []}
        selectedCards={orderedCards}
        onChange={handleSelectionChange}
      />

      <CardPreviewModal
        card={previewCard}
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
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  manageBtn: {
    padding: 2,
  },
  cardsScroll: {
    flexGrow: 0,
    maxHeight: 132,
  },
  cardsRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  cardTile: {
    width: 148,
    minHeight: 108,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 6,
  },
  cardAction: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    lineHeight: 18,
  },
  cardDifficulty: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
