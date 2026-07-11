import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { HtmlContent } from '@/src/components/HtmlContent';
import { StoryTagList } from '@/src/components/StoryTagList';
import { colors, radii } from '@/src/constants/theme';
import type { Story } from '@/src/types';
import { storyDisplayName } from '@/src/utils/display';

interface StoryPreviewModalProps {
  story: Story | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (story: Story) => void;
}

export function StoryPreviewModal({
  story,
  visible,
  onClose,
  onEdit,
}: StoryPreviewModalProps) {
  if (!story) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{storyDisplayName(story)}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {story.story_tags?.length ? (
            <View style={styles.tagRow}>
              <StoryTagList tags={story.story_tags} />
            </View>
          ) : null}
          <HtmlContent html={story.notes_html} />
        </ScrollView>
        {onEdit ? (
          <View style={styles.footer}>
            <Pressable style={styles.editBtn} onPress={() => onEdit(story)}>
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.editBtnText}>Edit story</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  tagRow: {
    marginBottom: 12,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 32,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: 14,
  },
  editBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
});
