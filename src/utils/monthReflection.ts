// Temporary preview override — set to true to unlock reflection early.
const REFLECTION_ALWAYS_UNLOCKED = false;

export function getLastDayOfMonth(year: number, month: number): Date {
  const lastDay = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, lastDay);
}

export function isReflectionUnlocked(
  year: number,
  month: number,
  today: Date = new Date()
): boolean {
  if (REFLECTION_ALWAYS_UNLOCKED) return true;

  const monthEnd = getLastDayOfMonth(year, month);
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return todayDate >= monthEnd;
}

export function daysUntilReflectionUnlock(
  year: number,
  month: number,
  today: Date = new Date()
): number {
  if (isReflectionUnlocked(year, month, today)) return 0;

  const monthEnd = getLastDayOfMonth(year, month);
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = monthEnd.getTime() - todayDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
