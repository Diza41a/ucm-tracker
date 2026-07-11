import { Platform, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';

import { colors, typography } from '@/src/constants/theme';

interface HtmlContentProps {
  html: string;
}

export function HtmlContent({ html }: HtmlContentProps) {
  const { width } = useWindowDimensions();

  if (!html?.trim()) {
    return null;
  }

  const editorFontFamily =
    Platform.OS === 'web' ? typography.editor.familyWeb : typography.editor.familyNative;

  return (
    <RenderHTML
      contentWidth={width - 48}
      source={{ html }}
      baseStyle={{
        color: colors.text,
        fontSize: typography.editor.size,
        lineHeight: typography.editor.lineHeightPx,
        fontFamily: editorFontFamily,
      }}
      tagsStyles={{
        h1: { color: colors.text, marginBottom: 8 },
        h2: { color: colors.text, marginBottom: 8 },
        p: { color: colors.textSecondary, marginBottom: 8 },
        li: { color: colors.textSecondary },
        strong: { color: colors.text },
      }}
    />
  );
}
