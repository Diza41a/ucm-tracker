import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { spacing } from '@/src/constants/theme';

interface FormActionBarProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function FormActionBar({ children, style }: FormActionBarProps) {
  return <View style={[styles.bar, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.fieldGap,
  },
});
