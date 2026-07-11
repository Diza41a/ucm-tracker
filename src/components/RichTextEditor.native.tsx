import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

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

  return (
    <View style={styles.container}>
      <RichToolbar
        editor={editorRef}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.heading1,
          actions.heading2,
        ]}
        style={styles.toolbar}
        iconTint={colors.textSecondary}
        selectedIconTint={colors.primary}
        disabledIconTint={colors.textMuted}
      />
      <ScrollView style={styles.editorScroll} nestedScrollEnabled>
        <RichEditor
          ref={editorRef}
          initialContentHTML={value}
          onChange={onChange}
          placeholder={placeholder ?? 'Write notes...'}
          style={styles.editor}
          editorStyle={{
            backgroundColor: colors.surfaceElevated,
            color: colors.text,
            placeholderColor: colors.textMuted,
            initialCSSText: editorFontImportCss,
            contentCSSText: editorContentCssText,
          }}
        />
      </ScrollView>
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
    backgroundColor: colors.toolbar,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editorScroll: {
    maxHeight: 300,
  },
  editor: {
    minHeight: 180,
  },
});
