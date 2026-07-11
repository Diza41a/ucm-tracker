import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CardBadge } from '@/src/components/CardBadge';
import { StoryChip } from '@/src/components/StoryChip';
import { colors, radii, spacing } from '@/src/constants/theme';
import type { Card } from '@/src/types';

interface CardPreviewModalProps {
  card: Card | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (card: Card) => void;
}

export function CardPreviewModal({
  card,
  visible,
  onClose,
  onEdit,
}: CardPreviewModalProps) {
  if (!card) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {card.action}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.metaRow}>
            {card.card_type ? <CardBadge cardType={card.card_type} /> : null}
            <Text style={styles.difficulty}>{card.difficulty}/10</Text>
          </View>

          {card.function_purpose ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Function / purpose</Text>
              <Text style={styles.sectionText}>{card.function_purpose}</Text>
            </View>
          ) : null}

          {card.practice_location_ideas ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Practice location ideas</Text>
              <Text style={styles.sectionText}>{card.practice_location_ideas}</Text>
            </View>
          ) : null}

          {card.stories && card.stories.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Relevant stories</Text>
              <View style={styles.chips}>
                {card.stories.map((story) => (
                  <StoryChip key={story.id} story={story} />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
        {onEdit ? (
          <View style={styles.footer}>
            <Pressable
              style={styles.editBtn}
              onPress={() => {
                onClose();
                onEdit(card);
              }}>
              <Ionicons name="create-outline" size={20} color={colors.onPrimary} />
              <Text style={styles.editBtnText}>Edit card</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.footer}>
            <Pressable
              style={styles.editBtn}
              onPress={() => {
                onClose();
                router.push(`/(tabs)/cards/${card.id}`);
              }}>
              <Ionicons name="open-outline" size={20} color={colors.onPrimary} />
              <Text style={styles.editBtnText}>Open card</Text>
            </Pressable>
          </View>
        )}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.screenPadding,
    paddingBottom: 32,
    gap: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficulty: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    padding: spacing.screenPadding,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
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
