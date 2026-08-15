import Storage from 'expo-sqlite/kv-store';

import { WIDGET_SNAPSHOT_KEY } from '@/src/widgets/constants';
import { EMPTY_WIDGET_SNAPSHOT, type WidgetSnapshot } from '@/src/widgets/types';

export function readWidgetSnapshot(): WidgetSnapshot {
  const raw = Storage.getItemSync(WIDGET_SNAPSHOT_KEY);
  if (!raw) return EMPTY_WIDGET_SNAPSHOT;

  try {
    return { ...EMPTY_WIDGET_SNAPSHOT, ...(JSON.parse(raw) as WidgetSnapshot) };
  } catch {
    return EMPTY_WIDGET_SNAPSHOT;
  }
}

export function writeWidgetSnapshot(snapshot: WidgetSnapshot) {
  Storage.setItemSync(WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
}
