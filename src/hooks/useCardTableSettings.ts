import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  CARD_TABLE_SETTINGS_KEY,
  clampColumnWidth,
  DEFAULT_CARD_TABLE_SETTINGS,
  mergeColumnWidths,
  mergeSortLevels,
  normalizeGroupSettings,
  normalizePageSize,
  type CardTableColumnKey,
  type CardTableSettings,
} from '@/src/utils/cardTable';
import { mergeCardFilterState } from '@/src/utils/cardFilters';

const LEGACY_SETTINGS_KEY = 'ucm_tracker_card_table_settings_v1';

function mergeSettings(raw: unknown): CardTableSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_CARD_TABLE_SETTINGS;

  const parsed = raw as Partial<CardTableSettings> & {
    sortField?: unknown;
    sortDirection?: unknown;
  };
  const group = normalizeGroupSettings(
    parsed.groupBy ?? DEFAULT_CARD_TABLE_SETTINGS.groupBy,
    parsed.subgroupBy ?? DEFAULT_CARD_TABLE_SETTINGS.subgroupBy
  );

  return {
    ...DEFAULT_CARD_TABLE_SETTINGS,
    ...parsed,
    ...group,
    pageSize: normalizePageSize(parsed.pageSize),
    sortLevels: mergeSortLevels(parsed.sortLevels, {
      sortField: parsed.sortField,
      sortDirection: parsed.sortDirection,
    }),
    columnFilters: mergeCardFilterState(parsed.columnFilters),
    columnWidths: mergeColumnWidths(parsed.columnWidths),
  };
}

export function useCardTableSettings() {
  const [settings, setSettings] = useState<CardTableSettings>(DEFAULT_CARD_TABLE_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(CARD_TABLE_SETTINGS_KEY)
      .then(async (raw) => {
        if (!active) return;
        if (raw) {
          try {
            setSettings(mergeSettings(JSON.parse(raw)));
            setLoaded(true);
            return;
          } catch {
            setSettings(DEFAULT_CARD_TABLE_SETTINGS);
            setLoaded(true);
            return;
          }
        }

        const legacy = await AsyncStorage.getItem(LEGACY_SETTINGS_KEY);
        if (!active) return;
        if (legacy) {
          try {
            setSettings(mergeSettings(JSON.parse(legacy)));
          } catch {
            setSettings(DEFAULT_CARD_TABLE_SETTINGS);
          }
        }
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: CardTableSettings) => {
    setSettings(next);
    AsyncStorage.setItem(CARD_TABLE_SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const updateSettings = useCallback((patch: Partial<CardTableSettings>) => {
    setSettings((current) => {
      const merged = { ...current, ...patch };
      const group = normalizeGroupSettings(merged.groupBy, merged.subgroupBy);
      const next = mergeSettings({ ...merged, ...group });
      AsyncStorage.setItem(CARD_TABLE_SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const updateColumnFilters = useCallback(
    (patch: Partial<CardTableSettings['columnFilters']>) => {
      setSettings((current) => {
        const next = mergeSettings({
          ...current,
          columnFilters: mergeCardFilterState({ ...current.columnFilters, ...patch }),
        });
        AsyncStorage.setItem(CARD_TABLE_SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  const updateColumnWidth = useCallback((key: CardTableColumnKey, width: number) => {
    setSettings((current) => {
      const next = mergeSettings({
        ...current,
        columnWidths: {
          ...current.columnWidths,
          [key]: clampColumnWidth(key, width),
        },
      });
      AsyncStorage.setItem(CARD_TABLE_SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    persist(DEFAULT_CARD_TABLE_SETTINGS);
  }, [persist]);

  return {
    settings,
    loaded,
    updateSettings,
    updateColumnFilters,
    updateColumnWidth,
    resetSettings,
  };
}
