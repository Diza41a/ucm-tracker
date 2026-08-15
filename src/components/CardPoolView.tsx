import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CardPoolFilterBar } from '@/src/components/CardPoolFilterBar';
import { CardListView } from '@/src/components/CardListView';
import { CardPoolLayoutBar } from '@/src/components/CardPoolLayoutBar';
import { CardPoolSortSheet } from '@/src/components/CardPoolSortSheet';
import { CardTableView } from '@/src/components/CardTableView';
import { LoadingState } from '@/src/components/StateViews';
import { spacing } from '@/src/constants/theme';
import { useCardSubcategories } from '@/src/hooks/useCardSubcategories';
import { useCardTableSettings } from '@/src/hooks/useCardTableSettings';
import { useCardTypes } from '@/src/hooks/useCardTypes';
import type { Card } from '@/src/types';
import { getLinkedStoriesFromCards, pruneStaleCardFilters } from '@/src/utils/cardFilters';
import { hasCustomCardTableSettings } from '@/src/utils/cardTable';

interface CardPoolViewProps {
  cards: Card[];
  emptyMessage: string;
}

export function CardPoolView({ cards, emptyMessage }: CardPoolViewProps) {
  const { data: cardTypes } = useCardTypes();
  const { data: subcategories } = useCardSubcategories();
  const { settings, loaded, updateSettings, updateColumnFilters, updateColumnWidth, resetSettings } =
    useCardTableSettings();
  const [sortOpen, setSortOpen] = useState(false);

  const linkedStories = useMemo(() => getLinkedStoriesFromCards(cards), [cards]);

  useEffect(() => {
    if (!loaded || cardTypes === undefined || subcategories === undefined) return;
    const pruned = pruneStaleCardFilters(
      settings.columnFilters,
      cardTypes,
      subcategories,
      cards
    );
    if (pruned) updateColumnFilters(pruned);
  }, [loaded, cards, cardTypes, subcategories, settings.columnFilters, updateColumnFilters]);

  if (!loaded) {
    return <LoadingState />;
  }

  const isListView = settings.poolViewMode === 'list';

  return (
    <View style={styles.page}>
      <CardPoolLayoutBar
        poolViewMode={settings.poolViewMode}
        groupBy={settings.groupBy}
        subgroupBy={settings.subgroupBy}
        showReset={hasCustomCardTableSettings(settings)}
        showSort={isListView}
        sortActive={settings.sortLevels.length > 0}
        onPoolViewModeChange={(poolViewMode) => updateSettings({ poolViewMode })}
        onGroupByChange={(groupBy) => updateSettings({ groupBy })}
        onSubgroupByChange={(subgroupBy) => updateSettings({ subgroupBy })}
        onReset={resetSettings}
        onSortPress={() => setSortOpen(true)}
      />

      {isListView ? (
        <View style={styles.filters}>
          <CardPoolFilterBar
            filters={settings.columnFilters}
            linkedStories={linkedStories}
            subcategories={subcategories}
            onChange={updateColumnFilters}
          />
        </View>
      ) : null}

      {isListView ? (
        <CardListView
          cards={cards}
          emptyMessage={emptyMessage}
          settings={settings}
        />
      ) : (
        <CardTableView
          cards={cards}
          emptyMessage={emptyMessage}
          settings={settings}
          onSettingsChange={updateSettings}
          onColumnFiltersChange={updateColumnFilters}
          onColumnWidthChange={updateColumnWidth}
        />
      )}

      <CardPoolSortSheet
        visible={sortOpen}
        sortLevels={settings.sortLevels}
        onClose={() => setSortOpen(false)}
        onSortLevelsChange={(sortLevels) => updateSettings({ sortLevels })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  filters: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
