import { memo, useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';

import { colors, typography } from '@/src/constants/theme';

const EDITOR_FONT_FAMILY =
  Platform.OS === 'web' ? typography.editor.familyWeb : typography.editor.familyNative;

const HTML_BASE_STYLE = {
  color: colors.text,
  fontSize: typography.editor.size,
  lineHeight: typography.editor.lineHeightPx,
  fontFamily: EDITOR_FONT_FAMILY,
};

const HTML_TAGS_STYLES = {
  h1: { color: colors.text, marginBottom: 8 },
  h2: { color: colors.text, marginBottom: 8 },
  p: { color: colors.textSecondary, marginBottom: 8 },
  li: { color: colors.textSecondary },
  strong: { color: colors.text },
  a: { color: colors.primaryLight, textDecorationLine: 'underline' as const },
  hr: { borderBottomWidth: 1, borderBottomColor: colors.border, marginVertical: 12 },
  mark: { borderRadius: 3 },
};

const CONTENT_HORIZONTAL_PADDING = 48;

interface HtmlContentProps {
  html: string;
}

function HtmlContentInner({ html }: HtmlContentProps) {
  const { width } = useWindowDimensions();
  const source = useMemo(() => ({ html }), [html]);
  const contentWidth = width - CONTENT_HORIZONTAL_PADDING;

  if (!html?.trim()) {
    return null;
  }

  return (
    <RenderHTML
      contentWidth={contentWidth}
      source={source}
      baseStyle={HTML_BASE_STYLE}
      tagsStyles={HTML_TAGS_STYLES}
    />
  );
}

export const HtmlContent = memo(HtmlContentInner);
