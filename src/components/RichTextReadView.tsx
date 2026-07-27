import { StyleSheet, Text, View } from 'react-native';

import { HtmlContent } from '@/src/components/HtmlContent';
import { colors, radii, spacing } from '@/src/constants/theme';

interface RichTextReadViewProps {
  html: string;
  emptyMessage?: string;
}

export function RichTextReadView({
  html,
  emptyMessage = 'Nothing here yet. Switch to Edit to add content.',
}: RichTextReadViewProps) {
  return (
    <View style={styles.card}>
      {html.trim() ? (
        <HtmlContent html={html} />
      ) : (
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 120,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
