import { FlexWidget } from 'react-native-android-widget';

import { getTrackerDeepLink } from '@/src/widgets/constants';
import type { WidgetSnapshot } from '@/src/widgets/types';
import {
  NoCommitmentBody,
  ProgressRing,
  WidgetCaption,
  WidgetCta,
  WidgetShell,
  WidgetTitle,
  widgetColors,
  spacing,
} from '@/src/widgets/components/shared';

export function WeeklyProgressWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  if (!snapshot.hasCommitment) {
    return (
      <WidgetShell deepLink={getTrackerDeepLink()}>
        <WidgetTitle label="THIS WEEK" />
        <NoCommitmentBody />
      </WidgetShell>
    );
  }

  const ringColor =
    snapshot.weekPercent >= 100
      ? widgetColors.success
      : snapshot.isOutingDay
        ? widgetColors.primary
        : widgetColors.warning;

  return (
    <WidgetShell deepLink={getTrackerDeepLink()} centered>
      <WidgetTitle label="THIS WEEK" centered />
      <FlexWidget style={{ alignItems: 'center', marginTop: spacing.xs }}>
        <ProgressRing
          size={92}
          percent={snapshot.weekPercent}
          primaryText={`${snapshot.weekCompleted}/${snapshot.weekTarget}`}
          secondaryText={`${snapshot.weekPercent}%`}
          fillColor={ringColor}
        />
      </FlexWidget>
      <WidgetCaption text={snapshot.momentumLine} centered marginTop={spacing.md} />
      <WidgetCta text={snapshot.weekRemaining > 0 ? 'Log an outing' : 'View tracker'} />
    </WidgetShell>
  );
}
