export type TodayOutingStatus =
  | 'no_commitment'
  | 'not_started'
  | 'in_progress'
  | 'tasks_pending'
  | 'tasks_overdue'
  | 'completed';

export type WidgetSnapshot = {
  updatedAt: string;
  hasCommitment: boolean;
  weekCompleted: number;
  weekTarget: number;
  weekPercent: number;
  weekRemaining: number;
  monthCompleted: number;
  monthTarget: number;
  monthPercent: number;
  durationMinutes: number;
  today: string;
  todayStatus: TodayOutingStatus;
  isOutingDay: boolean;
  todayHeadline: string;
  todayDetail: string;
  openTaskCount: number;
  momentumLine: string;
  ctaText: string;
};

export const EMPTY_WIDGET_SNAPSHOT: WidgetSnapshot = {
  updatedAt: '',
  hasCommitment: false,
  weekCompleted: 0,
  weekTarget: 0,
  weekPercent: 0,
  weekRemaining: 0,
  monthCompleted: 0,
  monthTarget: 0,
  monthPercent: 0,
  durationMinutes: 0,
  today: '',
  todayStatus: 'no_commitment',
  isOutingDay: false,
  todayHeadline: 'UCM Tracker',
  todayDetail: 'Open the app to sync widget data',
  openTaskCount: 0,
  momentumLine: 'Set your commitment to start tracking',
  ctaText: 'Open tracker',
};
