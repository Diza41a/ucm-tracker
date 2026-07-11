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

import { StorySelector } from '@/src/components/StorySelector';
import { ErrorState, InlineEmptyState, LoadingState } from '@/src/components/StateViews';
import { FormField } from '@/src/components/ui/FormField';
import { FormActionBar } from '@/src/components/ui/FormActionBar';
import { SaveButton } from '@/src/components/ui/SaveButton';
import { NumberInput } from '@/src/components/ui/NumberInput';
import { colors, spacing } from '@/src/constants/theme';
import { formStyles } from '@/src/constants/form';
import { useCardTypes } from '@/src/hooks/useCardTypes';
import {
  useCard,
  useCreateCard,
  useDeleteCard,
  useToggleCardCompletedOnce,
  useUpdateCard,
} from '@/src/hooks/useCards';
import { useStories } from '@/src/hooks/useStories';

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const navigation = useNavigation();

  const { data: card, isLoading, error } = useCard(id);
  const { data: cardTypes, isLoading: typesLoading } = useCardTypes();
  const { data: stories } = useStories();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const toggleCompletedOnce = useToggleCardCompletedOnce();

  const [cardTypeId, setCardTypeId] = useState('');
  const [difficulty, setDifficulty] = useState('5');
  const [action, setAction] = useState('');
  const [functionPurpose, setFunctionPurpose] = useState('');
  const [practiceLocation, setPracticeLocation] = useState('');
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [completedOnce, setCompletedOnce] = useState(false);

  const isSaving = createCard.isPending || updateCard.isPending;

  useEffect(() => {
    if (card) {
      setCardTypeId(card.card_type_id);
      setDifficulty(String(card.difficulty));
      setAction(card.action);
      setFunctionPurpose(card.function_purpose);
      setPracticeLocation(card.practice_location_ideas ?? '');
      setSelectedStoryIds(card.stories?.map((s) => s.id) ?? []);
      setCompletedOnce(card.completed_once ?? false);
    } else if (isNew && cardTypes?.length) {
      setCardTypeId(cardTypes[0].id);
    }
  }, [card, cardTypes, isNew]);

  const toggleStory = (storyId: string) => {
    setSelectedStoryIds((prev) =>
      prev.includes(storyId)
        ? prev.filter((s) => s !== storyId)
        : [...prev, storyId]
    );
  };

  const handleToggleCompletedOnce = useCallback(async () => {
    const next = !completedOnce;
    setCompletedOnce(next);

    if (isNew) return;

    try {
      await toggleCompletedOnce.mutateAsync({ id, completed_once: next });
    } catch (e) {
      setCompletedOnce(!next);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update');
    }
  }, [completedOnce, id, isNew, toggleCompletedOnce]);

  const handleSave = async () => {
    if (!cardTypeId) {
      Alert.alert('Validation', 'Select a card type.');
      return;
    }
    if (!action.trim()) {
      Alert.alert('Validation', 'Action is required.');
      return;
    }
    if (action.length > 100) {
      Alert.alert('Validation', 'Action must be 100 characters or less.');
      return;
    }

    const diff = parseFloat(difficulty);
    if (isNaN(diff) || diff < 1 || diff > 10) {
      Alert.alert('Validation', 'Difficulty must be between 1 and 10.');
      return;
    }

    try {
      const payload = {
        card_type_id: cardTypeId,
        difficulty: diff,
        action: action.trim(),
        function_purpose: functionPurpose.trim(),
        practice_location_ideas: practiceLocation.trim() || null,
        story_ids: selectedStoryIds,
        completed_once: completedOnce,
      };

      if (isNew) {
        const created = await createCard.mutateAsync(payload);
        router.replace(`/(tabs)/cards/${created.id}`);
      } else {
        await updateCard.mutateAsync({ id, ...payload });
        router.back();
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const handleDelete = () => {
    if (card?.stories && card.stories.length > 0) {
      Alert.alert(
        'Cannot delete card',
        `Unlink this card from ${card.stories.length} stor${card.stories.length === 1 ? 'y' : 'ies'} first, then try again.`
      );
      return;
    }

    Alert.alert('Delete card', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCard.mutateAsync(id);
            router.back();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleToggleCompletedOnce}
            hitSlop={8}
            disabled={toggleCompletedOnce.isPending}
            accessibilityLabel={
              completedOnce ? 'Mark as not completed once' : 'Mark as completed once'
            }>
            <Ionicons
              name={completedOnce ? 'flag' : 'flag-outline'}
              size={22}
              color={completedOnce ? colors.completed : colors.textSecondary}
            />
          </Pressable>
          {!isNew ? (
            <Pressable onPress={handleDelete} hitSlop={8} style={styles.headerBtn}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }, [
    navigation,
    isNew,
    completedOnce,
    handleToggleCompletedOnce,
    toggleCompletedOnce.isPending,
  ]);

  if (!isNew && isLoading) return <LoadingState />;
  if (!isNew && error) return <ErrorState message={error.message} />;
  if (isNew && typesLoading) return <LoadingState />;
  if (isNew && !cardTypes?.length) {
    return (
      <View style={[styles.container, styles.blocked]}>
        <InlineEmptyState
          icon="layers-outline"
          message="Create at least one card type before adding cards."
          actionLabel="Manage card types"
          onAction={() => router.push('/(tabs)/cards/types')}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={formStyles.screenContent}>
        <FormField icon="layers-outline" title="Card type" required>
          <View style={formStyles.chipRow}>
            {cardTypes?.map((type) => (
              <Pressable
                key={type.id}
                style={[
                  styles.typeChip,
                  { backgroundColor: type.bg_color },
                  cardTypeId === type.id && styles.typeChipSelected,
                ]}
                onPress={() => setCardTypeId(type.id)}>
                <Text style={{ color: type.text_color, fontWeight: '600' }}>{type.name}</Text>
              </Pressable>
            ))}
          </View>
        </FormField>

        <FormField icon="speedometer-outline" title="Difficulty (1-10)" required>
          <NumberInput
            value={difficulty}
            onChangeText={setDifficulty}
            allowFloat
            placeholder="e.g. 5.5"
            placeholderTextColor={colors.textMuted}
          />
        </FormField>

        <FormField icon="flash-outline" title="Action" required hint={`${action.length}/100`}>
          <TextInput
            style={formStyles.input}
            value={action}
            onChangeText={setAction}
            maxLength={100}
            placeholder="e.g. Ask a stranger for directions"
            placeholderTextColor={colors.textMuted}
          />
        </FormField>

        <FormField icon="bulb-outline" title="Function / purpose">
          <TextInput
            style={[formStyles.input, formStyles.textarea]}
            value={functionPurpose}
            onChangeText={setFunctionPurpose}
            multiline
            textAlignVertical="top"
            placeholder="Why this matters or what you're practicing"
            placeholderTextColor={colors.textMuted}
          />
        </FormField>

        <FormField icon="location-outline" title="Practice location ideas">
          <TextInput
            style={formStyles.input}
            value={practiceLocation}
            onChangeText={setPracticeLocation}
            placeholder="e.g. Coffee shop, park bench"
            placeholderTextColor={colors.textMuted}
          />
        </FormField>

        <FormField icon="book-outline" title="Relevant stories">
          <StorySelector
            stories={stories}
            selectedIds={selectedStoryIds}
            onToggle={toggleStory}
          />
        </FormField>

        <FormActionBar>
          <SaveButton onPress={handleSave} loading={isSaving} />
        </FormActionBar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  blocked: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.screenPadding,
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
  typeChip: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeChipSelected: {
    borderColor: colors.text,
  },
});
