import { startOfWeek } from 'date-fns';

import type { MonthlyCommitment, OutingLog } from '@/src/types';
import { toDateString } from '@/src/utils/display';
import { getMonthlyProgressFromCommitment } from '@/src/utils/monthProgress';
import { getOutingLogCalendarDots, isOutingLogEmpty } from '@/src/utils/outingLogCalendar';
import { countCompletedOutingsInWeek } from '@/src/utils/weekCounter';
import type { TodayOutingStatus, WidgetSnapshot } from '@/src/widgets/types';

function getSavableTasks(log: OutingLog) {
  return (log.tasks ?? []).filter((task) => task.title.trim().length > 0);
}

function getWeekPercent(completed: number, target: number) {
  if (target <= 0) return completed > 0 ? 100 : 0;
  return Math.min(Math.round((completed / target) * 100), 100);
}

function getTodayStatus(log: OutingLog | undefined, today: string): TodayOutingStatus {
  if (!log || isOutingLogEmpty(log)) return 'not_started';

  const tasks = getSavableTasks(log);
  const hasOpenTasks = tasks.length > 0 && !tasks.every((task) => task.completed);

  if (log.completed && !hasOpenTasks) return 'completed';
  if (hasOpenTasks && log.log_date < today) return 'tasks_overdue';
  if (hasOpenTasks) return 'tasks_pending';
  if (log.completed) return 'completed';
  return 'in_progress';
}

function getTodayCopy(
  status: TodayOutingStatus,
  isOutingDay: boolean,
  weekCompleted: number,
  weekTarget: number,
  openTaskCount: number
): { headline: string; detail: string } {
  switch (status) {
    case 'completed':
      return {
        headline: 'Outing complete',
        detail: `Week: ${weekCompleted}/${weekTarget} · Nice work`,
      };
    case 'in_progress':
      return {
        headline: isOutingDay ? 'Outing day' : 'Log in progress',
        detail: openTaskCount > 0 ? `${openTaskCount} task${openTaskCount === 1 ? '' : 's'} on today's log` : "Finish today's log",
      };
    case 'tasks_pending':
      return {
        headline: isOutingDay ? 'Outing day' : 'Tasks waiting',
        detail: `${openTaskCount} open task${openTaskCount === 1 ? '' : 's'} today`,
      };
    case 'tasks_overdue':
      return {
        headline: 'Catch up today',
        detail: `${openTaskCount} overdue task${openTaskCount === 1 ? '' : 's'}`,
      };
    case 'not_started':
      if (isOutingDay) {
        return {
          headline: 'Outing day',
          detail: `${Math.max(0, weekTarget - weekCompleted)} more outing${weekTarget - weekCompleted === 1 ? '' : 's'} needed this week`,
        };
      }
      return {
        headline: 'No log yet today',
        detail: weekTarget > 0 ? `Week: ${weekCompleted}/${weekTarget}` : 'Tap to open tracker',
      };
    case 'no_commitment':
    default:
      return {
        headline: 'Set commitment',
        detail: 'Configure your weekly target',
      };
  }
}

function getMomentumLine(
  status: TodayOutingStatus,
  isOutingDay: boolean,
  weekRemaining: number,
  monthPercent: number,
  openTaskCount: number
): string {
  if (status === 'completed') {
    return monthPercent >= 100 ? 'Monthly goal reached' : `${monthPercent}% of monthly goal`;
  }
  if (openTaskCount > 0) {
    return `Clear ${openTaskCount} task${openTaskCount === 1 ? '' : 's'} to build momentum`;
  }
  if (isOutingDay && weekRemaining > 0) {
    return weekRemaining === 1 ? 'One outing left this week' : `${weekRemaining} outings left this week`;
  }
  if (status === 'in_progress') {
    return "Almost there — finish today's log";
  }
  if (weekRemaining === 0) {
    return 'Weekly target hit — optional outing';
  }
  return 'Small steps keep the streak alive';
}

function getCtaText(status: TodayOutingStatus, openTaskCount: number): string {
  if (status === 'completed') return "Review today's log";
  if (openTaskCount > 0) return 'Open tasks';
  if (status === 'not_started' || status === 'in_progress') return 'Log today';
  if (status === 'tasks_overdue') return 'Catch up now';
  return 'Open tracker';
}

export function computeWidgetSnapshot(
  logs: OutingLog[],
  commitment: MonthlyCommitment | null,
  referenceDate = new Date()
): WidgetSnapshot {
  const today = toDateString(referenceDate);
  const todayLog = logs.find((log) => log.log_date === today);
  const savableTasks = todayLog ? getSavableTasks(todayLog) : [];
  const openTaskCount = savableTasks.filter((task) => !task.completed).length;

  if (!commitment) {
    const dots = todayLog ? getOutingLogCalendarDots(todayLog, today) : [];
    const hasActivity = dots.length > 0;

    return {
      updatedAt: new Date().toISOString(),
      hasCommitment: false,
      weekCompleted: 0,
      weekTarget: 0,
      weekPercent: 0,
      weekRemaining: 0,
      monthCompleted: 0,
      monthTarget: 0,
      monthPercent: 0,
      durationMinutes: 0,
      today,
      todayStatus: 'no_commitment',
      isOutingDay: false,
      todayHeadline: hasActivity ? 'Log started' : 'Ready to begin?',
      todayDetail: 'Set your monthly commitment first',
      openTaskCount,
      momentumLine: 'Choose a weekly outing target',
      ctaText: 'Set commitment',
    };
  }

  const weekCompleted = countCompletedOutingsInWeek(logs, referenceDate);
  const weekTarget = commitment.outings_per_week;
  const weekRemaining = Math.max(0, weekTarget - weekCompleted);
  const weekPercent = getWeekPercent(weekCompleted, weekTarget);
  const monthProgress = getMonthlyProgressFromCommitment(logs, commitment);
  const todayStatus = getTodayStatus(todayLog, today);
  const isOutingDay = weekTarget > 0 && weekRemaining > 0 && todayStatus !== 'completed';
  const { headline, detail } = getTodayCopy(
    todayStatus,
    isOutingDay,
    weekCompleted,
    weekTarget,
    openTaskCount
  );

  return {
    updatedAt: new Date().toISOString(),
    hasCommitment: true,
    weekCompleted,
    weekTarget,
    weekPercent,
    weekRemaining,
    monthCompleted: monthProgress.completed,
    monthTarget: monthProgress.target,
    monthPercent: monthProgress.percent,
    durationMinutes: commitment.outing_duration_minutes,
    today,
    todayStatus,
    isOutingDay,
    todayHeadline: headline,
    todayDetail: detail,
    openTaskCount,
    momentumLine: getMomentumLine(
      todayStatus,
      isOutingDay,
      weekRemaining,
      monthProgress.percent,
      openTaskCount
    ),
    ctaText: getCtaText(todayStatus, openTaskCount),
  };
}

export function getMonthsToFetch(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const months = [{ year, month }];

  if (weekStart.getFullYear() !== year || weekStart.getMonth() + 1 !== month) {
    months.unshift({
      year: weekStart.getFullYear(),
      month: weekStart.getMonth() + 1,
    });
  }

  return months;
}
