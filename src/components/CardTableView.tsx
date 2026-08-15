import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { CardTablePaginationBar } from '@/src/components/CardTablePaginationBar';
import { CardBadge } from '@/src/components/CardBadge';
import { CardSubcategoryBadge } from '@/src/components/CardSubcategoryBadge';
import { EmptyState } from '@/src/components/StateViews';
import { MultiSelectSheet } from '@/src/components/ui/MultiSelectSheet';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useCardSubcategories } from '@/src/hooks/useCardSubcategories';
import { useCardTypes } from '@/src/hooks/useCardTypes';
import { useToggleCardCompletedOnce, useUpdateCardTableFields } from '@/src/hooks/useCards';
import type { Card } from '@/src/types';
import { getCardTypeIds, getCardTypes } from '@/src/utils/cardTypes';
import {
  type CompletedFilterValue,
  type DifficultyFilterValue,
} from '@/src/utils/cardFilters';
import {
  buildCardTableRows,
  clampColumnWidth,
  cycleSortLevels,
  filterCollapsedRows,
  getSortLevelForField,
  getTableCards,
  getVisibleTableColumns,
  paginateTableCards,
  SORT_FIELD_BY_COLUMN,
  type CardTableColumnKey,
  type CardTablePageSize,
  type CardTableSettings,
  type CardTableSortField,
} from '@/src/utils/cardTable';
import type { CardFilterState } from '@/src/utils/cardFilters';

interface CardTableViewProps {
  cards: Card[];
  emptyMessage: string;
  settings: CardTableSettings;
  onSettingsChange: (patch: Partial<CardTableSettings>) => void;
  onColumnFiltersChange: (patch: Partial<CardFilterState>) => void;
  onColumnWidthChange: (key: CardTableColumnKey, width: number) => void;
}

type ActiveSheet =
  | 'filterSearch'
  | 'filterType'
  | 'filterSubcategory'
  | 'filterDifficulty'
  | 'filterCompleted'
  | null;

type CellEditSheet = { kind: 'type'; card: Card } | { kind: 'subcategory'; card: Card } | null;

type InlineEditField = 'difficulty';

type InlineEditState = {
  cardId: string;
  field: InlineEditField;
  draft: string;
};

type CellCoordinate = {
  cardId: string;
  columnKey: CardTableColumnKey;
};

const SUBCATEGORY_EMPTY_MESSAGE =
  'No subcategories yet. They are optional — create one to group related cards.';
const TABLE_MARGIN = spacing.lg;
const SECTION_GAP = spacing.lg;
const MIN_SPACER_WIDTH = 48;
const RESIZABLE_COLUMNS = new Set<CardTableColumnKey>([
  'action',
  'type',
  'subcategory',
  'difficulty',
  'done',
]);

