import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { supabase } from '@/src/lib/supabase';
import type { MonthlyCommitment, OutingLog } from '@/src/types';
import { ALL_WIDGET_NAMES, type WidgetName } from '@/src/widgets/constants';
import {
  computeWidgetSnapshot,
  getMonthsToFetch,
} from '@/src/widgets/computeWidgetSnapshot';
import { renderWidgetByName } from '@/src/widgets/widget-task-handler';
import { readWidgetSnapshot, writeWidgetSnapshot } from '@/src/widgets/widgetStorage';

async function fetchMonthLogs(year: number, month: number): Promise<OutingLog[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('outing_logs')
    .select(
      '*, outing_log_tasks(*), outing_log_cards(card_id), outing_log_stories(story_id)'
    )
    .gte('log_date', startDate)
    .lt('log_date', endDate)
    .order('log_date');

  if (error) throw error;

  return (
    data as (OutingLog & {
      outing_log_tasks?: OutingLog['tasks'];
      outing_log_cards?: { card_id: string }[];
      outing_log_stories?: { story_id: string }[];
    })[]
  ).map((log) => ({
    ...log,
    content_html: log.content_html ?? '',
    tasks: (log.outing_log_tasks ?? []).sort((a, b) => a.sort_order - b.sort_order),
    cards: (log.outing_log_cards ?? []).map((row) => ({ id: row.card_id })) as OutingLog['cards'],
    stories: (log.outing_log_stories ?? []).map((row) => ({ id: row.story_id })) as OutingLog['stories'],
  }));
}

async function fetchCommitment(year: number, month: number): Promise<MonthlyCommitment | null> {
  const { data, error } = await supabase
    .from('monthly_commitments')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();

  if (error) throw error;
  return data as MonthlyCommitment | null;
}

export async function syncWidgetSnapshot(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const now = new Date();
  const months = getMonthsToFetch(now);
  const monthResults = await Promise.all(
    months.map(({ year, month }) => fetchMonthLogs(year, month))
  );
  const logs = monthResults.flat();
  const { year, month } = months[months.length - 1];
  const commitment = await fetchCommitment(year, month);
  const snapshot = computeWidgetSnapshot(logs, commitment, now);

  writeWidgetSnapshot(snapshot);
}

export async function refreshAndroidWidgets(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await syncWidgetSnapshot();
  const snapshot = readWidgetSnapshot();

  await Promise.all(
    ALL_WIDGET_NAMES.map((widgetName) =>
      requestWidgetUpdate({
        widgetName,
        renderWidget: () => renderWidgetByName(widgetName as WidgetName, snapshot),
      }).catch(() => undefined)
    )
  );
}
