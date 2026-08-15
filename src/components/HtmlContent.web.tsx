import { memo, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';

import { AnchorRenderer } from '@/src/components/HtmlAnchorRenderer';
import {
  HTML_BASE_STYLE,
  HTML_CONTENT_HORIZONTAL_PADDING,
  HTML_TAGS_STYLES,
} from '@/src/constants/htmlContent';
import { typography } from '@/src/constants/theme';

interface HtmlContentProps {
  html: string;
}

const renderers = {
  a: AnchorRenderer,
};

function HtmlContentInner({ html }: HtmlContentProps) {
  const { width } = useWindowDimensions();
  const source = useMemo(() => ({ html }), [html]);
  const contentWidth = width - HTML_CONTENT_HORIZONTAL_PADDING;
  const baseStyle = useMemo(
    () => ({
      ...HTML_BASE_STYLE,
      fontFamily: typography.editor.familyWeb,
    }),
    []
  );

  if (!html?.trim()) {
    return null;
  }

  return (
    <RenderHTML
      contentWidth={contentWidth}
      source={source}
      baseStyle={baseStyle}
      tagsStyles={HTML_TAGS_STYLES}
      renderers={renderers}
    />
  );
}

export const HtmlContent = memo(HtmlContentInner);
