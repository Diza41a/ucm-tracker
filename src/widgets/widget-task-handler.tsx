import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { WIDGET_NAMES, type WidgetName } from '@/src/widgets/constants';
import { CombinedProgressWidget } from '@/src/widgets/components/CombinedProgressWidget';
import { MonthlyProgressWidget } from '@/src/widgets/components/MonthlyProgressWidget';
import { TodayOutingWidget } from '@/src/widgets/components/TodayOutingWidget';
import { WeeklyProgressWidget } from '@/src/widgets/components/WeeklyProgressWidget';
import { readWidgetSnapshot } from '@/src/widgets/widgetStorage';
import type { WidgetSnapshot } from '@/src/widgets/types';

export function renderWidgetByName(widgetName: WidgetName, snapshot: WidgetSnapshot) {
  switch (widgetName) {
    case WIDGET_NAMES.weeklyProgress:
      return <WeeklyProgressWidget snapshot={snapshot} />;
    case WIDGET_NAMES.monthlyProgress:
      return <MonthlyProgressWidget snapshot={snapshot} />;
    case WIDGET_NAMES.combinedProgress:
      return <CombinedProgressWidget snapshot={snapshot} />;
    case WIDGET_NAMES.todayOuting:
      return <TodayOutingWidget snapshot={snapshot} />;
    default:
      return <TodayOutingWidget snapshot={snapshot} />;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetName = props.widgetInfo.widgetName as WidgetName;
  const snapshot = readWidgetSnapshot();

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(renderWidgetByName(widgetName, snapshot));
      break;
    case 'WIDGET_DELETED':
    case 'WIDGET_CLICK':
    default:
      break;
  }
}
