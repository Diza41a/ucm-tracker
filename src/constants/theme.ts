export const colors = {
  primary: '#7C83FF',
  primaryLight: '#A5AAFF',
  background: '#0A0E14',
  surface: '#121820',
  surfaceElevated: '#182030',
  border: '#243044',
  borderLight: '#2E3D52',
  text: '#E8EDF5',
  textSecondary: '#8B9BB4',
  textMuted: '#5C6B82',
  success: '#3DDB9C',
  warning: '#F5B942',
  danger: '#FF6B7A',
  star: '#FFD05B',
  completed: '#3DDB9C',
  inProgress: '#5C6B82',
  chip: '#1A2433',
  chipBorder: '#334155',
  selected: 'rgba(124, 131, 255, 0.16)',
  accentSubtle: 'rgba(124, 131, 255, 0.10)',
  dangerSubtle: 'rgba(255, 107, 122, 0.14)',
  successSubtle: 'rgba(61, 219, 156, 0.14)',
  track: '#1E2A3A',
  onPrimary: '#FFFFFF',
  tabBar: '#0E141D',
  toolbar: '#161E2A',
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  screenPadding: 16,
  fieldGap: 20,
  labelGap: 8,
  hintGap: 4,
};

export const typography = {
  editor: {
    familyWeb: 'Inter',
    familyNative: 'Inter_400Regular',
    stack: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    size: 16,
    lineHeight: 1.6,
    lineHeightPx: 26,
  },
} as const;

export const editorFontImportCss =
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');";

export const editorContentCssText = `font-family: ${typography.editor.stack}; font-size: ${typography.editor.size}px; line-height: ${typography.editor.lineHeight};`;

export const tabBarScreenOptions = {
  tabBarStyle: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 14,
    marginTop: 2,
  },
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
};

export const calendarTheme = {
  backgroundColor: colors.surface,
  calendarBackground: colors.surface,
  textSectionTitleColor: colors.textSecondary,
  selectedDayBackgroundColor: colors.primary,
  selectedDayTextColor: colors.onPrimary,
  todayTextColor: colors.primaryLight,
  dayTextColor: colors.text,
  textDisabledColor: colors.textMuted,
  monthTextColor: colors.text,
  arrowColor: colors.primary,
  dotColor: colors.primary,
};
