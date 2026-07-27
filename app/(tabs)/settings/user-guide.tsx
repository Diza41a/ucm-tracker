import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { HtmlContent } from '@/src/components/HtmlContent';
import { RichTextEditor } from '@/src/components/RichTextEditor';
import { ErrorState, LoadingState } from '@/src/components/StateViews';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { FormField } from '@/src/components/ui/FormField';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { colors, radii, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import { useUpsertUserGuide, useUserGuide } from '@/src/hooks/useUserGuide';
import { showAlert } from '@/src/utils/confirm';

export default function UserGuideScreen() {
  const navigation = useNavigation();
  const { data: guide, isLoading, error, refetch } = useUserGuide();
  const upsertGuide = useUpsertUserGuide();

  const [contentHtml, setContentHtml] = useState('');
  const [editVisible, setEditVisible] = useState(false);

  useEffect(() => {
    if (guide) {
      setContentHtml(guide.content_html);
    }
  }, [guide]);

  const openEdit = useCallback(() => {
    setContentHtml(guide?.content_html ?? '');
    setEditVisible(true);
  }, [guide?.content_html]);

  const closeEdit = useCallback(() => {
    setContentHtml(guide?.content_html ?? '');
    setEditVisible(false);
  }, [guide?.content_html]);

  const handleSave = async () => {
    try {
      await upsertGuide.mutateAsync({ content_html: contentHtml });
      setEditVisible(false);
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Failed to save user guide');
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={openEdit} hitSlop={8} style={{ marginRight: 8 }}>
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, openEdit]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={formStyles.screenContent}>
        <Text style={styles.intro}>
          Tips and reminders for getting the most out of the app.
        </Text>
        <View style={styles.readCard}>
          {guide?.content_html?.trim() ? (
            <HtmlContent html={guide.content_html} />
          ) : (
            <Text style={styles.emptyText}>No guide content yet. Tap edit to add some.</Text>
          )}
        </View>
      </ScrollView>

      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={closeEdit}>
        <Pressable style={styles.backdrop} onPress={closeEdit}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation?.()}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit user guide</Text>
              <Pressable onPress={closeEdit} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheetBody}>
              <ScrollView
                contentContainerStyle={styles.sheetContent}
                keyboardShouldPersistTaps="handled">
                <FormField icon="book-outline" title="Guide content">
                  <RichTextEditor
                    value={contentHtml}
                    onChange={setContentHtml}
                    placeholder="Write your user guide..."
                    footer={
                      <FormActionBar>
                        <SaveButton onPress={handleSave} loading={upsertGuide.isPending} />
                      </FormActionBar>
                    }
                  />
                </FormField>
              </ScrollView>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  intro: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  readCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sheetBody: {
    flexGrow: 0,
  },
  sheetContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.screenPadding,
    gap: spacing.fieldGap,
  },
});
