import React from 'react';
import type { ColorProp } from 'react-native-android-widget';
import { FlexWidget, OverlapWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import { colors } from '@/src/constants/theme';

export const widgetColors = {
  background: colors.background as ColorProp,
  surface: colors.surface as ColorProp,
  surfaceElevated: colors.surfaceElevated as ColorProp,
  border: colors.border as ColorProp,
  text: colors.text as ColorProp,
  textSecondary: colors.textSecondary as ColorProp,
  textMuted: colors.textMuted as ColorProp,
  primary: colors.primary as ColorProp,
  success: colors.success as ColorProp,
  warning: colors.warning as ColorProp,
  danger: colors.danger as ColorProp,
  track: colors.track as ColorProp,
};

export const spacing = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
};

function buildProgressRingSvg(
  percent: number,
  size: number,
  stroke: number,
  trackColor: string,
  fillColor: string
) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(percent, 100));
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${trackColor}" stroke-width="${stroke}" />
    <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${fillColor}" stroke-width="${stroke}"
      stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
      stroke-linecap="round" transform="rotate(-90 ${center} ${center})" />
  </svg>`;
}

export function WidgetShell({
  children,
  deepLink,
  centered = false,
}: {
  children: React.ReactNode;
  deepLink: string;
  centered?: boolean;
}) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: deepLink }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: widgetColors.surface,
        borderRadius: 16,
        padding: spacing.lg,
        flexDirection: 'column',
        justifyContent: centered ? 'center' : 'flex-start',
        alignItems: centered ? 'center' : 'stretch',
      }}>
      {children}
    </FlexWidget>
  );
}

export function WidgetTitle({ label, centered = false, compact = false }: { label: string; centered?: boolean; compact?: boolean }) {
  return (
    <TextWidget
      text={label}
      style={{
        fontSize: 10,
        fontWeight: '700',
        color: widgetColors.textSecondary,
        ...(compact ? {} : { marginBottom: spacing.sm }),
      }}
    />
  );
}

export function WidgetCaption({
  text,
  centered = false,
  color = widgetColors.textMuted,
  marginTop = spacing.xs,
}: {
  text: string;
  centered?: boolean;
  color?: ColorProp;
  marginTop?: number;
}) {
  return (
    <TextWidget
      text={text}
      style={{
        fontSize: 11,
        color,
        marginTop,
        ...(centered ? { textAlign: 'center' as const } : {}),
      }}
    />
  );
}

export function WidgetCta({ text }: { text: string }) {
  return (
    <TextWidget
      text={text}
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: widgetColors.primary,
        marginTop: spacing.sm,
      }}
    />
  );
}

export function ProgressRing({
  size,
  percent,
  primaryText,
  secondaryText,
  fillColor = widgetColors.success,
  stroke = 7,
}: {
  size: number;
  percent: number;
  primaryText: string;
  secondaryText?: string;
  fillColor?: ColorProp;
  stroke?: number;
}) {
  return (
    <OverlapWidget>
      <SvgWidget
        svg={buildProgressRingSvg(percent, size, stroke, colors.track, fillColor as string)}
        style={{ width: size, height: size }}
      />
      <FlexWidget
        style={{
          width: size,
          height: size,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}>
        <TextWidget
          text={primaryText}
          style={{
            fontSize: size >= 88 ? 22 : 18,
            fontWeight: '800',
            color: widgetColors.text,
          }}
        />
        {secondaryText ? (
          <TextWidget
            text={secondaryText}
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: widgetColors.textSecondary,
              marginTop: 2,
            }}
          />
        ) : null}
      </FlexWidget>
    </OverlapWidget>
  );
}

export function StatusBadge({
  label,
  color,
}: {
  label: string;
  color: ColorProp;
}) {
  return (
    <FlexWidget
      style={{
        backgroundColor: widgetColors.track,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}>
      <TextWidget
        text={label}
        style={{
          fontSize: 9,
          fontWeight: '800',
          color,
        }}
      />
    </FlexWidget>
  );
}

export function NoCommitmentBody() {
  return (
    <FlexWidget style={{ flexDirection: 'column', marginTop: spacing.sm }}>
      <TextWidget
        text="Set your commitment"
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: widgetColors.text,
          marginBottom: spacing.xs,
        }}
      />
      <TextWidget
        text="Choose a weekly outing target to unlock progress widgets."
        style={{
          fontSize: 12,
          lineHeight: 16,
          color: widgetColors.textSecondary,
        }}
      />
      <WidgetCta text="Open tracker" />
    </FlexWidget>
  );
}

export function ProgressBar({
  ratio,
  fillColor = widgetColors.success,
  marginTop = spacing.sm,
}: {
  ratio: number;
  fillColor?: ColorProp;
  marginTop?: number;
}) {
  const clamped = Math.max(0, Math.min(ratio, 1));
  const widthPercent = Math.round(clamped * 100);

  return (
    <FlexWidget
      style={{
        height: 8,
        width: 'match_parent',
        backgroundColor: widgetColors.track,
        borderRadius: 4,
        flexDirection: 'row',
        marginTop,
      }}>
      {widthPercent > 0 ? (
        <FlexWidget
          style={{
            height: 'match_parent',
            width: `${widthPercent}%`,
            backgroundColor: fillColor,
            borderRadius: 4,
          }}
        />
      ) : null}
    </FlexWidget>
  );
}
