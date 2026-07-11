import { StyleSheet } from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';

export const formStyles = StyleSheet.create({
  screenContent: {
    padding: spacing.screenPadding,
    paddingBottom: 40,
    gap: spacing.fieldGap,
  },
  field: {
    gap: spacing.labelGap,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.hintGap - spacing.labelGap,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
