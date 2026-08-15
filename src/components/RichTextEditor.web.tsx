import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RichTextEditorShell, type RichTextEditorLayout } from '@/src/components/RichTextEditorShell';
import { RichTextEditorToolbar } from '@/src/components/RichTextEditorToolbar';
import { RichTextLinkModal } from '@/src/components/RichTextLinkModal';
import {
  richTextEditorHeights,
  richTextEditorStyles,
  type RichTextToolbarAction,
} from '@/src/constants/richTextEditor';
import { colors, typography } from '@/src/constants/theme';
import { useRichTextEditorContent } from '@/src/hooks/useRichTextEditorContent';
import { useRichTextEditorExpand } from '@/src/hooks/useRichTextEditorExpand';
import {
  captureEditorSelection,
  getRangeText,
  restoreEditorSelection,
} from '@/src/utils/richTextSelection.web';
import { buildLinkHtml } from '@/src/utils/richTextLink';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  footer?: React.ReactNode;
  showFooterInline?: boolean;
}

function getSelectedText() {
  const selection = window.getSelection();
  return selection?.toString() ?? '';
}

function runCommand(action: Exclude<RichTextToolbarAction, 'link'>) {
  if (action === 'h1') {
    document.execCommand('formatBlock', false, 'h1');
    return;
  }
  if (action === 'h2') {
    document.execCommand('formatBlock', false, 'h2');
    return;
  }
  document.execCommand(action);
}

function seedEditorNode(node: HTMLDivElement, html: string, force = false) {
  const nextHtml = html || '';
  if (force || node.innerHTML !== nextHtml) {
    node.innerHTML = nextHtml;
  }
}

export function RichTextEditor({ value, onChange, placeholder, footer, showFooterInline }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkDefaultTitle, setLinkDefaultTitle] = useState('');
  const { contentRef, editorHtml, commitHtml, externalSyncGeneration } =
    useRichTextEditorContent(value, onChange);
  const lastExternalSyncGeneration = useRef(externalSyncGeneration);
  const savedSelectionRef = useRef<Range | null>(null);

  const readEditorHtml = useCallback(() => {
    return editorRef.current?.innerHTML ?? contentRef.current;
  }, [contentRef]);

  const flushEditorContent = useCallback(() => {
    commitHtml(readEditorHtml());
  }, [commitHtml, readEditorHtml]);

  const { expanded, setExpandedWithFlush, toggleExpand } = useRichTextEditorExpand(flushEditorContent);

  const attachEditorRef = useCallback(
    (node: HTMLDivElement | null) => {
      editorRef.current = node;
      if (node) {
        seedEditorNode(node, contentRef.current);
      }
    },
    [contentRef]
  );

  useEffect(() => {
    const styleId = 'rich-text-editor-placeholder-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: ${colors.textMuted};
          font-family: ${typography.editor.stack};
        }
        [contenteditable] {
          font-family: ${typography.editor.stack};
        }
        [contenteditable] h1,
        [contenteditable] h2,
        [contenteditable] p,
        [contenteditable] li {
          font-family: ${typography.editor.stack};
        }
        ${richTextEditorStyles}
      `;
      document.head.appendChild(style);
    }
  }, []);

  useLayoutEffect(() => {
    if (!editorRef.current) return;
    if (externalSyncGeneration === lastExternalSyncGeneration.current) {
      return;
    }

    lastExternalSyncGeneration.current = externalSyncGeneration;
    seedEditorNode(editorRef.current, editorHtml, true);
  }, [editorHtml, externalSyncGeneration]);

  const handleAction = (action: RichTextToolbarAction) => {
    if (action === 'link') {
      savedSelectionRef.current = captureEditorSelection(editorRef.current);
      setLinkDefaultTitle(getRangeText(savedSelectionRef.current) || getSelectedText());
      setShowLinkModal(true);
      return;
    }

    editorRef.current?.focus();

    runCommand(action);
    flushEditorContent();
  };

  const applyTextColor = (color: string) => {
    editorRef.current?.focus();
    document.execCommand('foreColor', false, color);
    flushEditorContent();
  };

  const applyHighlightColor = (color: string) => {
    editorRef.current?.focus();
    if (color === 'transparent') {
      document.execCommand('hiliteColor', false, colors.surfaceElevated);
      flushEditorContent();
      return;
    }
    document.execCommand('hiliteColor', false, color);
    flushEditorContent();
  };

  const handleInsertLink = (title: string, url: string) => {
    editorRef.current?.focus();
    restoreEditorSelection(savedSelectionRef.current);

    const selected = getSelectedText();

    if (selected) {
      document.execCommand('createLink', false, url);
    } else {
      document.execCommand('insertHTML', false, buildLinkHtml(title, url));
    }

    savedSelectionRef.current = null;
    flushEditorContent();
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

        <View style={isExpanded ? styles.editorExpandedWrap : undefined}>
          <div
            key={isExpanded ? 'expanded' : 'inline'}
            ref={attachEditorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => commitHtml(readEditorHtml())}
            onBlur={flushEditorContent}
            data-placeholder={placeholder ?? 'Write notes...'}
            style={{
              minHeight: isExpanded ? undefined : richTextEditorHeights.inlineMin,
              maxHeight: isExpanded ? undefined : richTextEditorHeights.inlineMax,
              height: isExpanded ? '100%' : undefined,
              flex: isExpanded ? 1 : undefined,
              overflowY: 'auto',
              padding: 12,
              fontSize: typography.editor.size,
              lineHeight: typography.editor.lineHeight,
              fontFamily: typography.editor.stack,
              color: colors.text,
              backgroundColor: colors.surfaceElevated,
              outline: 'none',
            }}
          />
        </View>

        <RichTextLinkModal
          visible={showLinkModal}
          defaultTitle={linkDefaultTitle}
          onClose={() => {
            savedSelectionRef.current = null;
            setShowLinkModal(false);
          }}
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
  editorExpandedWrap: {
    flex: 1,
    minHeight: 0,
  },
});
