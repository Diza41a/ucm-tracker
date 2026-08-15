import { colors, typography } from '@/src/constants/theme';

export const HTML_CONTENT_HORIZONTAL_PADDING = 48;

export const HTML_BASE_STYLE = {
  color: colors.text,
  fontSize: typography.editor.size,
  lineHeight: typography.editor.lineHeightPx,
};

export const HTML_TAGS_STYLES = {
  h1: { color: colors.text, marginBottom: 8 },
  h2: { color: colors.text, marginBottom: 8 },
  p: { color: colors.textSecondary, marginBottom: 8 },
  li: { color: colors.textSecondary },
  strong: { color: colors.text },
  a: { color: colors.primaryLight, textDecorationLine: 'underline' as const },
  hr: { borderBottomWidth: 1, borderBottomColor: colors.border, marginVertical: 12 },
  mark: { borderRadius: 3 },
};
