import { addDays } from 'date-fns';

import type { MonthlyCommitment, OutingLog } from '@/src/types';
import { parseDateString } from '@/src/utils/display';
import { getWeekKey } from '@/src/utils/weekCounter';

export function getCommitmentCountingStartDate(commitment: MonthlyCommitment): Date {
  const created = new Date(commitment.created_at);
  const createdLocal = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const monthStart = new Date(commitment.year, commitment.month - 1, 1);
  const monthEnd = new Date(commitment.year, commitment.month, 0);

  if (createdLocal < monthStart) return monthStart;
  if (createdLocal > monthEnd) return monthStart;
  return createdLocal;
}

export function countCompletedOutingsInMonth(
  logs: OutingLog[],
  year: number,
  month: number,
  countingStart?: Date
): number {
  const monthEnd = new Date(year, month, 0);
  const start = countingStart
    ? new Date(countingStart.getFullYear(), countingStart.getMonth(), countingStart.getDate())
    : new Date(year, month - 1, 1);

  return logs.filter((log) => {
    if (!log.completed) return false;
    const logDate = parseDateString(log.log_date);
    return (
      logDate.getFullYear() === year &&
      logDate.getMonth() + 1 === month &&
      logDate >= start &&
      logDate <= monthEnd
    );
  }).length;
}

export function getMonthlyOutingTarget(
  outingsPerWeek: number,
  year: number,
  month: number,
  countingStart?: Date
): number {
  if (outingsPerWeek <= 0) return 0;

  const monthEnd = new Date(year, month, 0);
  const defaultStart = new Date(year, month - 1, 1);
  const start = countingStart
    ? new Date(countingStart.getFullYear(), countingStart.getMonth(), countingStart.getDate())
    : defaultStart;
  const rangeStart = start > monthEnd ? monthEnd : start < defaultStart ? defaultStart : start;

  const weeks = new Set<string>();
  for (let day = rangeStart; day <= monthEnd; day = addDays(day, 1)) {
    weeks.add(getWeekKey(day));
  }

  return outingsPerWeek * weeks.size;
}

export function getMonthCompletionPercent(
  completed: number,
  target: number
): number {
  if (target <= 0) return completed > 0 ? 100 : 0;
  return Math.min(Math.round((completed / target) * 100), 100);
}

export function getMonthlyProgressFromCommitment(
  logs: OutingLog[],
  commitment: MonthlyCommitment
) {
  const countingStart = getCommitmentCountingStartDate(commitment);
  const completed = countCompletedOutingsInMonth(
    logs,
    commitment.year,
    commitment.month,
    countingStart
  );
  const target = getMonthlyOutingTarget(
    commitment.outings_per_week,
    commitment.year,
    commitment.month,
    countingStart
  );
  const percent = getMonthCompletionPercent(completed, target);

  return { completed, target, percent, countingStart };
}
