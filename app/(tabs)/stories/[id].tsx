import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HtmlContent } from '@/src/components/HtmlContent';
import { LogTemplatePicker } from '@/src/components/LogTemplatePicker';
import { RichTextEditor } from '@/src/components/RichTextEditor';
import { StoryTagList } from '@/src/components/StoryTagList';
import { StoryTagPicker } from '@/src/components/StoryTagPicker';
import { ErrorState, LoadingState } from '@/src/components/StateViews';
import { FormField } from '@/src/components/ui/FormField';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { HeaderBackButton } from '@/src/components/ui/HeaderBackButton';
import { IconButton } from '@/src/components/ui/IconButton';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { colors, radii, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import {
  useCreateStory,
  useDeleteStory,
  useStory,
  useUpdateStory,
  fetchStoryCardLinkCount,
} from '@/src/hooks/useStories';
import { confirmDestructive } from '@/src/utils/confirm';
import { navigateBack } from '@/src/utils/navigation';

export default function StoryDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const isNew = id === 'new';
  const navigation = useNavigation();

  const { data: story, isLoading, error } = useStory(id);
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();

  const [name, setName] = useState('');
  const [storyTagIds, setStoryTagIds] = useState<string[]>([]);
  const [notesHtml, setNotesHtml] = useState('');
  const [formVisible, setFormVisible] = useState(isNew);

  const isSaving = createStory.isPending || updateStory.isPending;

  const resetFormFromStory = useCallback(() => {
    if (story) {
      setName(story.name);
      setStoryTagIds(story.story_tags?.map((tag) => tag.id) ?? []);
      setNotesHtml(story.notes_html);
      return;
    }

    setName('');
    setStoryTagIds([]);
    setNotesHtml('');
  }, [story]);

  useEffect(() => {
    if (story) {
      resetFormFromStory();
    }
  }, [story, resetFormFromStory]);

  const openEditForm = useCallback(() => {
    resetFormFromStory();
    setFormVisible(true);
  }, [resetFormFromStory]);

  const closeForm = useCallback(() => {
    if (isNew) {
      navigateBack(navigation, '/(tabs)/stories');
      return;
    }

    resetFormFromStory();
    setFormVisible(false);
  }, [isNew, navigation, resetFormFromStory]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    if (name.length > 100) {
      Alert.alert('Validation', 'Name must be 100 characters or less.');
      return;
    }

    try {
      if (isNew) {
        const created = await createStory.mutateAsync({
          name: name.trim(),
          story_tag_ids: storyTagIds,
          notes_html: notesHtml,
        });
        setFormVisible(false);
        router.replace(`/(tabs)/stories/${created.id}`);
      } else {
        await updateStory.mutateAsync({
          id,
          name: name.trim(),
          story_tag_ids: storyTagIds,
          notes_html: notesHtml,
        });
        setFormVisible(false);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    }
  }, [createStory, id, isNew, name, notesHtml, storyTagIds, updateStory]);

  const handleDelete = useCallback(() => {
    void (async () => {
      let cardCount = 0;
      try {
        cardCount = await fetchStoryCardLinkCount(id);
      } catch {
        Alert.alert('Error', 'Could not check card links for this story.');
        return;
      }

      const linkMessage =
        cardCount > 0
          ? `This story is linked to ${cardCount} card${cardCount === 1 ? '' : 's'}. Deleting will unlink it from those cards.\n\n`
          : '';

      confirmDestructive(
        'Delete story',
        `${linkMessage}This cannot be undone.`,
        async () => {
          try {
            await deleteStory.mutateAsync(id);
            navigateBack(navigation, '/(tabs)/stories');
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete');
          }
        }
      );
    })();
  }, [deleteStory, id, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isNew ? 'New story' : 'Story',
      headerLeft: () => <HeaderBackButton fallbackHref="/(tabs)/stories" />,
      headerRight: () =>
        isNew ? null : (
          <View style={styles.headerActions}>
            <Pressable onPress={openEditForm} hitSlop={8}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </Pressable>
            <Pressable onPress={handleDelete} hitSlop={8} style={styles.headerBtn}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </Pressable>
          </View>
        ),
    });
  }, [navigation, isNew, openEditForm, handleDelete]);

  if (!isNew && isLoading) return <LoadingState />;
  if (!isNew && error) return <ErrorState message={error.message} />;

  return (
    <View style={styles.container}>
      {!isNew ? (
        <ScrollView contentContainerStyle={formStyles.screenContent}>
          <Text style={styles.title}>{story?.name ?? name}</Text>
          {story?.story_tags?.length ? (
            <View style={styles.tagRow}>
              <StoryTagList tags={story.story_tags} />
            </View>
          ) : null}
          <HtmlContent html={story?.notes_html ?? ''} />
        </ScrollView>
      ) : null}

      <Modal
        visible={formVisible}
        animationType="slide"
        transparent
        onRequestClose={closeForm}>
        <Pressable style={styles.backdrop} onPress={closeForm}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation?.()}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{isNew ? 'New story' : 'Edit story'}</Text>
              <Pressable onPress={closeForm} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled">
              <FormField icon="bookmark-outline" title="Name" required hint={`${name.length}/100`}>
                <TextInput
                  style={formStyles.input}
                  value={name}
                  onChangeText={setName}
                  maxLength={100}
                  placeholder="e.g. Fear of judgment"
                  placeholderTextColor={colors.textMuted}
                />
              </FormField>

              <FormField icon="pricetag-outline" title="Tags (optional)">
                <StoryTagPicker value={storyTagIds} onChange={setStoryTagIds} />
              </FormField>

              <FormField icon="document-text-outline" title="Notes">
                <LogTemplatePicker onSelect={setNotesHtml} />
                <RichTextEditor
                  value={notesHtml}
                  onChange={setNotesHtml}
                  placeholder="Write story notes..."
                  showFooterInline={false}
                  footer={
                    <FormActionBar style={styles.sheetActions}>
                      <IconButton icon="close" label="Cancel" onPress={closeForm} variant="surface" />
                      <SaveButton onPress={handleSave} loading={isSaving} label={isNew ? 'Create' : 'Save'} />
                    </FormActionBar>
                  }
                />
              </FormField>
            </ScrollView>

            <FormActionBar style={styles.sheetActions}>
              <IconButton icon="close" label="Cancel" onPress={closeForm} variant="surface" />
              <SaveButton onPress={handleSave} loading={isSaving} label={isNew ? 'Create' : 'Save'} />
            </FormActionBar>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 12,
  },
  headerBtn: {
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  tagRow: {
    marginBottom: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    marginTop: 8,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetContent: {
    padding: spacing.screenPadding,
    gap: spacing.fieldGap,
    paddingBottom: spacing.lg,
  },
  sheetActions: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.screenPadding,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
