import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RichTextEditor } from '@/src/components/RichTextEditor';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { FormField } from '@/src/components/ui/FormField';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { IconButton } from '@/src/components/ui/IconButton';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { DEFAULT_LOG_TEMPLATE_HTML } from '@/src/constants/defaultLogTemplate';
import { colors, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import {
  useCreateLogTemplate,
  useDeleteLogTemplate,
  useEnsureDefaultTemplate,
  useLogTemplates,
  useSetDefaultLogTemplate,
  useUpdateLogTemplate,
} from '@/src/hooks/useLogTemplates';
import type { LogTemplate } from '@/src/types';

export default function LogTemplatesScreen() {
  const navigation = useNavigation();
  const { data: templates, isLoading, error, refetch } = useLogTemplates();
  const ensureDefault = useEnsureDefaultTemplate();
  const createTemplate = useCreateLogTemplate();
  const updateTemplate = useUpdateLogTemplate();
  const deleteTemplate = useDeleteLogTemplate();
  const setDefault = useSetDefaultLogTemplate();

  const [editing, setEditing] = useState<LogTemplate | null>(null);
  const [name, setName] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    ensureDefault.mutate();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setContentHtml('');
    setIsDefault(false);
  };

  const startNew = useCallback(() => {
    setEditing(null);
    setName('');
    setContentHtml(DEFAULT_LOG_TEMPLATE_HTML);
    setIsDefault(false);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={startNew} hitSlop={8} style={{ marginRight: 8 }}>
          <Ionicons name="add" size={28} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, startNew]);

  const startEdit = (template: LogTemplate) => {
    setEditing(template);
    setName(template.name);
    setContentHtml(template.content_html);
    setIsDefault(template.is_default);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Template name is required.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        content_html: contentHtml,
        is_default: isDefault,
      };

      if (editing) {
        await updateTemplate.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createTemplate.mutateAsync(payload);
      }

      resetForm();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete template', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTemplate.mutateAsync(id),
      },
    ]);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const isEditingForm = name.length > 0 || contentHtml.length > 0;
  const visibleTemplates = templates?.filter((item) => item.id !== editing?.id) ?? [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={visibleTemplates}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          isEditingForm ? (
            <View style={styles.editor}>
              <View style={styles.editorFields}>
                <FormField
                  icon="document-text-outline"
                  title={editing ? 'Edit template' : 'New template'}>
                  <TextInput
                    style={formStyles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Template name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </FormField>

                <Pressable style={styles.defaultToggle} onPress={() => setIsDefault(!isDefault)}>
                  <Ionicons
                    name={isDefault ? 'star' : 'star-outline'}
                    size={16}
                    color={isDefault ? colors.star : colors.textSecondary}
                  />
                  <Text style={styles.defaultToggleText}>
                    {isDefault ? 'Default template' : 'Set as default'}
                  </Text>
                </Pressable>

                <FormField icon="create-outline" title="Template content">
                  <RichTextEditor value={contentHtml} onChange={setContentHtml} />
                </FormField>
              </View>

              <FormActionBar>
                <IconButton icon="close" label="Cancel" onPress={resetForm} variant="surface" />
                <SaveButton onPress={handleSave} />
              </FormActionBar>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isEditingForm ? (
            <EmptyState message="No templates yet. Tap + to create one." />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.templateRow}>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>
                {item.name}
                {item.is_default ? ' (default)' : ''}
              </Text>
            </View>
            <View style={styles.templateActions}>
              {!item.is_default ? (
                <Pressable onPress={() => setDefault.mutate(item.id)} hitSlop={8}>
                  <Ionicons name="star-outline" size={18} color={colors.primary} />
                </Pressable>
              ) : (
                <Ionicons name="star" size={18} color={colors.star} />
              )}
              <Pressable onPress={() => startEdit(item)} hitSlop={8}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.screenPadding,
    paddingBottom: 32,
  },
  editor: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.screenPadding,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editorFields: {
    gap: spacing.fieldGap,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  defaultToggleText: {
    color: colors.primary,
    fontWeight: '600',
  },
  templateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
});
