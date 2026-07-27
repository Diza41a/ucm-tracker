import { colors } from '@/src/constants/theme';
import type { OutingLog } from '@/src/types';

export type CalendarDot = { key: string; color: string };

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSavableTasks(log: OutingLog) {
  return (log.tasks ?? []).filter((task) => task.title.trim().length > 0);
}

/** True when the log has no meaningful content (text, tasks, cards, or stories). */
export function isOutingLogEmpty(log: OutingLog): boolean {
  const hasText = stripHtml(log.content_html ?? '').length > 0;
  const hasTasks = getSavableTasks(log).length > 0;
  const hasCards = (log.cards?.length ?? 0) > 0;
  const hasStories = (log.stories?.length ?? 0) > 0;
  return !hasText && !hasTasks && !hasCards && !hasStories;
}

/** Calendar dot colors based on outing completion and task status. */
export function getOutingLogCalendarDots(log: OutingLog, today: string): CalendarDot[] {
  if (isOutingLogEmpty(log)) {
    return log.starred ? [{ key: 'starred', color: colors.star }] : [];
  }

  const dots: CalendarDot[] = [];
  const tasks = getSavableTasks(log);
  const hasTasks = tasks.length > 0;
  const allTasksDone = hasTasks && tasks.every((task) => task.completed);
  const hasOpenTasks = hasTasks && !allTasksDone;
  const isPast = log.log_date < today;

  if (log.completed && (!hasTasks || allTasksDone)) {
    dots.push({ key: 'completed', color: colors.completed });
  } else if (hasOpenTasks && isPast) {
    dots.push({ key: 'tasks-overdue', color: colors.danger });
  } else if (hasOpenTasks) {
    dots.push({ key: 'tasks-pending', color: colors.warning });
  } else if (hasTasks) {
    dots.push({ key: 'tasks', color: colors.primaryLight });
  } else if (log.completed) {
    dots.push({ key: 'completed', color: colors.completed });
  } else {
    dots.push({ key: 'started', color: colors.inProgress });
  }

  if (log.starred) {
    dots.push({ key: 'starred', color: colors.star });
  }

  return dots;
}
