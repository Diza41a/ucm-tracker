import { endOfWeek, getISOWeek, getISOWeekYear, startOfWeek } from 'date-fns';

import type { OutingLog } from '@/src/types';
import { parseDateString } from '@/src/utils/display';

export function getWeekKey(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
}

export function countCompletedOutingsInWeek(
  logs: OutingLog[],
  referenceDate: Date
): number {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });

  return logs.filter((log) => {
    if (!log.completed) return false;
    const logDate = parseDateString(log.log_date);
    return logDate >= weekStart && logDate <= weekEnd;
  }).length;
}
