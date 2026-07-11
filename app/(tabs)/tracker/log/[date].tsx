import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CardBadge } from '@/src/components/CardBadge';
import { CardPreviewModal } from '@/src/components/CardPreviewModal';
import { RichTextEditor } from '@/src/components/RichTextEditor';
import { StoryPickerModal } from '@/src/components/StoryPickerModal';
import { StoryPreviewModal } from '@/src/components/StoryPreviewModal';
import { InlineEmptyState, LoadingState } from '@/src/components/StateViews';
import { FormField } from '@/src/components/ui/FormField';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { IconButton } from '@/src/components/ui/IconButton';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { RemovablePill } from '@/src/components/ui/RemovablePill';
import { colors, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import { useCards } from '@/src/hooks/useCards';
import { useLogTemplates } from '@/src/hooks/useLogTemplates';
import {
  useOutingLogByDate,
  useUpsertOutingLog,
} from '@/src/hooks/useOutingLogs';
import { useStories } from '@/src/hooks/useStories';
import type { Card, Story } from '@/src/types';
import { parseDateString, storyDisplayName } from '@/src/utils/display';

export default function DayLogScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const navigation = useNavigation();
  const { data: existingLog, isLoading: logLoading } = useOutingLogByDate(date);
  const { data: templates, isLoading: templatesLoading } = useLogTemplates();
  const { data: allStories } = useStories();
  const { data: allCards } = useCards();
  const upsertLog = useUpsertOutingLog();

  const [contentHtml, setContentHtml] = useState('');
  const [savedContentHtml, setSavedContentHtml] = useState<string | null>(null);
  const [baselineContentHtml, setBaselineContentHtml] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [starred, setStarred] = useState(false);
  const [storyIds, setStoryIds] = useState<string[]>([]);
  const [cardIds, setCardIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [showStoryPicker, setShowStoryPicker] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [previewStory, setPreviewStory] = useState<Story | null>(null);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);

  const defaultTemplate = templates?.find((t) => t.is_default) ?? templates?.[0];

  const revertContentHtml = savedContentHtml ?? baselineContentHtml;
  const isLogDirty = contentHtml !== revertContentHtml;

  const taggedStories = useMemo(
    () => allStories?.filter((story) => storyIds.includes(story.id)) ?? [],
    [allStories, storyIds]
  );

  const taggedCards = useMemo(
    () => allCards?.filter((card) => cardIds.includes(card.id)) ?? [],
    [allCards, cardIds]
  );

  useEffect(() => {
    if (initialized) return;

    if (existingLog) {
      setContentHtml(existingLog.content_html);
      setSavedContentHtml(existingLog.content_html);
      setBaselineContentHtml(existingLog.content_html);
      setTemplateId(existingLog.template_id);
      setCompleted(existingLog.completed);
      setStarred(existingLog.starred);
      setStoryIds(existingLog.stories?.map((s) => s.id) ?? []);
      setCardIds(existingLog.cards?.map((c) => c.id) ?? []);
      setInitialized(true);
      return;
    }

    if (!logLoading && defaultTemplate) {
      setContentHtml(defaultTemplate.content_html);
      setBaselineContentHtml(defaultTemplate.content_html);
      setTemplateId(defaultTemplate.id);
      setInitialized(true);
    }
  }, [existingLog, defaultTemplate, logLoading, initialized]);

  const formattedDate = parseDateString(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const saveLog = useCallback(
    async (overrides?: {
      completed?: boolean;
      starred?: boolean;
      content_html?: string;
      story_ids?: string[];
      card_ids?: string[];
      template_id?: string | null;
    }) => {
      const nextContent = overrides?.content_html ?? contentHtml;

      try {
        await upsertLog.mutateAsync({
          log_date: date,
          template_id: overrides?.template_id ?? templateId ?? defaultTemplate?.id ?? null,
          completed: overrides?.completed ?? completed,
          starred: overrides?.starred ?? starred,
          content_html: nextContent,
          story_ids: overrides?.story_ids ?? storyIds,
          card_ids: overrides?.card_ids ?? cardIds,
        });

        if (overrides?.content_html !== undefined || overrides === undefined) {
          setSavedContentHtml(nextContent);
        }
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
      }
    },
    [
      templateId,
      cardIds,
      completed,
      contentHtml,
      date,
      defaultTemplate?.id,
      starred,
      storyIds,
      upsertLog,
    ]
  );

  const handleSaveLog = useCallback(async () => {
    await saveLog();
  }, [saveLog]);

  const handleResetLog = useCallback(() => {
    if (!isLogDirty) return;
    setContentHtml(revertContentHtml);
  }, [isLogDirty, revertContentHtml]);

  const toggleCompleted = async () => {
    const next = !completed;
    setCompleted(next);
    await saveLog({ completed: next });
  };

  const toggleStarred = async () => {
    const next = !starred;
    setStarred(next);
    await saveLog({ starred: next });
  };

  const updateStoryIds = async (next: string[]) => {
    setStoryIds(next);
    await saveLog({ story_ids: next });
  };

  const updateCardIds = async (next: string[]) => {
    setCardIds(next);
    await saveLog({ card_ids: next });
  };

  const removeStory = (storyId: string) => {
    updateStoryIds(storyIds.filter((id) => id !== storyId));
  };

  const toggleStory = (storyId: string) => {
    const next = storyIds.includes(storyId)
      ? storyIds.filter((id) => id !== storyId)
      : [...storyIds, storyId];
    updateStoryIds(next);
  };

  const removeCard = (cardId: string) => {
    updateCardIds(cardIds.filter((id) => id !== cardId));
  };

  const toggleCard = (cardId: string) => {
    const next = cardIds.includes(cardId)
      ? cardIds.filter((id) => id !== cardId)
      : [...cardIds, cardId];
    updateCardIds(next);
  };

  const applyTemplate = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (!template) return;

    setContentHtml(template.content_html);
    setTemplateId(template.id);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: formattedDate,
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable onPress={toggleCompleted} hitSlop={8} style={styles.headerBtn}>
            <Ionicons
              name={completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={28}
              color={completed ? colors.completed : colors.textSecondary}
            />
          </Pressable>
          <Pressable onPress={toggleStarred} hitSlop={8} style={styles.headerBtn}>
            <Ionicons
              name={starred ? 'star' : 'star-outline'}
              size={26}
              color={starred ? colors.star : colors.textSecondary}
            />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, formattedDate, completed, starred]);

  if (logLoading || templatesLoading || !initialized) return <LoadingState />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={formStyles.screenContent}>
        <FormField
          icon="albums-outline"
          title="Cards worked on"
          action={
            <Pressable style={styles.addBtn} onPress={() => setShowCardPicker(true)}>
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </Pressable>
          }>
          {taggedCards.length > 0 ? (
            <View style={formStyles.chipRow}>
              {taggedCards.map((card) => {
                const type = card.card_type;
                return (
                  <RemovablePill
                    key={card.id}
                    label={card.action}
                    backgroundColor={type?.bg_color ?? colors.chip}
                    textColor={type?.text_color ?? colors.text}
                    borderColor={type?.bg_color ?? colors.chipBorder}
                    onPress={() => setPreviewCard(card)}
                    onRemove={() => removeCard(card.id)}
                  />
                );
              })}
            </View>
          ) : (
            <InlineEmptyState
              icon="albums-outline"
              message="No cards tagged on this log yet."
              actionLabel={allCards?.length ? 'Add cards' : 'Create a card'}
              onAction={() =>
                allCards?.length
                  ? setShowCardPicker(true)
                  : router.push('/(tabs)/cards/new')
              }
              compact
            />
          )}
        </FormField>

        <FormField
          icon="pricetags-outline"
          title="Story tags"
          action={
            <Pressable style={styles.addBtn} onPress={() => setShowStoryPicker(true)}>
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </Pressable>
          }>
          {taggedStories.length > 0 ? (
            <View style={formStyles.chipRow}>
              {taggedStories.map((story) => {
                const tag = story.story_tags?.[0];
                return (
                  <RemovablePill
                    key={story.id}
                    label={storyDisplayName(story)}
                    backgroundColor={tag?.bg_color ?? colors.chip}
                    textColor={tag?.text_color ?? colors.primaryLight}
                    borderColor={tag?.bg_color ?? colors.chipBorder}
                    onPress={() => setPreviewStory(story)}
                    onRemove={() => removeStory(story.id)}
                  />
                );
              })}
            </View>
          ) : (
            <InlineEmptyState
              icon="pricetags-outline"
              message="No stories tagged yet."
              actionLabel={allStories?.length ? 'Tag stories' : 'Create a story'}
              onAction={() =>
                allStories?.length
                  ? setShowStoryPicker(true)
                  : router.push('/(tabs)/stories/new')
              }
              compact
            />
          )}
        </FormField>

        <FormField icon="create-outline" title="Log">
          {templates && templates.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {templates.map((t) => (
                <Pressable
                  key={t.id}
                  style={styles.templateChip}
                  onPress={() => applyTemplate(t.id)}>
                  <Text style={styles.templateChipText}>{t.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <RichTextEditor
            value={contentHtml}
            onChange={setContentHtml}
            placeholder="Write your outing log..."
          />
          <FormActionBar style={styles.logActionsBar}>
            <IconButton
              icon="refresh"
              label="Reset"
              variant="surface"
              onPress={handleResetLog}
              disabled={!isLogDirty}
            />
            <SaveButton
              onPress={handleSaveLog}
              loading={upsertLog.isPending}
              disabled={!isLogDirty}
            />
          </FormActionBar>
        </FormField>
      </ScrollView>

      <StoryPickerModal
        visible={showStoryPicker}
        stories={allStories}
        selectedIds={storyIds}
        onClose={() => setShowStoryPicker(false)}
        onToggle={toggleStory}
        onCreateStory={() => {
          setShowStoryPicker(false);
          router.push('/(tabs)/stories/new');
        }}
      />

      <Modal visible={showCardPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Cards worked on</Text>
            <Pressable onPress={() => setShowCardPicker(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.pickerList}>
            {!allCards?.length ? (
              <InlineEmptyState
                icon="albums-outline"
                message="No cards yet. Create one to tag it on this log."
                actionLabel="Create card"
                onAction={() => {
                  setShowCardPicker(false);
                  router.push('/(tabs)/cards/new');
                }}
              />
            ) : (
              allCards.map((card) => {
                const selected = cardIds.includes(card.id);
                return (
                  <Pressable
                    key={card.id}
                    style={[styles.pickerRow, selected && styles.pickerRowSelected]}
                    onPress={() => toggleCard(card.id)}>
                    <View style={styles.pickerCardInfo}>
                      {card.card_type ? <CardBadge cardType={card.card_type} /> : null}
                      <Text style={styles.pickerRowText} numberOfLines={2}>
                        {card.action}
                      </Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={22} color={colors.textSecondary} />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      <StoryPreviewModal
        story={previewStory}
        visible={!!previewStory}
        onClose={() => setPreviewStory(null)}
        onEdit={(story) => {
          setPreviewStory(null);
          router.push(`/(tabs)/stories/${story.id}`);
        }}
      />

      <CardPreviewModal
        card={previewCard}
        visible={!!previewCard}
        onClose={() => setPreviewCard(null)}
      />
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
    padding: 2,
  },
  addBtn: {
    padding: 2,
  },
  logActionsBar: {
    marginTop: spacing.fieldGap,
  },
  templateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  templateChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  pickerList: {
    padding: spacing.screenPadding,
    gap: spacing.sm,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  pickerRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  pickerCardInfo: {
    flex: 1,
    gap: 4,
  },
  pickerRowText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
});