function ColumnHeaderCell({
  label,
  width,
  filterActive,
  filterable,
  sortActive,
  sortDirection,
  sortOrder,
  onSort,
  onFilter,
  onResizeDraft,
  onResizeCommit,
  align = 'center',
  resizable = true,
}: {
  label: string;
  width: number;
  filterActive?: boolean;
  filterable?: boolean;
  sortActive?: boolean;
  sortDirection?: 'asc' | 'desc';
  sortOrder?: 1 | 2 | null;
  onSort: () => void;
  onFilter?: () => void;
  onResizeDraft: (width: number) => void;
  onResizeCommit: (width: number) => void;
  align?: 'left' | 'center' | 'right';
  resizable?: boolean;
}) {
  const widthRef = useRef(width);
  widthRef.current = width;
  const startWidth = useRef(width);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => resizable,
      onMoveShouldSetPanResponder: () => resizable,
      onPanResponderGrant: () => {
        startWidth.current = widthRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        onResizeDraft(startWidth.current + gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        onResizeCommit(startWidth.current + gesture.dx);
      },
      onPanResponderTerminate: (_, gesture) => {
        onResizeCommit(startWidth.current + gesture.dx);
      },
    })
  ).current;

  return (
    <View style={[styles.headerCell, { width }]}>
      <View
        style={[
          styles.headerCellInner,
          filterable && !filterActive && styles.headerCellFilterable,
          filterActive && styles.headerCellFiltered,
          align === 'left' && styles.alignLeft,
          align === 'right' && styles.alignRight,
        ]}>
        {onFilter ? (
          <Pressable style={styles.headerLabelPressable} onPress={onFilter}>
            {label ? (
              <Text
                style={[
                  styles.headerLabel,
                  filterable && !filterActive && styles.headerLabelFilterable,
                  filterActive && styles.headerLabelFiltered,
                  sortActive && sortOrder === 1 && styles.headerLabelActive,
                  sortActive && sortOrder === 2 && styles.headerLabelSecondary,
                ]}
                numberOfLines={1}>
                {label}
              </Text>
            ) : null}
          </Pressable>
        ) : label ? (
          <View style={styles.headerLabelPressable}>
            <Text
              style={[
                styles.headerLabel,
                sortActive && sortOrder === 1 && styles.headerLabelActive,
                sortActive && sortOrder === 2 && styles.headerLabelSecondary,
              ]}
              numberOfLines={1}>
              {label}
            </Text>
          </View>
        ) : (
          <View style={styles.headerLabelPressable} />
        )}
        <Pressable style={styles.headerActionBtn} onPress={onSort} hitSlop={6}>
          <View style={styles.sortBtnContent}>
            <Ionicons
              name={
                sortActive
                  ? sortDirection === 'asc'
                    ? 'arrow-up'
                    : 'arrow-down'
                  : 'swap-vertical-outline'
              }
              size={14}
              color={
                sortActive
                  ? sortOrder === 1
                    ? colors.primaryLight
                    : colors.textSecondary
                  : colors.textMuted
              }
            />
            {sortOrder ? <Text style={styles.sortOrderBadge}>{sortOrder}</Text> : null}
          </View>
        </Pressable>
      </View>
      {resizable ? (
        <View {...panResponder.panHandlers} style={styles.resizeHandle}>
          <View style={styles.resizeHandleBar} />
        </View>
      ) : null}
    </View>
  );
}

