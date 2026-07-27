import type { Story } from '@/src/types';

export function storyDisplayName(story: Pick<Story, 'name'>): string {
  return story.name;
}

export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toYearMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseYearMonthKey(key: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function formatWinDayLabel(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** All YYYY-MM-DD strings from the 1st through `throughDate` (inclusive). */
export function getMonthDateStringsThrough(
  year: number,
  month: number,
  throughDate: string
): string[] {
  const lastDay = new Date(year, month, 0).getDate();
  const dates: string[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateStr > throughDate) break;
    dates.push(dateStr);
  }

  return dates;
}

export function sortDateStringsDesc(dates: string[]): string[] {
  return [...dates].sort((a, b) => b.localeCompare(a));
}
