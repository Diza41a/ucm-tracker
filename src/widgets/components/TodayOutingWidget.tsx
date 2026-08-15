import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { getTodayLogDeepLink, getTrackerDeepLink } from '@/src/widgets/constants';
import type { WidgetSnapshot } from '@/src/widgets/types';
import {
  StatusBadge,
  WidgetCaption,
  WidgetCta,
  WidgetShell,
  WidgetTitle,
  widgetColors,
  spacing,
} from '@/src/widgets/components/shared';

function getAccentColor(snapshot: WidgetSnapshot) {
  if (snapshot.todayStatus === 'completed') return widgetColors.success;
  if (snapshot.todayStatus === 'tasks_overdue') return widgetColors.danger;
  if (snapshot.isOutingDay) return widgetColors.primary;
  if (snapshot.todayStatus === 'tasks_pending' || snapshot.todayStatus === 'in_progress') {
    return widgetColors.warning;
  }
  return widgetColors.textSecondary;
}

function getBadgeLabel(snapshot: WidgetSnapshot) {
  if (snapshot.todayStatus === 'completed') return 'DONE';
  if (snapshot.isOutingDay) return 'OUTING DAY';
  if (snapshot.todayStatus === 'tasks_overdue') return 'OVERDUE';
  if (snapshot.todayStatus === 'tasks_pending') return 'TASKS';
  if (snapshot.todayStatus === 'in_progress') return 'IN PROGRESS';
  if (!snapshot.hasCommitment) return 'SETUP';
  return 'TODAY';
}

export function TodayOutingWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  const deepLink = snapshot.today ? getTodayLogDeepLink(snapshot.today) : getTrackerDeepLink();
  const accent = getAccentColor(snapshot);

  return (
    <WidgetShell deepLink={deepLink}>
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        }}>
        <WidgetTitle label="TODAY" compact />
        <StatusBadge label={getBadgeLabel(snapshot)} color={accent} />
      </FlexWidget>

      <TextWidget
        text={snapshot.todayHeadline}
        style={{
          fontSize: 18,
          fontWeight: '800',
          color: widgetColors.text,
          marginBottom: spacing.xs,
        }}
      />
      <TextWidget
        text={snapshot.todayDetail}
        style={{
          fontSize: 13,
          color: widgetColors.textSecondary,
          marginBottom: spacing.sm,
        }}
      />

      {snapshot.openTaskCount > 0 ? (
        <FlexWidget
          style={{
            backgroundColor: widgetColors.surfaceElevated,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginBottom: spacing.sm,
          }}>
          <TextWidget
            text={`${snapshot.openTaskCount} open task${snapshot.openTaskCount === 1 ? '' : 's'}`}
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: widgetColors.warning,
            }}
          />
        </FlexWidget>
      ) : null}

      {snapshot.hasCommitment ? (
        <WidgetCaption
          text={`Week ${snapshot.weekCompleted}/${snapshot.weekTarget} · Month ${snapshot.monthPercent}%`}
          marginTop={0}
        />
      ) : null}

      <WidgetCaption text={snapshot.momentumLine} marginTop={spacing.xs} />
      <WidgetCta text={snapshot.ctaText} />
    </WidgetShell>
  );
}