function SectionHeader({
  sectionKey,
  label,
  count,
  bgColor,
  textColor,
  variant,
  minWidth,
  collapsed,
  onToggle,
}: {
  sectionKey: string;
  label: string;
  count: number;
  bgColor?: string;
  textColor?: string;
  variant: 'group' | 'subgroup';
  minWidth: number;
  collapsed: boolean;
  onToggle: (key: string) => void;
}) {
  const isGroup = variant === 'group';
  const hasTypeColor = Boolean(bgColor && textColor);

  return (
    <Pressable
      style={[
        isGroup ? styles.groupHeader : styles.subgroupHeader,
        { minWidth },
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

function TableDataCell({
  children,
  width,
  align = 'left',
  flex,
  isActive = false,
  isDisabled = false,
  interaction = 'edit',
  onPress,
}: {
  children?: ReactNode;
  width?: number;
  align?: 'left' | 'center' | 'right';
  flex?: boolean;
  isActive?: boolean;
  isDisabled?: boolean;
  interaction?: 'edit' | 'navigate';
  onPress?: () => void;
}) {
  const cellStyle = [
    styles.dataCell,
    width ? { width } : null,
    flex ? styles.dataCellFlex : null,
    align === 'center' && styles.alignCenter,
    align === 'right' && styles.alignRight,
    isActive && styles.cellInteractive,
    isDisabled && styles.cellDisabled,
  ];

  const hoverStyle =
    interaction === 'navigate' ? styles.cellNavigate : styles.cellInteractive;

  if (onPress && !isDisabled) {
    return (
      <Pressable
        focusable={false}
        style={({ pressed, hovered }) => [
          ...cellStyle,
          !isActive && (pressed || hovered) && hoverStyle,
        ]}
        onPress={onPress}>
        {children}
      </Pressable>
    );
  }

  return <View style={cellStyle}>{children}</View>;
}

function InlineEditableCell({
  width,
  align = 'left',
  isEditing,
  isSaving = false,
  draft,
  onDraftChange,
  onStartEdit,
  onCommit,
  onCancel,
  inputKind,
  children,
}: {
  width: number;
  align?: 'left' | 'center' | 'right';
  isEditing: boolean;
  isSaving?: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onCommit: () => void;
  onCancel: () => void;
  inputKind: InlineEditField;
  children?: ReactNode;
}) {
  const cellStyle = [
    styles.dataCell,
    { width },
    align === 'center' && styles.alignCenter,
    align === 'right' && styles.alignRight,
  ];

  if (isEditing) {
    return (
      <View style={[...cellStyle, styles.cellInteractive]}>
        <View style={styles.inlineInputWrap}>
          <TextInput
            style={[
              styles.inlineInput,
              inputKind === 'action' && styles.inlineInputAction,
              inputKind === 'difficulty' && styles.inlineInputDifficulty,
              align === 'center' && styles.inlineInputCenter,
            ]}
            value={draft}
            onChangeText={onDraftChange}
            onBlur={onCommit}
            onSubmitEditing={inputKind === 'difficulty' ? onCommit : undefined}
            onKeyPress={(event) => {
              if (event.nativeEvent.key === 'Escape') onCancel();
            }}
            autoFocus
            selectTextOnFocus
            multiline={inputKind === 'action'}
            numberOfLines={inputKind === 'action' ? 4 : 1}
            maxLength={inputKind === 'action' ? 100 : undefined}
            keyboardType={inputKind === 'difficulty' ? 'decimal-pad' : 'default'}
            inputMode={inputKind === 'difficulty' ? 'decimal' : 'text'}
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
    );
  }

  return (
    <TableDataCell
      width={width}
      align={align}
      isDisabled={isSaving}
      onPress={isSaving ? undefined : onStartEdit}>
      {children}
    </TableDataCell>
  );
}

function SearchFilterSheet({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheetCard} onPress={(event) => event.stopPropagation?.()}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter by card</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.searchSheetBody}>
            <Text style={styles.searchSheetLabel}>Search action, purpose, tags...</Text>
            <View style={styles.searchSheetInputWrap}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchSheetInput}
                value={value}
                onChangeText={onChange}
                placeholder="Search cards..."
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              {value ? (
                <Pressable hitSlop={8} onPress={() => onChange('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
            <Pressable style={styles.searchSheetDone} onPress={onClose}>
              <Text style={styles.searchSheetDoneText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function CardTableView({
  cards,
  emptyMessage,
  settings,
  onSettingsChange,
  onColumnFiltersChange,
  onColumnWidthChange,
}: CardTableViewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { data: cardTypes } = useCardTypes();
  const { data: subcategories } = useCardSubcategories();
  const toggleCompletedOnce = useToggleCardCompletedOnce();
  const updateCardFields = useUpdateCardTableFields();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [cellEdit, setCellEdit] = useState<CellEditSheet>(null);
  const [typeDraftIds, setTypeDraftIds] = useState<string[]>([]);
  const [subcategoryDraftIds, setSubcategoryDraftIds] = useState<string[]>([]);
  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [focusedCell, setFocusedCell] = useState<CellCoordinate | null>(null);
  const [savingCell, setSavingCell] = useState<CellCoordinate | null>(null);
  const [page, setPage] = useState(1);
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => new Set());
  const [resizeDraft, setResizeDraft] = useState<{
    key: CardTableColumnKey;
    width: number;
  } | null>(null);

  const sortedCards = useMemo(
    () => getTableCards(cards, settings, cardTypes ?? []),
    [cards, settings, cardTypes]
  );

  const totalCards = sortedCards.length;
  const totalPages = Math.max(1, Math.ceil(totalCards / settings.pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageCards = useMemo(
    () => paginateTableCards(sortedCards, currentPage, settings.pageSize),
    [sortedCards, currentPage, settings.pageSize]
  );

  const tableRows = useMemo(
    () => buildCardTableRows(pageCards, settings, cardTypes ?? [], { skipFilterSort: true }),
    [pageCards, settings, cardTypes]
  );

  const visibleRows = useMemo(
    () => filterCollapsedRows(tableRows, collapsedKeys),
    [tableRows, collapsedKeys]
  );

  useEffect(() => {
    if (cellEdit?.kind !== 'type') return;
    setTypeDraftIds(getCardTypeIds(cellEdit.card));
  }, [cellEdit]);

  useEffect(() => {
    if (cellEdit?.kind !== 'subcategory') return;
    setSubcategoryDraftIds(
      cellEdit.card.subcategories?.map((subcategory) => subcategory.id) ?? []
    );
  }, [cellEdit]);

  useEffect(() => {
    setPage(1);
  }, [
    settings.columnFilters,
    settings.sortLevels,
    settings.groupBy,
    settings.subgroupBy,
    settings.pageSize,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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

  const showSaveError = (error: unknown) => {
    Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update card');
  };

  const isCellFocused = (cardId: string, columnKey: CardTableColumnKey) =>
    focusedCell?.cardId === cardId && focusedCell?.columnKey === columnKey;

  const isCellSaving = (cardId: string, columnKey: CardTableColumnKey) =>
    savingCell?.cardId === cardId && savingCell?.columnKey === columnKey;

  const closeCellEdit = () => {
    setCellEdit(null);
    setFocusedCell(null);
    setSubcategoryDraftIds([]);
  };

  const commitInlineEdit = useCallback(
    (edit: InlineEditState | null = inlineEdit) => {
      if (!edit) return;

      setInlineEdit(null);
      setFocusedCell(null);

      const card = cards.find((item) => item.id === edit.cardId);
      if (!card) return;

      const coord: CellCoordinate = { cardId: edit.cardId, columnKey: edit.field };

      const parsed = parseFloat(edit.draft);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 10) {
        Alert.alert('Validation', 'Enter a number between 1 and 10.');
        return;
      }
      if (parsed !== card.difficulty) {
        setSavingCell(coord);
        updateCardFields.mutate(
          { id: card.id, difficulty: parsed },
          { onError: showSaveError, onSettled: () => setSavingCell(null) }
        );
      }
    },
    [cards, inlineEdit, updateCardFields]
  );

  const startInlineEdit = (card: Card) => {
    if (inlineEdit) commitInlineEdit(inlineEdit);
    setFocusedCell({ cardId: card.id, columnKey: 'difficulty' });
    setInlineEdit({
      cardId: card.id,
      field: 'difficulty',
      draft: String(card.difficulty),
    });
  };

  const openCardDetail = (card: Card) => {
    if (inlineEdit) commitInlineEdit(inlineEdit);
    router.push(`/(tabs)/cards/${card.id}`);
  };

  const cancelInlineEdit = () => {
    setInlineEdit(null);
    setFocusedCell(null);
  };

  const handleCellPress = (columnKey: CardTableColumnKey, card: Card) => {
    if (isCellSaving(card.id, columnKey)) return;

    if (
      inlineEdit &&
      !(inlineEdit.cardId === card.id && columnKey === 'difficulty')
    ) {
      commitInlineEdit(inlineEdit);
    }

    if (columnKey === 'done') {
      handleToggleComplete(card);
      return;
    }
    if (columnKey === 'action') {
      openCardDetail(card);
      return;
    }
    if (columnKey === 'type') {
      setFocusedCell({ cardId: card.id, columnKey: 'type' });
      setCellEdit({ kind: 'type', card });
      return;
    }
    if (columnKey === 'subcategory') {
      setFocusedCell({ cardId: card.id, columnKey: 'subcategory' });
      setCellEdit({ kind: 'subcategory', card });
      return;
    }
    if (columnKey === 'difficulty') {
      startInlineEdit(card);
    }
  };

  const visibleColumns = useMemo(() => getVisibleTableColumns(), []);

  const { columnFilters, columnWidths } = settings;

  const getColumnWidth = (key: CardTableColumnKey) => {
    if (resizeDraft?.key === key) return resizeDraft.width;
    return columnWidths[key];
  };

  const fixedColumnsWidth = useMemo(
    () => visibleColumns.reduce((sum, key) => sum + getColumnWidth(key), 0),
    [visibleColumns, columnWidths, resizeDraft]
  );

  const availableWidth = windowWidth - TABLE_MARGIN * 2;
  const needsHorizontalScroll = fixedColumnsWidth + MIN_SPACER_WIDTH > availableWidth;
  const rowMinWidth = needsHorizontalScroll
    ? fixedColumnsWidth + MIN_SPACER_WIDTH
    : availableWidth;

  const setSort = (field: CardTableSortField) => {
    onSettingsChange({
      sortLevels: cycleSortLevels(settings.sortLevels, field),
    });
  };

  const columnLabels: Record<CardTableColumnKey, string> = {
    action: 'Card',
    type: 'Type',
    subcategory: 'Subcategory',
    difficulty: 'Diff',
    done: '',
  };

  const filterSheetByColumn: Partial<Record<CardTableColumnKey, ActiveSheet>> = {
    action: 'filterSearch',
    type: 'filterType',
    subcategory: 'filterSubcategory',
    difficulty: 'filterDifficulty',
    done: 'filterCompleted',
  };

  const isFilterActive = (columnKey: CardTableColumnKey) => {
    if (columnKey === 'action') return !!columnFilters.search.trim();
    if (columnKey === 'type') return columnFilters.filterTypeIds.length > 0;
    if (columnKey === 'subcategory') return columnFilters.filterSubcategoryIds.length > 0;
    if (columnKey === 'difficulty') return columnFilters.filterDifficulties.length > 0;
    return columnFilters.filterCompleted.length > 0;
  };

  const renderHeaderRow = () => (
    <View style={[styles.tableRow, { minWidth: rowMinWidth }]}>
      {visibleColumns.map((columnKey) => {
        const sortField = SORT_FIELD_BY_COLUMN[columnKey];
        const sortLevel = sortField ? getSortLevelForField(settings.sortLevels, sortField) : null;
        const textAlign = 'center' as const;

        return (
          <ColumnHeaderCell
            key={columnKey}
            label={columnLabels[columnKey]}
            width={getColumnWidth(columnKey)}
            filterActive={isFilterActive(columnKey)}
            filterable={Boolean(filterSheetByColumn[columnKey])}
            sortActive={Boolean(sortLevel)}
            sortDirection={sortLevel?.direction}
            sortOrder={sortLevel?.order ?? null}
            onSort={() => sortField && setSort(sortField)}
            onFilter={
              filterSheetByColumn[columnKey]
                ? () => setActiveSheet(filterSheetByColumn[columnKey] ?? null)
                : undefined
            }
            onResizeDraft={(width) =>
              setResizeDraft({ key: columnKey, width: clampColumnWidth(columnKey, width) })
            }
            onResizeCommit={(width) => {
              onColumnWidthChange(columnKey, width);
              setResizeDraft(null);
            }}
            align={textAlign}
            resizable={RESIZABLE_COLUMNS.has(columnKey)}
          />
        );
      })}
      <View style={[styles.spacerCell, styles.headerSpacer, needsHorizontalScroll && styles.spacerFixed]}>
        {!needsHorizontalScroll ? null : <View style={styles.spacerFill} />}
      </View>
    </View>
  );

  const renderCardRow = (card: Card, isAlternate: boolean) => (
    <View
      style={[
        styles.tableRow,
        styles.dataRow,
        { minWidth: rowMinWidth },
        isAlternate && styles.dataRowAlternate,
        card.completed_once && styles.dataRowCompleted,
      ]}>
      {visibleColumns.map((columnKey) => {
        if (columnKey === 'action') {
          return (
            <TableDataCell
              key={columnKey}
              width={getColumnWidth(columnKey)}
              align="left"
              interaction="navigate"
              onPress={() => openCardDetail(card)}>
              <Text style={styles.actionText} numberOfLines={4}>
                {card.action}
              </Text>
            </TableDataCell>
          );
        }

        if (columnKey === 'difficulty') {
          const isEditing = inlineEdit?.cardId === card.id;
          return (
            <InlineEditableCell
              key={columnKey}
              width={getColumnWidth(columnKey)}
              align="center"
              isEditing={isEditing}
              isSaving={isCellSaving(card.id, 'difficulty')}
              draft={isEditing ? inlineEdit.draft : String(card.difficulty)}
              onDraftChange={(draft) =>
                setInlineEdit((prev) =>
                  prev ? { ...prev, draft: draft.replace(/[^0-9.]/g, '') } : prev
                )
              }
              onStartEdit={() => startInlineEdit(card)}
              onCommit={() => commitInlineEdit()}
              onCancel={cancelInlineEdit}
              inputKind="difficulty">
              <Text style={styles.diffText}>{card.difficulty}</Text>
            </InlineEditableCell>
          );
        }

        const isSaving = isCellSaving(card.id, columnKey);

        return (
          <TableDataCell
            key={columnKey}
            width={getColumnWidth(columnKey)}
            align={columnKey === 'action' ? 'left' : 'center'}
            isActive={isCellFocused(card.id, columnKey)}
            isDisabled={isSaving}
            onPress={isSaving ? undefined : () => handleCellPress(columnKey, card)}>
            {columnKey === 'type' ? (
              getCardTypes(card).length ? (
                <View style={styles.subcategoryStack}>
                  {getCardTypes(card).map((type) => (
                    <CardBadge key={type.id} cardType={type} compact />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyCell}>Tap to set</Text>
              )
            ) : null}
            {columnKey === 'subcategory' ? (
              card.subcategories?.length ? (
                <View style={styles.subcategoryStack}>
                  {card.subcategories.map((subcategory) => (
                    <CardSubcategoryBadge key={subcategory.id} subcategory={subcategory} compact />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyCell}>Tap to add</Text>
              )
            ) : null}
            {columnKey === 'done' ? (
              <View style={styles.doneToggle}>
                {card.completed_once ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.completed} />
                ) : (
                  <View style={styles.doneEmpty} />
                )}
              </View>
            ) : null}
          </TableDataCell>
        );
      })}
      <TableDataCell flex align="left">
        <View style={styles.spacerFill} />
      </TableDataCell>
    </View>
  );

  const handlePageSizeChange = (pageSize: CardTablePageSize) => {
    onSettingsChange({ pageSize });
  };

  const openSubcategoriesManager = () => {
    setActiveSheet(null);
    closeCellEdit();
    router.push('/(tabs)/cards/subcategories');
  };

  const tableBody = (
    <FlatList
      style={styles.tableList}
      data={visibleRows}
      keyExtractor={(item, index) =>
        item.kind === 'header' ? 'header' : item.key ?? String(index)
      }
      stickyHeaderIndices={[0]}
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
      renderItem={({ item, index }) => {
        if (item.kind === 'header') {
          return <View style={styles.headerRowWrap}>{renderHeaderRow()}</View>;
        }

        if (item.kind === 'group') {
          return (
            <SectionHeader
              sectionKey={item.key}
              variant="group"
              label={item.label}
              count={item.count}
              bgColor={item.bgColor}
              textColor={item.textColor}
              minWidth={rowMinWidth}
              collapsed={collapsedKeys.has(item.key)}
              onToggle={toggleCollapsed}
            />
          );
        }

        if (item.kind === 'subgroup') {
          return (
            <SectionHeader
              sectionKey={item.key}
              variant="subgroup"
              label={item.label}
              count={item.count}
              bgColor={item.bgColor}
              textColor={item.textColor}
              minWidth={rowMinWidth}
              collapsed={collapsedKeys.has(item.key)}
              onToggle={toggleCollapsed}
            />
          );
        }

        const cardIndex = visibleRows.slice(0, index).filter((row) => row.kind === 'card').length;
        const isAlternate = cardIndex % 2 === 1;
        return renderCardRow(item.card, isAlternate);
      }}
    />
  );

  return (
    <View style={styles.page}>
      <View style={styles.tableFrame}>
        {needsHorizontalScroll ? (
          <ScrollView
            horizontal
            bounces={false}
            showsHorizontalScrollIndicator
            style={styles.tableScroll}
            contentContainerStyle={styles.horizontalScrollContent}>
            <View style={[styles.tableScrollInner, { width: rowMinWidth }]}>
              {tableBody}
            </View>
          </ScrollView>
        ) : (
          tableBody
        )}
      </View>

      <CardTablePaginationBar
        page={currentPage}
        totalPages={totalPages}
        totalItems={totalCards}
        pageSize={settings.pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />

      <SearchFilterSheet
        visible={activeSheet === 'filterSearch'}
        value={columnFilters.search}
        onChange={(search) => onColumnFiltersChange({ search })}
        onClose={() => setActiveSheet(null)}
      />

      <MultiSelectSheet
        visible={activeSheet === 'filterType'}
        title="Filter by type"
        selectedValues={columnFilters.filterTypeIds}
        onClose={() => setActiveSheet(null)}
        onChange={(filterTypeIds) => onColumnFiltersChange({ filterTypeIds })}
        options={(cardTypes ?? []).map((type) => ({ value: type.id, label: type.name }))}
      />

      <MultiSelectSheet
        visible={activeSheet === 'filterSubcategory'}
        title="Filter by subcategory"
        selectedValues={columnFilters.filterSubcategoryIds}
        onClose={() => setActiveSheet(null)}
        onChange={(filterSubcategoryIds) => onColumnFiltersChange({ filterSubcategoryIds })}
        options={(subcategories ?? []).map((subcategory) => ({
          value: subcategory.id,
          label: subcategory.name,
        }))}
        emptyMessage={SUBCATEGORY_EMPTY_MESSAGE}
        emptyActionLabel="Manage subcategories"
        onEmptyAction={openSubcategoriesManager}
      />

      <MultiSelectSheet
        visible={activeSheet === 'filterDifficulty'}
        title="Filter by difficulty"
        selectedValues={columnFilters.filterDifficulties}
        onClose={() => setActiveSheet(null)}
        onChange={(filterDifficulties) =>
          onColumnFiltersChange({
            filterDifficulties: filterDifficulties as DifficultyFilterValue[],
          })
        }
        options={[
          { value: 'easy', label: 'Easy', hint: '1 – 3' },
          { value: 'medium', label: 'Medium', hint: '4 – 7' },
          { value: 'hard', label: 'Hard', hint: '8 – 10' },
        ]}
      />

      <MultiSelectSheet
        visible={activeSheet === 'filterCompleted'}
        title="Filter by completion"
        selectedValues={columnFilters.filterCompleted}
        onClose={() => setActiveSheet(null)}
        onChange={(filterCompleted) =>
          onColumnFiltersChange({
            filterCompleted: filterCompleted as CompletedFilterValue[],
          })
        }
        options={[
          { value: 'done', label: 'Done once' },
          { value: 'not_done', label: 'Not yet done' },
        ]}
      />

      <MultiSelectSheet
        visible={cellEdit?.kind === 'type'}
        title="Card types"
        selectedValues={typeDraftIds}
        onClose={closeCellEdit}
        onChange={(card_type_ids) => {
          if (cellEdit?.kind !== 'type') return;
          if (!card_type_ids.length) return;
          setTypeDraftIds(card_type_ids);
          setSavingCell({ cardId: cellEdit.card.id, columnKey: 'type' });
          updateCardFields.mutate(
            { id: cellEdit.card.id, card_type_ids },
            {
              onSuccess: () => setCellEdit(null),
              onError: showSaveError,
              onSettled: () => setSavingCell(null),
            }
          );
        }}
        options={(cardTypes ?? []).map((type) => ({
          value: type.id,
          label: type.name,
        }))}
        emptyMessage="No card types yet. Create one to categorize cards."
        emptyActionLabel="Manage card types"
        onEmptyAction={() => router.push('/(tabs)/cards/types')}
        emptyIcon="layers-outline"
      />

      <MultiSelectSheet
        visible={cellEdit?.kind === 'subcategory'}
        title="Subcategories"
        selectedValues={subcategoryDraftIds}
        onClose={closeCellEdit}
        onChange={(subcategory_ids) => {
          if (cellEdit?.kind !== 'subcategory') return;
          setSubcategoryDraftIds(subcategory_ids);
          setSavingCell({ cardId: cellEdit.card.id, columnKey: 'subcategory' });
          updateCardFields.mutate(
            { id: cellEdit.card.id, subcategory_ids },
            {
              onError: (error) => {
                showSaveError(error);
                const card = cards.find((item) => item.id === cellEdit.card.id);
                setSubcategoryDraftIds(
                  card?.subcategories?.map((subcategory) => subcategory.id) ?? []
                );
              },
              onSettled: () => setSavingCell(null),
            }
          );
        }}
        options={(subcategories ?? []).map((subcategory) => ({
          value: subcategory.id,
          label: subcategory.name,
        }))}
        emptyMessage={SUBCATEGORY_EMPTY_MESSAGE}
        emptyActionLabel="Manage subcategories"
        onEmptyAction={openSubcategoriesManager}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    gap: SECTION_GAP,
    paddingBottom: spacing.xl,
  },
  tableFrame: {
    flex: 1,
    marginHorizontal: TABLE_MARGIN,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  tableScroll: {
    flex: 1,
  },
  tableList: {
    flex: 1,
  },
  horizontalScrollContent: {
    flexGrow: 1,
    alignItems: 'stretch',
  },
  tableScrollInner: {
    flex: 1,
    ...(Platform.OS === 'web' ? { minHeight: '100%' as const } : null),
  },
  listContent: {
    flexGrow: 1,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  headerRowWrap: {
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  headerCell: {
    flexDirection: 'row',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  headerCellInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 6,
    gap: 4,
  },
  headerCellFiltered: {
    backgroundColor: colors.selected,
  },
  headerCellFilterable: {
    backgroundColor: 'rgba(124, 131, 255, 0.05)',
  },
  headerLabelPressable: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  headerActionBtn: {
    padding: 4,
    flexShrink: 0,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerLabelFilterable: {
    color: colors.textSecondary,
  },
  headerLabelFiltered: {
    color: colors.primaryLight,
  },
  headerLabelActive: {
    color: colors.primaryLight,
  },
  headerLabelSecondary: {
    color: colors.textSecondary,
  },
  sortBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  sortOrderBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
    marginTop: -2,
  },
  headerSpacer: {
    backgroundColor: colors.surfaceElevated,
    borderRightWidth: 0,
  },
  spacerCell: {
    flex: 1,
    minWidth: MIN_SPACER_WIDTH,
    borderBottomWidth: 0,
  },
  spacerFixed: {
    flexGrow: 0,
    flexShrink: 0,
    width: MIN_SPACER_WIDTH,
  },
  spacerFill: {
    flex: 1,
    minHeight: 1,
  },
  resizeHandle: {
    width: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  resizeHandleBar: {
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
  },
  dataRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 64,
  },
  dataCell: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    minWidth: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: colors.border,
  },
  dataCellFlex: {
    flex: 1,
    minWidth: MIN_SPACER_WIDTH,
    borderRightColor: 'transparent',
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  dataRowAlternate: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
  },
  dataRowCompleted: {
    backgroundColor: 'rgba(61, 219, 156, 0.06)',
  },
  cellInteractive: {
    backgroundColor: colors.accentSubtle,
    borderTopColor: colors.primary,
    borderBottomColor: colors.primary,
    borderLeftColor: colors.primary,
    borderRightColor: colors.primary,
  },
  cellNavigate: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  cellDisabled: {
    opacity: 0.45,
  },
  doneToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  inlineInputWrap: {
    flex: 1,
    alignSelf: 'stretch',
    minWidth: 0,
    width: '100%',
    overflow: 'hidden',
  },
  inlineInput: {
    width: '100%',
    minWidth: 0,
    fontSize: 14,
    color: colors.text,
    padding: 0,
    margin: 0,
  },
  inlineInputAction: {
    fontWeight: '600',
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  inlineInputDifficulty: {
    fontWeight: '700',
    color: colors.primaryLight,
    fontVariant: ['tabular-nums'],
  },
  inlineInputCenter: {
    textAlign: 'center',
  },
  subcategoryStack: {
    gap: 4,
    alignItems: 'center',
  },
  emptyCell: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  diffText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryLight,
    fontVariant: ['tabular-nums'],
  },
  doneEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    backgroundColor: colors.toolbar,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subgroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subgroupCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  sheetHandle: {
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
  searchSheetBody: {
    padding: spacing.screenPadding,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  searchSheetLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  searchSheetInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchSheetInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 10,
  },
  searchSheetDone: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchSheetDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
