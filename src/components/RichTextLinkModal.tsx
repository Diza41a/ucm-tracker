import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radii, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';

interface RichTextLinkModalProps {
  visible: boolean;
  defaultTitle?: string;
  onClose: () => void;
  onSubmit: (title: string, url: string) => void;
}

export function RichTextLinkModal({
  visible,
  defaultTitle = '',
  onClose,
  onSubmit,
}: RichTextLinkModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!visible) return;
    setTitle(defaultTitle);
    setUrl('');
  }, [defaultTitle, visible]);

  const handleSubmit = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    onSubmit(title.trim() || trimmedUrl, trimmedUrl);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Insert link</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <Text style={styles.label}>Label</Text>
          <TextInput
            style={formStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Link text"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="sentences"
          />

          <Text style={styles.label}>URL</Text>
          <TextInput
            style={formStyles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>Insert</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: spacing.screenPadding,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.screenPadding,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.text,
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
  },
  submitText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
