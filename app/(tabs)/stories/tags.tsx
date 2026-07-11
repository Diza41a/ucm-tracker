import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { StoryTagBadge } from '@/src/components/StoryTagBadge';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/StateViews';
import { ColorPickerField } from '@/src/components/ui/ColorPickerField';
import { FormField } from '@/src/components/ui/FormField';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { IconButton } from '@/src/components/ui/IconButton';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { colors, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import { useStories } from '@/src/hooks/useStories';
import {
  useCreateStoryTag,
  useDeleteStoryTag,
  useStoryTags,
  useUpdateStoryTag,
} from '@/src/hooks/useStoryTags';
import { isValidHexColor } from '@/src/utils/color';

const DEFAULT_BG_COLOR = colors.primary;
const DEFAULT_TEXT_COLOR = '#FFFFFF';

export default function StoryTagsScreen() {
  const { data: tags, isLoading, error, refetch } = useStoryTags();
  const { data: stories } = useStories();
  const createTag = useCreateStoryTag();
  const updateTag = useUpdateStoryTag();
  const deleteTag = useDeleteStoryTag();

  const [name, setName] = useState('');
  const [bgColor, setBgColor] = useState(DEFAULT_BG_COLOR);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);

  const storyCountByTag = useMemo(() => {
    const counts: Record<string, number> = {};
    stories?.forEach((story) => {
      story.story_tags?.forEach((tag) => {
        counts[tag.id] = (counts[tag.id] ?? 0) + 1;
      });
    });
    return counts;
  }, [stories]);

  const resetForm = () => {
    setName('');
    setBgColor(DEFAULT_BG_COLOR);
    setTextColor(DEFAULT_TEXT_COLOR);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    if (!isValidHexColor(bgColor) || !isValidHexColor(textColor)) {
      Alert.alert('Validation', 'Background and text colors must be valid hex values.');
      return;
    }

    const payload = {
      name: name.trim(),
      bg_color: bgColor,
      text_color: textColor,
    };

    try {
      if (editingId) {
        await updateTag.mutateAsync({ id: editingId, ...payload });
      } else {
        await createTag.mutateAsync(payload);
      }
      resetForm();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const startEdit = (tag: NonNullable<typeof tags>[number]) => {
    setEditingId(tag.id);
    setName(tag.name);
    setBgColor(tag.bg_color);
    setTextColor(tag.text_color);
  };

  const handleDelete = (id: string) => {
    const storyCount = storyCountByTag[id] ?? 0;
    if (storyCount > 0) {
      Alert.alert(
        'Cannot delete',
        `This tag is used by ${storyCount} stor${storyCount === 1 ? 'y' : 'ies'}. Remove it from those stories first.`
      );
      return;
    }

    Alert.alert('Delete story tag', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTag.mutateAsync(id);
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.formTitle}>{editingId ? 'Edit tag' : 'New story tag'}</Text>

        <View style={styles.formFields}>
          <FormField icon="text-outline" title="Name">
            <TextInput
              style={formStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tag name"
              placeholderTextColor={colors.textSecondary}
            />
          </FormField>

          <FormField icon="color-fill-outline" title="Background color">
            <ColorPickerField label="Background" value={bgColor} onChange={setBgColor} />
          </FormField>

          <FormField icon="text-outline" title="Text color">
            <ColorPickerField label="Text" value={textColor} onChange={setTextColor} />
          </FormField>

          <FormField icon="eye-outline" title="Preview">
            <StoryTagBadge
              tag={{
                name: name.trim() || 'Preview',
                bg_color: bgColor,
                text_color: textColor,
              }}
            />
          </FormField>
        </View>

        <FormActionBar>
          {editingId ? (
            <IconButton icon="close" label="Cancel" onPress={resetForm} variant="surface" />
          ) : null}
          <SaveButton
            label={editingId ? 'Update' : 'Add'}
            onPress={handleSave}
          />
        </FormActionBar>
      </View>

      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="No story tags yet. Add one above." />}
        renderItem={({ item }) => {
          const storyCount = storyCountByTag[item.id] ?? 0;
          return (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <StoryTagBadge tag={item} />
                {storyCount > 0 ? (
                  <Text style={styles.storyCount}>
                    {storyCount} stor{storyCount === 1 ? 'y' : 'ies'}
                  </Text>
                ) : null}
              </View>
              <View style={styles.rowActions}>
                <Pressable onPress={() => startEdit(item)} hitSlop={8}>
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </Pressable>
                {storyCount === 0 ? (
                  <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    padding: spacing.screenPadding,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.fieldGap,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  formFields: {
    gap: spacing.fieldGap,
  },
  list: {
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowInfo: {
    flex: 1,
    marginRight: spacing.md,
    gap: spacing.xs,
  },
  storyCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
});
