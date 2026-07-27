import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RichTextEditor } from '@/src/components/RichTextEditor';
import { RichTextReadView } from '@/src/components/RichTextReadView';
import { FormField } from '@/src/components/ui/FormField';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { IconButton } from '@/src/components/ui/IconButton';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { defaultViewEditMode, ViewEditSwitch, type ViewEditMode } from '@/src/components/ui/ViewEditSwitch';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useLogTemplates } from '@/src/hooks/useLogTemplates';
import { useMonthlyNotes, useUpsertMonthlyNotes } from '@/src/hooks/useMonthlyNotes';

interface MonthlyNotesProps {
  year: number;
  month: number;
}

export function MonthlyNotes({ year, month }: MonthlyNotesProps) {
  const { data: notes, isFetched } = useMonthlyNotes(year, month);
  const { data: templates } = useLogTemplates();
  const upsertNotes = useUpsertMonthlyNotes();

  const [contentHtml, setContentHtml] = useState('');
  const [savedContentHtml, setSavedContentHtml] = useState('');
  const [editorMode, setEditorMode] = useState<ViewEditMode>('view');
  const loadedMonthKey = useRef<string | null>(null);

  const isDirty = contentHtml !== savedContentHtml;

  useEffect(() => {
    const monthKey = `${year}-${month}`;
    if (loadedMonthKey.current === monthKey) return;
    if (!isFetched) return;
    if (notes && notes.year !== year) return;

    const fromServer =
      notes?.year === year && notes?.month === month ? notes.content_html : '';

    setContentHtml(fromServer);
    setSavedContentHtml(fromServer);
    setEditorMode(defaultViewEditMode(fromServer));
    loadedMonthKey.current = monthKey;
  }, [isFetched, notes, year, month]);

  const handleSave = useCallback(async () => {
    if (!isDirty) return;

    try {
      await upsertNotes.mutateAsync({ year, month, content_html: contentHtml });
      setSavedContentHtml(contentHtml);
      setEditorMode('view');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save notes');
    }
  }, [contentHtml, isDirty, month, upsertNotes, year]);

  const handleReset = useCallback(() => {
    if (!isDirty) return;
    setContentHtml(savedContentHtml);
  }, [isDirty, savedContentHtml]);

  const applyTemplate = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (!template) return;
    setContentHtml(template.content_html);
  };

  return (
    <View style={styles.section}>
      <FormField
        icon="document-text-outline"
        title="Monthly notes"
        action={
          <ViewEditSwitch mode={editorMode} onModeChange={setEditorMode} />
        }>
        {templates && templates.length > 0 && editorMode === 'edit' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {templates.map((template) => (
              <Pressable
                key={template.id}
                style={styles.templateChip}
                onPress={() => applyTemplate(template.id)}>
                <Text style={styles.templateChipText}>{template.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        {editorMode === 'view' ? (
          <>
            <RichTextReadView html={contentHtml} />
            {isDirty ? (
              <FormActionBar style={styles.actionsBar}>
                <IconButton
                  icon="refresh"
                  label="Reset"
                  variant="surface"
                  onPress={handleReset}
                />
                <SaveButton
                  onPress={handleSave}
                  loading={upsertNotes.isPending}
                />
              </FormActionBar>
            ) : null}
          </>
        ) : (
          <RichTextEditor
            key={`${year}-${month}`}
            value={contentHtml}
            onChange={setContentHtml}
            placeholder="Monthly intentions, reminders, focus areas..."
            footer={
              isDirty ? (
                <FormActionBar style={styles.actionsBar}>
                  <IconButton
                    icon="refresh"
                    label="Reset"
                    variant="surface"
                    onPress={handleReset}
                  />
                  <SaveButton
                    onPress={handleSave}
                    loading={upsertNotes.isPending}
                  />
                </FormActionBar>
              ) : null
            }
          />
        )}
      </FormField>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: spacing.md,
    marginBottom: 16,
  },
  templateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: spacing.sm,
  },
  templateChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  actionsBar: {
    marginTop: spacing.sm,
  },
});
