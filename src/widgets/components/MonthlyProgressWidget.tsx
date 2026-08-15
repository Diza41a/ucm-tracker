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

export function MonthlyProgressWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  if (!snapshot.hasCommitment) {
    return (
      <WidgetShell deepLink={getTrackerDeepLink()}>
        <WidgetTitle label="THIS MONTH" />
        <NoCommitmentBody />
      </WidgetShell>
    );
  }

  const ringColor =
    snapshot.monthPercent >= 100
      ? widgetColors.success
      : snapshot.monthPercent >= 50
        ? widgetColors.primary
        : widgetColors.warning;

  return (
    <WidgetShell deepLink={getTrackerDeepLink()} centered>
      <WidgetTitle label="THIS MONTH" centered />
      <FlexWidget style={{ alignItems: 'center', marginTop: spacing.xs }}>
        <ProgressRing
          size={92}
          percent={snapshot.monthPercent}
          primaryText={`${snapshot.monthPercent}%`}
          secondaryText={`${snapshot.monthCompleted}/${snapshot.monthTarget}`}
          fillColor={ringColor}
        />
      </FlexWidget>
      <WidgetCaption
        text={`${snapshot.durationMinutes} min per outing`}
        centered
        marginTop={spacing.md}
      />
      <WidgetCta text="See monthly progress" />
    </WidgetShell>
  );
}
