import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';

import { colors } from '@/src/constants/theme';

export const appDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

export { ThemeProvider };
