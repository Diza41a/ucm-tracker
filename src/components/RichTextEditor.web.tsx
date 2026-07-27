import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RichTextEditorToolbar } from '@/src/components/RichTextEditorToolbar';
import { RichTextLinkModal } from '@/src/components/RichTextLinkModal';
import { richTextEditorStyles, type RichTextToolbarAction } from '@/src/constants/richTextEditor';
import { colors, radii, typography } from '@/src/constants/theme';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
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

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkDefaultTitle, setLinkDefaultTitle] = useState('');

  const syncValue = useCallback(() => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

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

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleAction = (action: RichTextToolbarAction) => {
    editorRef.current?.focus();

    if (action === 'link') {
      setLinkDefaultTitle(getSelectedText());
      setShowLinkModal(true);
      return;
    }

    runCommand(action);
    syncValue();
  };

  const applyTextColor = (color: string) => {
    editorRef.current?.focus();
    document.execCommand('foreColor', false, color);
    syncValue();
  };

  const applyHighlightColor = (color: string) => {
    editorRef.current?.focus();
    if (color === 'transparent') {
      document.execCommand('hiliteColor', false, colors.surfaceElevated);
      syncValue();
      return;
    }
    document.execCommand('hiliteColor', false, color);
    syncValue();
  };

  const handleInsertLink = (title: string, url: string) => {
    editorRef.current?.focus();
    const selected = getSelectedText();

    if (selected) {
      document.execCommand('createLink', false, url);
    } else {
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`
      );
    }

    syncValue();
  };

  return (
    <View style={styles.container}>
      <RichTextEditorToolbar
        onAction={handleAction}
        onTextColor={applyTextColor}
        onHighlightColor={applyHighlightColor}
      />

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncValue}
        onBlur={syncValue}
        data-placeholder={placeholder ?? 'Write notes...'}
        style={{
          minHeight: 180,
          maxHeight: 300,
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

      <RichTextLinkModal
        visible={showLinkModal}
        defaultTitle={linkDefaultTitle}
        onClose={() => setShowLinkModal(false)}
        onSubmit={handleInsertLink}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    minHeight: 200,
  },
});
