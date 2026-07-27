import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { RichEditor } from 'react-native-pell-rich-editor';

import { RichTextEditorShell, type RichTextEditorLayout } from '@/src/components/RichTextEditorShell';
import { RichTextEditorToolbar } from '@/src/components/RichTextEditorToolbar';
import { RichTextLinkModal } from '@/src/components/RichTextLinkModal';
import {
  richTextEditorHeights,
  richTextEditorStyles,
  type RichTextToolbarAction,
} from '@/src/constants/richTextEditor';
import {
  colors,
  editorContentCssText,
  editorFontImportCss,
} from '@/src/constants/theme';
import { useRichTextEditorContent } from '@/src/hooks/useRichTextEditorContent';
import { useRichTextEditorExpand } from '@/src/hooks/useRichTextEditorExpand';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  footer?: React.ReactNode;
  showFooterInline?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, footer, showFooterInline }: RichTextEditorProps) {
  const editorRef = useRef<RichEditor>(null);
  const skipProgrammaticChange = useRef(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkDefaultTitle, setLinkDefaultTitle] = useState('');
  const { contentRef, editorHtml, commitHtml, externalSyncGeneration } =
    useRichTextEditorContent(value, onChange);

  const readEditorHtml = useCallback(async () => {
    const html = await editorRef.current?.getContentHtml();
    return html ?? contentRef.current;
  }, [contentRef]);

  const flushEditorContent = useCallback(async () => {
    const html = await readEditorHtml();
    commitHtml(html);
  }, [commitHtml, readEditorHtml]);

  const { expanded, setExpandedWithFlush, toggleExpand } = useRichTextEditorExpand(flushEditorContent);

  const applyEditorHtml = useCallback((html: string, force = false) => {
    skipProgrammaticChange.current = true;
    editorRef.current?.setContentHTML(html);
    if (force) {
      contentRef.current = html;
    }
  }, [contentRef]);

  const lastExternalSyncGeneration = useRef(externalSyncGeneration);

  useLayoutEffect(() => {
    const isExternalSync = externalSyncGeneration !== lastExternalSyncGeneration.current;
    lastExternalSyncGeneration.current = externalSyncGeneration;
    applyEditorHtml(editorHtml, isExternalSync);
  }, [applyEditorHtml, editorHtml, externalSyncGeneration]);

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      applyEditorHtml(contentRef.current);
    }, 0);

    return () => clearTimeout(timer);
  }, [applyEditorHtml, contentRef, expanded]);

  const handleChange = (html: string) => {
    if (skipProgrammaticChange.current) {
      skipProgrammaticChange.current = false;
      return;
    }
    commitHtml(html);
  };

  const handleAction = (action: RichTextToolbarAction) => {
    switch (action) {
      case 'bold':
        editorRef.current?.commandDOM('bold');
        break;
      case 'italic':
        editorRef.current?.commandDOM('italic');
        break;
      case 'underline':
        editorRef.current?.commandDOM('underline');
        break;
      case 'strikeThrough':
        editorRef.current?.commandDOM('strikeThrough');
        break;
      case 'insertUnorderedList':
        editorRef.current?.commandDOM('insertUnorderedList');
        break;
      case 'insertOrderedList':
        editorRef.current?.commandDOM('insertOrderedList');
        break;
      case 'h1':
        editorRef.current?.commandDOM('formatBlock', false, 'h1');
        break;
      case 'h2':
        editorRef.current?.commandDOM('formatBlock', false, 'h2');
        break;
      case 'insertHorizontalRule':
        editorRef.current?.insertHTML('<hr />');
        break;
      case 'removeFormat':
        editorRef.current?.commandDOM('removeFormat');
        break;
      case 'undo':
        editorRef.current?.commandDOM('undo');
        break;
      case 'redo':
        editorRef.current?.commandDOM('redo');
        break;
      case 'link':
        editorRef.current?.focusContentEditor();
        setLinkDefaultTitle('');
        setShowLinkModal(true);
        break;
    }
  };

  const applyTextColor = (color: string) => {
    editorRef.current?.setForeColor(color);
  };

  const applyHighlightColor = (color: string) => {
    if (color === 'transparent') {
      editorRef.current?.commandDOM('removeFormat');
      return;
    }
    editorRef.current?.setHiliteColor(color);
  };

  const handleInsertLink = (title: string, url: string) => {
    editorRef.current?.focusContentEditor();
    setTimeout(() => {
      editorRef.current?.insertLink(title, url);
    }, 0);
  };

  const editorProps = {
    initialContentHTML: contentRef.current,
    onChange: handleChange,
    placeholder: placeholder ?? 'Write notes...',
    editorStyle: {
      backgroundColor: colors.surfaceElevated,
      color: colors.text,
      placeholderColor: colors.textMuted,
      initialCSSText: editorFontImportCss,
      contentCSSText: `${editorContentCssText} ${richTextEditorStyles}`,
    },
  };

  const renderEditor = (layout: RichTextEditorLayout) => {
    const isExpanded = layout === 'expanded';

    return (
      <>
        <RichTextEditorToolbar
          onAction={handleAction}
          onTextColor={applyTextColor}
          onHighlightColor={applyHighlightColor}
          expanded={isExpanded}
          onToggleExpand={toggleExpand}
        />

        {isExpanded ? (
          <View style={styles.editorExpandedWrap}>
            <RichEditor
              key="expanded"
              ref={editorRef}
              {...editorProps}
              style={styles.editorExpanded}
            />
          </View>
        ) : (
          <ScrollView style={styles.editorScroll} nestedScrollEnabled>
            <RichEditor
              key="inline"
              ref={editorRef}
              {...editorProps}
              style={styles.editorInline}
            />
          </ScrollView>
        )}

        <RichTextLinkModal
          visible={showLinkModal}
          defaultTitle={linkDefaultTitle}
          onClose={() => setShowLinkModal(false)}
          onSubmit={handleInsertLink}
        />
      </>
    );
  };

  return (
    <RichTextEditorShell
      expanded={expanded}
      onExpandedChange={setExpandedWithFlush}
      footer={footer}
      showFooterInline={showFooterInline}>
      {renderEditor}
    </RichTextEditorShell>
  );
}

const styles = StyleSheet.create({
  editorScroll: {
    maxHeight: richTextEditorHeights.inlineMax,
  },
  editorInline: {
    minHeight: richTextEditorHeights.inlineMin,
  },
  editorExpandedWrap: {
    flex: 1,
    minHeight: 0,
  },
  editorExpanded: {
    flex: 1,
    minHeight: richTextEditorHeights.inlineMin,
  },
});
