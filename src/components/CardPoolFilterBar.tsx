import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CardFilterBar } from '@/src/components/CardFilterBar';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useCardSubcategories } from '@/src/hooks/useCardSubcategories';
import { useCardTypes } from '@/src/hooks/useCardTypes';
import type { CardSubcategory, CardType, Story } from '@/src/types';
import {
  completedFilterLabel,
  countActiveCardFilters,
  DEFAULT_CARD_FILTER_STATE,
  difficultyFilterLabel,
  hasActiveCardFilters,
  type CardFilterState,
} from '@/src/utils/cardFilters';
import { storyDisplayName } from '@/src/utils/display';

type CardPoolFilterBarProps = {
  filters: CardFilterState;
  linkedStories: Story[];
  subcategories?: CardSubcategory[];
  onChange: (patch: Partial<CardFilterState>) => void;
};

type ActiveFilterChip = {
  key: string;
  label: string;
  bgColor?: string;
  textColor?: string;
  onRemove: () => void;
};

function FilterChip({
  label,
  bgColor,
  textColor,
  onRemove,
}: {
  label: string;
  bgColor?: string;
  textColor?: string;
  onRemove: () => void;
}) {
  const activeStyle = bgColor
    ? { backgroundColor: bgColor, borderColor: bgColor }
    : styles.activeChipDefault;

  return (
    <Pressable
      style={[styles.activeChip, activeStyle]}
      onPress={onRemove}
      accessibilityLabel={`Remove filter ${label}`}
      accessibilityRole="button">
      <Text style={[styles.activeChipText, textColor ? { color: textColor } : null]} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons
        name="close"
        size={14}
        color={textColor ?? colors.onPrimary}
        style={styles.activeChipIcon}
      />
    </Pressable>
  );
}

function buildActiveFilterChips(
  filters: CardFilterState,
  cardTypes: CardType[] | undefined,
  subcategories: CardSubcategory[] | undefined,
  linkedStories: Story[],
  onChange: (patch: Partial<CardFilterState>) => void
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const search = filters.search.trim();

  if (search) {
    chips.push({
      key: 'search',
      label: `"${search.length > 18 ? `${search.slice(0, 18)}…` : search}"`,
      onRemove: () => onChange({ search: '' }),
    });
  }

  filters.filterTypeIds.forEach((typeId) => {
    const type = cardTypes?.find((item) => item.id === typeId);
    chips.push({
      key: `type-${typeId}`,
      label: type?.name ?? 'Type',
      bgColor: type?.bg_color,
      textColor: type?.text_color,
      onRemove: () =>
        onChange({
          filterTypeIds: filters.filterTypeIds.filter((id) => id !== typeId),
        }),
    });
  });

  filters.filterSubcategoryIds.forEach((subcategoryId) => {
    const subcategory = subcategories?.find((item) => item.id === subcategoryId);
    chips.push({
      key: `sub-${subcategoryId}`,
      label: subcategory?.name ?? 'Subcategory',
      onRemove: () =>
        onChange({
          filterSubcategoryIds: filters.filterSubcategoryIds.filter((id) => id !== subcategoryId),
        }),
    });
  });

  filters.filterCompleted.forEach((value) => {
    chips.push({
      key: `done-${value}`,
      label: completedFilterLabel(value),
      onRemove: () =>
        onChange({
          filterCompleted: filters.filterCompleted.filter((item) => item !== value),
        }),
    });
  });

  filters.filterDifficulties.forEach((value) => {
    chips.push({
      key: `diff-${value}`,
      label: difficultyFilterLabel(value),
      onRemove: () =>
        onChange({
          filterDifficulties: filters.filterDifficulties.filter((item) => item !== value),
        }),
    });
  });

  if (filters.filterStoryId) {
    const story = linkedStories.find((item) => item.id === filters.filterStoryId);
    const tag = story?.story_tags?.[0];
    chips.push({
      key: `story-${filters.filterStoryId}`,
      label: story ? storyDisplayName(story) : 'Story',
      bgColor: tag?.bg_color,
      textColor: tag?.text_color,
      onRemove: () => onChange({ filterStoryId: null }),
    });
  }

  return chips;
}

export function CardPoolFilterBar({
  filters,
  linkedStories,
  subcategories: subcategoriesProp,
  onChange,
}: CardPoolFilterBarProps) {
  const { data: cardTypes } = useCardTypes();
  const { data: fetchedSubcategories } = useCardSubcategories();
  const subcategories = subcategoriesProp ?? fetchedSubcategories;
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCount = countActiveCardFilters(filters);
  const filtersActive = hasActiveCardFilters(filters);

  const activeChips = useMemo(
    () => buildActiveFilterChips(filters, cardTypes, subcategories, linkedStories, onChange),
    [filters, cardTypes, subcategories, linkedStories, onChange]
  );

  const clearAllFilters = () => onChange(DEFAULT_CARD_FILTER_STATE);

  return (
    <>
      <View style={styles.wrap}>
        <View style={styles.toolbar}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cards..."
              placeholderTextColor={colors.textMuted}
              value={filters.search}
              onChangeText={(search) => onChange({ search })}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {filters.search ? (
              <Pressable hitSlop={8} onPress={() => onChange({ search: '' })}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={[styles.filterBtn, filtersActive && styles.filterBtnActive]}
            onPress={() => setSheetOpen(true)}
            accessibilityLabel="Open filters"
            accessibilityRole="button">
            <Ionicons
              name="options-outline"
              size={20}
              color={filtersActive ? colors.primaryLight : colors.textSecondary}
            />
            {activeCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeCount > 9 ? '9+' : activeCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {activeChips.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeChipsRow}>
            {activeChips.map((chip) => (
              <FilterChip
                key={chip.key}
                label={chip.label}
                bgColor={chip.bgColor}
                textColor={chip.textColor}
                onRemove={chip.onRemove}
              />
            ))}
            <Pressable style={styles.clearAllChip} onPress={clearAllFilters}>
              <Text style={styles.clearAllText}>Clear all</Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </View>

      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation?.()}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Filters</Text>
                <Text style={styles.sheetSubtitle}>
                  {activeCount ? `${activeCount} active` : 'None selected'}
                </Text>
              </View>
              <View style={styles.sheetHeaderActions}>
                {filtersActive ? (
                  <Pressable onPress={clearAllFilters} hitSlop={8}>
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => setSheetOpen(false)} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetBody}
              keyboardShouldPersistTaps="handled">
              <CardFilterBar
                filters={filters}
                linkedStories={linkedStories}
                showSearch={false}
                showSubcategories
                subcategories={subcategories}
                onChange={onChange}
              />
            </ScrollView>

            <View style={styles.sheetFooter}>
              <Pressable style={styles.doneBtn} onPress={() => setSheetOpen(false)}>
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 8,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.selected,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onPrimary,
    fontVariant: ['tabular-nums'],
  },
  activeChipsRow: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: 2,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 180,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  activeChipDefault: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activeChipText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  activeChipIcon: {
    flexShrink: 0,
  },
  clearAllChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '78%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  sheetSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  sheetHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  clearText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetBody: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.lg,
  },
  sheetFooter: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
