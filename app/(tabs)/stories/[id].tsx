import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HtmlContent } from '@/src/components/HtmlContent';
import { RichTextEditor } from '@/src/components/RichTextEditor';
import { StoryTagList } from '@/src/components/StoryTagList';
import { StoryTagPicker } from '@/src/components/StoryTagPicker';
import { ErrorState, LoadingState } from '@/src/components/StateViews';
import { FormField } from '@/src/components/ui/FormField';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { HeaderBackButton } from '@/src/components/ui/HeaderBackButton';
import { IconButton } from '@/src/components/ui/IconButton';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { colors } from '@/src/constants/theme';
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
  const [editing, setEditing] = useState(isNew);

  const isSaving = createStory.isPending || updateStory.isPending;

  useEffect(() => {
    if (story) {
      setName(story.name);
      setStoryTagIds(story.story_tags?.map((tag) => tag.id) ?? []);
      setNotesHtml(story.notes_html);
    }
  }, [story]);

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
        router.replace(`/(tabs)/stories/${created.id}`);
      } else {
        await updateStory.mutateAsync({
          id,
          name: name.trim(),
          story_tag_ids: storyTagIds,
          notes_html: notesHtml,
        });
        setEditing(false);
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
            navigateBack('/(tabs)/stories');
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete');
          }
        }
      );
    })();
  }, [deleteStory, id]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <HeaderBackButton fallbackHref="/(tabs)/stories" />,
      headerRight: () => (
        <View style={styles.headerActions}>
          {editing ? null : (
            <>
              <Pressable onPress={() => setEditing(true)} hitSlop={8}>
                <Ionicons name="create-outline" size={22} color={colors.primary} />
              </Pressable>
              {!isNew ? (
                <Pressable onPress={handleDelete} hitSlop={8} style={styles.headerBtn}>
                  <Ionicons name="trash-outline" size={22} color={colors.danger} />
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      ),
    });
  }, [navigation, editing, isNew, isSaving, handleDelete, handleSave]);

  if (!isNew && isLoading) return <LoadingState />;
  if (!isNew && error) return <ErrorState message={error.message} />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={formStyles.screenContent}>
        {editing ? (
          <>
            <FormField icon="bookmark-outline" title="Name" hint={`${name.length}/100`}>
              <TextInput
                style={formStyles.input}
                value={name}
                onChangeText={setName}
                maxLength={100}
                placeholder="Story name"
                placeholderTextColor={colors.textMuted}
              />
            </FormField>

            <FormField icon="pricetag-outline" title="Tags (optional)">
              <StoryTagPicker value={storyTagIds} onChange={setStoryTagIds} />
            </FormField>

            <FormField icon="document-text-outline" title="Notes">
              <RichTextEditor value={notesHtml} onChange={setNotesHtml} />
            </FormField>

            <FormActionBar>
              {!isNew ? (
                <IconButton
                  icon="close"
                  label="Cancel"
                  variant="surface"
                  onPress={() => setEditing(false)}
                />
              ) : null}
              <SaveButton onPress={handleSave} loading={isSaving} />
            </FormActionBar>
          </>
        ) : (
          <>
            <Text style={styles.title}>{name}</Text>
            {story?.story_tags?.length ? (
              <View style={styles.tagRow}>
                <StoryTagList tags={story.story_tags} />
              </View>
            ) : null}
            <HtmlContent html={notesHtml} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
});
