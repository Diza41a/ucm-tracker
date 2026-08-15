import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CardMetaChips } from '@/src/components/CardMetaChips';
import { EmptyState } from '@/src/components/StateViews';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useCardTypes } from '@/src/hooks/useCardTypes';
import { useToggleCardCompletedOnce } from '@/src/hooks/useCards';
import type { Card } from '@/src/types';
import type { CardTableSettings } from '@/src/utils/cardTable';
import {
  buildCardTableRows,
  filterCollapsedRows,
  getTableCards,
} from '@/src/utils/cardTable';

interface CardListViewProps {
  cards: Card[];
  emptyMessage: string;
  settings: CardTableSettings;
}

function ListSectionHeader({
  sectionKey,
  label,
  count,
  bgColor,
  textColor,
  variant,
  collapsed,
  onToggle,
}: {
  sectionKey: string;
  label: string;
  count: number;
  bgColor?: string;
  textColor?: string;
  variant: 'group' | 'subgroup';
  collapsed: boolean;
  onToggle: (key: string) => void;
}) {
  const isGroup = variant === 'group';
  const hasTypeColor = Boolean(bgColor && textColor);

  return (
    <Pressable
      style={[
        isGroup ? styles.groupHeader : styles.subgroupHeader,
        hasTypeColor && bgColor
          ? { backgroundColor: `${bgColor}22`, borderLeftColor: bgColor, borderLeftWidth: 3 }
          : null,
        collapsed && styles.sectionHeaderCollapsed,
      ]}
      onPress={() => onToggle(sectionKey)}>
      <Ionicons
        name={collapsed ? 'chevron-forward' : 'chevron-down'}
        size={isGroup ? 18 : 16}
        color={colors.textMuted}
        style={isGroup ? styles.groupChevron : styles.subgroupChevron}
      />
      {hasTypeColor && bgColor && textColor ? (
        <View
          style={[
            isGroup ? styles.sectionBadge : styles.sectionBadgeCompact,
            { backgroundColor: bgColor },
          ]}>
          <Text
            style={[
              isGroup ? styles.sectionBadgeText : styles.sectionBadgeTextCompact,
              { color: textColor },
            ]}
            numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : isGroup ? (
        <>
          <View style={styles.groupAccent} />
          <Text style={styles.groupTitle}>{label}</Text>
        </>
      ) : (
        <Text style={styles.subgroupTitle}>{label}</Text>
      )}
      <Text style={isGroup ? styles.groupCount : styles.subgroupCount}>{count}</Text>
    </Pressable>
  );
}

function CardListItem({
  card,
  onToggleComplete,
}: {
  card: Card;
  onToggleComplete: (card: Card) => void;
}) {
  const hasMeta =
    (card.card_types?.length ?? 0) > 0 ||
    !!card.card_type ||
    (card.subcategories?.length ?? 0) > 0;

  return (
    <Pressable
      style={[styles.cardRow, card.completed_once && styles.cardRowCompleted]}
      onPress={() => router.push(`/(tabs)/cards/${card.id}`)}>
      <View style={styles.cardMain}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardAction} numberOfLines={3}>
            {card.action}
          </Text>
          <View style={styles.diffMark}>
            <Text style={styles.diffValue}>{card.difficulty}</Text>
          </View>
        </View>
        {hasMeta ? (
          <View style={styles.metaWrap}>
            <CardMetaChips card={card} compact stacked={false} />
          </View>
        ) : null}
      </View>
      <Pressable
        style={styles.doneBtn}
        hitSlop={8}
        onPress={(event) => {
          event.stopPropagation?.();
          onToggleComplete(card);
        }}
        accessibilityLabel={card.completed_once ? 'Mark not done' : 'Mark done once'}
        accessibilityRole="button">
        {card.completed_once ? (
          <Ionicons name="checkmark-circle" size={26} color={colors.completed} />
        ) : (
          <View style={styles.doneEmpty} />
        )}
      </Pressable>
    </Pressable>
  );
}

export function CardListView({ cards, emptyMessage, settings }: CardListViewProps) {
  const { data: cardTypes } = useCardTypes();
  const toggleCompletedOnce = useToggleCardCompletedOnce();
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => new Set());

  const sortedCards = useMemo(
    () => getTableCards(cards, settings, cardTypes ?? []),
    [cards, settings, cardTypes]
  );

  const totalCards = sortedCards.length;

  const tableRows = useMemo(
    () => buildCardTableRows(sortedCards, settings, cardTypes ?? [], { skipFilterSort: true }),
    [sortedCards, settings, cardTypes]
  );

  const visibleRows = useMemo(
    () => filterCollapsedRows(tableRows, collapsedKeys),
    [tableRows, collapsedKeys]
  );

  useEffect(() => {
    setCollapsedKeys(new Set());
  }, [settings.groupBy, settings.subgroupBy]);

  const toggleCollapsed = (key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleComplete = (card: Card) => {
    toggleCompletedOnce.mutate(
      { id: card.id, completed_once: !card.completed_once },
      {
        onError: (error) => {
          Alert.alert(
            'Error',
            error instanceof Error ? error.message : 'Failed to update completion status'
          );
        },
      }
    );
  };

  return (
    <View style={styles.page}>
      <FlatList
        style={styles.list}
        data={visibleRows}
        keyExtractor={(item, index) =>
          item.kind === 'header' ? 'header' : item.key ?? String(index)
        }
        contentContainerStyle={[
          styles.listContent,
          totalCards === 0 ? styles.listContentEmpty : null,
        ]}
        ListFooterComponent={
          totalCards === 0 ? (
            <View style={styles.emptyWrap}>
              <EmptyState message={emptyMessage} />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.kind === 'group') {
            return (
              <ListSectionHeader
                sectionKey={item.key}
                variant="group"
                label={item.label}
                count={item.count}
                bgColor={item.bgColor}
                textColor={item.textColor}
                collapsed={collapsedKeys.has(item.key)}
                onToggle={toggleCollapsed}
              />
            );
          }

          if (item.kind === 'subgroup') {
            return (
              <ListSectionHeader
                sectionKey={item.key}
                variant="subgroup"
                label={item.label}
                count={item.count}
                bgColor={item.bgColor}
                textColor={item.textColor}
                collapsed={collapsedKeys.has(item.key)}
                onToggle={toggleCollapsed}
              />
            );
          }

          if (item.kind === 'header') return null;

          return <CardListItem card={item.card} onToggleComplete={handleToggleComplete} />;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  cardRowCompleted: {
    backgroundColor: 'rgba(61, 219, 156, 0.06)',
    borderColor: 'rgba(61, 219, 156, 0.25)',
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardAction: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  diffMark: {
    minWidth: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  diffValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
    lineHeight: 16,
  },
  metaWrap: {
    marginTop: 6,
  },
  doneBtn: {
    flexShrink: 0,
    paddingTop: 2,
  },
  doneEmpty: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    marginTop: spacing.xs,
  },
  groupChevron: {
    width: 18,
  },
  subgroupChevron: {
    width: 16,
    marginLeft: spacing.sm,
  },
  sectionHeaderCollapsed: {
    opacity: 0.92,
  },
  sectionBadge: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sectionBadgeCompact: {
    flex: 1,
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sectionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionBadgeTextCompact: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  groupTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  groupCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    backgroundColor: colors.chip,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  subgroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginLeft: spacing.sm,
  },
  subgroupTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subgroupCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
