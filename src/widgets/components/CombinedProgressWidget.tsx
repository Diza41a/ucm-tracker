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

export function CombinedProgressWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  if (!snapshot.hasCommitment) {
    return (
      <WidgetShell deepLink={getTrackerDeepLink()}>
        <WidgetTitle label="MOMENTUM" />
        <NoCommitmentBody />
      </WidgetShell>
    );
  }

  const weekColor = snapshot.weekPercent >= 100 ? widgetColors.success : widgetColors.primary;
  const monthColor = snapshot.monthPercent >= 100 ? widgetColors.success : widgetColors.warning;

  return (
    <WidgetShell deepLink={getTrackerDeepLink()}>
      <WidgetTitle label="MOMENTUM" />
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          marginTop: spacing.xs,
        }}>
        <FlexWidget style={{ alignItems: 'center' }}>
          <ProgressRing
            size={76}
            percent={snapshot.weekPercent}
            primaryText={`${snapshot.weekCompleted}/${snapshot.weekTarget}`}
            secondaryText="week"
            fillColor={weekColor}
            stroke={6}
          />
        </FlexWidget>
        <FlexWidget style={{ alignItems: 'center' }}>
          <ProgressRing
            size={76}
            percent={snapshot.monthPercent}
            primaryText={`${snapshot.monthPercent}%`}
            secondaryText="month"
            fillColor={monthColor}
            stroke={6}
          />
        </FlexWidget>
      </FlexWidget>
      <WidgetCaption text={snapshot.momentumLine} marginTop={spacing.md} />
      <WidgetCta text={snapshot.ctaText} />
    </WidgetShell>
  );
}
