import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, typography } from '@/src/constants/theme';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type ToolbarAction = 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList' | 'h1' | 'h2';

const TOOLBAR_ITEMS: { action: ToolbarAction; label: string }[] = [
  { action: 'bold', label: 'B' },
  { action: 'italic', label: 'I' },
  { action: 'underline', label: 'U' },
  { action: 'insertUnorderedList', label: '•' },
  { action: 'insertOrderedList', label: '1.' },
  { action: 'h1', label: 'H1' },
  { action: 'h2', label: 'H2' },
];

function runCommand(action: ToolbarAction) {
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

  const handleToolbarPress = (action: ToolbarAction) => {
    editorRef.current?.focus();
    runCommand(action);
    syncValue();
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        {TOOLBAR_ITEMS.map((item) => (
          <Pressable
            key={item.action}
            style={styles.toolbarBtn}
            onPress={() => handleToolbarPress(item.action)}>
            <Text style={styles.toolbarBtnText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
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
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    backgroundColor: colors.toolbar,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  toolbarBtn: {
    minWidth: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
  },
  toolbarBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
