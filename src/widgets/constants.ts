export const WIDGET_SNAPSHOT_KEY = 'ucm:widgetSnapshot';

export const WIDGET_NAMES = {
  weeklyProgress: 'WeeklyProgress',
  monthlyProgress: 'MonthlyProgress',
  combinedProgress: 'CombinedProgress',
  todayOuting: 'TodayOuting',
} as const;

export type WidgetName = (typeof WIDGET_NAMES)[keyof typeof WIDGET_NAMES];

export const ALL_WIDGET_NAMES = Object.values(WIDGET_NAMES);

export function getTodayLogDeepLink(date: string) {
  return `ucmtracker:///(tabs)/tracker/log/${date}`;
}

export function getTrackerDeepLink() {
  return 'ucmtracker:///(tabs)/tracker';
}
