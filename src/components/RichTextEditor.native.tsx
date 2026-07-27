import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { RichEditor } from 'react-native-pell-rich-editor';

import { RichTextEditorToolbar } from '@/src/components/RichTextEditorToolbar';
import { RichTextLinkModal } from '@/src/components/RichTextLinkModal';
import { richTextEditorStyles, type RichTextToolbarAction } from '@/src/constants/richTextEditor';
import {
  colors,
  radii,
  editorContentCssText,
  editorFontImportCss,
} from '@/src/constants/theme';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<RichEditor>(null);
  const skipNextSync = useRef(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    editorRef.current?.setContentHTML(value);
  }, [value]);

  const handleChange = (html: string) => {
    skipNextSync.current = true;
    onChange(html);
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
    editorRef.current?.insertLink(title, url);
  };

  return (
    <View style={styles.container}>
      <RichTextEditorToolbar
        onAction={handleAction}
        onTextColor={applyTextColor}
        onHighlightColor={applyHighlightColor}
      />

      <ScrollView style={styles.editorScroll} nestedScrollEnabled>
        <RichEditor
          ref={editorRef}
          initialContentHTML={value}
          onChange={handleChange}
          placeholder={placeholder ?? 'Write notes...'}
          style={styles.editor}
          editorStyle={{
            backgroundColor: colors.surfaceElevated,
            color: colors.text,
            placeholderColor: colors.textMuted,
            initialCSSText: editorFontImportCss,
            contentCSSText: `${editorContentCssText} ${richTextEditorStyles}`,
          }}
        />
      </ScrollView>

      <RichTextLinkModal
        visible={showLinkModal}
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
  editorScroll: {
    maxHeight: 300,
  },
  editor: {
    minHeight: 180,
  },
});
